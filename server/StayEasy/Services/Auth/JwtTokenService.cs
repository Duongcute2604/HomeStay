using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using StayEasy.Entities;
using StayEasy.Enums;

namespace StayEasy.Services.Auth;

/// <summary>
/// Ký và đọc token bằng HMAC-SHA256.
///
/// Khoá bí mật đọc từ appsettings qua IOptions, tuyệt đối không viết thẳng trong
/// code — nếu để trong source thì ai xem repo cũng biết, và token người dùng sẽ
/// tự ký được (AGENTS.md mục 6.6).
/// </summary>
public class JwtTokenService : IJwtTokenService
{
    /// <summary>Tên claim chứa định danh người dùng.</summary>
    public const string UserIdClaimType = "userId";

    /// <summary>Tên claim chứa quyền (CUSTOMER hoặc ADMIN).</summary>
    public const string RoleClaimType = ClaimTypes.Role;

    private const string SecurityAlgorithm = SecurityAlgorithms.HmacSha256;

    private readonly JwtOptions _options;

    /// <summary>Khởi tạo dịch vụ với cấu hình ký token.</summary>
    public JwtTokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    /// <inheritdoc />
    public string TaoAccessToken(User user, DateTime hetHan)
    {
        List<Claim> claims =
        [
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(UserIdClaimType, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(RoleClaimType, user.Role.ToString())
        ];

        return KyToken(claims, hetHan);
    }

    /// <inheritdoc />
    public string TaoRefreshToken(User user, DateTime hetHan)
    {
        // Cố tình KHÔNG đưa email và quyền vào refresh token — xem giải thích ở interface.
        //
        // jti là mã định danh duy nhất cho từng lần phát hành (chuẩn JWT 7519 mục 4.1.7).
        // Không có nó thì token chỉ khác nhau ở mốc thời gian hết hạn, mà mốc này tính
        // theo giây — nên đăng nhập hai lần trong cùng một giây sẽ sinh ra hai chuỗi
        // token GIỐNG HỆT NHAU, và làm mới phiên ngay sau đó cũng không đổi được token.
        List<Claim> claims =
        [
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(UserIdClaimType, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        ];

        return KyToken(claims, hetHan);
    }

    /// <inheritdoc />
    public TokenClaims? DocClaims(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        try
        {
            JwtSecurityTokenHandler handler = new();

            // ValidateToken làm trọn cả 3 việc trong một lần: kiểm tra chữ ký, kiểm tra
            // thời hạn, kiểm tra issuer/audience. Nếu chỉ dùng ReadJwtToken thì token chưa
            // hề được kiểm chữ ký — kẻ xấu tự chế token giả gửi thẳng vào hệ thống cũng được.
            ClaimsPrincipal principal = handler.ValidateToken(
                token,
                TaoThamSoKiemTra(),
                out SecurityToken validatedToken);

            string? userIdClaim = principal.FindFirst(UserIdClaimType)?.Value;

            if (!int.TryParse(userIdClaim, out int userId))
            {
                return null;
            }

            DateTime expiresAt = validatedToken.ValidTo.ToLocalTime();

            return new TokenClaims(userId, expiresAt);
        }
        catch (SecurityTokenException)
        {
            // Token sai chữ ký (giả mạo) hoặc đã hết hạn — trả null để tầng trên trả 401.
            return null;
        }
        catch (ArgumentException)
        {
            // Chuỗi không phải JWT — coi như token không hợp lệ, không phải lỗi hệ thống.
            return null;
        }
    }

    /// <inheritdoc />
    public DateTime TinhThoiDiemHetHanAccessToken()
    {
        return DateTime.Now.AddMinutes(AuthRules.AccessTokenMinutes);
    }

    private TokenValidationParameters TaoThamSoKiemTra()
    {
        // Dùng chung cấu hình với JwtBearer ở `Program.cs` — xem lý do trong
        // `TokenValidationFactory`.
        return TokenValidationFactory.Tao(_options);
    }

    private string KyToken(List<Claim> claims, DateTime hetHan)
    {
        SymmetricSecurityKey key = new(Encoding.UTF8.GetBytes(_options.Secret));

        SigningCredentials credentials = new(key, SecurityAlgorithm);

        JwtSecurityToken token = new(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            // Dùng UTC cho exp: đây là chuẩn của JWT, tránh sai lệch khi máy chủ
            // đổi múi giờ. Chỗ hiển thị cho người dùng mới chuyển sang giờ địa phương.
            // Cố tình KHÔNG đặt notBefore. Nếu đặt bằng thời điểm hiện tại, thư viện JWT
            // bắt buộc exp phải sau notBefore và ném lỗi khi ký token đã hết hạn — tức là
            // không tạo được token quá hạn để kiểm thử. Token ta cấp có hiệu lực ngay
            // từ lúc nhận nên không cần ràng buộc thời điểm bắt đầu.
            expires: hetHan.ToUniversalTime(),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
