namespace HomeStay.Services.Auth;

/// <summary>Cấu hình ký token, đọc từ appsettings (không hardcode trong code).</summary>
public class JwtOptions
{
    /// <summary>Tên khối cấu hình trong appsettings.</summary>
    public const string SectionName = "Jwt";

    /// <summary>Khoá dùng để ký. Cần dài tối thiểu 32 ký tự theo yêu cầu của HMAC-SHA256.</summary>
    public string Secret { get; set; } = string.Empty;

    /// <summary>Nơi phát hành token, hiện trong claim "iss".</summary>
    public string Issuer { get; set; } = string.Empty;

    /// <summary>Nơi token được chấp nhận, hiện trong claim "aud".</summary>
    public string Audience { get; set; } = string.Empty;
}
