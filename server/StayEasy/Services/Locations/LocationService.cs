using Microsoft.EntityFrameworkCore;
using StayEasy.Data;
using StayEasy.DTOs;

namespace StayEasy.Services.Locations;

/// <summary>Danh sách địa điểm cho khách xem.</summary>
public class LocationService : ILocationService
{
    private readonly StayEasyDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public LocationService(StayEasyDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<List<LocationListItemDto>> LayDanhSachAsync(CancellationToken ct)
    {
        // Chỉ lấy địa điểm đang hoạt động — ngừng hoạt động thì không hiện cho
        // khách (ghi trong entity Location). Lọc tường minh ở đây thay vì global
        // filter để test được riêng từng trường hợp.
        return await _db.Locations
            .AsNoTracking()
            .Where(diaDiem => diaDiem.IsActive)
            .OrderBy(diaDiem => diaDiem.Id)
            .Select(diaDiem => new LocationListItemDto
            {
                Name = diaDiem.Name,
                City = diaDiem.City,
                Province = diaDiem.Province,
                Address = diaDiem.Address,
                Description = diaDiem.Description,
                ImageUrl = diaDiem.ImageUrl,
                Rooms = diaDiem.Rooms
                    .OrderBy(phong => phong.Id)
                    .Select(phong => new RoomSummaryDto
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
                        // Ảnh chính: ưu tiên `IsPrimary`, không có thì `SortOrder`
                        // nhỏ nhất, không có ảnh nào thì null.
                        // Viết thẳng vào đây thay vì gọi hàm riêng: EF Core chỉ
                        // dịch được biểu thức trong `Select`, gọi hàm C# riêng
                        // sẽ báo lỗi không dịch được sang SQL lúc chạy thật
                        // (dù test InMemory vẫn xanh — bẫy giống `lessons.md` 20).
                        ThumbnailUrl = phong.Images
                            .OrderByDescending(anh => anh.IsPrimary)
                            .ThenBy(anh => anh.SortOrder)
                            .Select(anh => anh.ImageUrl)
                            .FirstOrDefault(),
                    })
                    .ToList(),
            })
            .ToListAsync(ct);
    }
}
