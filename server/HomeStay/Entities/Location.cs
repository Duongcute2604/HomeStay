namespace HomeStay.Entities;

/// <summary>
/// Địa điểm chứa homestay (ví dụ: Hưng Yên, Đà Lạt, Hội An).
/// </summary>
public class Location
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Tên địa điểm.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Quận/Huyện hoặc khu vực nhỏ hơn.</summary>
    public string City { get; set; } = string.Empty;

    /// <summary>Tỉnh/Thành phố.</summary>
    public string Province { get; set; } = string.Empty;

    /// <summary>Địa chỉ đầy đủ.</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>Mô tả giới thiệu địa điểm, không bắt buộc.</summary>
    public string? Description { get; set; }

    /// <summary>Đường dẫn ảnh đại diện địa điểm.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Địa điểm còn hoạt động hay không — ngừng hoạt động thì không hiện cho khách.</summary>
    public bool IsActive { get; set; } = true;

    /// <summary>Thời điểm tạo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Các phòng thuộc địa điểm này.</summary>
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
