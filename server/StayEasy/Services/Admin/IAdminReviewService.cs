using StayEasy.DTOs;

namespace StayEasy.Services.Admin;

/// <summary>Quản lý đánh giá phía Admin: xem, ẩn/hiện, xoá.</summary>
public interface IAdminReviewService
{
    /// <summary>Danh sách đánh giá có phân trang, mới nhất trước.</summary>
    /// <param name="anId">Lọc theo trạng thái hiển thị. Null = tất cả.</param>
    /// <param name="soSao">Lọc theo số sao 1–5. Null = tất cả.</param>
    /// <param name="page">Trang bắt đầu từ 1.</param>
    /// <param name="pageSize">Số dòng mỗi trang, tối đa 50.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<PagedResultDto<AdminReviewDto>> LayDanhSachAsync(
        bool? anId, int? soSao, int page, int pageSize, CancellationToken ct);

    /// <summary>Ẩn hoặc hiện lại một đánh giá, rồi tính lại điểm phòng.</summary>
    /// <param name="id">Khoá đánh giá.</param>
    /// <param name="an">True = ẩn, false = hiện.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<ReviewVisibilityDto> DoiTrangThaiHienThiAsync(int id, bool an, CancellationToken ct);

    /// <summary>Xoá hẳn đánh giá khỏi hệ thống, rồi tính lại điểm phòng.</summary>
    /// <param name="id">Khoá đánh giá.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<ReviewVisibilityDto> XoaAsync(int id, CancellationToken ct);
}
