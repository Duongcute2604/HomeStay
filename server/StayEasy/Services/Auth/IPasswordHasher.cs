namespace StayEasy.Services.Auth;

/// <summary>
/// Bọc thuật toán băm mật khẩu.
///
/// Tách interface để unit test kiểm tra logic AuthService không bị phụ thuộc vào
/// BCrypt — test nhanh hơn và không phải chờ băm nhiều lần. Nếu sau này đổi thuật toán
/// (ví dụ sang Argon2) chỉ cần viết lớp hiện thực khác, không sửa AuthService.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Biến mật khẩu thô thành chuỗi hash an toàn để lưu vào CSDL.</summary>
    string Hash(string matKhauTho);

    /// <summary>
    /// Kiểm tra mật khẩu người dùng nhập có khớp với hash đã lưu không.
    /// </summary>
    /// <param name="hashDaLuu">
    /// Hash đã lưu. Cho phép null vì cột RefreshTokenHash trong CSDL là nullable —
    /// tài khoản chưa đăng nhập thì chưa có hash nào để đối chiếu.
    /// </param>
    bool Verify(string matKhauTho, string? hashDaLuu);
}
