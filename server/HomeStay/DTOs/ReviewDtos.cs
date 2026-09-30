using System.ComponentModel.DataAnnotations;
using HomeStay.Services.Reviews;

namespace HomeStay.DTOs;

/// <summary>Dữ liệu gửi lên khi khách đánh giá phòng đã ở.</summary>
/// <remarks>
/// Không có `BookingCode` trong body: đơn được định danh bằng `code` trên URL,
/// và `userId` lấy từ token — không nhận từ client (AGENTS.md 6.6).
/// </remarks>
public class CreateReviewRequest
{
    /// <summary>Số sao từ 1 đến 5. Không có mặc định để tránh 5 sao oan khi quên gửi.</summary>
    [Range(ReviewRules.MinRating, ReviewRules.MaxRating,
        ErrorMessage = "Vui lòng chọn số sao từ 1 đến 5")]
    public int Rating { get; set; }

    /// <summary>Nội dung nhận xét, tối đa 1000 ký tự, không bắt buộc.</summary>
    [StringLength(ReviewRules.MaxCommentLength, ErrorMessage = "Nhận xét không được vượt quá 1000 ký tự")]
    public string? Comment { get; set; }
}

/// <summary>Đánh giá của chính người đang xem — trả về sau khi ghi hoặc khi mở chi tiết đơn.</summary>
public class MyReviewDto
{
    /// <summary>Số sao đã chấm.</summary>
    public int Rating { get; set; }

    /// <summary>Nội dung nhận xét, có thể null.</summary>
    public string? Comment { get; set; }

    /// <summary>Thời điểm viết đánh giá.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Một đánh giá trong danh sách quản trị.
/// </summary>
/// <remarks>
/// Có `Id` vì Admin cần thao tác đúng dòng cần sửa, nhưng giao diện **không**
/// hiển thị (AGENTS.md 6.3) — hiện tên người viết và mã đơn thay thế.
/// </remarks>
public class AdminReviewDto
{
    /// <summary>Khoá chính — dùng cho thao tác Admin, không hiển thị ra giao diện.</summary>
    public int Id { get; set; }

    /// <summary>Mã đơn đã đánh giá, dạng `HS-250930-4821`.</summary>
    public string BookingCode { get; set; } = string.Empty;

    /// <summary>Tên người viết đánh giá.</summary>
    public string ReviewerName { get; set; } = string.Empty;

    /// <summary>Tên phòng được đánh giá.</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>Tên cơ sở chứa phòng.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Số sao 1–5.</summary>
    public int Rating { get; set; }

    /// <summary>Nội dung nhận xét, có thể null.</summary>
    public string? Comment { get; set; }

    /// <summary>Đã bị Admin ẩn hay chưa.</summary>
    public bool IsHidden { get; set; }

    /// <summary>Thời điểm viết đánh giá.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Đánh giá vừa cập nhật trạng thái hiển thị — trả về cho Admin.</summary>
public class ReviewVisibilityDto
{
    /// <summary>Khoá chính của dòng vừa sửa.</summary>
    public int Id { get; set; }

    /// <summary>Trạng thái hiển thị sau khi sửa.</summary>
    public bool IsHidden { get; set; }

    /// <summary>Điểm trung bình của phòng sau khi tính lại (2 chữ số thập phân).</summary>
    public decimal PhongDiemTrungBinh { get; set; }

    /// <summary>Số đánh giá đang được tính vào điểm của phòng.</summary>
    public int PhongSoDanhGia { get; set; }
}
