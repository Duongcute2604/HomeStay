using StayEasy.DTOs;

namespace StayEasy.Services.Admin;

/// <summary>
/// Quản lý vòng đời đơn đặt phòng phía Admin: xem, xác nhận, từ chối,
/// check-in, check-out.
///
/// Tách riêng khỏi `IBookingService` vì hai bên khác hẳn về mặt quyền: bên
/// khách chỉ thấy đơn mình và chỉ hủy được; bên Admin thấy toàn bộ đơn và điều
/// khiển trạng thái. Gộp chung sẽ khiến mọi hàm phải kiểm tra "ai đang gọi".
///
/// `adminUserId` luôn lấy từ token do controller chuyển vào — không bao giờ nhận
/// từ body, và cũng không dùng bừa id của khách đặt phòng làm người thực hiện.
/// </summary>
public interface IAdminBookingService
{
    /// <summary>Danh sách đơn có lọc theo trạng thái / từ khoá, mới nhất trước.</summary>
    Task<PagedResultDto<AdminBookingDto>> LayDanhSachAsync(AdminBookingFilter filter, CancellationToken ct);

    /// <summary>
    /// Xác nhận đơn: <c>PENDING → CONFIRMED</c>, phòng chuyển sang <c>BOOKED</c>.
    /// </summary>
    /// <param name="code">Mã đơn.</param>
    /// <param name="adminUserId">Id Admin lấy từ token, ghi vào lịch sử trạng thái.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <exception cref="AppException">404 khi mã sai · 409 khi đơn không ở trạng thái chờ xác nhận.</exception>
    Task<AdminBookingDto> XacNhanAsync(string code, int adminUserId, CancellationToken ct);

    /// <summary>Từ chối đơn: <c>PENDING → REJECTED</c>, phòng về <c>AVAILABLE</c>.</summary>
    /// <exception cref="AppException">400 khi thiếu lý do · 404 khi mã sai · 409 khi sai trạng thái.</exception>
    Task<AdminBookingDto> TuChoiAsync(string code, int adminUserId, string reason, CancellationToken ct);

    /// <summary>Cho khách nhận phòng: <c>CONFIRMED → CHECKED_IN</c>, phòng sang <c>OCCUPIED</c>.</summary>
    /// <exception cref="AppException">404 khi mã sai · 409 khi đơn chưa được xác nhận.</exception>
    Task<AdminBookingDto> CheckInAsync(string code, int adminUserId, CancellationToken ct);

    /// <summary>Khách trả phòng: <c>CHECKED_IN → COMPLETED</c>, phòng sang <c>CLEANING</c>.</summary>
    /// <exception cref="AppException">404 khi mã sai · 409 khi khách chưa nhận phòng.</exception>
    Task<AdminBookingDto> CheckOutAsync(string code, int adminUserId, CancellationToken ct);
}
