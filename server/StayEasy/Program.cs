using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using System.Text.Unicode;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.Data.Seed;
using StayEasy.Middleware;
using StayEasy.Services.Admin;
using StayEasy.Services.Auth;
using StayEasy.Services.Bookings;
using StayEasy.Services.Locations;
using StayEasy.Services.Rooms;

var builder = WebApplication.CreateBuilder(args);

const string ConnectionStringName = "DefaultConnection";
const string CorsPolicyName = "ClientWeb";

// Tiền tố key mà ASP.NET dùng trong ModelState cho lỗi đọc body (JSON hỏng, sai kiểu).
// Giá trị gốc là "$" — khai báo tên thay vì hardcode rải rác cho dễ đọc.
const string JsonInputFormatterErrorKeyPrefix = "$";

// Chốt đúng phiên bản MySQL đang chạy trong docker-compose.yml.
// Dùng AutoDetect sẽ mở kết nối ngay lúc khởi động, khiến `dotnet ef` hỏng nếu MySQL chưa bật.
var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        // Ép key JSON viết thường chữ đầu (success, message, data) cho MỌI response.
        // Không có dòng này thì C# trả "Success"/"Message" viết hoa còn lỗi do
        // middleware tự sinh lại khác — giao diện phải có hai nhánh đọc dữ liệu.
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;

        // Bỏ dấu + / = trong token: nếu không, ASP.NET tự escape chúng thành %2B
        // và %3D, client gửi lại token sai dạng nên luôn bị từ chối.
        options.JsonSerializerOptions.Encoder =
            JavaScriptEncoder.Create(UnicodeRanges.All);
    })
    .ConfigureApiBehaviorOptions(options =>
    {
        // Mặc định, khi [ApiController] thấy dữ liệu sai định dạng thì trả về
        // ValidationProblemDetails — cấu trúc hoàn toàn khác ApiResponse. Giao diện
        // sẽ phải có hai nhánh xử lý lỗi khác nhau. Ở đây ép về đúng một cấu trúc
        // { success, message, data } cho mọi lỗi, kể cả lỗi validate của framework.
        options.InvalidModelStateResponseFactory = context =>
        {
            // Lỗi chia làm hai loại, phân biệt được qua KEY của ModelState (đã kiểm chứng):
            //
            // 1. Lỗi đọc/dịch dữ liệu ở tầng form binding — JSON hỏng, body là mảng,
            //    body là số, sai kiểu dữ liệu. Key có dạng "$" hoặc "$.email".
            //    ErrorMessage là chuỗi kỹ thuật của .NET kiểu
            //    "'d' is an invalid start of a value. Path: $ | LineNumber: 0".
            //    Đưa nguyên văn ra ngoài là lộ chi tiết kỹ thuật (AGENTS.md mục 6.5).
            // 2. Lỗi do chính attribute trong DTO đặt ra — key là tên trường
            //    ("FullName", "Password"...) kèm thông báo tiếng Việt đã soạn sẵn.
            //
            // Lưu ý: cả hai loại đều có Exception = null, nên không phân biệt được
            // bằng Exception — buộc phải dựa vào key.
            bool coLoiDinhDang = context.ModelState.Keys
                .Any(khoa => khoa == JsonInputFormatterErrorKeyPrefix
                    || khoa.StartsWith(JsonInputFormatterErrorKeyPrefix + ".", StringComparison.Ordinal));

            if (coLoiDinhDang)
            {
                return new BadRequestObjectResult(
                    ApiResponse<object>.ErrorResponse(ErrorMessages.DuLieuKhongHopLe));
            }

            string thongBao = context.ModelState
                .SelectMany(entry => entry.Value?.Errors.Select(error => error.ErrorMessage) ?? [])
                .FirstOrDefault(tep => !string.IsNullOrWhiteSpace(tep))
                ?? ErrorMessages.DuLieuKhongHopLe;

            return new BadRequestObjectResult(
                ApiResponse<object>.ErrorResponse(thongBao));
        };
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    // Khai báo cơ chế bearer một lần: Swagger sinh nút "Authorize" để dán access token.
    // Chỉ những endpoint có [Authorize] mới được OperationFilter gắn biểu tượng khoá vào
    // (nếu áp dụng chung, cả endpoint công khai như đăng ký/đăng nhập cũng hiện khoá,
    // gây hiểu nhầm là phải đăng nhập mới gọi được).
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập access token theo đúng định dạng: Bearer {token}"
    });

    options.OperationFilter<SwaggerBearerOperationFilter>();
});

// Chuỗi kết nối chứa mật khẩu nên nằm ở appsettings.Development.json — file đó KHÔNG commit lên git (AGENTS.md 6.7).
// Nối 9 bảng trong StayEasyDbContext với MySQL trong Docker (cổng 3307).
// Kiểm tra chuỗi kết nối tồn tại ngay khi khởi động, để lỗi cấu hình lộ ra lúc chạy chứ không phải lúc có request.
builder.Services.AddDbContext<StayEasyDbContext>(options =>
{
    string connectionString = builder.Configuration.GetConnectionString(ConnectionStringName)
        ?? throw new InvalidOperationException($"Thiếu chuỗi kết nối '{ConnectionStringName}' trong appsettings.Development.json");

    options.UseMySql(connectionString, serverVersion);
});

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));

// Khoá bí mật nằm trong appsettings.Development.json, file này KHÔNG commit lên git.
// Kiểm tra ngay lúc khởi động để thiếu cấu hình thì báo lỗi rõ, chứ không đợi tới lúc
// có người đăng nhập mới phát hiện.
JwtOptions jwtConfig = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException($"Thiếu khối cấu hình '{JwtOptions.SectionName}' trong appsettings");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        // Cấu hình kiểm token lấy từ một chỗ duy nhất — xem `TokenValidationFactory`.
        // Viết riêng ở đây sẽ dễ lệch với cấu hình mà `JwtTokenService` dùng.
        options.TokenValidationParameters = TokenValidationFactory.Tao(jwtConfig);
    });

builder.Services.AddAuthorization();

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IBookingService, BookingService>();
builder.Services.AddScoped<IAdminLocationService, AdminLocationService>();
builder.Services.AddScoped<IAdminRoomService, AdminRoomService>();
builder.Services.AddScoped<IAdminCustomerService, AdminCustomerService>();
builder.Services.AddScoped<IAdminBookingService, AdminBookingService>();
// Job nền: tự chuyển phòng đã vệ sinh xong (CLEANING) sang còn trống.
builder.Services.AddHostedService<RoomCleaningJob>();
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<ITokenHasher, TokenHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();

// Giao diện React chạy ở cổng khác, nên phải cho phép gọi chéo. Danh sách cố định thay vì
// AllowAnyOrigin() vì token đang nằm trong header, cho phép mọi nguồn là lỗ hổng CORS.
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy => policy
        .WithOrigins(
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            // Dự phòng: cổng 5173 có thể đã bị ứng dụng khác trên máy chiếm,
            // lúc đó Vite chuyển sang 5174 (xem client/vite.config.ts).
            "http://localhost:5174",
            "http://127.0.0.1:5174")
        .AllowAnyHeader()
        .AllowAnyMethod());
});

var app = builder.Build();

// Nạp dữ liệu mẫu ở lần chạy đầu tiên để dự án luôn có sẵn dữ liệu trình diễn,
// khỏi phải import thủ công mỗi lần xoá bảng. Hàm tự kiểm tra dữ liệu đã có chưa nên
// chạy lại bao nhiêu lần cũng không nhân bản.
// Dùng CreateAsyncScope vì DbContext đăng ký theo kiểu Scoped — lấy trực tiếp từ
// app.Services sẽ ném lỗi "Cannot resolve scoped service".
await using (AsyncServiceScope seedScope = app.Services.CreateAsyncScope())
{
    StayEasyDbContext db = seedScope.ServiceProvider.GetRequiredService<StayEasyDbContext>();

    await SeedData.SeedAsync(db, CancellationToken.None);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Đặt ExceptionMiddleware đầu tiên để nó bọc được cả lỗi phát sinh ở các tầng sau,
// kể cả lỗi ModelState do [ApiController] trả về.
app.UseMiddleware<ExceptionMiddleware>();

// Bắt các mã lỗi mà framework tự trả mà KHÔNG có body: 401/403 từ tầng xác thực,
// 415 khi sai Content-Type, 404 khi gõ sai đường dẫn. Không có middleware này thì
// client nhận status 401 nhưng body rỗng, đọc response.data.message ra undefined
// đúng lúc cần báo "phiên đã hết hạn".
app.UseStatusCodePages(async trangLoi =>
{
    HttpResponse response = trangLoi.HttpContext.Response;

    string thongBao = response.StatusCode switch
    {
        StatusCodes.Status401Unauthorized => ErrorMessages.ChuaDangNhap,
        StatusCodes.Status403Forbidden => ErrorMessages.KhongDuQuyen,
        StatusCodes.Status404NotFound => ErrorMessages.KhongTimThayDuLieu,
        StatusCodes.Status415UnsupportedMediaType => ErrorMessages.DinhDangKhongHoTro,
        _ => ErrorMessages.LoiHeThong
    };

    // WriteAsJsonAsync dùng đúng bộ tuần tự hoá đã cấu hình ở trên (camelCase),
    // nhờ vậy lỗi ở đây cũng có key "success"/"message"/"data" giống hệt phần còn lại.
    await response.WriteAsJsonAsync(ApiResponse<object>.ErrorResponse(thongBao));
});

app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
