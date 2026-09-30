using HomeStay.DTOs;

namespace HomeStay.Services.Auth;

/// <summary>
/// Nghiệp vụ tài khoản: đăng ký, đăng nhập, phiên, hồ sơ.
///
/// Mọi quy tắc nằm ở tầng Service chứ không nằm trong Controller — nhờ vậy
/// unit test gọi thẳng hàm được mà không cần dựng HTTP server (AGENTS.md mục 5.2).
/// </summary>
public interface IAuthService
{
    /// <summary>Đăng ký tài khoản khách mới và đăng nhập luôn.</summary>
    Task<AuthResponse> DangKyAsync(RegisterRequest request, CancellationToken ct);

    /// <summary>Kiểm tra thông tin đăng nhập và cấp cặp token.</summary>
    Task<AuthResponse> DangNhapAsync(LoginRequest request, CancellationToken ct);

    /// <summary>Dùng refresh token để xin cặp token mới.</summary>
    Task<AuthResponse> LamMoiTokenAsync(RefreshTokenRequest request, CancellationToken ct);

    /// <summary>Vô hiệu hoá refresh token của tài khoản.</summary>
    Task<bool> DangXuatAsync(int userId, CancellationToken ct);

    /// <summary>Lấy hồ sơ người dùng theo định danh lấy từ token.</summary>
    Task<UserProfileDto> LayHoSoAsync(int userId, CancellationToken ct);

    /// <summary>Cập nhật họ tên, điện thoại, địa chỉ.</summary>
    Task<UserProfileDto> CapNhatHoSoAsync(int userId, UpdateProfileRequest request, CancellationToken ct);

    /// <summary>Đổi mật khẩu sau khi kiểm tra mật khẩu hiện tại.</summary>
    Task<bool> DoiMatKhauAsync(int userId, ChangePasswordRequest request, CancellationToken ct);
}
