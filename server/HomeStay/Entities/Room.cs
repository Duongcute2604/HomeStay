using HomeStay.Enums;

namespace HomeStay.Entities;

/// <summary>
/// Phòng homestay. Giá lưu tách theo giờ và theo ngày vì khách thuê theo 2 cách khác nhau.
/// </summary>
public class Room
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Địa điểm chứa phòng.</summary>
    public int LocationId { get; set; }

    /// <summary>Tên phòng hiển thị cho khách.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số phòng để phân biệt các phòng cùng tên trong một homestay.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Loại phòng.</summary>
    public RoomType RoomType { get; set; } = RoomType.COZY;

    /// <summary>Số khách tối đa phòng chịu được.</summary>
    public int Capacity { get; set; }

    /// <summary>
    /// Diện tích phòng (m²) — dùng để phân phòng nhỏ/lớn khi tính tiền theo giờ:
    /// ≤ 40 m² là phòng nhỏ (giá 3 giờ đầu 200.000), lớn hơn là phòng lớn (300.000).
    /// </summary>
    public decimal Area { get; set; }

    /// <summary>Giá TRỌN GÓI cho 3 giờ đầu, tính bằng VNĐ (không còn là giá 1 giờ).</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Giá 1 ngày, tính bằng VNĐ.</summary>
    public decimal PricePerDay { get; set; }

    /// <summary>Mô tả phòng, không bắt buộc.</summary>
    public string? Description { get; set; }

    /// <summary>Vị trí trong vòng đời phòng.</summary>
    public RoomStatus Status { get; set; } = RoomStatus.AVAILABLE;

    /// <summary>Điểm đánh giá trung bình (0–5), cập nhật mỗi khi có đánh giá mới.</summary>
    public decimal RatingAvg { get; set; }

    /// <summary>Số đánh giá đã nhận, dùng làm mẫu số khi tính lại trung bình.</summary>
    public int RatingCount { get; set; }

    /// <summary>Thời điểm tạo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Thời điểm cập nhật gần nhất.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Địa điểm chứa phòng.</summary>
    public Location Location { get; set; } = null!;

    /// <summary>Các ảnh của phòng.</summary>
    public ICollection<RoomImage> Images { get; set; } = new List<RoomImage>();

    /// <summary>Các tiện nghi phòng đang có (quan hệ nhiều-nhiều).</summary>
    public ICollection<RoomAmenity> AmenityLinks { get; set; } = new List<RoomAmenity>();

    /// <summary>Các đơn đặt phòng của phòng này.</summary>
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    /// <summary>Các đánh giá của phòng này.</summary>
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}
