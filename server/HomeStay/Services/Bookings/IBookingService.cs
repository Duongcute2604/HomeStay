using HomeStay.Common;
using HomeStay.DTOs;

namespace HomeStay.Services.Bookings;

/// <summary>
/// Nghiệp vụ đơn đặt phòng của khách: tạo, xem, hủy.
///
/// Mọi quy tắc về ngày/giờ/trùng lịch tái sử dụng `IRoomService.KiemTraTrongAsync`
/// thay vì viết lại (DRY) — đặt được hay không do đúng một nơi quyết định.
/// `userId` luôn lấy từ token, không nhận từ client.
/// </summary>
public interface IBookingService
{
    /// <summary>
    /// Tạo đơn mới ở trạng thái `PENDING` trong transaction `SERIALIZABLE`.
    /// </summary>
    /// <exception cref="AppException">
    /// 400 khi thiếu ngày, trả trước nhận, đặt gấp, theo giờ dưới 3 giờ, quá
    /// sức chứa, hoặc cách thuê không hợp lệ. 404 khi chỉ số sai phòng.
    /// 409 khi phòng bận trong khoảng đã chọn.
    /// </exception>
    Task<BookingResponseDto> TaoDonAsync(int userId, CreateBookingRequest request, CancellationToken ct);

    /// <summary>
    /// Danh sách đơn của chính khách, mới nhất trước, có phân trang.
    /// `userId` lấy từ token — không bao giờ lẫn đơn người khác.
    /// </summary>
    Task<PagedResultDto<MyBookingDto>> LayCuaToiAsync(int userId, int page, int pageSize, CancellationToken ct);

    /// <summary>
    /// Chi tiết một đơn của chính khách kèm lịch sử trạng thái.
    /// </summary>
    /// <exception cref="AppException">404 khi mã sai hoặc đơn của người khác.</exception>
    Task<BookingDetailDto> LayChiTietAsync(int userId, string code, CancellationToken ct);

    /// <summary>
    /// Khách hủy đơn của chính mình. Chỉ `PENDING`/`CONFIRMED` được hủy.
    /// </summary>
    /// <exception cref="AppException">
    /// 404 khi mã sai hoặc đơn của người khác. 409 khi đơn đã qua bước được hủy.
    /// </exception>
    Task<BookingDetailDto> HuyDonAsync(int userId, string code, string? reason, CancellationToken ct);
}
