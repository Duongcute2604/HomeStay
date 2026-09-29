namespace StayEasy.Enums;

/// <summary>
/// Vòng đời phòng: AVAILABLE → BOOKED → OCCUPIED → CLEANING → AVAILABLE.
/// MAINTENANCE là trạng thái Admin tự đặt khi phòng hỏng, phòng này không cho đặt.
/// </summary>
public enum RoomStatus
{
    /// <summary>Đang trống, sẵn sàng nhận khách.</summary>
    AVAILABLE = 0,

    /// <summary>Đã có đơn đặt nhưng khách chưa nhận phòng.</summary>
    BOOKED = 1,

    /// <summary>Khách đang ở trong phòng.</summary>
    OCCUPIED = 2,

    /// <summary>Vừa trả phòng, đang vệ sinh (2 giờ theo quy định nghiệp vụ).</summary>
    CLEANING = 3,

    /// <summary>Bảo trì, không nhận đặt phòng.</summary>
    MAINTENANCE = 4
}
