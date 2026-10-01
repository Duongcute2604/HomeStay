using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Payments;

namespace HomeStay.Controllers;

/// <summary>
/// Phía khách: xem lịch sử thanh toán và chọn phương thức thanh toán cho đơn của mình.
/// </summary>
/// <remarks>
/// Chỉ <b>ghi nhận</b> phương thức thanh toán — không có lời gọi mạng nào tới cổng thanh
/// toán. Đây là ranh giới đã chốt của đồ án, được nêu rõ trong báo cáo.
/// </remarks>
[ApiController]
[Route("api/payments")]
[Authorize]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _service;

    /// <summary>Khởi tạo controller với service thanh toán.</summary>
    public PaymentsController(IPaymentService service)
    {
        _service = service;
    }

    /// <summary>Lịch sử thanh toán của chính khách, mới nhất trước.</summary>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<IReadOnlyList<PaymentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LayCuaToi(CancellationToken ct)
    {
        IReadOnlyList<PaymentDto> result = await _service.LayCuaToiAsync(User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<IReadOnlyList<PaymentDto>>.SuccessResponse("Lấy lịch sử thanh toán thành công", result));
    }

    /// <summary>Phiếu thu của một đơn của chính khách, hoặc `null` khi đơn chưa có phiếu.</summary>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet("booking/{code}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LayTheoDon(string code, CancellationToken ct)
    {
        PaymentDto? result = await _service.LayTheoDonAsync(User.LayUserIdHienTai(), code, ct);

        return Ok(ApiResponse<PaymentDto?>.SuccessResponse("Lấy thông tin thanh toán thành công", result));
    }

    /// <summary>
    /// Khách chọn phương thức thanh toán cho đơn của mình.
    /// </summary>
    /// <remarks>
    /// Đơn phải ở trạng thái hoàn thành mới có phiếu thu; gọi lần đầu sẽ mở phiếu, gọi lần
    /// sau đổi phương thức. Phiếu đã đánh dấu thu tiền thì trả `409`.
    /// </remarks>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="request">Phương thức thanh toán khách chọn.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPost("booking/{code}")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ChonPhuongThuc(
        string code, CreatePaymentRequest request, CancellationToken ct)
    {
        PaymentDto result = await _service.ChonPhuongThucAsync(
            User.LayUserIdHienTai(), code, request, ct);

        return Ok(ApiResponse<PaymentDto>.SuccessResponse("Chọn phương thức thanh toán thành công", result));
    }
}