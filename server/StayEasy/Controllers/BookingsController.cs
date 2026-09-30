using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Services.Auth;
using StayEasy.Services.Bookings;

namespace StayEasy.Controllers;

/// <summary>
/// Endpoint đặt phòng của khách — phải đăng nhập.
///
/// Controller chỉ lấy `userId` từ token, gọi Service, bọc ApiResponse (AGENTS.md 6.1).
/// </summary>
[ApiController]
[Route("api/bookings")]
[Produces("application/json")]
public class BookingsController : ControllerBase
{
    private readonly IBookingService _bookingService;

    /// <summary>Khởi tạo controller với service đặt phòng.</summary>
    public BookingsController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    /// <summary>
    /// Tạo đơn đặt phòng mới ở trạng thái chờ xác nhận.
    /// Trả 201 kèm mã đơn `Code` — giao diện hiển thị `Code`, không hiển thị `Id`.
    /// </summary>
    [HttpPost]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> TaoDon([FromBody] CreateBookingRequest request, CancellationToken ct)
    {
        BookingResponseDto result = await _bookingService.TaoDonAsync(LayUserIdHienTai(), request, ct);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.SuccessResponse("Đặt phòng thành công. Đơn đang chờ quản trị viên xác nhận", result));
    }

    /// <summary>
    /// Lấy định danh người dùng từ access token.
    /// TUYỆT ĐỐI không tin id do client gửi — đổi một con số là đặt đơn hộ người khác.
    /// </summary>
    private int LayUserIdHienTai()
    {
        string rawUserId = User.FindFirstValue(JwtTokenService.UserIdClaimType)
            ?? throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.ChuaDangNhap);

        if (!int.TryParse(rawUserId, out int userId))
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenKhongHopLe);
        }

        return userId;
    }
}
