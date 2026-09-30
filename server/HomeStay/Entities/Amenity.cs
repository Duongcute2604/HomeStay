namespace HomeStay.Entities;

/// <summary>
/// Tiện nghi dùng chung cho nhiều phòng (WiFi, máy lạnh, bồn tắm...).
/// Tách riêng khỏi Room để không phải nhập lại cùng một tiện nghi cho từng phòng.
/// </summary>
public class Amenity
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Tên tiện nghi, duy nhất (có unique index).</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Mô tả ngắn, không bắt buộc.</summary>
    public string? Description { get; set; }

    /// <summary>Tên icon dùng trên giao diện.</summary>
    public string? Icon { get; set; }

    /// <summary>Thời điểm tạo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Các phòng đang có tiện nghi này.</summary>
    public ICollection<RoomAmenity> RoomLinks { get; set; } = new List<RoomAmenity>();
}
