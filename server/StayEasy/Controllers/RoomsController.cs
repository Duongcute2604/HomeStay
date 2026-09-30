using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Services.Rooms;

namespace StayEasy.Controllers;

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
}
