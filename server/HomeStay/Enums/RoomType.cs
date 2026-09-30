namespace HomeStay.Enums;

/// <summary>
/// Loại phòng. Thêm loại phòng mới = thêm 1 giá trị enum + 1 nhánh xử lý, không phải sửa code cũ (nguyên tắc Open/Closed).
/// </summary>
public enum RoomType
{
    /// <summary>Phòng Cozy — ấm cúng, riêng tư.</summary>
    COZY = 0,

    /// <summary>Phòng Japandi — tối giản, tinh tế.</summary>
    JAPANDI = 1,

    /// <summary>Phòng Signature — đẳng cấp, view đẹp.</summary>
    SIGNATURE = 2
}
