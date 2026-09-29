namespace StayEasy.Enums;

/// <summary>
/// Cách khách thuê phòng — quyết định cách tính tiền và cách kiểm tra khoảng thời gian.
/// </summary>
public enum BookingType
{
    /// <summary>Đặt theo giờ — tối thiểu 3 giờ, tổng tiền = số giờ × giá theo giờ.</summary>
    HOUR = 0,

    /// <summary>Đặt theo ngày — nhận phòng 14:00, trả phòng 12:00 hôm sau.</summary>
    DAY = 1
}
