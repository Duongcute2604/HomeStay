using HomeStay.DTOs;

namespace HomeStay.Services.Payments;

/// <summary>Phía khách: xem lịch sử thanh toán và chọn phương thức thanh toán.</summary>
public interface IPaymentService
{
    /// <summary>
    /// Danh sách thanh toán của chính khách, mới nhất trước.
    /// </summary>
    /// <param name="userId">Khoá người dùng lấy từ token.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<IReadOnlyList<PaymentDto>> LayCuaToiAsync(int userId, CancellationToken ct);

    /// <summary>
    /// Mở phiếu thu cho một đơn của chính khách, hoặc đổi phương thức của phiếu đang chờ.
    /// </summary>
    /// <param name="userId">Khoá người dùng lấy từ token.</param>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="request">Phương thức khách chọn.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <exception cref="Common.AppException">
    /// 404 khi không thấy đơn của người này hoặc chưa có phiếu thu ·
    /// 400 khi đơn chưa hoàn thành hoặc số tiền không khớp ·
    /// 409 khi phiếu đã thu tiền rồi.
    /// </exception>
    Task<PaymentDto> ChonPhuongThucAsync(
        int userId, string code, CreatePaymentRequest request, CancellationToken ct);

    /// <summary>Phiếu thu của một đơn, hoặc `null` khi đơn chưa có phiếu.</summary>
    /// <param name="userId">Khoá người dùng lấy từ token.</param>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<PaymentDto?> LayTheoDonAsync(int userId, string code, CancellationToken ct);
}