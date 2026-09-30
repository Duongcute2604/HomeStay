using Microsoft.EntityFrameworkCore;
using HomeStay.Data;
using HomeStay.DTOs;

namespace HomeStay.Services.Locations;

/// <summary>Danh sách địa điểm cho khách xem.</summary>
public class LocationService : ILocationService
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public LocationService(HomeStayDbContext db)
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
                    .Select(phong => new RoomDetailDto
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
                        Description = phong.Description,
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
                        Images = phong.Images
                            .OrderBy(anh => anh.SortOrder)
                            .Select(anh => anh.ImageUrl)
                            .ToList(),
                        Amenities = phong.AmenityLinks
                            .Select(lienKet => lienKet.Amenity.Name)
                            .ToList(),
                        // Chỉ đánh giá KHÔNG bị ẩn, mới nhất trước, tối đa 5.
                        Reviews = phong.Reviews
                            .Where(danhGia => !danhGia.IsHidden)
                            .OrderByDescending(danhGia => danhGia.CreatedAt)
                            .Take(5)
                            .Select(danhGia => new RoomReviewDto
                            {
                                ReviewerName = danhGia.User.FullName,
                                Rating = danhGia.Rating,
                                Comment = danhGia.Comment,
                                CreatedAt = danhGia.CreatedAt,
                            })
                            .ToList(),
                    })
                    .ToList(),
            })
            .ToListAsync(ct);
    }
}
