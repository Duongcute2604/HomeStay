using System.Net;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StayEasy.Common;
using StayEasy.DTOs;
using StayEasy.Middleware;
using StayEasy.Services.Auth;

namespace StayEasy.Controllers;

/// <summary>
/// Các endpoint về tài khoản: đăng ký, đăng nhập, phiên, hồ sơ.
///
/// Controller chỉ làm ba việc: nhận request, gọi Service, bọc kết quả vào ApiResponse.
/// Không có truy vấn database, không có luật nghiệp vụ — theo AGENTS.md mục 6.1.
/// </summary>
[ApiController]
[Route("api/auth")]
[Produces("application/json")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    /// <summary>Khởi tạo controller với service tài khoản.</summary>
    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>Đăng ký tài khoản khách mới. Tài khoản luôn là CUSTOMER, không thể tự chọn quyền.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DangKy([FromBody] RegisterRequest request, CancellationToken ct)
    {
        AuthResponse result = await _authService.DangKyAsync(request, ct);

        return CreatedAtAction(
            nameof(LayHoSo),
            new { id = result.User.Id },
            ApiResponse<AuthResponse>.SuccessResponse("Đăng ký tài khoản thành công", result));
    }

    /// <summary>Đăng nhập bằng email và mật khẩu, trả về cặp access token + refresh token.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> DangNhap([FromBody] LoginRequest request, CancellationToken ct)
    {
        AuthResponse result = await _authService.DangNhapAsync(request, ct);

        return Ok(ApiResponse<AuthResponse>.SuccessResponse("Đăng nhập thành công", result));
    }

    /// <summary>Làm mới access token khi hết hạn, dùng refresh token.</summary>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LamMoiToken([FromBody] RefreshTokenRequest request, CancellationToken ct)
    {
        AuthResponse result = await _authService.LamMoiTokenAsync(request, ct);

        return Ok(ApiResponse<AuthResponse>.SuccessResponse("Làm mới phiên đăng nhập thành công", result));
    }

    /// <summary>Đăng xuất — vô hiệu hoá refresh token phía máy chủ.</summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> DangXuat(CancellationToken ct)
    {
        await _authService.DangXuatAsync(LayUserIdHienTai(), ct);

        return Ok(ApiResponse<object>.SuccessResponse("Đăng xuất thành công"));
    }

    /// <summary>Lấy hồ sơ của người đang đăng nhập.</summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> LayHoSo(CancellationToken ct)
    {
        UserProfileDto result = await _authService.LayHoSoAsync(LayUserIdHienTai(), ct);

        return Ok(ApiResponse<UserProfileDto>.SuccessResponse("Lấy hồ sơ thành công", result));
    }

    /// <summary>Cập nhật họ tên, điện thoại, địa chỉ. Không sửa được email, quyền hay trạng thái.</summary>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CapNhatHoSo([FromBody] UpdateProfileRequest request, CancellationToken ct)
    {
        UserProfileDto result = await _authService.CapNhatHoSoAsync(LayUserIdHienTai(), request, ct);

        return Ok(ApiResponse<UserProfileDto>.SuccessResponse("Cập nhật hồ sơ thành công", result));
    }

    /// <summary>Đổi mật khẩu, phải nhập đúng mật khẩu hiện tại.</summary>
    [HttpPut("change-password")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DoiMatKhau([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        await _authService.DoiMatKhauAsync(LayUserIdHienTai(), request, ct);

        return Ok(ApiResponse<object>.SuccessResponse("Đổi mật khẩu thành công. Vui lòng đăng nhập lại"));
    }

    /// <summary>
    /// Lấy định danh người dùng từ access token.
    ///
    /// TUYỆT ĐỐI không tin id do client gửi trong body hoặc query — nếu lấy id từ client
    /// thì đổi một con số là đọc được hồ sơ người khác. [Authorize] đã bảo đảm token
    /// hợp lệ nên khai báo hàm này là private được.
    /// </summary>
    private int LayUserIdHienTai()
    {
        string rawUserId = User.FindFirstValue(JwtTokenService.UserIdClaimType)
            ?? throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.ChuaDangNhap);

        if (!int.TryParse(rawUserId, out int userId))
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenKhongHopLe);
        }

        return userId;
    }
}
