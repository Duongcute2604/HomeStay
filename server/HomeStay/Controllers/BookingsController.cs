using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Auth;
using HomeStay.Services.Bookings;
using HomeStay.Services.Reviews;

namespace HomeStay.Controllers;

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
    private readonly IReviewService _reviewService;

    /// <summary>Khởi tạo controller với service đặt phòng và service đánh giá.</summary>
    public BookingsController(IBookingService bookingService, IReviewService reviewService)
    {
        _bookingService = bookingService;
        _reviewService = reviewService;
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
        BookingResponseDto result = await _bookingService.TaoDonAsync(User.LayUserIdHienTai(), request, ct);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<BookingResponseDto>.SuccessResponse("Đặt phòng thành công. Đơn đang chờ quản trị viên xác nhận", result));
    }

    /// <summary>
    /// Danh sách đơn của chính người đang đăng nhập, mới nhất trước.
    /// </summary>
    /// status loc theo trang thai (0-5). Khong truyen hoac tron bien thi tra tat ca.
    [HttpGet("my")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<MyBookingDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LayCuaToi(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] int? status = null, CancellationToken ct = default)
    {
        PagedResultDto<MyBookingDto> result =
            await _bookingService.LayCuaToiAsync(User.LayUserIdHienTai(), page, pageSize, status, ct);

        return Ok(ApiResponse<PagedResultDto<MyBookingDto>>.SuccessResponse("Lấy danh sách đơn thành công", result));
    }

    /// <summary>
    /// Chi tiết một đơn của chính mình kèm lịch sử trạng thái. Tra cứu bằng `Code`.
    /// </summary>
    [HttpGet("{code}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LayChiTiet(string code, CancellationToken ct)
    {
        BookingDetailDto result = await _bookingService.LayChiTietAsync(User.LayUserIdHienTai(), code, ct);

        return Ok(ApiResponse<BookingDetailDto>.SuccessResponse("Lấy chi tiết đơn thành công", result));
    }

    /// <summary>
    /// Khách hủy đơn của chính mình. Chỉ đơn `PENDING`/`CONFIRMED` được hủy.
    /// </summary>
    [HttpPost("{code}/cancel")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<BookingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> HuyDon(
        string code, [FromBody] CancelBookingRequest? request, CancellationToken ct)
    {
        // Body được phép rỗng hoàn toàn (lý do không bắt buộc) — `request` null
        // thì lý do là null, không báo lỗi thiếu body.
        BookingDetailDto result = await _bookingService.HuyDonAsync(
            User.LayUserIdHienTai(), code, request?.Reason, ct);

        return Ok(ApiResponse<BookingDetailDto>.SuccessResponse("Hủy đơn thành công", result));
    }

    /// <summary>
    /// Khách đánh giá phòng sau khi đã trả phòng.
    /// Chỉ đơn `COMPLETED` của chính mình được đánh giá, và mỗi đơn chỉ một lần.
    /// </summary>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="request">Số sao + nhận xét.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPost("{code}/review")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<MyReviewDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DanhGia(
        string code, [FromBody] CreateReviewRequest request, CancellationToken ct)
    {
        MyReviewDto result = await _reviewService.TaoDanhGiaAsync(
            User.LayUserIdHienTai(), code, request, ct);

        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<MyReviewDto>.SuccessResponse(
                "Cảm ơn bạn đã đánh giá. Ý kiến của bạn giúp chúng tôi phục vụ tốt hơn",
                result));
    }
}
