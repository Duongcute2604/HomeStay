using System.Globalization;
using System.Net;
using System.Security.Claims;
using HomeStay.Services.Auth;

namespace HomeStay.Common;

/// <summary>
/// Đọc thông tin người dùng từ access token.
/// </summary>
/// <remarks>
/// Tách riêng thành extension vì có nhiều controller đều cần id của người đang
/// đăng nhập. Viết lại trong từng controller sẽ tạo ra N chỗ phải sửa khi claim
/// đổi tên — và chỗ nào quên sửa là chỗ đó lộ thông tin sai.
/// </remarks>
public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Lấy `userId` từ access token.
    /// TUYỆT ĐỐI không tin id do client gửi lên — đổi một con số là thao tác
    /// hộ người khác.
    /// </summary>
    /// <exception cref="AppException">
    /// 401 khi token không có claim id (chưa đăng nhập) hoặc claim không phải số
    /// (token sai chữ ký / cũ).
    /// </exception>
    public static int LayUserIdHienTai(this ClaimsPrincipal user)
    {
        string? rawUserId = user.FindFirstValue(JwtTokenService.UserIdClaimType)
            ?? throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.ChuaDangNhap);

        if (!int.TryParse(rawUserId, NumberStyles.Integer, CultureInfo.InvariantCulture, out int userId))
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenKhongHopLe);
        }

        return userId;
    }
}
