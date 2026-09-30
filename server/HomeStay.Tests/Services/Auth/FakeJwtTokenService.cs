using HomeStay.Entities;
using HomeStay.Services.Auth;

namespace HomeStay.Tests.Services.Auth;

/// <summary>
/// Dịch vụ cấp token giả cho unit test nghiệp vụ.
///
/// Token thật là chuỗi JWT dài hàng trăm ký tự, không thuận tiện để test kiểm tra
/// "đăng xuất có vô hiệu hoá được token không". Ở đây thay bằng chuỗi ngắn có dạng
/// <c>fake-refresh-{id}-{số thứ tự}</c> để test khẳng định đúng ý nghĩa nghiệp vụ.
/// Tính đúng đắn của thuật toán ký token thì đã có lớp test riêng (JwtTokenServiceTests).
///
/// Bài học rút ra từ một lỗi thật: bản đầu tiên trả về <c>fake-refresh-{id}</c> — cùng
/// một chuỗi cho mọi lần gọi. Hệ quả là mọi test đều xanh, kể cả test "đăng nhập máy
/// thứ hai làm token máy thứ nhất mất tác dụng", trong khi bản thật thì hỏng. Bản giả
/// phải mô phỏng cả TÍNH CHẤT của hàm thật, không chỉ hành vi "đúng". Token thật có
/// payload riêng theo thời điểm phát hành nên mỗi lần cấp đều khác nhau.
/// </summary>
public class FakeJwtTokenService : IJwtTokenService
{
    public const string AccessTokenPrefix = "fake-access-";
    public const string RefreshTokenPrefix = "fake-refresh-";

    private int _soLanCapRefresh;

    public string TaoAccessToken(User user, DateTime hetHan)
    {
        return AccessTokenPrefix + user.Id;
    }

    public string TaoRefreshToken(User user, DateTime hetHan)
    {
        _soLanCapRefresh++;
        return RefreshTokenPrefix + user.Id + "-" + _soLanCapRefresh;
    }

    public TokenClaims? DocClaims(string? token)
    {
        if (string.IsNullOrWhiteSpace(token))
        {
            return null;
        }

        // Cố tình chỉ chấp nhận refresh token: đây là hàm mà AuthService dùng để đọc
        // token khi làm mới phiên. Token sai tiền tố phải bị từ chối, y hệt hành vi
        // của dịch vụ thật khi token không phải JWT.
        if (!token.StartsWith(RefreshTokenPrefix, StringComparison.Ordinal))
        {
            return null;
        }

        // Bỏ đuôi "-{số thứ tự}" rồi mới đọc id: định dạng là {id}-{số thứ tự}.
        string phanId = token[RefreshTokenPrefix.Length..];
        int viPhanTach = phanId.IndexOf('-', StringComparison.Ordinal);

        if (viPhanTach > 0)
        {
            phanId = phanId[..viPhanTach];
        }

        return int.TryParse(phanId, out int userId)
            ? new TokenClaims(userId, DateTime.Now.AddDays(AuthRules.RefreshTokenDays))
            : null;
    }

    public DateTime TinhThoiDiemHetHanAccessToken()
    {
        return DateTime.Now.AddMinutes(AuthRules.AccessTokenMinutes);
    }
}
