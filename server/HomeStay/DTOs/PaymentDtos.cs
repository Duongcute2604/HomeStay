using System.ComponentModel.DataAnnotations;
using HomeStay.Services.Payments;

namespace HomeStay.DTOs;

/// <summary>
/// Khách chọn phương thức thanh toán cho đơn của mình.
///
/// <remarks>
/// Không có trường `amount`: số tiền lấy từ `Booking.TotalAmount` chứ không nhận từ
/// client — nếu nhận từ client thì khách gửi số tiền nhỏ hơn cũng qua, và tiền thu được
/// không khớp tiền phải thu (AGENTS.md 6.6: không tin giá trị gửi lên từ client).
/// </remarks>
/// </summary>
public class CreatePaymentRequest
{
    /// <summary>
    /// Phương thức thanh toán. Bắt buộc chỉ nhận giá trị có trong enum
    /// <c>PaymentMethod</c> — giá trị ngoài khoảng trả về `400`.
    /// </summary>
    [Required(ErrorMessage = "Vui lòng chọn phương thức thanh toán")]
    [Range(0, 2, ErrorMessage = "Phương thức thanh toán không hợp lệ")]
    public int Method { get; set; }
}

/// <summary>Thông tin thanh toán của một đơn, trả về cho cả khách và quản trị viên.</summary>
public class PaymentDto
{
    /// <summary>Khoá phiếu thu, dùng cho thao tác của quản trị viên.</summary>
    /// <remarks>
    /// <b>Không hiển thị</b> khoá này ra giao diện — giao diện hiện <c>BookingCode</c> để
    /// khách tra cứu. Nhưng Admin cần khoá để gọi endpoint "đánh dấu đã thu", nên DTO vẫn
    /// phải có nó. Cùng cách làm với <c>AdminReviewDto.Id</c> (AGENTS.md 6.3).
    /// </remarks>
    public int Id { get; set; }

    /// <summary>Mã đơn đặt phòng liên quan, ví dụ `HS-261029-0015`.</summary>
    public string BookingCode { get; set; } = string.Empty;

    /// <summary>Tên phòng đã đặt.</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>Số phòng, ví dụ `A201`.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Tên cơ sở.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Số tiền phải thu, chụp tại lúc mở phiếu.</summary>
    public decimal Amount { get; set; }

    /// <summary>Phương thức thanh toán (giá trị số của enum, giao diện tự ánh tên).</summary>
    public int Method { get; set; }

    /// <summary>Trạng thái thanh toán (giá trị số của enum).</summary>
    public int Status { get; set; }

    /// <summary>Thời điểm đã thu tiền; `null` khi chưa thu.</summary>
    public DateTime? PaidAt { get; set; }

    /// <summary>Ghi chú của quản trị viên; có thể `null`.</summary>
    public string? Note { get; set; }

    /// <summary>Thời điểm mở phiếu thu.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Quản trị viên xác nhận đã thu tiền hoặc đánh dấu thất bại.</summary>
public class UpdatePaymentRequest
{
    /// <summary>Phương thức thực tế đã thu — có thể khác phương thức khách đã chọn.</summary>
    [Range(0, 2, ErrorMessage = "Phương thức thanh toán không hợp lệ")]
    public int Method { get; set; }

    /// <summary>Ghi chú, tối đa 500 ký tự. Không bắt buộc.</summary>
    [StringLength(PaymentRules.DoDaiGhiChuToiDa,
        ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
    public string? Note { get; set; }
}

/// <summary>
/// Một dòng trong bảng thống kê doanh thu đã thu.
///
/// <para>
/// Tách riêng khỏi <c>DashboardDtos</c> hiện có vì cách tính khác hẳn: thống kê cũ cộng
/// tiền của đơn đã hoàn thành, còn bảng này cộng tiền của phiếu thu đã đánh dấu `PAID`.
/// Trộn hai cách tính vào một chỗ thì không biết con số nào lấy từ đâu.
/// </para>
/// </summary>
public class RevenueByMonthDto
{
    /// <summary>Tháng dạng `yyyy-MM`.</summary>
    public string Thang { get; set; } = string.Empty;

    /// <summary>Nhãn tiếng Việt dạng `MM/yyyy` để biểu đồ khỏi tự định dạng.</summary>
    public string TenThang { get; set; } = string.Empty;

    /// <summary>Tổng tiền đã thu trong tháng.</summary>
    public decimal DoanhThu { get; set; }
}
