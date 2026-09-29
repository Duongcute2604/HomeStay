using StayEasy.Services.Auth;

namespace StayEasy.Tests.Services.Auth;

/// <summary>
/// Bộ băm mật khẩu giả cho unit test nghiệp vụ.
///
/// Vì sao không dùng BCrypt thật trong test AuthService: BCrypt cố tình chậm
/// (vài chục mili giây mỗi lần) để chống dò mật khẩu. Ở đây cần chạy hàng chục test
/// nên thay bằng so sánh chuỗi thuần, xong trong vài mili giây. Tính đúng đắn của BCrypt
/// thì đã có lớp test riêng (PasswordHasherTests).
///
/// Lưu ý: hash giả vẫn phải "băm" thay vì so sánh trực tiếp, để test bắt được cả lỗi
/// kiểu "so sánh mật khẩu thô với hash trong CSDL" — lỗi đó lộ mật khẩu qua timing.
/// </summary>
public class FakePasswordHasher : IPasswordHasher
{
    /// <summary>Tiền tố để nhận ra ngay hash do lớp giả sinh ra.</summary>
    public const string HashPrefix = "fake:";

    public string Hash(string matKhauTho)
    {
        return HashPrefix + matKhauTho;
    }

    public bool Verify(string matKhauTho, string? hashDaLuu)
    {
        return hashDaLuu == HashPrefix + matKhauTho;
    }
}
