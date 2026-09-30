using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Rooms;

namespace HomeStay.Controllers;

/// <summary>
/// Endpoint tìm kiếm phòng cho khách — public, không cần đăng nhập.
///
/// Controller chỉ gọi Service rồi bọc vào ApiResponse (AGENTS.md 6.1).
/// </summary>
[ApiController]
[Route("api/rooms")]
[Produces("application/json")]
public class RoomsController : ControllerBase
{
    private readonly IRoomService _roomService;

    /// <summary>Khởi tạo controller với service phòng.</summary>
    public RoomsController(IRoomService roomService)
    {
        _roomService = roomService;
    }

    /// <summary>
    /// Tìm kiếm phòng theo bộ lọc, sắp xếp rồi phân trang.
    /// Response KHÔNG có `Id` — STT do giao diện tự tính.
    /// </summary>
    [HttpGet("search")]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<RoomSearchItemDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TimKiem([FromQuery] RoomSearchRequest request, CancellationToken ct)
    {
        PagedResultDto<RoomSearchItemDto> result = await _roomService.SearchAsync(request, ct);

        return Ok(ApiResponse<PagedResultDto<RoomSearchItemDto>>.SuccessResponse("Tìm kiếm phòng thành công", result));
    }

    /// <summary>
    /// Kiểm tra phòng có đặt được trong khoảng đã chọn không.
    /// Phòng bận vẫn trả 200 với `isAvailable: false` — chỉ tham số sai mới 4xx.
    /// </summary>
    [HttpGet("availability")]
    [ProducesResponseType(typeof(ApiResponse<AvailabilityResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> KiemTraTrong([FromQuery] AvailabilityRequest request, CancellationToken ct)
    {
        AvailabilityResponse result = await _roomService.KiemTraTrongAsync(request, ct);

        return Ok(ApiResponse<AvailabilityResponse>.SuccessResponse("Kiểm tra phòng trống thành công", result));
    }
}
