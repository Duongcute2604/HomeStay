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

    /// <summary>
    /// Hash SHA-256 của refresh token hiện hành. Null nghĩa là chưa đăng nhập,
    /// hoặc đã đăng xuất / đổi mật khẩu nên token bị vô hiệu hoá.
    ///
    /// Lưu hash chứ không lưu token thô: database bị lấy cũng không dùng được token.
    /// Dùng SHA-256 chứ không phải BCrypt như mật khẩu, vì BCrypt chỉ xét 72 byte đầu
    /// mà refresh token dài ~196 ký tự — xem giải thích ở ITokenHasher.
    ///
    /// Giới hạn đã biết: mỗi tài khoản chỉ giữ một refresh token tại một thời điểm,
    /// nên đăng nhập ở máy thứ hai sẽ làm token máy thứ nhất mất tác dụng.
    /// </summary>
    public string? RefreshTokenHash { get; set; }

    /// <summary>
    /// Thời điểm refresh token hiện hành hết hạn.
    /// </summary>
    /// <remarks>
    /// Cột này **không tham gia quyết định** token còn hạn hay không — việc đó do
    /// claim `exp` trong chính JWT đảm nhiệm, kiểm lúc `ValidateToken`. Cột giữ
    /// lại chỉ để tra cứu khi cần, ví dụ khi muốn biết phiên nào sắp hết hạn mà
    /// không phải giải mã token.
    ///
    /// Nói rõ để không ai tưởng sửa ở đây là sửa được luật hết hạn.
    /// </remarks>
    public DateTime? RefreshTokenExpiresAt { get; set; }

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
