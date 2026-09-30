using System.Net;

namespace HomeStay.Common;

/// <summary>
/// Lỗi nghiệp vụ có mã HTTP đi kèm.
///
/// Tồn tại để Service ném lỗi kèm thông điệp tiếng Việt sẵn, còn
/// ExceptionMiddleware lo phần còn lại (ghi log, bọc format JSON). Nhờ vậy
/// Controller không phải tự if từng trường hợp lỗi — vi phạm nguyên tắc
/// "Controller chỉ tiếp nhận, validate, trả response".
/// </summary>
public class AppException : Exception
{
    /// <summary>Mã trạng thái HTTP sẽ trả về cho client.</summary>
    public HttpStatusCode StatusCode { get; }

    /// <summary>
    /// Khởi tạo lỗi nghiệp vụ.
    /// </summary>
    /// <param name="statusCode">Mã HTTP cần trả về.</param>
    /// <param name="message">Thông báo tiếng Việt hiển thị cho người dùng.</param>
    public AppException(HttpStatusCode statusCode, string message)
        : base(message)
    {
        StatusCode = statusCode;
    }
}
