using HomeStay.DTOs;

namespace HomeStay.Services.Rooms;

/// <summary>
/// Nghiệp vụ tìm kiếm phòng cho khách.
///
/// Logic nằm ở tầng Service để unit test gọi thẳng hàm được (AGENTS.md 5.2).
/// Endpoint public, không cần đăng nhập.
/// </summary>
public interface IRoomService
{
    /// <summary>
    /// Tìm phòng theo bộ lọc, sắp xếp rồi phân trang.
    /// `locationIndex` vượt phạm vi → trả trang rỗng (không báo lỗi).
    /// </summary>
    /// <exception cref="HomeStay.Common.AppException">
    /// 400 khi `minPrice &gt; maxPrice`, `roomType` ngoài 0–3, hoặc `sort` không hợp lệ.
    /// </exception>
    Task<PagedResultDto<RoomSearchItemDto>> SearchAsync(RoomSearchRequest request, CancellationToken ct);

    /// <summary>
    /// Tìm phòng đang hiện cho khách theo cặp chỉ số (cùng thứ tự với
    /// `GET /api/locations`). Trả null khi chỉ số sai hoặc đã ngừng hiện.
    /// </summary>
    /// <remarks>
    /// Tách riêng để `BookingService` dùng lại thay vì đoán lại thứ tự —
    /// hai nơi tự tính thứ tự là chờ một lần lệch nhau.
    /// </remarks>
    Task<HomeStay.Entities.Room?> TimPhongAsync(int locationIndex, int roomIndex, CancellationToken ct);

    /// <summary>
    /// Kiểm tra phòng có đặt được trong khoảng đã chọn không.
    /// </summary>
    /// <exception cref="HomeStay.Common.AppException">
    /// 400 khi thiếu ngày, trả trước nhận, đặt gấp (dưới 2 giờ), theo giờ dưới
    /// 3 giờ, hoặc cách thuê không hợp lệ. 404 khi chỉ số trỏ sai phòng.
    /// Phòng bận (bảo trì, trùng đơn) trả 200 với `isAvailable: false`.
    /// </exception>
    Task<AvailabilityResponse> KiemTraTrongAsync(AvailabilityRequest request, CancellationToken ct);
}
