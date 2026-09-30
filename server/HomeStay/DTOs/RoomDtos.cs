using System.ComponentModel.DataAnnotations;
using HomeStay.Enums;

namespace HomeStay.DTOs;

/// <summary>
/// Tham số tìm kiếm phòng, nhận qua query string của `GET /api/rooms/search`.
/// Đúng 9 tham số: 6 lọc + 1 sắp xếp + 2 phân trang.
/// </summary>
public class RoomSearchRequest
{
    /// <summary>Từ khoá so với tên phòng, không phân biệt hoa thường. Bỏ trống = không lọc.</summary>
    [StringLength(100, ErrorMessage = "Từ khoá tìm kiếm không được vượt quá 100 ký tự")]
    public string? Keyword { get; set; }

    /// <summary>
    /// Chỉ số địa điểm theo thứ tự của `GET /api/locations` (0, 1, 2...).
    /// Response không có `Id` nên lọc bằng chỉ số thay vì `Id`.
    /// Vượt phạm vi → trả danh sách rỗng, không báo lỗi.
    /// </summary>
    [Range(0, int.MaxValue, ErrorMessage = "Chỉ số địa điểm không được âm")]
    public int? LocationIndex { get; set; }

    /// <summary>Loại phòng (0 = Tiêu chuẩn... 3 = Hạng nhà). Ngoài khoảng → 400.</summary>
    public int? RoomType { get; set; }

    /// <summary>Giá ngày thấp nhất (VNĐ). Bỏ trống = không giới hạn dưới.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Giá thấp nhất không được âm")]
    public decimal? MinPrice { get; set; }

    /// <summary>Giá ngày cao nhất (VNĐ). Bỏ trống = không giới hạn trên.</summary>
    [Range(0, double.MaxValue, ErrorMessage = "Giá cao nhất không được âm")]
    public decimal? MaxPrice { get; set; }

    /// <summary>Số khách — chỉ lấy phòng chứa đủ. Bỏ trống = không lọc.</summary>
    [Range(1, 20, ErrorMessage = "Số khách phải từ 1 đến 20")]
    public int? Capacity { get; set; }

    /// <summary>
    /// Cách sắp xếp: `priceAsc` (giá tăng), `priceDesc` (giá giảm),
    /// `ratingDesc` (đánh giá cao), `newest` (mới nhất). Mặc định `newest`.
    /// </summary>
    public string Sort { get; set; } = RoomSortOptions.Newest;

    /// <summary>Trang hiện tại, bắt đầu từ 1.</summary>
    [Range(1, int.MaxValue, ErrorMessage = "Trang phải bắt đầu từ 1")]
    public int Page { get; set; } = 1;

    /// <summary>Số phòng mỗi trang, tối đa 50.</summary>
    [Range(1, RoomSearchRules.MaxPageSize, ErrorMessage = "Mỗi trang tối đa 50 phòng")]
    public int PageSize { get; set; } = RoomSearchRules.DefaultPageSize;
}

/// <summary>Các giá trị `sort` hợp lệ của tìm kiếm phòng.</summary>
public static class RoomSortOptions
{
    /// <summary>Giá ngày tăng dần.</summary>
    public const string PriceAsc = "priceAsc";

    /// <summary>Giá ngày giảm dần.</summary>
    public const string PriceDesc = "priceDesc";

    /// <summary>Đánh giá cao trước.</summary>
    public const string RatingDesc = "ratingDesc";

    /// <summary>Mới nhất trước (mặc định).</summary>
    public const string Newest = "newest";
}

/// <summary>Giới hạn phân trang của tìm kiếm phòng.</summary>
public static class RoomSearchRules
{
    /// <summary>Số phòng mỗi trang khi client không gửi lên.</summary>
    public const int DefaultPageSize = 6;

    /// <summary>Số phòng tối đa mỗi trang — chặn kéo sập DB.</summary>
    public const int MaxPageSize = 50;
}

/// <summary>
/// Một phòng trong kết quả tìm kiếm.
/// </summary>
/// <remarks>Cố tình KHÔNG có `Id` (AGENTS.md 6.3). STT do giao diện tự tính.</remarks>
public class RoomSearchItemDto
{
    /// <summary>Tên phòng.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số phòng.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Loại phòng, dạng số. Giao diện tự gắn nhãn.</summary>
    public RoomType RoomType { get; set; }

    /// <summary>Số khách tối đa.</summary>
    public int Capacity { get; set; }

    /// <summary>Giá 1 giờ (VNĐ).</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Giá 1 ngày (VNĐ) — dùng để lọc và sắp xếp.</summary>
    public decimal PricePerDay { get; set; }

    /// <summary>Điểm đánh giá trung bình.</summary>
    public decimal RatingAvg { get; set; }

    /// <summary>Số đánh giá đã nhận.</summary>
    public int RatingCount { get; set; }

    /// <summary>Trạng thái, dạng số. Hiện nhãn chứ không cho đặt (Bước 9 mới kiểm trống).</summary>
    public RoomStatus Status { get; set; }

    /// <summary>Ảnh chính, null khi chưa có ảnh.</summary>
    public string? ThumbnailUrl { get; set; }

    /// <summary>Tên địa điểm chứa phòng — để khách biết phòng ở đâu mà không cần `Id`.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>
    /// Chỉ số địa điểm theo thứ tự của `GET /api/locations` — để trang tìm kiếm
    /// link tới chi tiết mà không cần `Id` (tên phòng có thể trùng giữa các nơi).
    /// </summary>
    public int LocationIndex { get; set; }

    /// <summary>Chỉ số phòng trong địa điểm đó (cùng thứ tự `OrderBy Id`).</summary>
    public int RoomIndex { get; set; }
}

/// <summary>
/// Tham số kiểm tra phòng trống, nhận qua query string của
/// `GET /api/rooms/availability`.
/// </summary>
/// <remarks>
/// Định danh phòng bằng cặp chỉ số (cùng thứ tự với `GET /api/locations`)
/// thay vì `Id` — response các endpoint khác không lộ `Id` (AGENTS.md 6.3).
/// </remarks>
public class AvailabilityRequest
{
    /// <summary>Chỉ số địa điểm (0, 1, 2...).</summary>
    [Range(0, int.MaxValue, ErrorMessage = "Chỉ số địa điểm không được âm")]
    public int LocationIndex { get; set; }

    /// <summary>Chỉ số phòng trong địa điểm đó.</summary>
    [Range(0, int.MaxValue, ErrorMessage = "Chỉ số phòng không được âm")]
    public int RoomIndex { get; set; }

    /// <summary>Cách thuê: 0 = theo giờ, 1 = theo ngày. Ngoài khoảng → 400.</summary>
    public int Type { get; set; } = (int)HomeStay.Enums.BookingType.DAY;

    /// <summary>Thời điểm dự kiến nhận phòng.</summary>
    public DateTime? CheckIn { get; set; }

    /// <summary>Thời điểm dự kiến trả phòng.</summary>
    public DateTime? CheckOut { get; set; }
}

/// <summary>Kết quả kiểm tra phòng trống.</summary>
public class AvailabilityResponse
{
    /// <summary>Phòng có đặt được trong khoảng đã chọn không.</summary>
    public bool IsAvailable { get; set; }

    /// <summary>
    /// Lý do không đặt được (tiếng Việt), null khi còn trống.
    /// "Bận" là kết quả hợp lệ nên vẫn trả 200 — chỉ tham số sai mới 4xx.
    /// </summary>
    public string? Reason { get; set; }
}

/// <summary>Kết quả phân trang dùng chung.</summary>
/// <typeparam name="T">Kiểu phần tử trong trang.</typeparam>
public class PagedResultDto<T>
{
    /// <summary>Các phần tử của trang hiện tại.</summary>
    public List<T> Items { get; set; } = new();

    /// <summary>Trang hiện tại (bắt đầu từ 1).</summary>
    public int Page { get; set; }

    /// <summary>Số phần tử mỗi trang.</summary>
    public int PageSize { get; set; }

    /// <summary>Tổng số phần tử sau khi lọc (chưa phân trang).</summary>
    public int TotalItems { get; set; }

    /// <summary>Tổng số trang.</summary>
    public int TotalPages { get; set; }
}
