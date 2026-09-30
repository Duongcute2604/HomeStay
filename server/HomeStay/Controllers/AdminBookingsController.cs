using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Enums;
using HomeStay.Services.Admin;

namespace HomeStay.Controllers;

/// <summary>
/// Endpoint quản lý đơn đặt phòng phía Admin — chỉ Admin.
///
/// Bốn thao tác chuyển trạng thái tách riêng thay vì một endpoint
/// `PATCH /status` nhận trạng thái đích tùy ý: cách này làm ma trận chuyển
/// trạng thái nằm ngay trong URL, đọc Swagger là biết quy tắc, và không mở đường
/// cho việc chuyển nhảy trạng thái tuỳ ý qua API.
/// </summary>
[ApiController]
[Route("api/admin/bookings")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminBookingsController : ControllerBase
{
    private readonly IAdminBookingService _service;

    /// <summary>Khởi tạo controller với service quản lý đơn.</summary>
    public AdminBookingsController(IAdminBookingService service)
    {
        _service = service;
    }

    /// <summary>Lấy danh sách đơn, lọc theo trạng thái và từ khoá (mã đơn / tên / email khách).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<AdminBookingDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSach(
        [FromQuery] BookingStatus? status,
        [FromQuery] string? keyword,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken ct = default)
    {
        var filter = new AdminBookingFilter
        {
            Status = status,
            Keyword = keyword,
            Page = page,
            PageSize = pageSize,
        };

        PagedResultDto<AdminBookingDto> result = await _service.LayDanhSachAsync(filter, ct);

        return Ok(ApiResponse<PagedResultDto<AdminBookingDto>>.SuccessResponse(
            "Lấy danh sách đơn thành công", result));
    }

    /// <summary>Xác nhận đơn đang chờ: <c>PENDING → CONFIRMED</c>.</summary>
    [HttpPatch("{code}/confirm")]
    [ProducesResponseType(typeof(ApiResponse<AdminBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> XacNhan(string code, CancellationToken ct)
    {
        AdminBookingDto result = await _service.XacNhanAsync(code, User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<AdminBookingDto>.SuccessResponse("Đã xác nhận đơn", result));
    }

    /// <summary>Từ chối đơn đang chờ kèm lý do: <c>PENDING → REJECTED</c>.</summary>
    [HttpPatch("{code}/reject")]
    [ProducesResponseType(typeof(ApiResponse<AdminBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> TuChoi(
        string code,
        [FromBody] RejectBookingRequest request,
        CancellationToken ct)
    {
        AdminBookingDto result = await _service.TuChoiAsync(code, User.LayUserIdHienTai(), request.Reason, ct);

        return Ok(ApiResponse<AdminBookingDto>.SuccessResponse("Đã từ chối đơn", result));
    }

    /// <summary>Cho khách nhận phòng: <c>CONFIRMED → CHECKED_IN</c>.</summary>
    [HttpPatch("{code}/check-in")]
    [ProducesResponseType(typeof(ApiResponse<AdminBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CheckIn(string code, CancellationToken ct)
    {
        AdminBookingDto result = await _service.CheckInAsync(code, User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<AdminBookingDto>.SuccessResponse("Đã check-in", result));
    }

    /// <summary>Khách trả phòng: <c>CHECKED_IN → COMPLETED</c>, phòng chuyển sang đang vệ sinh.</summary>
    [HttpPatch("{code}/check-out")]
    [ProducesResponseType(typeof(ApiResponse<AdminBookingDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CheckOut(string code, CancellationToken ct)
    {
        AdminBookingDto result = await _service.CheckOutAsync(code, User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<AdminBookingDto>.SuccessResponse("Đã check-out", result));
    }
}
