using System.Net;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Bookings;
using StayEasy.Services.Rooms;
using StayEasy.Tests.Common;
using StayEasy.Tests.Helpers;

namespace StayEasy.Tests.Services;

/// <summary>
/// Kiểm chứng tạo đơn đặt phòng: tính tiền, snapshot giá, transaction + lịch sử,
/// chống trùng, mã đơn.
///
/// Service tái dùng kiểm trống của `RoomService` nên các quy tắc ngày/giờ ở đây
/// chỉ kiểm "lan tiếp đúng" — logic chi tiết đã có test ở `AvailabilityTests`.
/// </summary>
public class BookingServiceTests
{
    /// <summary>Dựng DB có 1 địa điểm + 1 phòng (sức chứa 2) + 1 khách.</summary>
    private static async Task<(StayEasyDbContext Db, User Khach, Room Phong)> TaoDbCoSanAsync()
    {
        StayEasyDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        db.Rooms.Add(room);
        User khach = TestDataBuilder.CreateCustomer();
        db.Users.Add(khach);
        await db.SaveChangesAsync();
        return (db, khach, room);
    }

    private static BookingService TaoService(StayEasyDbContext db)
    {
        return new BookingService(db, new RoomService(db));
    }

    private static CreateBookingRequest TaoYeuCau(
        DateTime? checkIn = null, DateTime? checkOut = null, int type = 1, int guestCount = 2)
    {
        return new CreateBookingRequest
        {
            LocationIndex = 0,
            RoomIndex = 0,
            Type = type,
            CheckIn = checkIn,
            CheckOut = checkOut,
            GuestCount = guestCount,
        };
    }

    // ---------------- Happy path ----------------

    [Fact]
    public async Task TaoDonAsync_TheoNgay_TinhTienDung_TrangThaiChoXacNhan()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            // Nhận 14:00 05/10, trả 12:00 07/10 = 46 giờ → 2 ngày × 900.000.
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            BookingResponseDto result = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan, nhan.AddDays(2).AddHours(-2)), CancellationToken.None);

            Assert.Equal(1800000, result.TotalAmount);
            Assert.Equal(BookingStatus.PENDING, result.Status);
            Assert.Equal(khach.Id, (await db.Bookings.SingleAsync()).UserId);
        }
    }

    [Fact]
    public async Task TaoDonAsync_TheoGio_TinhTienDung()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            // 3 giờ × 120.000.
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            BookingResponseDto result = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan, nhan.AddHours(3), 0), CancellationToken.None);

            Assert.Equal(360000, result.TotalAmount);
            Assert.Equal(BookingType.HOUR, result.BookingType);
        }
    }

    [Fact]
    public async Task TaoDonAsync_MaDon_DungDinhDang_HS_YYMMDD_XXXX()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            BookingResponseDto result = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

            // HS-261005-4821: tiền tố HS, ngày nhận 6 số, 4 số ngẫu nhiên.
            Assert.Matches(new Regex(@"^HS-\d{6}-\d{4}$"), result.Code);
            Assert.Contains(nhan.ToString("yyMMdd"), result.Code);
        }
    }

    [Fact]
    public async Task TaoDonAsync_HaiDon_MaKhacNhau()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan1 = DateTime.Now.Date.AddDays(5).AddHours(14);
            DateTime nhan2 = DateTime.Now.Date.AddDays(8).AddHours(14);

            BookingResponseDto don1 = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan1, nhan1.AddDays(1)), CancellationToken.None);
            BookingResponseDto don2 = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan2, nhan2.AddDays(1)), CancellationToken.None);

            Assert.NotEqual(don1.Code, don2.Code);
        }
    }

    // ---------------- Snapshot + lịch sử + transaction ----------------

    [Fact]
    public async Task TaoDonAsync_DoiGiaPhong_DonCuGiuNguyenTienVaSnapshot()
    {
        var (db, khach, phong) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            BookingResponseDto result = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

            // Admin sửa giá sau khi đơn đã tạo.
            phong.PricePerDay = 2000000;
            phong.PricePerHour = 300000;
            await db.SaveChangesAsync();

            Booking donCu = await db.Bookings.SingleAsync(d => d.Code == result.Code);
            Assert.Equal(900000, donCu.TotalAmount);
            Assert.Equal(120000, donCu.PricePerHourSnapshot);
            Assert.Equal(900000, donCu.PricePerDaySnapshot);
        }
    }

    [Fact]
    public async Task TaoDonAsync_GhiMotDongLichSu_NullDenPending_DungNguoiTao()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            BookingResponseDto result = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

            Booking don = await db.Bookings.SingleAsync(d => d.Code == result.Code);
            BookingStatusHistory lichSu = Assert.Single(await db.BookingStatusHistory.ToListAsync());

            Assert.Equal(don.Id, lichSu.BookingId);
            Assert.Null(lichSu.FromStatus);
            Assert.Equal(BookingStatus.PENDING, lichSu.ToStatus);
            Assert.Equal(khach.Id, lichSu.ChangedByUserId);
        }
    }

    [Fact]
    public void TaoDonAsync_ResponseKhongChuaId()
    {
        Assert.Null(typeof(BookingResponseDto).GetProperty("Id"));
        Assert.Null(typeof(BookingResponseDto).GetProperty("RoomId"));
        Assert.Null(typeof(BookingResponseDto).GetProperty("UserId"));
    }

    // ---------------- Xung đột và quy tắc ----------------

    [Fact]
    public async Task TaoDonAsync_TrungDonHieuLuc_ThroiAppException409()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            DateTime tra = nhan.AddDays(2);
            await service.TaoDonAsync(khach.Id, TaoYeuCau(nhan, tra), CancellationToken.None);

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(
                    khach.Id, TaoYeuCau(nhan.AddHours(5), tra.AddHours(5)), CancellationToken.None));

            Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
            Assert.Equal(ErrorMessages.PhongDaCoDon, loi.Message);
            // Đơn thứ hai không được tạo — vẫn chỉ 1 đơn trong DB.
            Assert.Equal(1, await db.Bookings.CountAsync());
        }
    }

    [Fact]
    public async Task TaoDonAsync_ChamBienDonHieuLuc_ThanhCong()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            DateTime tra = nhan.AddDays(2);
            await service.TaoDonAsync(khach.Id, TaoYeuCau(nhan, tra), CancellationToken.None);

            // Nhận đúng giờ đơn cũ trả — không tính trùng.
            BookingResponseDto don2 = await service.TaoDonAsync(
                khach.Id, TaoYeuCau(tra, tra.AddDays(1)), CancellationToken.None);

            Assert.Equal(2, await db.Bookings.CountAsync());
            Assert.NotEqual(don2.Code, (await db.Bookings.FirstAsync()).Code);
        }
    }

    [Fact]
    public async Task TaoDonAsync_VuotSucChua_ThroiAppException400()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            // Phòng mẫu chứa tối đa 2 khách.
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(
                    khach.Id, TaoYeuCau(nhan, nhan.AddDays(1), 1, 3), CancellationToken.None));

            Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        }
    }

    [Fact]
    public async Task TaoDonAsync_SoKhachBang0_ThroiAppException400()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(
                    khach.Id, TaoYeuCau(nhan, nhan.AddDays(1), 1, 0), CancellationToken.None));

            Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        }
    }

    [Fact]
    public async Task TaoDonAsync_PhongBaoTri_ThroiAppException409()
    {
        var (db, khach, phong) = await TaoDbCoSanAsync();
        await using (db)
        {
            phong.Status = RoomStatus.MAINTENANCE;
            await db.SaveChangesAsync();
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(khach.Id, TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None));

            Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
            Assert.Equal(ErrorMessages.PhongBaoTri, loi.Message);
        }
    }

    [Fact]
    public async Task TaoDonAsync_ChiSoSai_ThroiAppException404()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.Date.AddDays(5).AddHours(14);
            CreateBookingRequest request = TaoYeuCau(nhan, nhan.AddDays(1));
            request.LocationIndex = 99;

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(khach.Id, request, CancellationToken.None));

            Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        }
    }

    [Fact]
    public async Task TaoDonAsync_DatGap_ThroiAppException400_LanTruyenTuKiemTrong()
    {
        var (db, khach, _) = await TaoDbCoSanAsync();
        await using (db)
        {
            BookingService service = TaoService(db);
            DateTime nhan = DateTime.Now.AddHours(1);

            // Quy tắc ngày/giờ không viết lại ở đây — test chỉ khẳng định lan tiếp.
            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.TaoDonAsync(khach.Id, TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None));

            Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
            Assert.Equal(ErrorMessages.DatTruocItNhat2Gio, loi.Message);
        }
    }
}
