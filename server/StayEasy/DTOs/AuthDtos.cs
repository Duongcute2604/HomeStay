using System.ComponentModel.DataAnnotations;
using StayEasy.Enums;
// Tham chiếu hằng số quy tắc để độ dài ở attribute và ở tầng Service không trôi lệch
// nhau. Đây chỉ là lớp hằng số thuần, không kéo theo phụ thuộc tầng nào.
using StayEasy.Services.Auth;

namespace StayEasy.DTOs;

/// <summary>Dữ liệu gửi lên khi đăng ký tài khoản khách.</summary>
public class RegisterRequest
{
    /// <summary>Họ và tên hiển thị. Bắt buộc.</summary>
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(AuthRules.MaxFullNameLength, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Email đăng nhập.
    /// Cố tình KHÔNG dùng attribute [EmailAddress] vì DataAnnotations sẽ ép mã 400,
    /// trong khi quy tắc đã chốt là email sai định dạng phải trả 409. Việc kiểm tra
    /// định dạng do EmailValidator trong tầng Service đảm nhiệm.
    /// </summary>
    [Required(ErrorMessage = "Vui lòng nhập email")]
    [StringLength(AuthRules.MaxEmailLength, ErrorMessage = "Email không được vượt quá 150 ký tự")]
    public string Email { get; set; } = string.Empty;

    /// <summary>
    /// Mật khẩu. Tối thiểu 6 ký tự, tối đa 100, không có giới hạn ký tự đặc biệt.
    /// </summary>
    /// <remarks>
    /// Tách `MinLength` và `StringLength` thành hai attribute là **bắt buộc**, không
    /// phải làm rối thêm cho vui. `StringLength(100, MinimumLength = 6, msg)` chỉ
    /// mang **một** thông báo cho **cả hai** ràng buộc, nên nhập mật khẩu 101 ký tự
    /// cũng hiện "Mật khẩu phải có ít nhất 6 ký tự" — người dùng rút ngắn xuống 6
    /// ký tự rồi lại thấy vẫn lỗi. Hai attribute tách rời thì mỗi ràng buộc báo
    /// đúng thông báo của nó.
    /// </remarks>
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu")]
    [MinLength(AuthRules.MinPasswordLength, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
    [StringLength(AuthRules.MaxPasswordLength, ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự")]
    public string Password { get; set; } = string.Empty;

    /// <summary>Nhập lại mật khẩu để chống gõ nhầm.</summary>
    [Compare(nameof(Password), ErrorMessage = "Mật khẩu xác nhận không khớp")]
    public string ConfirmPassword { get; set; } = string.Empty;

    /// <summary>Số điện thoại, không bắt buộc.</summary>
    [StringLength(AuthRules.MaxPhoneLength, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
    public string? PhoneNumber { get; set; }

    /// <summary>Địa chỉ, không bắt buộc.</summary>
    [StringLength(AuthRules.MaxAddressLength, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự")]
    public string? Address { get; set; }
}

/// <summary>Dữ liệu gửi lên khi đăng nhập.</summary>
public class LoginRequest
{
    /// <summary>Email đăng nhập.</summary>
    [Required(ErrorMessage = "Vui lòng nhập email")]
    public string Email { get; set; } = string.Empty;

    /// <summary>Mật khẩu.</summary>
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu")]
    public string Password { get; set; } = string.Empty;
}

/// <summary>Dữ liệu gửi lên khi làm mới access token.</summary>
public class RefreshTokenRequest
{
    /// <summary>Refresh token nhận được lúc đăng nhập.</summary>
    [Required(ErrorMessage = "Thiếu refresh token")]
    public string RefreshToken { get; set; } = string.Empty;
}

/// <summary>Dữ liệu gửi lên khi đổi mật khẩu.</summary>
public class ChangePasswordRequest
{
    /// <summary>Mật khẩu hiện tại, bắt buộc phải đúng mới cho đổi.</summary>
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu hiện tại")]
    public string CurrentPassword { get; set; } = string.Empty;

    /// <summary>Mật khẩu mới, tối thiểu 6 và tối đa 100 ký tự.</summary>
    /// <remarks>Tách `MinLength` và `StringLength` — xem giải thích ở `RegisterRequest.Password`.</remarks>
    [Required(ErrorMessage = "Vui lòng nhập mật khẩu mới")]
    [MinLength(AuthRules.MinPasswordLength, ErrorMessage = "Mật khẩu mới phải có ít nhất 6 ký tự")]
    [StringLength(AuthRules.MaxPasswordLength, ErrorMessage = "Mật khẩu mới không được vượt quá 100 ký tự")]
    public string NewPassword { get; set; } = string.Empty;

    /// <summary>Nhập lại mật khẩu mới.</summary>
    [Compare(nameof(NewPassword), ErrorMessage = "Mật khẩu xác nhận không khớp")]
    public string ConfirmNewPassword { get; set; } = string.Empty;
}

/// <summary>Dữ liệu gửi lên khi cập nhật hồ sơ cá nhân.</summary>
public class UpdateProfileRequest
{
    /// <summary>Họ và tên mới. Bắt buộc không được rỗng.</summary>
    [Required(ErrorMessage = "Vui lòng nhập họ và tên")]
    [StringLength(AuthRules.MaxFullNameLength, ErrorMessage = "Họ và tên không được vượt quá 100 ký tự")]
    public string FullName { get; set; } = string.Empty;

    /// <summary>Số điện thoại mới, không bắt buộc.</summary>
    [StringLength(AuthRules.MaxPhoneLength, ErrorMessage = "Số điện thoại không được vượt quá 15 ký tự")]
    public string? PhoneNumber { get; set; }

    /// <summary>Địa chỉ mới, không bắt buộc.</summary>
    [StringLength(AuthRules.MaxAddressLength, ErrorMessage = "Địa chỉ không được vượt quá 255 ký tự")]
    public string? Address { get; set; }
}

/// <summary>
/// Thông tin người dùng trả về cho client.
///
/// Cố tình KHÔNG có PasswordHash và RefreshTokenHash: entity User không bao giờ
/// được trả thẳng ra ngoài, mọi thứ nhạy cảm đều phải đi qua DTO đã lọc
/// (AGENTS.md mục 6.2). Đây là ranh giới bảo mật quan trọng nhất của cả API.
/// </summary>
public class UserProfileDto
{
    /// <summary>Khoá nội bộ, giao diện không hiển thị.</summary>
    public int Id { get; set; }

    /// <summary>Họ và tên.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Email đăng nhập.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Số điện thoại.</summary>
    public string? PhoneNumber { get; set; }

    /// <summary>Địa chỉ.</summary>
    public string? Address { get; set; }

    /// <summary>Vai trò: CUSTOMER hoặc ADMIN.</summary>
    public UserRole Role { get; set; }

    /// <summary>Trạng thái: ACTIVE hoặc LOCKED.</summary>
    public UserStatus Status { get; set; }

    /// <summary>Thời điểm tạo tài khoản.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Kết quả đăng nhập hoặc làm mới token.</summary>
public class AuthResponse
{
    /// <summary>Access token, dùng gắn vào mọi request sau. Hết hạn sau 1 giờ.</summary>
    public string AccessToken { get; set; } = string.Empty;

    /// <summary>Refresh token, chỉ dùng để xin access token mới. Hết hạn sau 7 ngày.</summary>
    public string RefreshToken { get; set; } = string.Empty;

    /// <summary>Access token còn dùng được bao lâu nữa (tính bằng phút).</summary>
    public int ExpiresInMinutes { get; set; }

    /// <summary>Thông tin tài khoản vừa đăng nhập.</summary>
    public UserProfileDto User { get; set; } = new();
}
