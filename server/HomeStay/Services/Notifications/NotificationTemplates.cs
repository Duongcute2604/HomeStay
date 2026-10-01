using HomeStay.Entities;
using HomeStay.Enums;

namespace HomeStay.Services.Notifications;

/// <summary>
/// Sinh tiêu đề và nội dung thông báo theo trạng thái đơn vừa chuyển.
/// </summary>
/// <remarks>
/// Tách ra khỏi <c>AdminBookingService</c> để service đó chỉ lo "chuyển trạng thái",
/// còn chuyện viết gì cho khách đọc thì ở đúng một chỗ. Khi sửa câu chữ không phải đụng
/// vào logic transaction.
///
/// Nội dung luôn kèm **mã đơn** để khách tra cứu được ngay, không phải đoán
/// "cái đơn hôm trước là cái nào".
/// </remarks>
public static class NotificationTemplates
{
    /// <summary>
    /// Trả về cặp (tiêu đề, nội dung) cho một lần chuyển trạng thái.
    /// </summary>
    /// <param name="don">Đơn vừa chuyển trạng thái — cần <c>Code</c> và <c>Room.Name</c>.</param>
    /// <param name="denTrangThai">Trạng thái mới của đơn.</param>
    /// <param name="lyDo">Lý do từ chối/hủy, chỉ có với trạng thái `REJECTED`.</param>
    public static (string TieuDe, string NoiDung) Tao(
        Entities.Booking don,
        BookingStatus denTrangThai,
        string? lyDo)
    {
        string maDon = don.Code;
        string phong = don.Room?.Name ?? "phòng đã đặt";

        return denTrangThai switch
        {
            BookingStatus.CONFIRMED => (
                $"Đơn {maDon} đã được xác nhận",
                $"Đơn đặt phòng {phong} đã được xác nhận. Bạn có thể đến nhận phòng từ 14:00 ngày nhận phòng."),

            BookingStatus.CHECKED_IN => (
                $"Đơn {maDon}: đã nhận phòng",
                $"Bạn đã nhận phòng {phong}. Chúc bạn kỳ nghỉ vui vẻ!"),

            BookingStatus.COMPLETED => (
                $"Đơn {maDon}: đã trả phòng",
                $"Cảm ơn bạn đã sử dụng dịch vụ. Hãy vào trang đơn để chọn phương thức thanh toán và đánh giá trải nghiệm."),

            BookingStatus.REJECTED => (
                $"Đơn {maDon} bị từ chối",
                string.IsNullOrWhiteSpace(lyDo)
                    ? $"Đơn đặt phòng {phong} đã bị từ chối."
                    : $"Đơn đặt phòng {phong} đã bị từ chối. Lý do: {lyDo.Trim()}"),

            // Cố ý KHÔNG có nhánh `CANCELLED`: khách tự huỷ thì chính họ biết, gửi
            // thông báo lại chỉ làm nhiễu. Chỉ Admin sinh thông báo, mà Admin không có
            // thao tác huỷ đơn — nhánh đó là code không bao giờ chạy tới (AGENTS.md 3.4).
            // Nếu sau này thêm "Admin huỷ đơn" thì bổ sung nhánh vào đây.
            _ => throw new ArgumentOutOfRangeException(
                nameof(denTrangThai),
                denTrangThai,
                "Chưa có câu chữ cho trạng thái này. Thêm nhánh vào switch thay vì trả chuỗi rỗng."),
        };
    }
}
