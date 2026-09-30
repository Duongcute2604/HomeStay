using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Admin;

namespace HomeStay.Controllers;

/// <summary>
/// Endpoint quản lý khách hàng — chỉ Admin.
///
/// Hệ thống chỉ có 2 vai trò CUSTOMER và ADMIN (AGENTS.md 1.4), nên đây là
/// nơi duy nhất Admin xem và xử lý khách — không tách riêng "đơn" và "khách".
/// </summary>
[ApiController]
[Route("api/admin/customers")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminCustomersController : ControllerBase
{
    private readonly IAdminCustomerService _service;

    /// <summary>Khởi tạo controller với service quản lý khách hàng.</summary>
    public AdminCustomersController(IAdminCustomerService service)
    {
        _service = service;
    }

    /// <summary>Lấy toàn bộ tài khoản khách kèm số đơn đã đặt.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<CustomerDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSach(CancellationToken ct)
    {
        List<CustomerDto> result = await _service.LayDanhSachAsync(ct);

        return Ok(ApiResponse<List<CustomerDto>>.SuccessResponse("Lấy danh sách khách hàng thành công", result));
    }

    /// <summary>Admin tự tạo tài khoản khách (ví dụ khách gọi điện đặt trước).</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Tao([FromBody] CustomerCreateRequest request, CancellationToken ct)
    {
        CustomerDto result = await _service.TaoAsync(request, ct);

        return Ok(ApiResponse<CustomerDto>.SuccessResponse("Tạo khách hàng thành công", result));
    }

    /// <summary>Khoá hoặc mở khoá tài khoản khách. Không xoá để giữ lịch sử đơn.</summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<CustomerDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DoiTrangThai(int id, [FromBody] CustomerStatusRequest request, CancellationToken ct)
    {
        string message = request.IsLocked
            ? "Đã khoá tài khoản khách hàng"
            : "Đã mở khoá tài khoản khách hàng";

        CustomerDto result = await _service.DoiTrangThaiAsync(id, request, ct);

        return Ok(ApiResponse<CustomerDto>.SuccessResponse(message, result));
    }
}
