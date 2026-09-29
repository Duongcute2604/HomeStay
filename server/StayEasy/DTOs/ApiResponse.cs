namespace StayEasy.Common;

/// <summary>
/// Lớp bọc mọi kết quả trả về cho client.
///
/// Bắt buộc theo AGENTS.md mục 6.2: Controller không bao giờ trả thẳng entity,
/// mà trả qua ApiResponse để có một cấu trúc JSON thống nhất cho toàn hệ thống.
/// Giao diện chỉ cần đọc đúng một chỗ: có <c>data</c> hay không, và <c>message</c> để báo lỗi.
/// </summary>
/// <typeparam name="T">Kiểu dữ liệu đặt trong <c>data</c>.</typeparam>
public class ApiResponse<T>
{
    /// <summary>Thành công hay thất bại. Giao diện dùng để chọn màu thông báo.</summary>
    public bool Success { get; set; }

    /// <summary>Thông báo tiếng Việt cho người dùng đọc.</summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>Dữ liệu trả về, null khi thất bại.</summary>
    public T? Data { get; set; }

    /// <summary>Khởi tạo rỗng — cho phép khởi tạo bằng object initializer.</summary>
    public ApiResponse()
    {
    }

    /// <summary>Khởi tạo kết quả đầy đủ.</summary>
    public ApiResponse(bool success, string message, T? data)
    {
        Success = success;
        Message = message;
        Data = data;
    }

    /// <summary>Tạo kết quả thành công kèm dữ liệu.</summary>
    public static ApiResponse<T> SuccessResponse(string message, T data)
    {
        return new ApiResponse<T>(true, message, data);
    }

    /// <summary>Tạo kết quả thành công không kèm dữ liệu (ví dụ sau khi xoá).</summary>
    public static ApiResponse<T> SuccessResponse(string message)
    {
        return new ApiResponse<T>(true, message, default);
    }

    /// <summary>Tạo kết quả thất bại, không kèm dữ liệu.</summary>
    public static ApiResponse<T> ErrorResponse(string message)
    {
        return new ApiResponse<T>(false, message, default);
    }
}
