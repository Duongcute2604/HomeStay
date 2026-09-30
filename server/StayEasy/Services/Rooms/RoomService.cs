using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;

namespace StayEasy.Services.Rooms;

/// <summary>Tìm kiếm và lọc phòng cho khách.</summary>
public class RoomService : IRoomService
{
    private readonly StayEasyDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public RoomService(StayEasyDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<RoomSearchItemDto>> SearchAsync(RoomSearchRequest request, CancellationToken ct)
    {
        KiemTraThamSo(request);

        IQueryable<StayEasy.Entities.Room> query = _db.Rooms
            .AsNoTracking()
            .Include(phong => phong.Location)
            .Include(phong => phong.Images)
            .Where(phong => phong.Location.IsActive);

        // 1. Lọc theo từ khoá (tên phòng, không phân biệt hoa thường).
        // Ép `ToLower()` cả hai vế: MySQL collation `ci` vốn đã đúng, nhưng viết
        // tường minh để InMemory của unit test cũng cho kết quả giống hệt.
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            string tuKhoa = request.Keyword.Trim().ToLower();
            query = query.Where(phong => phong.Name.ToLower().Contains(tuKhoa));
        }

        // 2. Lọc theo địa điểm bằng CHỈ SỐ (response không có `Id`).
        // Cùng thứ tự `OrderBy Id` với `GET /api/locations` để chỉ số khớp nhau.
        if (request.LocationIndex.HasValue)
        {
            List<int> danhSachId = await _db.Locations
                .AsNoTracking()
                .Where(diaDiem => diaDiem.IsActive)
                .OrderBy(diaDiem => diaDiem.Id)
                .Select(diaDiem => diaDiem.Id)
                .ToListAsync(ct);

            // Vượt phạm vi là "không có kết quả", không phải lỗi — giao diện hiện
            // Empty state thay vì báo lỗi.
            if (request.LocationIndex.Value >= danhSachId.Count)
            {
                return TrangRong(request);
            }

            int locationId = danhSachId[request.LocationIndex.Value];
            query = query.Where(phong => phong.LocationId == locationId);
        }

        // 3. Lọc theo loại phòng.
        if (request.RoomType.HasValue)
        {
            query = query.Where(phong => (int)phong.RoomType == request.RoomType.Value);
        }

        // 4. Lọc theo khoảng giá ngày.
        if (request.MinPrice.HasValue)
        {
            query = query.Where(phong => phong.PricePerDay >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(phong => phong.PricePerDay <= request.MaxPrice.Value);
        }

        // 5. Lọc theo sức chứa — phòng phải chứa ĐỦ số khách.
        if (request.Capacity.HasValue)
        {
            query = query.Where(phong => phong.Capacity >= request.Capacity.Value);
        }

        // 6. Sắp xếp. Giá trị `sort` đã kiểm hợp lệ ở `KiemTraThamSo`.
        query = request.Sort switch
        {
            RoomSortOptions.PriceAsc => query.OrderBy(phong => phong.PricePerDay).ThenBy(phong => phong.Id),
            RoomSortOptions.PriceDesc => query.OrderByDescending(phong => phong.PricePerDay).ThenBy(phong => phong.Id),
            RoomSortOptions.RatingDesc => query.OrderByDescending(phong => phong.RatingAvg).ThenBy(phong => phong.Id),
            _ => query.OrderByDescending(phong => phong.CreatedAt).ThenBy(phong => phong.Id),
        };

        int tongSo = await query.CountAsync(ct);

        List<RoomSearchItemDto> items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            // `Select` thẳng ra DTO: không lộ `Id`, không lấy thừa cột (AGENTS.md 6.4).
            .Select(phong => new RoomSearchItemDto
            {
                Name = phong.Name,
                RoomNumber = phong.RoomNumber,
                RoomType = phong.RoomType,
                Capacity = phong.Capacity,
                PricePerHour = phong.PricePerHour,
                PricePerDay = phong.PricePerDay,
                RatingAvg = phong.RatingAvg,
                RatingCount = phong.RatingCount,
                Status = phong.Status,
                ThumbnailUrl = phong.Images
                    .OrderByDescending(anh => anh.IsPrimary)
                    .ThenBy(anh => anh.SortOrder)
                    .Select(anh => anh.ImageUrl)
                    .FirstOrDefault(),
                LocationName = phong.Location.Name,
            })
            .ToListAsync(ct);

        return new PagedResultDto<RoomSearchItemDto>
        {
            Items = items,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalItems = tongSo,
            TotalPages = tongSo == 0 ? 0 : (int)Math.Ceiling(tongSo / (double)request.PageSize),
        };
    }

    /// <summary>
    /// Kiểm các quan hệ giữa tham số mà attribute không kiểm được:
    /// `minPrice &lt;= maxPrice`, `roomType` trong 0–3, `sort` hợp lệ.
    /// </summary>
    private static void KiemTraThamSo(RoomSearchRequest request)
    {
        if (request.MinPrice.HasValue && request.MaxPrice.HasValue
            && request.MinPrice.Value > request.MaxPrice.Value)
        {
            throw new AppException(
                HttpStatusCode.BadRequest,
                "Giá thấp nhất không được lớn hơn giá cao nhất");
        }

        if (request.RoomType.HasValue && !Enum.IsDefined(typeof(StayEasy.Enums.RoomType), request.RoomType.Value))
        {
            throw new AppException(HttpStatusCode.BadRequest, "Loại phòng không hợp lệ");
        }

        if (request.Sort != RoomSortOptions.PriceAsc
            && request.Sort != RoomSortOptions.PriceDesc
            && request.Sort != RoomSortOptions.RatingDesc
            && request.Sort != RoomSortOptions.Newest)
        {
            throw new AppException(HttpStatusCode.BadRequest, "Cách sắp xếp không hợp lệ");
        }
    }

    /// <summary>Trang rỗng giữ nguyên số trang client gửi — giao diện vẫn hiện phân trang đúng.</summary>
    private static PagedResultDto<RoomSearchItemDto> TrangRong(RoomSearchRequest request)
    {
        return new PagedResultDto<RoomSearchItemDto>
        {
            Items = new(),
            Page = request.Page,
            PageSize = request.PageSize,
            TotalItems = 0,
            TotalPages = 0,
        };
    }
}
