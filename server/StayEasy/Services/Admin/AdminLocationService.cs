using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;

namespace StayEasy.Services.Admin;

/// <summary>
/// Quản lý cơ sở cho Admin.
///
/// Khác với trang khách, trang quản trị thấy cả cơ sở đã ngừng hoạt động —
/// cần thấy để bật/tắt lại được, không phải để mất đi.
/// </summary>
public class AdminLocationService : IAdminLocationService
{
    private readonly StayEasyDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public AdminLocationService(StayEasyDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<List<AdminLocationDto>> LayDanhSachAsync(CancellationToken ct)
    {
        List<AdminLocationDto> result = await _db.Locations
            .AsNoTracking()
            .Select(coSo => new AdminLocationDto
            {
                Id = coSo.Id,
                Name = coSo.Name,
                City = coSo.City,
                Province = coSo.Province,
                Address = coSo.Address,
                Description = coSo.Description,
                ImageUrl = coSo.ImageUrl,
                IsActive = coSo.IsActive,
                TotalRooms = coSo.Rooms.Count
            })
            .OrderBy(coSo => coSo.Id)
            .ToListAsync(ct);

        return result;
    }

    /// <inheritdoc />
    public async Task<AdminLocationDto> TaoAsync(FacilityRequest request, CancellationToken ct)
    {
        KiemTraDuLieu(request);

        Location coSo = new()
        {
            Name = request.Name.Trim(),
            City = request.City.Trim(),
            Province = request.Province.Trim(),
            Address = request.Address.Trim(),
            Description = request.Description,
            ImageUrl = request.ImageUrl,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync(ct);

        return ChuyenDto(coSo, 0);
    }

    /// <inheritdoc />
    public async Task<AdminLocationDto> SuaAsync(int id, FacilityRequest request, CancellationToken ct)
    {
        KiemTraDuLieu(request);

        Location coSo = await TimCoSoAsync(id, ct);

        coSo.Name = request.Name.Trim();
        coSo.City = request.City.Trim();
        coSo.Province = request.Province.Trim();
        coSo.Address = request.Address.Trim();
        coSo.Description = request.Description;
        coSo.ImageUrl = request.ImageUrl;
        coSo.IsActive = request.IsActive;

        await _db.SaveChangesAsync(ct);

        return ChuyenDto(coSo, coSo.Rooms.Count);
    }

    /// <inheritdoc />
    public async Task XoaAsync(int id, CancellationToken ct)
    {
        Location coSo = await TimCoSoAsync(id, ct);

        // Chặn ở đây thay vì để khoá ngoại lai nổi lên thành lỗi 500:
        // Admin cần biết "cơ sở còn phòng" chứ không phải "lỗi hệ thống".
        int soPhong = await _db.Rooms.CountAsync(phong => phong.LocationId == id, ct);
        if (soPhong > 0)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.KhongXoaCoSoDangCoPhong);
        }

        _db.Locations.Remove(coSo);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<Location> TimCoSoAsync(int id, CancellationToken ct)
    {
        return await _db.Locations.FindAsync(new object[] { id }, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayCoSo);
    }

    private static void KiemTraDuLieu(FacilityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TenCoSoRong);
        }

        if (request.Name.Trim().Length > AdminRules.MaxLocationNameLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TenCoSoQuaDai);
        }

        if (string.IsNullOrWhiteSpace(request.Address))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DiaChiCoSoRong);
        }
    }

    private static AdminLocationDto ChuyenDto(Location coSo, int soPhong)
    {
        return new AdminLocationDto
        {
            Id = coSo.Id,
            Name = coSo.Name,
            City = coSo.City,
            Province = coSo.Province,
            Address = coSo.Address,
            Description = coSo.Description,
            ImageUrl = coSo.ImageUrl,
            IsActive = coSo.IsActive,
            TotalRooms = soPhong
        };
    }
}
