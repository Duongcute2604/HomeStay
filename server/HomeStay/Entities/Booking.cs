using HomeStay.Enums;

namespace HomeStay.Entities;

/// <summary>
/// Đơn đặt phòng — bảng trọng tâm của hệ thống.
/// </summary>
public class Booking
{
    /// <summary>Khoá chính, tự tăng (nội bộ, không hiển thị ra giao diện).</summary>
    public int Id { get; set; }

    /// <summary>Mã hiển thị cho khách, dạng HS-250930-4821 — duy nhất, dùng để tra cứu thay cho Id.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Khách đặt phòng.</summary>
    public int UserId { get; set; }

    /// <summary>Phòng được đặt.</summary>
    public int RoomId { get; set; }

    /// <summary>Thuê theo giờ hay theo ngày — quyết định cách tính tiền.</summary>
    public BookingType BookingType { get; set; } = BookingType.DAY;

    /// <summary>Thời điểm dự kiến nhận phòng.</summary>
    public DateTime CheckIn { get; set; }

    /// <summary>Thời điểm dự kiến trả phòng.</summary>
    public DateTime CheckOut { get; set; }

    /// <summary>Số khách thực tế.</summary>
    public int GuestCount { get; set; }

    /// <summary>Tổng tiền đã chốt, tính một lần lúc đặt và không đổi theo giá phòng về sau.</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Giá theo giờ tại thời điểm đặt — giữ lại để lịch sử đơn không bị biến động khi Admin sửa giá phòng.</summary>
    public decimal PricePerHourSnapshot { get; set; }

    /// <summary>Giá theo ngày tại thời điểm đặt — cùng lý do với <see cref="PricePerHourSnapshot"/>.</summary>
    public decimal PricePerDaySnapshot { get; set; }

    /// <summary>Trạng thái hiện tại của đơn.</summary>
    public BookingStatus Status { get; set; } = BookingStatus.PENDING;

    /// <summary>Ghi chú của khách khi đặt, không bắt buộc.</summary>
    public string? Note { get; set; }

    /// <summary>Lý do huỷ hoặc lý do từ chối — hiển thị cho khách khi đơn không còn hiệu lực.</summary>
    public string? CancelReason { get; set; }

    /// <summary>Thời điểm tạo đơn.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Thời điểm cập nhật gần nhất.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Khách đặt phòng.</summary>
    public User User { get; set; } = null!;

    /// <summary>Phòng được đặt.</summary>
    public Room Room { get; set; } = null!;

    /// <summary>Lịch sử mọi lần đổi trạng thái đơn này.</summary>
    public ICollection<BookingStatusHistory> StatusHistory { get; set; } = new List<BookingStatusHistory>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();

    /// <summary>Đánh giá của đơn này — tối đa 1 vì có unique index trên BookingId.</summary>
    public Review? Review { get; set; }
}
