namespace HomeStay.Services.Auth;

/// <summary>
/// Hiện thực băm mật khẩu bằng BCrypt (thư viện BCrypt.Net-Next 4.2.1).
///
/// BCrypt tự sinh salt ngẫu nhiên cho mỗi lần băm, nên hai tài khoản dùng cùng
/// mật khẩu vẫn có hash khác nhau. Nhờ vậy khi lộ CSDL, kẻ xấu không dùng được
/// "bảng tra mật khẩu" ngược lại.
///
/// Lưu ý: phải ghi đầy đủ BCrypt.Net.BCrypt. Nếu chỉ using BCrypt.Net rồi gọi
/// BCrypt.HashPassword thì trình biên dịch hiểu nhầm "BCrypt" là tên namespace
/// và báo lỗi CS0234.
/// </summary>
public class PasswordHasher : IPasswordHasher
{
    /// <summary>
    /// Băm mật khẩu. Chỉ hàm này được phép chạm vào mật khẩu thô.
    /// </summary>
    public string Hash(string matKhauTho)
    {
        return BCrypt.Net.BCrypt.HashPassword(matKhauTho);
    }

    /// <summary>
    /// Đối chiếu mật khẩu nhập với hash đã lưu.
    ///
    /// Bọc try/catch vì hash lưu trong CSDL có thể hỏng (ví dụ dữ liệu cũ nhập tay).
    /// BCrypt.VerifyHashesBytes sẽ ném lỗi; nếu để lọt, lỗi này biến thành 500
    /// và lộ chi tiết hệ thống ra ngoài. Coi như không khớp là an toàn hơn.
    /// </summary>
    public bool Verify(string matKhauTho, string? hashDaLuu)
    {
        if (string.IsNullOrWhiteSpace(hashDaLuu))
        {
            return false;
        }

        try
        {
            return BCrypt.Net.BCrypt.Verify(matKhauTho, hashDaLuu);
        }
        catch (BCrypt.Net.SaltParseException)
        {
            return false;
        }
    }
}
