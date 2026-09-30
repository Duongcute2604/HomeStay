namespace StayEasy.Services.Auth;

/// <summary>
/// Các quy ước nghiệp vụ về tài khoản, khai báo MỘT LẦN duy nhất.
///
/// Gom ra đây để không có con số 6 hay 60 rải rác ở Controller, Service và test.
/// Đổi quy tắc thì sửa đúng một chỗ — đây là lý do AGENTS.md mục 3.2 yêu cầu
/// hằng số phải có tên thay vì dùng magic number.
/// </summary>
public static class AuthRules
{
    /// <summary>Mật khẩu ngắn nhất cho phép khi đăng ký và khi đổi mật khẩu.</summary>
    public const int MinPasswordLength = 6;

    /// <summary>Độ dài tối đa mật khẩu, khớp với giới hạn cột trong CSDL.</summary>
    public const int MaxPasswordLength = 100;

    /// <summary>Số phút access token còn hiệu lực — 1 giờ.</summary>
    public const int AccessTokenMinutes = 60;

    /// <summary>Số ngày refresh token còn hiệu lực — 7 ngày.</summary>
    public const int RefreshTokenDays = 7;

    /// <summary>Độ dài tối đa họ tên, khớp với cột FullName trong CSDL.</summary>
    public const int MaxFullNameLength = 100;

    /// <summary>Độ dài tối đa email, khớp với cột Email trong CSDL.</summary>
    public const int MaxEmailLength = 150;

    /// <summary>Độ dài tối đa số điện thoại, khớp với cột PhoneNumber trong CSDL.</summary>
    public const int MaxPhoneLength = 15;

    /// <summary>Số điện thoại ngắn nhất hợp lý ở Việt Nam.</summary>
    public const int MinPhoneDigits = 9;

    /// <summary>Số điện thoại dài nhất hợp lý ở Việt Nam.</summary>
    public const int MaxPhoneDigits = 11;

    /// <summary>Độ dài tối đa địa chỉ, khớp với cột Address trong CSDL.</summary>
    public const int MaxAddressLength = 255;
}
