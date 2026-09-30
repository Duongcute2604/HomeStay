using HomeStay.Enums;

namespace HomeStay.DTOs;

/// <summary>
/// Tóm tắt một phòng để hiện trong trang chi tiết địa điểm.
/// </summary>
/// <remarks>
/// Cố tình KHÔNG có `Id` (AGENTS.md 6.3: danh sách không lộ khoá nội bộ).
/// Chi tiết đầy đủ của phòng thuộc Bước 8.
/// </remarks>
public class RoomSummaryDto
{
    /// <summary>Tên phòng hiển thị cho khách.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số phòng để phân biệt các phòng cùng tên.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Loại phòng, dạng số (0 = Tiêu chuẩn). Giao diện tự gắn nhãn tiếng Việt.</summary>
    public RoomType RoomType { get; set; }

    /// <summary>Số khách tối đa.</summary>
    public int Capacity { get; set; }

    /// <summary>Giá 1 giờ (VNĐ).</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Giá 1 ngày (VNĐ).</summary>
    public decimal PricePerDay { get; set; }

    /// <summary>Điểm đánh giá trung bình (0–5).</summary>
    public decimal RatingAvg { get; set; }

    /// <summary>Số đánh giá đã nhận.</summary>
    public int RatingCount { get; set; }

    /// <summary>
    /// Trạng thái phòng, dạng số (0 = Trống). Hiện nhãn chứ không cho đặt —
    /// kiểm tra trống thật thuộc Bước 9.
    /// </summary>
    public RoomStatus Status { get; set; }

    /// <summary>Ảnh chính của phòng. Null khi phòng chưa có ảnh nào.</summary>
    public string? ThumbnailUrl { get; set; }
}

/// <summary>Một đánh giá hiển thị trong trang chi tiết phòng.</summary>
public class RoomReviewDto
{
    /// <summary>Tên người viết.</summary>
    public string ReviewerName { get; set; } = string.Empty;

    /// <summary>Số sao 1–5.</summary>
    public int Rating { get; set; }

    /// <summary>Nội dung nhận xét, có thể null.</summary>
    public string? Comment { get; set; }

    /// <summary>Thời điểm viết.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Chi tiết một phòng: tóm tắt + mô tả + toàn bộ ảnh + tiện nghi + đánh giá.
/// </summary>
/// <remarks>
/// Mở rộng `RoomSummaryDto` thay vì DTO rời — trang danh sách (Bước 6) dùng lớp
/// cha, trang chi tiết (Bước 8) dùng lớp con. Không `Id` ở cả hai.
/// </remarks>
public class RoomDetailDto : RoomSummaryDto
{
    /// <summary>Mô tả phòng, có thể null.</summary>
    public string? Description { get; set; }

    /// <summary>Toàn bộ ảnh theo `SortOrder` (ảnh chính đầu tiên).</summary>
    public List<string> Images { get; set; } = new();

    /// <summary>Tên các tiện nghi phòng đang có.</summary>
    public List<string> Amenities { get; set; } = new();

    /// <summary>Tối đa 5 đánh giá mới nhất, trừ đánh giá bị Admin ẩn.</summary>
    public List<RoomReviewDto> Reviews { get; set; } = new();
}

/// <summary>
/// Một địa điểm trong danh sách trả về cho khách.
/// </summary>
/// <remarks>
/// Cố tình KHÔNG có `Id` (AGENTS.md 6.3). Giao diện điều hướng chi tiết bằng
/// chỉ số trong danh sách, STT = chỉ số + 1.
/// </remarks>
public class LocationListItemDto
{
    /// <summary>Tên địa điểm.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Quận/Huyện hoặc khu vực nhỏ hơn.</summary>
    public string City { get; set; } = string.Empty;

    /// <summary>Tỉnh/Thành phố.</summary>
    public string Province { get; set; } = string.Empty;

    /// <summary>Địa chỉ đầy đủ.</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>Mô tả giới thiệu, có thể null.</summary>
    public string? Description { get; set; }

    /// <summary>Đường dẫn ảnh đại diện, có thể null.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Các phòng thuộc địa điểm này, sắp theo `Id` để thứ tự ổn định.
    /// Dạng chi tiết (kèm ảnh, tiện nghi, đánh giá) để trang chi tiết đọc từ cache.
    /// </summary>
    public List<RoomDetailDto> Rooms { get; set; } = new();
}
