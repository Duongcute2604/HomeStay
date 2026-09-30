using System.Text.RegularExpressions;

namespace HomeStay.Services.Auth;

/// <summary>
/// Kiểm tra định dạng email bằng hàm thuần — không cần database, test được trực tiếp.
///
/// Vì sao không dùng [EmailAddress] của DataAnnotations: attribute đó làm ASP.NET
/// tự trả 400 trước khi request tới Service. Nhưng quy tắc đã chốt ở Bước 5 là
/// "email sai định dạng" cũng phải trả 409, giống hệt "email đã tồn tại" — vì cả hai
/// đều kết luận chung là email này không dùng được. Nên phải tự kiểm.
/// </summary>
public static class EmailValidator
{
    // Định dạng email thực dụng: ký tự trước @ không được có khoảng trắng, phải có ít nhất
    // một dấu chấm trong phần tên miền. Regex này cố tình không cố bám RFC 5322 — mục tiêu
    // là chặn nhập liệu sai, không phải xác thực mọi trường hợp email hiếm gặp.
    private static readonly Regex EmailPattern = new(
        @"^[A-Za-z0-9._%+\-]+@[A-Za-z0-9\-]+(\.[A-Za-z0-9\-]+)*\.[A-Za-z]{2,}$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <summary>
    /// Email có đúng định dạng không.
    /// </summary>
    /// <param name="email">Chuỗi email cần kiểm tra.</param>
    /// <returns>True nếu hợp lệ, false nếu rỗng hoặc sai định dạng.</returns>
    public static bool IsValid(string? email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        if (email.Length > AuthRules.MaxEmailLength)
        {
            return false;
        }

        return EmailPattern.IsMatch(email);
    }
}
