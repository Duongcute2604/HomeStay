using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Services.Admin;

namespace StayEasy.Controllers;

/// <summary>
/// Endpoint quản lý phòng — chỉ Admin.
///
/// Mọi lỗi do Service ném `AppException`; ExceptionMiddleware đổi thành mã
/// HTTP tương ứng nên controller chỉ bọc kết quả thành ApiResponse.
/// </summary>
[ApiController]
[Route("api/admin/rooms")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminRoomsController : ControllerBase
{
    private readonly IAdminRoomService _service;

    /// <summary>Khởi tạo controller với service quản lý phòng.</summary>
    public AdminRoomsController(IAdminRoomService service)
    {
        _service = service;
    }

    /// <summary>Lấy toàn bộ phòng kèm ảnh, tiện nghi và tên cơ sở.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<AdminRoomDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSach(CancellationToken ct)
    {
        List<AdminRoomDto> result = await _service.LayDanhSachAsync(ct);

        return Ok(ApiResponse<List<AdminRoomDto>>.SuccessResponse("Lấy danh sách phòng thành công", result));
    }

    /// <summary>Lấy danh mục tiện nghi để dựng checkbox ở form tạo/sửa phòng.</summary>
    [HttpGet("amenities")]
    [ProducesResponseType(typeof(ApiResponse<List<AmenityDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSachTienNgh(CancellationToken ct)
    {
        List<AmenityDto> result = await _service.LayDanhSachTienNghAsync(ct);

        return Ok(ApiResponse<List<AmenityDto>>.SuccessResponse("Lấy danh mục tiện nghi thành công", result));
    }

    /// <summary>Tạo phòng mới cùng ảnh và tiện nghi.</summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<AdminRoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Tao([FromBody] RoomRequest request, CancellationToken ct)
    {
        AdminRoomDto result = await _service.TaoAsync(request, ct);

        return Ok(ApiResponse<AdminRoomDto>.SuccessResponse("Tạo phòng thành công", result));
    }

    /// <summary>Cập nhật phòng, thay toàn bộ ảnh và tiện nghi theo dữ liệu gửi lên.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<AdminRoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Sua(int id, [FromBody] RoomRequest request, CancellationToken ct)
    {
        AdminRoomDto result = await _service.SuaAsync(id, request, ct);

        return Ok(ApiResponse<AdminRoomDto>.SuccessResponse("Cập nhật phòng thành công", result));
    }

    /// <summary>Chỉ đổi trạng thái phòng (trống / đã đặt / có khách / vệ sinh / bảo trì).</summary>
    [HttpPatch("{id:int}/status")]
    [ProducesResponseType(typeof(ApiResponse<AdminRoomDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DoiTrangThai(int id, [FromBody] RoomStatusRequest request, CancellationToken ct)
    {
        AdminRoomDto result = await _service.DoiTrangThaiAsync(id, request, ct);

        return Ok(ApiResponse<AdminRoomDto>.SuccessResponse("Cập nhật trạng thái phòng thành công", result));
    }

    /// <summary>Xoá phòng. Phòng đã có đơn sẽ bị từ chối với mã 400.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Xoa(int id, CancellationToken ct)
    {
        await _service.XoaAsync(id, ct);

        return Ok(ApiResponse<object>.SuccessResponse("Xoá phòng thành công"));
    }
}
