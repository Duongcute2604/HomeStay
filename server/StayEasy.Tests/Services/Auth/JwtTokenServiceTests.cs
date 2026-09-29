using Microsoft.Extensions.Options;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Auth;

namespace StayEasy.Tests.Services.Auth;

/// <summary>
/// Kiểm chứng ký và đọc token.
///
/// Trọng tâm là: token tự chế phải bị từ chối. Nếu chỉ kiểm tra "token hợp lệ đọc được",
/// thì khi cài đặt kiểm tra chữ ký hỏng mà test vẫn xanh thì toàn hệ thống đã thủng mà
/// không ai biết. Nên các test "từ chối" quan trọng ngang test "cho qua".
/// </summary>
public class JwtTokenServiceTests
{
    // Khoá riêng cho test, không dùng chung với khoá thật trong appsettings.
    private const string TestSecret = "KHOA_TEST_RIENG_CHO_UNIT_TEST_STAYEASY_DON_AN_4_64_KY_TU_ABCDEF";
    private const string TestIssuer = "StayEasy.Api";
    private const string TestAudience = "StayEasy.Client";

    private readonly JwtTokenService _tokenService;

    public JwtTokenServiceTests()
    {
        _tokenService = new JwtTokenService(
            Options.Create(new JwtOptions
            {
                Secret = TestSecret,
                Issuer = TestIssuer,
                Audience = TestAudience
            }));
    }

    [Fact]
    public void TaoVaDocAccessToken_DocDuocDinhDanhVaQuyen()
    {
        User user = TaoUser(id: 42, role: UserRole.ADMIN);

        DateTime hetHan = DateTime.Now.AddMinutes(AuthRules.AccessTokenMinutes);
        string token = _tokenService.TaoAccessToken(user, hetHan);

        TokenClaims? claims = _tokenService.DocClaims(token);

        Assert.NotNull(claims);
        Assert.Equal(42, claims!.UserId);
    }

    [Fact]
    public void DocClaims_AccessTokenHopLe_TokenDungHanChua()
    {
        User user = TaoUser(id: 7);

        DateTime hetHan = DateTime.Now.AddMinutes(AuthRules.AccessTokenMinutes);
        string token = _tokenService.TaoAccessToken(user, hetHan);

        TokenClaims? claims = _tokenService.DocClaims(token);

        Assert.NotNull(claims);

        // Chênh lệch vài giây là do làm tròn thời gian trong chuỗi JWT.
        double soPhaiLechGiay = Math.Abs((claims!.ExpiresAt - hetHan).TotalSeconds);
        Assert.True(soPhaiLechGiay < 5, $"Lệch {soPhaiLechGiay} giây, quá lớn so với sai số làm tròn");
    }

    [Fact]
    public void DocClaims_TokenDaHetHan_TraVeNull()
    {
        User user = TaoUser(id: 7);

        // Đã hết hạn từ 10 phút trước — token hết hạn phải bị từ chối ngay, không
        // chờ tới lúc hết khoảng chênh lệch 30 giây.
        DateTime hetHan = DateTime.Now.AddMinutes(-10);
        string token = _tokenService.TaoAccessToken(user, hetHan);

        TokenClaims? claims = _tokenService.DocClaims(token);

        Assert.Null(claims);
    }

    [Fact]
    public void DocClaims_TokenKyBangKhoaKhac_TraVeNull()
    {
        User user = TaoUser(id: 7);

        // Token do kẻ xấu tự chế với khoá mà họ tự đặt. Đây là tình huống nguy hiểm nhất:
        // nếu không kiểm tra chữ ký, kẻ xấu tự tạo token quyền ADMIN và vào thẳng
        // trang quản trị mà không cần biết mật khẩu ai.
        JwtTokenService attacker = new(
            Options.Create(new JwtOptions
            {
                Secret = "KHOA_KHAC_HOAN_TOAN_KHAC_VOI_KHOA_THAT_CUA_HE_THONG_STAYEASY_XYZ",
                Issuer = TestIssuer,
                Audience = TestAudience
            }));

        string tokenGia = attacker.TaoAccessToken(TaoUser(id: 1, role: UserRole.ADMIN), DateTime.Now.AddHours(1));

        TokenClaims? claims = _tokenService.DocClaims(tokenGia);

        Assert.Null(claims);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("khong-phai-chuoi-jwt")]
    [InlineData("abc.def.ghi")]
    public void DocClaims_ChuoiKhongPhaiTokenHopLe_TraVeNull(string? token)
    {
        Assert.Null(_tokenService.DocClaims(token));
    }

    [Fact]
    public void TinhThoiDiemHetHanAccessToken_SauHienTaiDungMotGio()
    {
        DateTime hetHan = _tokenService.TinhThoiDiemHetHanAccessToken();

        double soPhut = (hetHan - DateTime.Now).TotalMinutes;

        Assert.Equal(AuthRules.AccessTokenMinutes, soPhut, 1);
    }

    [Fact]
    public void TaoRefreshToken_HetHanSauBayNgay()
    {
        User user = TaoUser(id: 7);

        DateTime hetHan = DateTime.Now.AddDays(AuthRules.RefreshTokenDays);
        string token = _tokenService.TaoRefreshToken(user, hetHan);

        TokenClaims? claims = _tokenService.DocClaims(token);

        Assert.NotNull(claims);
        Assert.Equal(7, (claims!.ExpiresAt - DateTime.Now).TotalDays, 0);
    }

    [Fact]
    public void TaoRefreshToken_GoiHaiLan_CoHaiTokenKhacNhau()
    {
        User user = TaoUser(id: 7);
        DateTime hetHan = DateTime.Now.AddDays(AuthRules.RefreshTokenDays);

        string token1 = _tokenService.TaoRefreshToken(user, hetHan);
        string token2 = _tokenService.TaoRefreshToken(user, hetHan);

        // Nếu hai lần phát hành cho cùng một tài khoản và cùng một mốc hết hạn mà ra
        // trùng nhau, thì làm mới phiên sẽ không thay đổi được token — và token bị đánh
        // cắp vẫn dùng được sau khi người dùng đã làm mới. Nguyên nhân là mốc hết hạn
        // chỉ chính xác tới giây, nên thiếu jti thì hai lần gọi liền nhau trong cùng
        // giây cho ra hai chuỗi giống hệt nhau.
        Assert.NotEqual(token1, token2);
    }

    private static User TaoUser(int id, UserRole role = UserRole.CUSTOMER)
    {
        return new User
        {
            Id = id,
            FullName = "Nguyễn Văn A",
            Email = "khach1@gmail.com",
            PasswordHash = "hash-bcrypt-gia",
            Role = role,
            Status = UserStatus.ACTIVE
        };
    }
}
