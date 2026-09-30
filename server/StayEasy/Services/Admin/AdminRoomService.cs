using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;

namespace StayEasy.Services.Admin;

/// <summary>
/// Quản lý phòng cho Admin.
///
/// Mỗi lần sửa phòng thay TOÀN BỘ ảnh và tiện nghi theo dữ liệu gửi lên, thay vì
/// ghi thêm/xoá lẻ từng dòng. Cách này giữ cho một lần sửa chỉ sinh đúng một
/// transaction, dễ kiểm chứng hơn là cần so khớp từng khoá.
/// </summary>
public class AdminRoomService : IAdminRoomService
{
    private readonly StayEasyDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public AdminRoomService(StayEasyDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<List<AdminRoomDto>> LayDanhSachAsync(CancellationToken ct)
    {
        List<Room> danhSach = await _db.Rooms
            .AsNoTracking()
            .Include(phong => phong.Location)
            .Include(phong => phong.Images)
            .Include(phong => phong.AmenityLinks)
            .ThenInclude(lienKet => lienKet.Amenity)
            .OrderBy(phong => phong.Id)
            .ToListAsync(ct);

        return danhSach.Select(ChuyenDto).ToList();
    }

    /// <inheritdoc />
    public async Task<List<AmenityDto>> LayDanhSachTienNghAsync(CancellationToken ct)
    {
        return await _db.Amenities
            .AsNoTracking()
            .OrderBy(tienNghi => tienNghi.Name)
            .Select(tienNghi => new AmenityDto
            {
                Id = tienNghi.Id,
                Name = tienNghi.Name,
                Icon = tienNghi.Icon
            })
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<AdminRoomDto> TaoAsync(RoomRequest request, CancellationToken ct)
    {
        await KiemTraDuLieuAsync(request, ct);

        Room phong = new()
        {
            LocationId = request.LocationId,
            Name = request.Name.Trim(),
            RoomNumber = request.RoomNumber.Trim(),
            RoomType = request.RoomType,
            Capacity = request.Capacity,
            PricePerHour = request.PricePerHour,
            PricePerDay = request.PricePerDay,
            Description = request.Description,
            Status = Enums.RoomStatus.AVAILABLE,
            CreatedAt = DateTime.UtcNow
        };

        _db.Rooms.Add(phong);
        await _db.SaveChangesAsync(ct);

        GhiAnhVaTienNgh(phong.Id, request);
        await _db.SaveChangesAsync(ct);

        return await TimPhongDtoAsync(phong.Id, ct);
    }

    /// <inheritdoc />
    public async Task<AdminRoomDto> SuaAsync(int id, RoomRequest request, CancellationToken ct)
    {
        await KiemTraDuLieuAsync(request, ct);

        Room phong = await _db.Rooms
            .Include(p => p.Images)
            .Include(p => p.AmenityLinks)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);

        phong.LocationId = request.LocationId;
        phong.Name = request.Name.Trim();
        phong.RoomNumber = request.RoomNumber.Trim();
        phong.RoomType = request.RoomType;
        phong.Capacity = request.Capacity;
        phong.PricePerHour = request.PricePerHour;
        phong.PricePerDay = request.PricePerDay;
        phong.Description = request.Description;
        phong.UpdatedAt = DateTime.UtcNow;

        // Xoá ảnh / tiện nghi cũ trước khi ghi bộ mới. Chỉ đổi khi Admin thực sự
        // gửi danh sách mới — trường rỗng nghĩa là "bỏ hết", nên không so sánh.
        _db.RoomImages.RemoveRange(phong.Images);
        _db.RoomAmenities.RemoveRange(phong.AmenityLinks);
        await _db.SaveChangesAsync(ct);

        GhiAnhVaTienNgh(phong.Id, request);
        await _db.SaveChangesAsync(ct);

        return await TimPhongDtoAsync(phong.Id, ct);
    }

    /// <inheritdoc />
    public async Task<AdminRoomDto> DoiTrangThaiAsync(int id, RoomStatusRequest request, CancellationToken ct)
    {
        Room phong = await _db.Rooms.FindAsync(new object[] { id }, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);

        phong.Status = request.Status;
        phong.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return await TimPhongDtoAsync(phong.Id, ct);
    }

    /// <inheritdoc />
    public async Task XoaAsync(int id, CancellationToken ct)
    {
        Room phong = await _db.Rooms
            .Include(p => p.Bookings)
            .Include(p => p.Images)
            .Include(p => p.AmenityLinks)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);

        if (phong.Bookings.Any())
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.KhongXoaPhongDangCoDon);
        }

        // Ảnh và tiện nghi là bảng con — phải xoá tay, nếu không sẽ vi phạm khoá
        // ngoại lai và thành lỗi 500 thay vì lỗi nghiệp vụ rõ ràng.
        _db.RoomImages.RemoveRange(phong.Images);
        _db.RoomAmenities.RemoveRange(phong.AmenityLinks);
        _db.Rooms.Remove(phong);

        await _db.SaveChangesAsync(ct);
    }

    /// <summary>Ghi ảnh và tiện nghi cho phòng. Không tự SaveChanges — gọi bên ngoài.</summary>
    private void GhiAnhVaTienNgh(int roomId, RoomRequest request)
    {
        for (int i = 0; i < request.ImageUrls.Count; i++)
        {
            _db.RoomImages.Add(new RoomImage
            {
                RoomId = roomId,
                ImageUrl = request.ImageUrls[i],
                // Ảnh đầu tiên làm ảnh chính: đây là ảnh khách thấy trong
                // danh sách kết quả tìm kiếm, nên thứ tự trong form có ý nghĩa.
                IsPrimary = i == 0,
                SortOrder = i,
                CreatedAt = DateTime.UtcNow
            });
        }

        foreach (int amenityId in request.AmenityIds.Distinct())
        {
            _db.RoomAmenities.Add(new RoomAmenity
            {
                RoomId = roomId,
                AmenityId = amenityId,
                CreatedAt = DateTime.UtcNow
            });
        }
    }

    private async Task<AdminRoomDto> TimPhongDtoAsync(int id, CancellationToken ct)
    {
        Room phong = await _db.Rooms
            .AsNoTracking()
            .Include(p => p.Location)
            .Include(p => p.Images)
            .Include(p => p.AmenityLinks)
            .ThenInclude(lienKet => lienKet.Amenity)
            .FirstAsync(p => p.Id == id, ct);

        return ChuyenDto(phong);
    }

    private async Task KiemTraDuLieuAsync(RoomRequest request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TenPhongRong);
        }

        if (request.Name.Trim().Length > AdminRules.MaxRoomNameLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TenPhongQuaDai);
        }

        if (string.IsNullOrWhiteSpace(request.RoomNumber)
            || request.RoomNumber.Trim().Length > AdminRules.MaxRoomNumberLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.SoPhongQuaDai);
        }

        if (request.Description is { Length: > AdminRules.MaxDescriptionLength })
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.MoTaPhongQuaDai);
        }

        if (request.Capacity < 1 || request.Capacity > AdminRules.MaxCapacity)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.SoKhachKhongHopLe);
        }

        if (request.PricePerHour < AdminRules.MinPricePerHour)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.GiaGioKhongHopLe);
        }

        if (request.PricePerDay < AdminRules.MinPricePerHour || request.PricePerDay > AdminRules.MaxPricePerDay)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.GiaNgayKhongHopLe);
        }

        if (request.ImageUrls.Count > AdminRules.MaxImagesPerRoom)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.AnhPhongQuaNhieu);
        }

        await KiemTraCoSoVaTienNghAsync(request, ct);
    }

    private async Task KiemTraCoSoVaTienNghAsync(RoomRequest request, CancellationToken ct)
    {
        bool coCoSo = await _db.Locations.AnyAsync(coSo => coSo.Id == request.LocationId, ct);
        if (!coCoSo)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.KhongTimThayCoSo);
        }

        List<int> danhSachId = request.AmenityIds.Distinct().ToList();
        if (danhSachId.Count == 0)
        {
            return;
        }

        int soTienNghTonTai = await _db.Amenities.CountAsync(tienNghi => danhSachId.Contains(tienNghi.Id), ct);
        if (soTienNghTonTai != danhSachId.Count)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TienNghiKhongHopLe);
        }
    }

    private static AdminRoomDto ChuyenDto(Room phong)
    {
        List<RoomImage> anh = phong.Images
            .OrderByDescending(a => a.IsPrimary)
            .ThenBy(a => a.SortOrder)
            .ToList();

        return new AdminRoomDto
        {
            Id = phong.Id,
            LocationName = phong.Location?.Name ?? string.Empty,
            Name = phong.Name,
            RoomNumber = phong.RoomNumber,
            RoomType = phong.RoomType,
            Capacity = phong.Capacity,
            PricePerHour = phong.PricePerHour,
            PricePerDay = phong.PricePerDay,
            Description = phong.Description,
            Status = phong.Status,
            Images = anh.Select(a => a.ImageUrl).ToList(),
            AmenityIds = phong.AmenityLinks.Select(l => l.AmenityId).ToList(),
            AmenityNames = phong.AmenityLinks
                .Where(l => l.Amenity is not null)
                .Select(l => l.Amenity.Name)
                .ToList()
        };
    }
}
