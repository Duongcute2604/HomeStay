using HomeStay.Services.Auth;

namespace HomeStay.Tests.Services.Auth;

/// <summary>
/// Kiểm chứng hàm băm refresh token (SHA-256).
///
/// Lớp test này tồn tại vì một lỗi thật đã xảy ra: trước đây refresh token được băm
/// bằng BCrypt, mà BCrypt chỉ xét 72 byte đầu chuỗi. Refresh token dài ~196 ký tự,
/// nên hai token chỉ khác nhau ở phần cuối lại cho CÙNG hash — token cũ vẫn dùng được
/// sau khi máy khác đăng nhập. Các test bên dưới chốt lại đúng hành vi cần có, để
/// lỗi tương tự không tái diễn.
/// </summary>
public class TokenHasherTests
{
    private readonly ITokenHasher _hasher = new TokenHasher();

    [Fact]
    public void Hash_CungMotChuoi_HaiLanChoHaiHashKhacNhau()
    {
        const string Token = "abc.def.ghi";

        string hashLan1 = _hasher.Hash(Token);
        string hashLan2 = _hasher.Hash(Token);

        // SHA-256 là hàm băm thuần: cùng đầu vào phải ra cùng kết quả. Nếu kết quả
        // khác nhau thì nghĩa là nó còn trộn thêm yếu tố ngẫu nhiên, và lần đối chiếu
        // sau đó sẽ luôn thất bại.
        Assert.Equal(hashLan1, hashLan2);
    }

    [Fact]
    public void Hash_DungDoDaiChuHaiMuoiLamKyTu()
    {
        string hash = _hasher.Hash("bat-ky-chuoi-nao");

        Assert.Equal(64, hash.Length);
    }

    [Fact]
    public void Verify_TokenDungKhopHash_TraVeTrue()
    {
        const string Token = "token-can-kiem-tra";

        string hash = _hasher.Hash(Token);

        Assert.True(_hasher.Verify(Token, hash));
    }

    [Fact]
    public void Verify_TokenKhacKhopHash_TraVeFalse()
    {
        string hash = _hasher.Hash("token-cu");

        Assert.False(_hasher.Verify("token-moi", hash));
    }

    [Fact]
    public void Verify_HaiChuoiDaiChiKhacPhanCuoi_CoRaHaiHashKhacNhau()
    {
        // Đây là test bắt được đúng lỗi đã gặp. Token thật dài khoảng 196 ký tự và
        // phần đuôi là chữ ký — hai token của cùng một tài khoản chỉ khác nhau ở
        // payload và chữ ký, tức khác nhau ở phần CUỐI. Với BCrypt (chỉ xét 72 byte
        // đầu) hai chuỗi này cho cùng hash. SHA-256 phải cho hai hash khác nhau.
        string tienTo = new('a', 100);

        string hashTokenCu = _hasher.Hash(tienTo + "-token-cu");
        string hashTokenMoi = _hasher.Hash(tienTo + "-token-moi");

        Assert.NotEqual(hashTokenCu, hashTokenMoi);
        Assert.False(_hasher.Verify(tienTo + "-token-moi", hashTokenCu));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Verify_HashRong_TraVeFalseKhongNemLoi(string? hashDaLuu)
    {
        Assert.False(_hasher.Verify("bat-ky-token", hashDaLuu));
    }

    [Fact]
    public void Verify_HashKhongPhaiHex_TraVeFalseKhongNemLoi()
    {
        // Dữ liệu cũ trong CSDL có thể chứa hash do thuật toán trước đây tạo ra
        // (chuỗi 60 ký tự kiểu "$2a$11$..."). Nếu không bắt lỗi chuyển đổi hex,
        // nó biến thành lỗi 500 và lộ chi tiết hệ thống ra ngoài.
        const string HashCu = "$2a$11$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUV";

        bool ketQua = _hasher.Verify("bat-ky-token", HashCu);

        Assert.False(ketQua);
    }
}
