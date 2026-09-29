using System.Security.Cryptography;
using System.Text;

namespace StayEasy.Services.Auth;

/// <summary>
/// Băm refresh token bằng SHA-256, kết quả trả về dạng chữ hex 64 ký tự.
///
/// Vì sao SHA-256 thay vì BCrypt: xem giải thích ở <see cref="ITokenHasher"/> —
/// BCrypt cắt cốt 72 byte đầu nên với chuỗi dài hơn thì phần cuối không ảnh
/// hưởng tới kết quả băm, và token cũ vẫn khớp hash của token mới.
///
/// Cột RefreshTokenHash trong CSDL là varchar(100) nên 64 ký tự hex vừa khít.
/// </summary>
public class TokenHasher : ITokenHasher
{
    /// <summary>Băm chuỗi xác thực phiên. Chỉ hàm này được phép nhận token thô.</summary>
    public string Hash(string token)
    {
        byte[] hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(hash);
    }

    /// <summary>
    /// Đối chiếu chuỗi xác thực với giá trị đã lưu.
    ///
    /// So sánh theo thứ tự hằng số (FixedTimeEquals) chứ không dùng == : thời gian
    /// của phép so sánh chuỗi bình thường phụ thuộc vào vị trí ký tự khác nhau đầu
    /// tiên, lộ ra thông tin cho kẻ đoán từng ký tự. Ở đây hash đã là dữ liệu
    /// ngẫu nhiên không đoán được nên rủi ro thấp, nhưng chi phí cho việc đúng
    /// chuẩn gần như bằng không thì không có lý do bỏ.
    /// </summary>
    public bool Verify(string token, string? hashDaLuu)
    {
        if (string.IsNullOrWhiteSpace(hashDaLuu))
        {
            return false;
        }

        try
        {
            byte[] hashTinh = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            byte[] hashDaLuuBytes = Convert.FromHexString(hashDaLuu);

            return CryptographicOperations.FixedTimeEquals(hashTinh, hashDaLuuBytes);
        }
        catch (FormatException)
        {
            // Cột chứa hash có thể còn dữ liệu không do hàm này tạo ra (ví dụ phiên
            // đăng nhập cũ trước khi đổi thuật toán, hoặc dữ liệu nhập tay).
            // Không bắt lỗi thì nó biến thành 500 và lộ chi tiết hệ thống ra ngoài.
            // Coi như không khớp là hành vi an toàn.
            return false;
        }
    }
}
