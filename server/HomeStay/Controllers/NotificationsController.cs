using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Notifications;

namespace HomeStay.Controllers;

/// <summary>
/// Phía khách: xem thông báo và đánh dấu đã đọc.
/// </summary>
/// <remarks>
/// Thông báo <b>chỉ hiển thị trong hệ thống</b>, không gửi email/SMS. Người dùng đăng
/// nhập vào là thấy trên icon chuông.
/// </remarks>
[ApiController]
[Route("api/notifications")]
[Authorize]
[Produces("application/json")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _service;

    /// <summary>Khởi tạo controller với service thông báo.</summary>
    public NotificationsController(INotificationService service)
    {
        _service = service;
    }

    /// <summary>Thông báo mới nhất kèm số chưa đọc.</summary>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet("my")]
    [ProducesResponseType(typeof(ApiResponse<NotificationListDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LayCuaToi(CancellationToken ct)
    {
        NotificationListDto result = await _service.LayDanhSachAsync(User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<NotificationListDto>.SuccessResponse("Lấy thông báo thành công", result));
    }

    /// <summary>Đánh dấu một thông báo đã đọc.</summary>
    /// <remarks>
    /// Thông báo của người khác trả `404` chứ không phải `403` — trả `403` là lộ ra
    /// việc thông báo đó tồn tại.
    /// </remarks>
    /// <param name="id">Khoá thông báo.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("{id}/read")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DanhDauDaDoc(int id, CancellationToken ct)
    {
        bool ok = await _service.DanhDauDaDocAsync(id, User.LayUserIdHienTai(), ct);
        if (!ok)
        {
            return NotFound(ApiResponse<object>.ErrorResponse("Không tìm thấy thông báo"));
        }

        return Ok(ApiResponse<object>.SuccessResponse("Đánh dấu đã đọc thành công"));
    }

    /// <summary>Đánh dấu đã đọc tất cả thông báo của chính mình.</summary>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("read-all")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DanhDauDaDocTatCa(CancellationToken ct)
    {
        int soMoi = await _service.DanhDauDaDocTatCaAsync(User.LayUserIdHienTai(), ct);

        return Ok(ApiResponse<int>.SuccessResponse("Đánh dấu đã đọc tất cả thành công", soMoi));
    }
}
