namespace HomeStay.Enums;

/// <summary>
/// Tên tiếng Việt của trạng thái đơn đặt phòng, dùng trong thông báo lỗi.
/// </summary>
/// <remarks>
/// Tách ra khỏi `AdminBookingService` vì Bước 16 cũng cần tên trạng thái để nói
/// "chỉ đánh giá được đơn đã hoàn tất". Để private trong service thì phải copy —
/// mà copy chính là chỗ dễ lệch: một bên sửa "đã hoàn tất" thành "đã trả phòng"
/// thì thông báo lỗi ở hai chỗ khác nhau, rất khó phát hiện khi bảo vệ.
/// </remarks>
public static class BookingStatusLabels
{
    /// <summary>
    /// Trả về tên tiếng Việt, viết thường để ghép câu thông báo
    /// ("Đơn hiện ở trạng thái \"đã hủy\"").
    /// </summary>
    public static string Ten(BookingStatus trangThai)
    {
        return trangThai switch
        {
            BookingStatus.PENDING => "chờ xác nhận",
            BookingStatus.CONFIRMED => "đã xác nhận",
            BookingStatus.CHECKED_IN => "khách đang ở",
            BookingStatus.COMPLETED => "đã hoàn tất",
            BookingStatus.CANCELLED => "đã hủy",
            BookingStatus.REJECTED => "đã từ chối",
            _ => trangThai.ToString(),
        };
    }
}
