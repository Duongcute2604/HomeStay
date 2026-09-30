using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Admin;

namespace HomeStay.Controllers;

/// <summary>
/// Endpoint quản lý cơ sở — chỉ Admin.
///
/// Controller chỉ gọi Service rồi bọc kết quả vào ApiResponse (AGENTS.md 6.1).
/// Lỗi nghiệp vụ do Service ném `AppException`, ExceptionMiddleware đổi thành
/// mã HTTP tương ứng — nên controller không cần if/else cho từng lỗi.
/// </summary>
[ApiController]
[Route("api/admin/locations")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminLocationsController : ControllerBase
{
    private readonly IAdminLocationService _service;

    /// <summary>Khởi tạo controller với service quản lý cơ sở.</summary>
    public AdminLocationsController(IAdminLocationService service)
    {
        _service = service;
    }

    /// <summary>Lấy toàn bộ cơ sở kèm tổng số phòng, gồm cả cơ sở đã ngừng hoạt động.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<AdminLocationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSach(CancellationToken ct)
    {
        List<AdminLocationDto> result = await _service.LayDanhSachAsync(ct);

        return Ok(ApiResponse<List<AdminLocationDto>>.SuccessResponse("Lấy danh sách cơ sở thành công", result));
    }

    /// <summary>Tạo cơ sở mới.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AdminLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Tao([FromBody] FacilityRequest request, CancellationToken ct)
    {
        AdminLocationDto result = await _service.TaoAsync(request, ct);

        return Ok(ApiResponse<AdminLocationDto>.SuccessResponse("Tạo cơ sở thành công", result));
    }

    /// <summary>Cập nhật thông tin cơ sở.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AdminLocationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Sua(int id, [FromBody] FacilityRequest request, CancellationToken ct)
    {
        AdminLocationDto result = await _service.SuaAsync(id, request, ct);

        return Ok(ApiResponse<AdminLocationDto>.SuccessResponse("Cập nhật cơ sở thành công", result));
    }

    /// <summary>Xoá cơ sở. Cơ sở còn phòng sẽ bị từ chối với mã 400.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Xoa(int id, CancellationToken ct)
    {
        await _service.XoaAsync(id, ct);

        return Ok(ApiResponse<object>.SuccessResponse("Xoá cơ sở thành công"));
    }
}
