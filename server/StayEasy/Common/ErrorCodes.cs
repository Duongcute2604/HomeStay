namespace StayEasy.Common;

/// <summary>
/// Mã lỗi HTTP dùng thống nhất trong toàn hệ thống.
///
/// Quy tắc phân biệt 400 với 409 (đã chốt ở Bước 5):
/// - 400: lỗi ĐỊNH DẠNG dữ liệu thuần — thiếu trường bắt buộc, quá ngắn, không khớp nhau.
/// - 409: lỗi liên quan tới GIÁ TRỊ người dùng gửi lên — email sai định dạng, email đã có,
///   mật khẩu mới trùng mật khẩu cũ.
/// </summary>
public static class ErrorCodes
{
    /// <summary>400 — Dữ liệu sai định dạng hoặc vi phạm quy tắc dạng (thiếu trường, quá ngắn).</summary>
    public const int BadRequest = 400;

    /// <summary>401 — Chưa đăng nhập, token không hợp lệ hoặc đã hết hạn.</summary>
    public const int Unauthorized = 401;

    /// <summary>403 — Đã đăng nhập nhưng không đủ quyền, hoặc tài khoản bị khoá.</summary>
    public const int Forbidden = 403;

    /// <summary>404 — Không tìm thấy dữ liệu.</summary>
    public const int NotFound = 404;

    /// <summary>409 — Xung đột nghiệp vụ: email trùng, email sai định dạng, trùng giá trị đã dùng.</summary>
    public const int Conflict = 409;

    /// <summary>500 — Lỗi hệ thống, không lộ chi tiết kỹ thuật ra ngoài.</summary>
    public const int InternalServerError = 500;
}
