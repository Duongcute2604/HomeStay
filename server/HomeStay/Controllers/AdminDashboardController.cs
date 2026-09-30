using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Admin;

namespace HomeStay.Controllers;

/// <summary>
/// Endpoint số liệu thống kê — chỉ Admin.
///
/// Một endpoint gom, không tách 6 endpoint: dashboard cần 6 con số cùng lúc,
/// 6 lần gọi thì tải 6 lần và các con số có thể lệch nhau do đọc ở 6 thời điểm.
/// </summary>
[ApiController]
[Route("api/admin/dashboard")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminDashboardController : ControllerBase
{
    private readonly IAdminDashboardService _service;

    /// <summary>Khởi tạo controller với service thống kê.</summary>
    public AdminDashboardController(IAdminDashboardService service)
    {
        _service = service;
    }

    /// <summary>
    /// Lấy toàn bộ số liệu: tổng quan · doanh thu & số đơn theo tháng · tỷ lệ lấp đầy
    /// · trạng thái phòng · 5 phòng doanh thu cao nhất.
    /// </summary>
    /// <param name="soThang">Số tháng gần nhất tính doanh thu (mặc định 6, tối đa 24).</param>
    /// <param name="soNgay">Số ngày gần nhất tính tỷ lệ lấp đầy (mặc định 30, tối đa 365).</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<DashboardDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LaySoLieu(
        [FromQuery] int soThang = 6,
        [FromQuery] int soNgay = 30,
        CancellationToken ct = default)
    {
        DashboardDto result = await _service.LaySoLieuAsync(soThang, soNgay, ct);

        return Ok(ApiResponse<DashboardDto>.SuccessResponse("Lấy số liệu thống kê thành công", result));
    }
}
