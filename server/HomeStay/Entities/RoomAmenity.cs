namespace HomeStay.Entities;

/// <summary>
/// Bảng nối giữa Room và Amenity — quan hệ nhiều-nhiều.
/// Khoá chính ghép (RoomId, AmenityId) chính là cách chặn trùng: cùng 1 phòng không thể có 2 dòng cùng 1 tiện nghi.
/// </summary>
public class RoomAmenity
{
    /// <summary>Phòng.</summary>
    public int RoomId { get; set; }

    /// <summary>Tiện nghi.</summary>
    public int AmenityId { get; set; }

    /// <summary>Thời điểm tạo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Phòng.</summary>
    public Room Room { get; set; } = null!;

    /// <summary>Tiện nghi.</summary>
    public Amenity Amenity { get; set; } = null!;
}
