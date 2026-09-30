using HomeStay.Services.Auth;

namespace HomeStay.Tests.Services.Auth;

/// <summary>
/// Kiểm chứng lớp băm mật khẩu.
///
/// Hai điều phải đúng thì hệ thống mới an toàn: mật khẩu thô KHÔNG BAO GIỜ xuất hiện
/// trong hash, và cùng một mật khẩu băm hai lần phải ra hai hash khác nhau (salt ngẫu nhiên).
/// Nếu vô hiệu hóa salt, kẻ lấy được CSDL có bảng tra ngược mật khẩu trong vài giây.
/// </summary>
public class PasswordHasherTests
{
    private readonly PasswordHasher _hasher = new();

    [Fact]
    public void Hash_MatKhauTho_KhongConChuoiMatKhauGoc()
    {
        const string MatKhauTho = "123456";

        string hash = _hasher.Hash(MatKhauTho);

        Assert.DoesNotContain(MatKhauTho, hash);
        Assert.NotEmpty(hash);
    }

    [Fact]
    public void Hash_CungMotMatKhau_HaiLanHaiHashKhacNhau()
    {
        const string MatKhauTho = "123456";

        string hashLan1 = _hasher.Hash(MatKhauTho);
        string hashLan2 = _hasher.Hash(MatKhauTho);

        Assert.NotEqual(hashLan1, hashLan2);
    }

    [Fact]
    public void Verify_MatKhauDung_TraVeTrue()
    {
        const string MatKhauTho = "matkhau123";

        string hash = _hasher.Hash(MatKhauTho);

        Assert.True(_hasher.Verify(MatKhauTho, hash));
    }

    [Theory]
    [InlineData("12345")]                 // thiếu 1 ký tự
    [InlineData("1234567")]               // thừa 1 ký tự
    [InlineData("")]                      // rỗng
    [InlineData("MatKhau123")]            // sai hoa thường
    public void Verify_MatKhauSai_TraVeFalse(string matKhauNhap)
    {
        const string MatKhauTho = "matkhau123";

        string hash = _hasher.Hash(MatKhauTho);

        Assert.False(_hasher.Verify(matKhauNhap, hash));
    }

    [Theory]
    [InlineData("")]
    [InlineData(null)]
    public void Verify_HashRong_TraVeFalseKhongNemLoi(string? hashDaLuu)
    {
        // Hash NULL/Rỗng xuất hiện khi tài khoản cũ được tạo bằng cách ghi tay vào CSDL.
        // Không bắt lỗi ở đây thì lỗi này biến thành 500 và lộ chi tiết hệ thống ra ngoài.
        Assert.False(_hasher.Verify("123456", hashDaLuu));
    }

    [Fact]
    public void Verify_HashHongKhongPhaiBcrypt_TraVeFalseKhongNemLoi()
    {
        // Hash sai định dạng làm BCrypt ném lỗi SaltParseException. Coi như không khớp
        // là hành vi an toàn: đăng nhập thất bại chứ không sập server.
        Assert.False(_hasher.Verify("123456", "khong-phai-hash-bcrypt"));
    }

    [Fact]
    public void Hash_MatKhauCoKyTuDacBiet_VanXacNhanDung()
    {
        const string MatKhauTho = "Abc@123!#";

        string hash = _hasher.Hash(MatKhauTho);

        Assert.True(_hasher.Verify(MatKhauTho, hash));
    }

    [Fact]
    public void Hash_HaiChuoiDaiChiKhacPhanDauot_CungChoMotHash()
    {
        // Test này KHÔNG phải để bắt lỗi — nó ghi lại một đặc tính có thật của BCrypt
        // đã được kiểm chứng bằng test, và đó là lý do mật khẩu và refresh token
        // phải dùng hai thuật toán băm khác nhau.
        //
        // BCrypt rút ra từ thuật toán bcrypt cổ: chỉ xét 72 byte ĐẦU chuỗi, phần còn
        // lại bị bỏ qua. Với mật khẩu (thường < 72 ký tự) thì không sao. Nhưng refresh
        // token dài ~196 ký tự và chỉ khác nhau ở phần cuối, nên nếu băm bằng BCrypt
        // thì token cũ vẫn khớp hash của token mới — lỗ hổng đã xảy ra thật và được
        // sửa bằng SHA-256 (xem TokenHasher).
        //
        // Giữ test lại để nếu ai đó đổi thư viện băm thì thấy ngay hành vi này đã
        // thay đổi, chứ không phải âm thầm dựa vào một đặc tính không ai nhớ.
        string tienTo = new('a', 100);
        string chuoi1 = tienTo + "-duoi-1";
        string chuoi2 = tienTo + "-duoi-2";

        string hash1 = _hasher.Hash(chuoi1);

        Assert.True(_hasher.Verify(chuoi2, hash1));
    }
}
