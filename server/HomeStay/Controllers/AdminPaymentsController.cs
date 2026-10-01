using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Admin;

namespace HomeStay.Controllers;

/// <summary>Quản lý phiếu thu phía Admin — chỉ Admin.</summary>
[ApiController]
[Route("api/admin/payments")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminPaymentsController : ControllerBase
{
    private readonly IAdminPaymentService _service;

    /// <summary>Khởi tạo controller với service quản lý thanh toán.</summary>
    public AdminPaymentsController(IAdminPaymentService service)
    {
        _service = service;
    }

    /// <summary>Danh sách phiếu thu phân trang, mới nhất trước.</summary>
    /// <param name="status">Lọc theo trạng thái thanh toán. Bỏ trống = tất cả.</param>
    /// <param name="page">Trang bắt đầu từ 1.</param>
    /// <param name="pageSize">Số dòng mỗi trang, tối đa 50.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<PaymentDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> LayDanhSach(
        [FromQuery] int? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        PagedResultDto<PaymentDto> result =
            await _service.LayDanhSachAsync(status, page, pageSize, ct);

        return Ok(ApiResponse<PagedResultDto<PaymentDto>>.SuccessResponse("Lấy danh sách thanh toán thành công", result));
    }

    /// <summary>Xác nhận đã thu tiền: chuyển phiếu sang `PAID` và ghi thời điểm.</summary>
    /// <param name="id">Khoá phiếu thu.</param>
    /// <param name="request">Phương thức thực tế đã thu + ghi chú.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("{id}/paid")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DanhDauDaThu(
        int id, UpdatePaymentRequest request, CancellationToken ct)
    {
        PaymentDto result = await _service.DanhDauDaThuAsync(id, request, ct);

        return Ok(ApiResponse<PaymentDto>.SuccessResponse("Đã đánh dấu thu tiền", result));
    }

    /// <summary>Đánh dấu thất bại để khách tạo lại giao dịch mới.</summary>
    /// <param name="id">Khoá phiếu thu.</param>
    /// <param name="lyDo">Lý do thất bại, hiển thị cho khách.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("{id}/failed")]
    [ProducesResponseType(typeof(ApiResponse<PaymentDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DanhDauThatBai(
        int id, [FromQuery] string? lyDo, CancellationToken ct)
    {
        PaymentDto result = await _service.DanhDauThatBaiAsync(id, lyDo, ct);

        return Ok(ApiResponse<PaymentDto>.SuccessResponse("Đã đánh dấu thất bại", result));
    }
}