namespace HomeStay.Enums;

/// <summary>
/// Trạng thái đơn đặt phòng. Mọi lần chuyển trạng thái đều được ghi vào BookingStatusHistory.
/// </summary>
public enum BookingStatus
{
    /// <summary>Khách vừa đặt, chờ Admin xác nhận.</summary>
    PENDING = 0,

    /// <summary>Admin đã xác nhận, chờ khách nhận phòng.</summary>
    CONFIRMED = 1,

    /// <summary>Khách đã nhận phòng.</summary>
    CHECKED_IN = 2,

    /// <summary>Khách đã trả phòng — là điều kiện duy nhất được phép đánh giá.</summary>
    COMPLETED = 3,

    /// <summary>Khách hủy.</summary>
    CANCELLED = 4,

    /// <summary>Admin từ chối đơn (ví dụ: phòng bảo trì).</summary>
    REJECTED = 5
}
