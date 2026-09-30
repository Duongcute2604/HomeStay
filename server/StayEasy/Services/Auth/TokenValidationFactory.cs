using System.IdentityModel.Tokens.Jwt;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace StayEasy.Services.Auth;

/// <summary>
/// Dựng <see cref="TokenValidationParameters"/> — cấu hình kiểm tra token, khai một
/// lần duy nhất.
/// </summary>
/// <remarks>
/// Trước đây khối này bị viết lặp ở <c>Program.cs</c> (cho JwtBearer) và trong
/// <c>JwtTokenService</c> (để tự kiểm token), 8/8 thuộc tính giống hệt nhau. Rủi ro
/// thật không phải là dài hơn, mà là: khi token được ký bằng cấu hình mới nhưng
/// chỗ kiểm vẫn dùng cấu hình cũ thì mọi token đều bị từ chối, và log chỉ hiện
/// "token không hợp lệ" — rất khó đoán. Sửa một chỗ mà quên chỗ kia là kiểu lỗi
/// âm thầm đắt nhất.
/// </remarks>
public static class TokenValidationFactory
{
    /// <summary>
    /// Sai lệch đồng hồ được chấp nhận giữa máy chủ và máy khách, tính bằng giây.
    /// Không có khoảng này thì người dùng phải đăng nhập lại chỉ vì đồng hồ lệch
    /// vài giây.
    /// </summary>
    public const int DoLechPhepTinhGiay = 30;

    /// <summary>
    /// Dựng cấu hình kiểm token từ khối cấu hình đã nạp.
    /// </summary>
    /// <param name="options">Cấu hình ký, tức khối <c>Jwt</c> trong appsettings.</param>
    public static TokenValidationParameters Tao(JwtOptions options)
    {
        return new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Secret)),

            ValidateIssuer = true,
            ValidIssuer = options.Issuer,

            ValidateAudience = true,
            ValidAudience = options.Audience,

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(DoLechPhepTinhGiay)
        };
    }
}
