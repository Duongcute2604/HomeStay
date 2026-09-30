using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Services.Locations;

namespace StayEasy.Controllers;

/// <summary>
/// Endpoint xem địa điểm cho khách — public, không cần đăng nhập.
///
/// Controller chỉ gọi Service rồi bọc vào ApiResponse (AGENTS.md 6.1).
/// </summary>
[ApiController]
[Route("api/locations")]
[Produces("application/json")]
public class LocationsController : ControllerBase
{
    private readonly ILocationService _locationService;

    /// <summary>Khởi tạo controller với service địa điểm.</summary>
    public LocationsController(ILocationService locationService)
    {
        _locationService = locationService;
    }

    /// <summary>
    /// Lấy danh sách địa điểm đang hoạt động kèm phòng tóm tắt.
    /// Response KHÔNG có `Id` (AGENTS.md 6.3) — giao diện điều hướng bằng chỉ số.
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<LocationListItemDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> LayDanhSach(CancellationToken ct)
    {
        List<LocationListItemDto> result = await _locationService.LayDanhSachAsync(ct);

        return Ok(ApiResponse<List<LocationListItemDto>>.SuccessResponse("Lấy danh sách địa điểm thành công", result));
    }
}
