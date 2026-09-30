using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using HomeStay.Common;

namespace HomeStay.Middleware;

/// <summary>
/// Bắt toàn bộ lỗi phát sinh trong pipeline và trả về JSON thống nhất.
///
/// Vai trò: đảm bảo client LUÔN nhận được cùng một cấu trúc
/// { success, message, data }, và KHÔNG BAO GIỜ thấy stack trace hay thông báo lỗi
/// hệ thống (AGENTS.md mục 6.5). Nếu không có middleware này, một lỗi EF bên trong
/// sẽ trả về trang HTML lỗi mặc định của ASP.NET, lộ chi tiết kỹ thuật ra ngoài.
///
/// Phân biệt 2 loại lỗi:
/// - AppException: lỗi nghiệp vụ do chính mình ném ra — trả đúng mã và thông báo đã soạn.
/// - Lỗi còn lại: lỗi không lường trước — ghi log đầy đủ, nhưng trả thông báo chung.
///
/// Lưu ý: middleware này KHÔNG bắt được lỗi 401/403. Tầng xác thực không ném lỗi ra
/// mà ghi thẳng StatusCode rồi luồng tiếp tục chạy, nên không đi qua try/catch bên dưới.
/// Phần đó do UseStatusCodePages trong Program.cs lo — tránh xử lý trùng ở hai chỗ.
/// </summary>
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly JsonSerializerOptions _jsonOptions;

    /// <summary>Khởi tạo middleware.</summary>
    /// <param name="next">Middleware kế tiếp trong pipeline.</param>
    /// <param name="logger">Bộ ghi log hệ thống.</param>
    /// <param name="jsonOptions">
    /// Tuỳ chọn tuần tự hoá JSON do MVC cấu hình. Phải dùng chung bộ này chứ không
    /// tự tạo mới: nếu không, lỗi trả về đây sẽ có key "Success"/"Message" viết hoa
    /// trong khi lỗi validate của framework ra "success"/"message" viết thường.
    /// Giao diện đọc response.success sẽ nhận undefined đúng lúc cần báo lỗi nhất.
    /// </param>
    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger,
        IOptions<JsonOptions> jsonOptions)
    {
        _next = next;
        _logger = logger;
        _jsonOptions = jsonOptions.Value.JsonSerializerOptions;
    }

    /// <summary>Gọi middleware tiếp theo, bọc toàn bộ lỗi phát sinh bên trong.</summary>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            await TraVeLoiAsync(context, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            // Ghi lại lỗi gốc kèm stack trace vào log để khi có sự cố còn truy được,
            // nhưng phía client chỉ nhận thông báo chung.
            _logger.LogError(ex, "Lỗi hệ thống khi xử lý {Method} {Path}", context.Request.Method, context.Request.Path);

            await TraVeLoiAsync(context, HttpStatusCode.InternalServerError, ErrorMessages.LoiHeThong);
        }
    }

    private async Task TraVeLoiAsync(HttpContext context, HttpStatusCode statusCode, string message)
    {
        if (context.Response.HasStarted)
        {
            // Đã bắt đầu gửi dữ liệu thì không ghi được header nữa — ghi log và bỏ qua,
            // tránh ném lỗi mới che mất lỗi gốc.
            return;
        }

        context.Response.Clear();
        context.Response.StatusCode = (int)statusCode;
        context.Response.ContentType = "application/json; charset=utf-8";

        ApiResponse<object> body = ApiResponse<object>.ErrorResponse(message);

        await context.Response.WriteAsync(
            JsonSerializer.Serialize(body, _jsonOptions));
    }
}
