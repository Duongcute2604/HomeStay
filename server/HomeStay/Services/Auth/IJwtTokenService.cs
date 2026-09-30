using HomeStay.Entities;
using HomeStay.Enums;

namespace HomeStay.Services.Auth;

/// <summary>Một cặp token trả về cho client.</summary>
/// <param name="AccessToken">Token dùng gắn vào header Authorization.</param>
/// <param name="RefreshToken">Token dùng xin access token mới.</param>
/// <param name="AccessTokenExpiresAt">Thời điểm access token hết hạn.</param>
public record IssuedTokens(string AccessToken, string RefreshToken, DateTime AccessTokenExpiresAt);

/// <summary>
/// Ký và đọc access token / refresh token.
///
/// Tách interface để AuthService không phụ thuộc thuật toán JWT — sau này đổi sang
/// cơ chế token khác chỉ cần thay lớp hiện thực.
/// </summary>
public interface IJwtTokenService
{
    /// <summary>
    /// Tạo access token mang thông tin người dùng và quyền của họ.
    /// </summary>
    string TaoAccessToken(User user, DateTime hetHan);

    /// <summary>
    /// Tạo refresh token chỉ chứa định danh người dùng, không chứa quyền.
    /// Lý do không nhét quyền vào refresh token: sau khi Admin khoá tài khoản,
    /// access token cũ vẫn còn hiệu lực tới hết hạn. Nếu refresh token mang quyền
    /// thì nó sống lâu 7 ngày và cấp lại quyền đã bị thu hồi.
    /// </summary>
    string TaoRefreshToken(User user, DateTime hetHan);

    /// <summary>
    /// Đọc định danh người dùng và thời điểm hết hạn từ token.
    /// </summary>
    /// <returns>Null nếu token sai định dạng, giả mạo, hoặc đã hết hạn.</returns>
    TokenClaims? DocClaims(string? token);

    /// <summary>Thời điểm access token mới cấp sẽ hết hạn.</summary>
    DateTime TinhThoiDiemHetHanAccessToken();
}
