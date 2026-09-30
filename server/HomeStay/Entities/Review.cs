namespace HomeStay.Entities;

/// <summary>
/// Đánh giá của khách sau khi đã trả phòng.
/// Mỗi đơn chỉ có tối đa 1 đánh giá — thực thi bằng unique index trên <see cref="BookingId"/>, không bằng code kiểm tra.
/// </summary>
public class Review
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Đơn đặt phòng được đánh giá — duy nhất trong hệ thống.</summary>
    public int BookingId { get; set; }

    /// <summary>Người viết đánh giá.</summary>
    public int UserId { get; set; }

    /// <summary>Phòng được đánh giá.</summary>
    public int RoomId { get; set; }

    /// <summary>Số sao từ 1 đến 5 (ràng buộc kiểm tra ở tầng CSDL).</summary>
    public int Rating { get; set; }

    /// <summary>Nội dung nhận xét, không bắt buộc.</summary>
    public string? Comment { get; set; }

    /// <summary>Admin ẩn đánh giá vi phạm — bản ghi vẫn còn, chỉ không hiện ra giao diện.</summary>
    public bool IsHidden { get; set; }

    /// <summary>Thời điểm viết đánh giá.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Đơn đặt phòng được đánh giá.</summary>
    public Booking Booking { get; set; } = null!;

    /// <summary>Người viết đánh giá.</summary>
    public User User { get; set; } = null!;

    /// <summary>Phòng được đánh giá.</summary>
    public Room Room { get; set; } = null!;
}
