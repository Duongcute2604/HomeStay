using StayEasy.DTOs;

namespace StayEasy.Services.Reviews;

/// <summary>Ghi đánh giá của khách lên đơn đã trả phòng.</summary>
public interface IReviewService
{
    /// <summary>
    /// Khách viết đánh giá cho đơn của chính mình.
    /// </summary>
    /// <param name="userId">Khoá người dùng lấy từ token.</param>
    /// <param name="code">Mã đơn dạng `HS-250930-4821`.</param>
    /// <param name="request">Số sao + nhận xét.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <exception cref="Common.AppException">
    /// 404 khi không thấy đơn của người này · 409 khi đơn chưa hoàn tất
    /// hoặc đã có đánh giá.
    /// </exception>
    Task<MyReviewDto> TaoDanhGiaAsync(
        int userId, string code, CreateReviewRequest request, CancellationToken ct);
}
