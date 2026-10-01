using HomeStay.DTOs;

namespace HomeStay.Services.Notifications;

/// <summary>
/// Các thao tác thông báo dành cho chính người đang đăng nhập.
/// </summary>
public interface INotificationService
{
    /// <summary>Lấy thông báo mới nhất kèm số chưa đọc.</summary>
    Task<NotificationListDto> LayDanhSachAsync(int userId, CancellationToken ct);

    /// <summary>Đánh dấu một thông báo đã đọc.</summary>
    /// <returns><c>false</c> nếu thông báo không thuộc về người này hoặc không tồn tại.</returns>
    Task<bool> DanhDauDaDocAsync(int id, int userId, CancellationToken ct);

    /// <summary>Đánh dấu đã đọc tất cả thông báo của người này.</summary>
    /// <returns>Số thông báo vừa chuyển sang đã đọc.</returns>
    Task<int> DanhDauDaDocTatCaAsync(int userId, CancellationToken ct);
}
