using Microsoft.EntityFrameworkCore;
using StayEasy.Data;
using StayEasy.Data.Seed;

var builder = WebApplication.CreateBuilder(args);

const string ConnectionStringName = "DefaultConnection";

// Chốt đúng phiên bản MySQL đang chạy trong docker-compose.yml.
// Dùng AutoDetect sẽ mở kết nối ngay lúc khởi động, khiến `dotnet ef` hỏng nếu MySQL chưa bật.
var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Nối 9 bảng trong StayEasyDbContext với MySQL trong Docker (cổng 3307).
// Kiểm tra chuỗi kết nối tồn tại ngay khi khởi động, để lỗi cấu hình lộ ra lúc chạy chứ không phải lúc có request.
builder.Services.AddDbContext<StayEasyDbContext>(options =>
{
    string connectionString = builder.Configuration.GetConnectionString(ConnectionStringName)
        ?? throw new InvalidOperationException($"Thiếu chuỗi kết nối '{ConnectionStringName}' trong appsettings.json");

    options.UseMySql(connectionString, serverVersion);
});

var app = builder.Build();

// Nạp dữ liệu mẫu ở lần chạy đầu tiên để dự án luôn có sẵn dữ liệu trình diễn,
// khỏi phải import thủ công mỗi lần xoá bảng. Hàm tự kiểm tra dữ liệu đã có chưa nên
// chạy lại bao nhiêu lần cũng không nhân bản.
// Dùng CreateAsyncScope vì DbContext đăng ký theo kiểu Scoped — lấy trực tiếp từ
// app.Services sẽ ném lỗi "Cannot resolve scoped service".
await using (AsyncServiceScope scope = app.Services.CreateAsyncScope())
{
    StayEasyDbContext db = scope.ServiceProvider.GetRequiredService<StayEasyDbContext>();

    await SeedData.SeedAsync(db, CancellationToken.None);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
