using HomeStay.Enums;

namespace HomeStay.Entities;

/// <summary>
/// Một lần ghi nhận thanh toán cho một đơn đặt phòng.
///
/// <para>
/// Vì sao mỗi đơn chỉ có đúng 1 bản ghi: cài đặt đúng bằng <b>unique index</b> trên
/// <see cref="BookingId"/>, không bằng kiểm tra trong code — hai lần gọi API đồng thời sẽ
/// không tạo được hai dòng. Cùng cách làm với <see cref="Review"/>.
/// </para>
///
/// <para>
/// Vì sao bản ghi này được tạo khi đơn <b>hoàn thành</b> chứ không phải khi khách đặt:
/// khách chưa trả tiền thì chưa có giao dịch. Đến lúc đơn chuyển sang
/// <c>COMPLETED</c> thì hệ thống mở phiếu thu ở trạng thái <c>PENDING</c>, Admin xác nhận
/// đã nhận tiền thì chuyển sang <c>PAID</c>.
/// </para>
/// </summary>
public class Payment
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Đơn đặt phòng được thanh toán. Duy nhất trong hệ thống.</summary>
    public int BookingId { get; set; }

    /// <summary>
    /// Số tiền phải thu, chụp từ <see cref="Booking.TotalAmount"/> tại thời điểm mở phiếu.
    /// Chụp chứ không đọc động vì giá phòng có thể đổi sau này.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>Phương thức khách chọn. Mặc định tiền mặt.</summary>
    public PaymentMethod Method { get; set; } = PaymentMethod.CASH;

    /// <summary>Trạng thái thanh toán.</summary>
    public PaymentStatus Status { get; set; } = PaymentStatus.PENDING;

    /// <summary>
    /// Thời điểm Admin xác nhận đã thu tiền. <c>null</c> khi chưa thu — đây cũng là điều
    /// kiện để biết đơn nào còn nợ.
    /// </summary>
    public DateTime? PaidAt { get; set; }

    /// <summary>Ghi chú của Admin khi đánh dấu thất bại (ví dụ khách chuyển sai số tiền).</summary>
    public string? Note { get; set; }

    /// <summary>Thời điểm mở phiếu thu.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Thời điểm cập nhật gần nhất.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Đơn đặt phòng liên quan.</summary>
    public Booking Booking { get; set; } = null!;
}