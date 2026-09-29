using Microsoft.EntityFrameworkCore;
using StayEasy.Data;

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

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Run();
