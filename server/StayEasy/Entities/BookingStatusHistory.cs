using StayEasy.Enums;

namespace StayEasy.Entities;

/// <summary>
/// Ghi lại mỗi lần một đơn đặt phòng chuyển trạng thái — gồm cả người thực hiện.
/// Giữ riêng lịch sử thay vì chỉ lưu trạng thái hiện tại, để Admin và khách tra lại được quá trình xử lý.
/// </summary>
public class BookingStatusHistory
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Đơn bị thay đổi trạng thái.</summary>
    public int BookingId { get; set; }

    /// <summary>Trạng thái trước khi đổi. Rỗng ở lần tạo đơn vì chưa có trạng thái nào trước đó.</summary>
    public BookingStatus? FromStatus { get; set; }

    /// <summary>Trạng thái sau khi đổi.</summary>
    public BookingStatus ToStatus { get; set; }

    /// <summary>Tài khoản thực hiện thay đổi.</summary>
    public int ChangedByUserId { get; set; }

    /// <summary>Ghi chú kèm theo, không bắt buộc.</summary>
    public string? Note { get; set; }

    /// <summary>Thời điểm thay đổi.</summary>
    public DateTime ChangedAt { get; set; }

    /// <summary>Đơn bị thay đổi trạng thái.</summary>
    public Booking Booking { get; set; } = null!;

    /// <summary>Tài khoản thực hiện thay đổi.</summary>
    public User ChangedByUser { get; set; } = null!;
}
