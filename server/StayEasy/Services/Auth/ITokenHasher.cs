namespace StayEasy.Services.Auth;

/// <summary>
/// Băm chuỗi xác thực phiên (refresh token) trước khi lưu vào CSDL.
///
/// Vì sao tách khỏi <see cref="IPasswordHasher"/>:
/// mật khẩu người dùng là thông tin người dùng TỰ CHỌN, độ dài ngắn, nên cần thuật
/// toán chậm (BCrypt) để chống dò. Còn refresh token là chuỗi ngẫu nhiên do hệ
/// thống tự sinh, đã có hàng trăm bit ngẫu nhiên — dùng thuật toán chậm chỉ làm
/// chậm hệ thống mà không thêm an toàn nào.
///
/// Quan trọng hơn: BCrypt CẮT CỐT chỉ còn 72 byte đầu chuỗi. Một refresh token
/// dài khoảng 196 ký tự, nên nếu băm bằng BCrypt thì mọi token có cùng 72 ký tự đầu
/// (header + phần đầu payload, chỉ khác nhau ở vài chữ số cuối của exp) sẽ cho
/// CÙNG một hash. Hậu quả trực tiếp: token cũ vẫn khớp hash của token mới, tức
/// đăng nhập ở máy khác KHÔNG làm mất phiên cũ — đúng cái lỗ hổng mà việc lưu
/// hash nhằm chống. SHA-256 xét toàn bộ chuỗi nên không dính lỗi này.
/// </summary>
public interface ITokenHasher
{
    /// <summary>Băm chuỗi xác thực phiên thành chuỗi lưu được trong CSDL.</summary>
    string Hash(string token);

    /// <summary>Kiểm tra chuỗi xác thực có khớp giá trị đã lưu hay không.</summary>
    bool Verify(string token, string? hashDaLuu);
}
