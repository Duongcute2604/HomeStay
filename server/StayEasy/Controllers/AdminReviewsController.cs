using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Services.Admin;

namespace StayEasy.Controllers;

/// <summary>
/// Quản lý đánh giá phía Admin — chỉ Admin.
/// </summary>
/// <remarks>
/// Ba endpoint tách riêng thay vì một `PATCH .../status` nhận trạng thái tuỳ ý:
/// mỗi hành động có một đường dẫn riêng thì không thể gọi nhầm, và thêm hành động
/// mới không phải sửa lại endpoint cũ (nguyên tắc Open/Closed của SOLID).
/// Cùng cách làm với 4 endpoint chuyển trạng thái đơn ở Bước 13.
/// </remarks>
[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "ADMIN")]
[Produces("application/json")]
public class AdminReviewsController : ControllerBase
{
    private readonly IAdminReviewService _service;

    /// <summary>Khởi tạo controller với service quản lý đánh giá.</summary>
    public AdminReviewsController(IAdminReviewService service)
    {
        _service = service;
    }

    /// <summary>
    /// Danh sách đánh giá có phân trang, mới nhất trước.
    /// </summary>
    /// <param name="anId">Lọc theo trạng thái hiển thị. Bỏ trống = tất cả.</param>
    /// <param name="soSao">Lọc theo số sao 1–5. Bỏ trống = tất cả.</param>
    /// <param name="page">Trang bắt đầu từ 1.</param>
    /// <param name="pageSize">Số dòng mỗi trang, tối đa 50.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResultDto<AdminReviewDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> LayDanhSach(
        [FromQuery] bool? anId,
        [FromQuery] int? soSao,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        PagedResultDto<AdminReviewDto> result =
            await _service.LayDanhSachAsync(anId, soSao, page, pageSize, ct);

        return Ok(ApiResponse<PagedResultDto<AdminReviewDto>>.SuccessResponse(
            "Lấy danh sách đánh giá thành công", result));
    }

    /// <summary>Ẩn một đánh giá vi phạm — bản ghi vẫn còn, chỉ không hiện ra giao diện.</summary>
    /// <param name="id">Khoá đánh giá.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("{id:int}/hide")]
    [ProducesResponseType(typeof(ApiResponse<ReviewVisibilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AnDanhGia(int id, CancellationToken ct)
    {
        ReviewVisibilityDto result = await _service.DoiTrangThaiHienThiAsync(id, true, ct);

        return Ok(ApiResponse<ReviewVisibilityDto>.SuccessResponse(
            "Đã ẩn đánh giá khỏi trang phòng", result));
    }

    /// <summary>Hiện lại một đánh giá đã bị ẩn.</summary>
    /// <param name="id">Khoá đánh giá.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpPatch("{id:int}/unhide")]
    [ProducesResponseType(typeof(ApiResponse<ReviewVisibilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HienDanhGia(int id, CancellationToken ct)
    {
        ReviewVisibilityDto result = await _service.DoiTrangThaiHienThiAsync(id, false, ct);

        return Ok(ApiResponse<ReviewVisibilityDto>.SuccessResponse(
            "Đã hiện lại đánh giá", result));
    }

    /// <summary>Xoá hẳn đánh giá — dành cho đánh giá rác, vi phạm nặng.</summary>
    /// <param name="id">Khoá đánh giá.</param>
    /// <param name="ct">Token huỷ.</param>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<ReviewVisibilityDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> XoaDanhGia(int id, CancellationToken ct)
    {
        ReviewVisibilityDto result = await _service.XoaAsync(id, ct);

        return Ok(ApiResponse<ReviewVisibilityDto>.SuccessResponse(
            "Đã xoá đánh giá", result));
    }
}
