namespace StayEasy.Enums;

/// <summary>
/// Loại phòng. Thêm loại phòng mới = thêm 1 giá trị enum + 1 nhánh xử lý, không phải sửa code cũ (nguyên tắc Open/Closed).
/// </summary>
public enum RoomType
{
    /// <summary>Phòng tiêu chuẩn.</summary>
    STANDARD = 0,

    /// <summary>Phòng cao cấp.</summary>
    DELUXE = 1,

    /// <summary>Phòng cho gia đình, sức chứa lớn hơn.</summary>
    FAMILY = 2,

    /// <summary>Phòng hạng nhà.</summary>
    SUITE = 3
}
