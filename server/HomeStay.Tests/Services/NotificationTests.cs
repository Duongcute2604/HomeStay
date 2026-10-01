using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Admin;
using HomeStay.Services.Notifications;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm nghiệm tính năng thông báo (Bước 23).
///
/// <para>
/// Bốn điều cần khoá lại ở đây: <b>mỗi lần Admin chuyển trạng thái thì sinh đúng
/// một thông báo</b>, thông báo <b>luôn ghi mã đơn</b>, người dùng <b>không đọc được
/// thông báo của người khác</b>, và <b>con số chưa đọc</b> trên badge luôn khớp với
/// dữ liệu.
/// </para>
/// </summary>
public class NotificationTests : IDisposable
{
    /// <summary>Id Admin giả lập — service không đọc id này từ CSDL mà lấy từ token.</summary>
    private const int AdminId = 999;

    private readonly HomeStayDbContext _db;
    private readonly AdminBookingService _bookingService;
    private readonly NotificationService _notificationService;

    public NotificationTests()
    {
        _db = TestDbContextFactory.Create();
        _bookingService = new AdminBookingService(_db);
        _notificationService = new NotificationService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ---------- Chuẩn bị dữ liệu ----------

    /// <summary>Dựng 1 khách + 1 cơ sở + 1 phòng + 1 đơn đang chờ, rồi lưu xuống CSDL.</summary>
    private async Task<(User Khach, Booking Don)> TaoDonChoAsync(string email = "khach1@gmail.com")
    {
        User khach = TestDataBuilder.CreateCustomer(email);
        Location coSo = TestDataBuilder.CreateLocation();
        Room phong = TestDataBuilder.CreateRoom(coSo);
        Booking don = TestDataBuilder.CreateBooking(khach, phong);

        await _db.AddRangeAsync(khach, coSo, phong, don);
        await _db.SaveChangesAsync();
        return (khach, don);
    }

    /// <summary>Nhét thẳng một thông báo vào CSDL, dùng để kiểm thử phía đọc.</summary>
    private async Task<Notification> TaoThongBaoAsync(int userId, bool daDoc = false, DateTime? luc = null)
    {
        Notification thongBao = new()
        {
            UserId = userId,
            Title = "Đơn HS-0001 đã được xác nhận",
            Content = "Nội dung kiểm thử",
            IsRead = daDoc,
            CreatedAt = luc ?? DateTime.Now,
        };

        _db.Notifications.Add(thongBao);
        await _db.SaveChangesAsync();
        return thongBao;
    }

    // ---------- Sinh thông báo khi Admin chuyển trạng thái ----------

    [Fact]
    public async Task XacNhanDon_SinhMotThongBaoChoKhach()
    {
        (User khach, Booking don) = await TaoDonChoAsync();

        await _bookingService.XacNhanAsync(don.Code, AdminId, CancellationToken.None);

        List<Notification> thongBao = await _db.Notifications
            .Where(x => x.UserId == khach.Id)
            .ToListAsync();

        Assert.Single(thongBao);
        Assert.False(thongBao[0].IsRead);
    }

    [Fact]
    public async Task XacNhanDon_TieuDeChuaMaDon_DeKhachTraCuuDuoc()
    {
        (User _, Booking don) = await TaoDonChoAsync();

        await _bookingService.XacNhanAsync(don.Code, AdminId, CancellationToken.None);

        Notification thongBao = await _db.Notifications.SingleAsync();

        // Không có mã đơn trong thông báo thì khách phải tự vào từng đơn dò — đúng
        // cái phiền mà tính năng này sinh ra để loại bỏ.
        Assert.Contains(don.Code, thongBao.Title);
        Assert.NotNull(thongBao.Content);
        Assert.NotEmpty(thongBao.Content);
    }

    [Theory]
    [InlineData(BookingStatus.CONFIRMED, 1)]
    [InlineData(BookingStatus.CHECKED_IN, 2)]
    [InlineData(BookingStatus.COMPLETED, 3)]
    public async Task ChuyenTrangThai_MoiLan_DungSinhMotThongBao(BookingStatus trangThaiCanDen, int soLanChuyen)
    {
        (User khach, Booking don) = await TaoDonChoAsync();

        // Đi đúng đường đi của đơn: luôn xác nhận trước, rồi nhận phòng, rồi trả phòng.
        // Dừng ở bước tương ứng với trạng thái cần kiểm tra.
        await _bookingService.XacNhanAsync(don.Code, AdminId, CancellationToken.None);

        if (trangThaiCanDen is BookingStatus.CHECKED_IN or BookingStatus.COMPLETED)
        {
            await _bookingService.CheckInAsync(don.Code, AdminId, CancellationToken.None);
        }

        if (trangThaiCanDen == BookingStatus.COMPLETED)
        {
            await _bookingService.CheckOutAsync(don.Code, AdminId, CancellationToken.None);
        }

        int soThongBao = await _db.Notifications.CountAsync(x => x.UserId == khach.Id);

        // Số lần chuyển trạng thái đã xảy ra = số thông báo. Nhiều hơn là sinh thừa,
        // ít hơn là mất thông báo — hai lỗi đều lộ ra khi khách mở chuông.
        Assert.Equal(soLanChuyen, soThongBao);
    }

    [Fact]
    public async Task TuChoiDon_NoiDungThongBaoChuaLyDo()
    {
        (User _, Booking don) = await TaoDonChoAsync();

        await _bookingService.TuChoiAsync(
            don.Code, AdminId, "Phòng đang có khách thuê dài hạn", CancellationToken.None);

        Notification thongBao = await _db.Notifications.SingleAsync();

        // Từ chối mà không nói lý do thì khách không biết phải đặt phòng khác hay đợi,
        // nên lý do là bắt buộc — đã chặn ở tầng service, kiểm lại ở đây.
        Assert.Contains("Phòng đang có khách thuê dài hạn", thongBao.Content);
    }

    // ---------- Đọc và đếm ----------

    [Fact]
    public async Task LayDanhSach_MoiNhatTrenVaDemDungSoChuaDoc()
    {
        (User khach, _) = await TaoDonChoAsync();

        await TaoThongBaoAsync(khach.Id, daDoc: false, luc: new DateTime(2026, 9, 1));
        await TaoThongBaoAsync(khach.Id, daDoc: true, luc: new DateTime(2026, 9, 2));
        await TaoThongBaoAsync(khach.Id, daDoc: false, luc: new DateTime(2026, 9, 3));

        NotificationListDto result = await _notificationService.LayDanhSachAsync(khach.Id, CancellationToken.None);

        Assert.Equal(3, result.Items.Count);
        Assert.Equal(2, result.SoChuaDoc);
        // Mới nhất trước: dòng đầu là thông báo tháng 9, không phải tháng 3.
        Assert.Equal(new DateTime(2026, 9, 3), result.Items[0].CreatedAt);
    }

    [Fact]
    public async Task DanhDauDaDoc_GiamSoChuaDocMotDon()
    {
        (User khach, _) = await TaoDonChoAsync();
        Notification thongBao = await TaoThongBaoAsync(khach.Id);

        bool ok = await _notificationService.DanhDauDaDocAsync(thongBao.Id, khach.Id, CancellationToken.None);

        Assert.True(ok);
        NotificationListDto result = await _notificationService.LayDanhSachAsync(khach.Id, CancellationToken.None);
        Assert.Equal(0, result.SoChuaDoc);
        Assert.True(result.Items[0].IsRead);
    }

    [Fact]
    public async Task DanhDauDaDocTatCa_GiamVeKhong()
    {
        (User khach, _) = await TaoDonChoAsync();
        await TaoThongBaoAsync(khach.Id);
        await TaoThongBaoAsync(khach.Id);
        await TaoThongBaoAsync(khach.Id);

        int soMoi = await _notificationService.DanhDauDaDocTatCaAsync(khach.Id, CancellationToken.None);

        Assert.Equal(3, soMoi);
        NotificationListDto result = await _notificationService.LayDanhSachAsync(khach.Id, CancellationToken.None);
        Assert.Equal(0, result.SoChuaDoc);
    }

    [Fact]
    public async Task DanhDauDaDocTatCa_KhongHongThongBaoCuaNguoiKhac()
    {
        (User khachA, _) = await TaoDonChoAsync("khachA@gmail.com");
        (User khachB, _) = await TaoDonChoAsync("khachB@gmail.com");
        await TaoThongBaoAsync(khachB.Id);

        await _notificationService.DanhDauDaDocTatCaAsync(khachA.Id, CancellationToken.None);

        NotificationListDto cuaB = await _notificationService.LayDanhSachAsync(khachB.Id, CancellationToken.None);
        Assert.Equal(1, cuaB.SoChuaDoc);
    }

    // ---------- Ranh giới giữa các người dùng ----------

    [Fact]
    public async Task DanhDauDaDoc_ThongBaoNguoiKhac_TraFalse()
    {
        (User khachA, _) = await TaoDonChoAsync("khachA@gmail.com");
        (User khachB, _) = await TaoDonChoAsync("khachB@gmail.com");
        Notification thongBaoCuaB = await TaoThongBaoAsync(khachB.Id);

        bool ok = await _notificationService.DanhDauDaDocAsync(thongBaoCuaB.Id, khachA.Id, CancellationToken.None);

        // `UserId` truyền vào là id của A; thông báo của B phải không bị đụng tới.
        Assert.False(ok);
        Notification conNguyenBan = await _db.Notifications
            .SingleAsync(x => x.Id == thongBaoCuaB.Id);
        Assert.False(conNguyenBan.IsRead);
    }

    [Fact]
    public async Task LayDanhSach_KhongLoThongBaoNguoiKhac()
    {
        (User khachA, _) = await TaoDonChoAsync("khachA@gmail.com");
        (User khachB, _) = await TaoDonChoAsync("khachB@gmail.com");
        await TaoThongBaoAsync(khachB.Id, daDoc: false);

        NotificationListDto cuaA = await _notificationService.LayDanhSachAsync(khachA.Id, CancellationToken.None);

        Assert.Empty(cuaA.Items);
        Assert.Equal(0, cuaA.SoChuaDoc);
    }

    // ---------- Giới hạn khối lượng ----------

    [Fact]
    public async Task LayDanhSach_GioiHanSoLuongTraVe()
    {
        (User khach, _) = await TaoDonChoAsync();

        for (int i = 0; i < NotificationRules.SoToiDaMoiTrang + 10; i++)
        {
            await TaoThongBaoAsync(khach.Id, luc: new DateTime(2026, 9, 1).AddMinutes(i));
        }

        NotificationListDto result = await _notificationService.LayDanhSachAsync(khach.Id, CancellationToken.None);

        Assert.Equal(NotificationRules.SoToiDaMoiTrang, result.Items.Count);
        // Số chưa đọc phải đếm trên **toàn bộ** bảng, không phải trên 50 dòng vừa lấy.
        // Nếu đếm nhầm thì khi khách có 60 thông báo chưa đọc thì badge sẽ hiện 50.
        Assert.Equal(NotificationRules.SoToiDaMoiTrang + 10, result.SoChuaDoc);
    }
}
