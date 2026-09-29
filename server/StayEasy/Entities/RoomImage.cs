namespace StayEasy.Entities;

/// <summary>
/// Ảnh của phòng. Mỗi phòng có 1 ảnh chính và một số ảnh phụ, sắp xếp theo <see cref="SortOrder"/>.
/// </summary>
public class RoomImage
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Phòng mà ảnh này thuộc về.</summary>
    public int RoomId { get; set; }

    /// <summary>Đường dẫn tới file ảnh.</summary>
    public string ImageUrl { get; set; } = string.Empty;

    /// <summary>Ảnh chính — dùng làm ảnh đại diện trong danh sách kết quả tìm kiếm.</summary>
    public bool IsPrimary { get; set; }

    /// <summary>Thứ tự hiển thị, số nhỏ hiện trước.</summary>
    public int SortOrder { get; set; }

    /// <summary>Thời điểm tạo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Phòng chứa ảnh.</summary>
    public Room Room { get; set; } = null!;
}
