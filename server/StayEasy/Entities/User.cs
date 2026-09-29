using StayEasy.Enums;

namespace StayEasy.Entities;

/// <summary>
/// Tài khoản người dùng. Hệ thống chỉ có 2 vai trò: CUSTOMER và ADMIN.
/// </summary>
public class User
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Họ tên hiển thị trên giao diện.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Email dùng để đăng nhập, duy nhất trong hệ thống (có unique index).</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Số điện thoại, không bắt buộc.</summary>
    public string? PhoneNumber { get; set; }

    /// <summary>Hash BCrypt của mật khẩu — không bao giờ lưu mật khẩu thô.</summary>
    public string PasswordHash { get; set; } = string.Empty;

    /// <summary>Địa chỉ, không bắt buộc.</summary>
    public string? Address { get; set; }

    /// <summary>Vai trò của tài khoản.</summary>
    public UserRole Role { get; set; } = UserRole.CUSTOMER;

    /// <summary>Trạng thái tài khoản — khách bị khoá vẫn giữ nguyên lịch sử đặt phòng.</summary>
    public UserStatus Status { get; set; } = UserStatus.ACTIVE;

    /// <summary>Thời điểm tạo tài khoản.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Thời điểm cập nhật gần nhất.</summary>
    public DateTime UpdatedAt { get; set; }

    /// <summary>Các đơn đặt phòng của tài khoản này.</summary>
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    /// <summary>Các đánh giá do tài khoản này viết.</summary>
    public ICollection<Review> Reviews { get; set; } = new List<Review>();

    /// <summary>Các lần thay đổi trạng thái đơn do tài khoản này thực hiện.</summary>
    public ICollection<BookingStatusHistory> StatusChanges { get; set; } = new List<BookingStatusHistory>();
}
