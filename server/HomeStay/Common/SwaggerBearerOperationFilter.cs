using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace HomeStay.Common;

/// <summary>
/// Gắn yêu cầu bearer token vào các endpoint có [Authorize] trong tài liệu Swagger.
///
/// Vì sao cần: Swagger mặc định đánh dấu mọi endpoint là không cần token, kể cả
/// những endpoint bắt buộc phải đăng nhập. Người kiểm thử tay bấm "Try it out" thì
/// nhận 401 rồi tưởng API hỏng. Filter này chỉ gắn vào endpoint thật sự cần token
/// nên trang Swagger phản ánh đúng hành vi của API.
/// </summary>
public class SwaggerBearerOperationFilter : IOperationFilter
{
    /// <summary>Bổ sung yêu cầu Authorization vào các endpoint cần đăng nhập.</summary>
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        bool canAuthorize = context.MethodInfo
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), inherit: true)
            .Any();

        // Cũng gắn yêu cầu bearer khi controller đặt [Authorize] ở cấp lớp.
        // Nếu chỉ kiểm tra method thì các endpoint kế thừa quyền từ controller sẽ
        // hiển thị trên Swagger như không cần token, khiến người kiểm thử tay gặp 401
        // mà không hiểu vì sao.
        bool canAuthorizeController = context.MethodInfo.DeclaringType?
            .GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), inherit: true)
            .Any() ?? false;

        if (!canAuthorize && !canAuthorizeController)
        {
            return;
        }

        operation.Responses.TryAdd("401", new OpenApiResponse { Description = "Chưa đăng nhập hoặc token hết hạn" });
        operation.Responses.TryAdd("403", new OpenApiResponse { Description = "Không đủ quyền" });

        operation.Security.Add(new OpenApiSecurityRequirement
        {
            [new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            }] = Array.Empty<string>()
        });
    }
}
