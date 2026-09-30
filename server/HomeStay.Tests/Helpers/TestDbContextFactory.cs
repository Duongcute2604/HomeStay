using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using HomeStay.Data;

namespace HomeStay.Tests.Helpers;

/// <summary>
/// Tạo DbContext cho unit test, theo đúng mục đích từng loại test.
/// </summary>
public static class TestDbContextFactory
{
    /// <summary>
    /// Tạo DbContext dùng cơ sở dữ liệu InMemory — dùng để test thao tác ghi/đọc dữ liệu.
    /// Chạy được không cần MySQL, 9 bảng rỗng nên xong trong mili giây.
    /// </summary>
    /// <param name="databaseName">
    /// Tên database InMemory. Bỏ trống thì sinh tên ngẫu nhiên — mỗi test có dữ liệu riêng,
    /// tránh test này ghi đè dữ liệu của test khác.
    /// </param>
    public static HomeStayDbContext Create(string? databaseName = null)
    {
        string name = databaseName ?? Guid.NewGuid().ToString();

        DbContextOptions<HomeStayDbContext> options =
            new DbContextOptionsBuilder<HomeStayDbContext>()
                .UseInMemoryDatabase(name)
                // InMemory không thực thi transaction thật — bỏ qua cảnh báo để code
                // dùng `BeginTransaction` (như BookingService) vẫn chạy được trong test.
                // Giới hạn phải nhớ: chống trùng đồng thời KHÔNG chứng minh được bằng
                // InMemory, chỉ chứng minh bằng test tay 2 tab trên MySQL thật.
                .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
                .Options;

        return new HomeStayDbContext(options);
    }

    /// <summary>
    /// Tạo DbContext gắn với provider MySQL để kiểm tra CẤU HÌNH CSDL (tên bảng, index,
    /// check constraint, kiểu lưu của enum).
    ///
    /// Vì sao không dùng InMemory cho việc này: provider InMemory không có khái niệm bảng,
    /// nên không sinh ra các thông tin đó — đọc vào sẽ ra null rồi test hỏng.
    ///
    /// Chuỗi kết nối ở đây là chuỗi bất kỹ: test chỉ đọc metadata trong bộ nhớ,
    /// KHÔNG mở kết nối tới MySQL, nên test vẫn chạy được khi máy không bật database.
    /// </summary>
    public static HomeStayDbContext CreateForSchemaInspection()
    {
        var serverVersion = new MySqlServerVersion(new Version(8, 0, 36));

        DbContextOptions<HomeStayDbContext> options =
            new DbContextOptionsBuilder<HomeStayDbContext>()
                .UseMySql("Server=localhost;Database=homestay;User=homestay;Password=homestay;", serverVersion)
                .Options;

        return new HomeStayDbContext(options);
    }
}
