using Microsoft.EntityFrameworkCore;
using StayEasy.Data;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Booking;

namespace StayEasy.Services.Admin;

/// <summary>
/// Tự chuyển phòng từ `CLEANING` sang `AVAILABLE` khi đã đủ thời gian vệ sinh.
///
/// <para>
/// Vì sao cần: quy định nghiệp vụ là sau khi khách trả phòng phải vệ sinh
/// 2 giờ mới nhận đơn mới. Nếu để Admin bấm tay ở trang "Phòng" thì có 2 vấn
/// đề: (1) phòng đã sẵn sàng mà vẫn bị chặn đặt, (2) Admin quên bấm thì phòng
/// kẹt vĩnh viễn — đều là lỗi vận hành, không phải tính năng.
///
/// </para>
/// <para>
/// Vì sao là `BackgroundService` thay vì tính lười (lazy) lúc đọc: phòng phải
/// thật sự đổi trạng thái trong CSDL, nếu không thì báo cáo thống kê ở Bước 15
/// đếm sai số phòng đang vệ sinh. Tính lười chỉ sửa lúc đọc, CSDL vẫn sai.
///
/// </para>
/// </summary>
public class RoomCleaningJob : BackgroundService
{
    /// <summary>Chu kỳ quét. 1 phút là đủ — sai số 1 phút không ảnh hưởng đặt phòng.</summary>
    private static readonly TimeSpan ChuKy = TimeSpan.FromMinutes(1);

    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<RoomCleaningJob> _log;

    /// <summary>Khởi tạo job với scope factory (mỗi lần chạy cần DbContext riêng).</summary>
    public RoomCleaningJob(IServiceProvider serviceProvider, ILogger<RoomCleaningJob> log)
    {
        _serviceProvider = serviceProvider;
        _log = log;
    }

    /// <inheritdoc />
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Vòng lặp chạy suốt thời gian ứng dụng. `PeriodicTimer` tự chờ đúng
        // `ChuKy` giữa 2 lần chạy, khác vì `Task.Delay` cộng dồn thời gian xử lý.
        using var timer = new PeriodicTimer(ChuKy);

        do
        {
            try
            {
                await ChuyenPhongDaVeSinhXongAsync(stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                // Ứng dụng đang tắt — thoát vòng lặp, không phải lỗi.
                return;
            }
            catch (Exception ex)
            {
                // Job nền phải sống sót qua lỗi: một lần truy vấn hỏng không được
                // làm cả ứng dụng sập. Ghi log rồi thử lại ở nhịp kế tiếp.
                _log.LogError(ex, "Không chuyển được phòng đã vệ sinh xong sang còn trống");
            }
        }
        while (await timer.WaitForNextTickAsync(stoppingToken));
    }

    /// <summary>Chuyển mọi phòng `CLEANING` đã đủ thời gian sang `AVAILABLE`.</summary>
    private async Task ChuyenPhongDaVeSinhXongAsync(CancellationToken ct)
    {
        using IServiceScope scope = _serviceProvider.CreateScope();
        StayEasyDbContext db = scope.ServiceProvider.GetRequiredService<StayEasyDbContext>();

        DateTime moc =
            db.Rooms.AsNoTracking()
                .Where(phong => phong.Status == RoomStatus.CLEANING)
                .Select(phong => (DateTime?)phong.UpdatedAt)
                .Min() ?? DateTime.MinValue;

        if (moc == DateTime.MinValue)
        {
            return;
        }

        List<Room> canChuyen = await db.Rooms
            .Where(phong => phong.Status == RoomStatus.CLEANING
                && phong.UpdatedAt <= DateTime.Now.AddHours(-BookingRules.CleaningHoursAfterCheckout))
            .ToListAsync(ct);

        if (canChuyen.Count == 0)
        {
            return;
        }

        foreach (Room phong in canChuyen)
        {
            phong.Status = RoomStatus.AVAILABLE;
            phong.UpdatedAt = DateTime.Now;
        }

        await db.SaveChangesAsync(ct);

        _log.LogInformation(
            "Đã chuyển {SoPhong} phòng sang còn trống sau khi vệ sinh xong", canChuyen.Count);
    }
}
