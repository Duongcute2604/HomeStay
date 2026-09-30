using System.Net;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Booking;
using HomeStay.Services.Rooms;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng kiểm tra phòng trống: 6 quy tắc nghiệp vụ.
///
/// Mỗi test dựng database InMemory riêng nên không cần MySQL.
/// Ngày giờ trong test tính tương đối so với `DateTime.Now` vì quy tắc "đặt
/// trước 2 giờ" phụ thuộc thời điểm chạy — dùng ngày cố định như
/// `TestDataBuilder.CheckInTime` (2026) thì quy tắc này luôn fail.
/// </summary>
public class AvailabilityTests
{
    /// <summary>Đơn còn hiệu lực giữ phòng: 10:00 ngày mai → 12:00 ngày kia.</summary>
    private static (HomeStayDbContext Db, Room Room) TaoDbCoDonHieuLuc()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        db.Rooms.Add(room);
        db.SaveChanges();

        DateTime nhan = DateTime.Now.Date.AddDays(1).AddHours(14);
        DateTime tra = DateTime.Now.Date.AddDays(2).AddHours(12);
        Booking don = TestDataBuilder.CreateBooking(
            TestDataBuilder.CreateCustomer(), room, "HS-261001-0001",
            BookingType.DAY, nhan, tra);
        don.Status = BookingStatus.CONFIRMED;
        db.Users.Add(don.User);
        db.Bookings.Add(don);
        db.SaveChanges();

        return (db, room);
    }

    private static AvailabilityRequest TaoYeuCau(
        DateTime? checkIn = null, DateTime? checkOut = null, int type = 1)
    {
        return new AvailabilityRequest
        {
            LocationIndex = 0,
            RoomIndex = 0,
            Type = type,
            CheckIn = checkIn,
            CheckOut = checkOut,
        };
    }

    private static RoomService TaoService(HomeStayDbContext db)
    {
        return new RoomService(db);
    }

    // ---------------- Happy path ----------------

    [Fact]
    public async Task KiemTraTrong_KhoangKhongCoDon_TraVeConTrong()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        db.Rooms.Add(TestDataBuilder.CreateRoom(location, "101"));
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(10);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddDays(2)), CancellationToken.None);

        Assert.True(result.IsAvailable);
        Assert.Null(result.Reason);
    }

    // ---------------- 3 test chồng lấn bắt buộc ----------------

    [Fact]
    public async Task KiemTraTrong_ChongLanVoiDonHieuLuc_TraVeBan()
    {
        var (db, _) = TaoDbCoDonHieuLuc();
        await using (db)
        {
            RoomService service = TaoService(db);
            // Đơn giữ từ 14:00 mai đến 12:00 kia — xin 10:00 mai đến 10:00 kia là chồng.
            DateTime nhan = DateTime.Now.Date.AddDays(1).AddHours(10);
            AvailabilityResponse result = await service.KiemTraTrongAsync(
                TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

            Assert.False(result.IsAvailable);
            Assert.Equal(ErrorMessages.PhongDaCoDon, result.Reason);
        }
    }

    [Fact]
    public async Task KiemTraTrong_ChamBienVoiDonHieuLuc_TraVeConTrong()
    {
        var (db, _) = TaoDbCoDonHieuLuc();
        await using (db)
        {
            RoomService service = TaoService(db);
            // Đơn cũ trả 12:00 ngày kia — nhận đúng 12:00 ngày kia vẫn được.
            // Đây là quy tắc biên quan trọng nhất: sai dấu `<=` là mất 1 ngày cho thuê.
            DateTime traDonCu = DateTime.Now.Date.AddDays(2).AddHours(12);
            AvailabilityResponse result = await service.KiemTraTrongAsync(
                TaoYeuCau(traDonCu, traDonCu.AddDays(1)), CancellationToken.None);

            Assert.True(result.IsAvailable);
        }
    }

    [Fact]
    public async Task KiemTraTrong_Lech1PhutVoiDonHieuLuc_TraVeBan()
    {
        var (db, _) = TaoDbCoDonHieuLuc();
        await using (db)
        {
            RoomService service = TaoService(db);
            // Nhận sớm hơn 1 phút so với giờ đơn cũ trả → vẫn tính là trùng.
            DateTime traDonCu = DateTime.Now.Date.AddDays(2).AddHours(12);
            AvailabilityResponse result = await service.KiemTraTrongAsync(
                TaoYeuCau(traDonCu.AddMinutes(-1), traDonCu.AddDays(1)), CancellationToken.None);

            Assert.True(result.IsAvailable == false);
            Assert.Equal(ErrorMessages.PhongDaCoDon, result.Reason);
        }
    }

    // ---------------- Đơn không còn giữ phòng ----------------

    [Theory]
    [InlineData(BookingStatus.CANCELLED)]
    [InlineData(BookingStatus.REJECTED)]
    [InlineData(BookingStatus.COMPLETED)]
    public async Task KiemTraTrong_DonDaHuyTuChoiTraRoi_KhongGiuPhong(BookingStatus trangThai)
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        db.Rooms.Add(room);
        db.SaveChanges();

        DateTime nhan = DateTime.Now.Date.AddDays(1).AddHours(14);
        DateTime tra = DateTime.Now.Date.AddDays(2).AddHours(12);
        Booking don = TestDataBuilder.CreateBooking(
            TestDataBuilder.CreateCustomer(), room, "HS-261001-0002",
            BookingType.DAY, nhan, tra);
        don.Status = trangThai;
        db.Users.Add(don.User);
        db.Bookings.Add(don);
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, tra), CancellationToken.None);

        Assert.True(result.IsAvailable);
        await db.DisposeAsync();
    }

    // ---------------- Quy tắc thời gian ----------------

    [Fact]
    public async Task KiemTraTrong_TraTruocNhan_ThroiAppException400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);
        DateTime moc = DateTime.Now.AddDays(5);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(moc, moc.AddHours(-1)), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Equal(ErrorMessages.GioTraPhaiSauGioNhan, loi.Message);
    }

    [Fact]
    public async Task KiemTraTrong_ThieuNgay_ThroiAppException400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(null, null), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task KiemTraTrong_DatGapDuoi2Gio_ThroiAppException400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);
        DateTime nhan = DateTime.Now.AddHours(1);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Equal(ErrorMessages.DatTruocItNhat2Gio, loi.Message);
    }

    [Fact]
    public async Task KiemTraTrong_DatDung2Gio_ChapNhan()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        db.Rooms.Add(TestDataBuilder.CreateRoom(location, "101"));
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        // Biên: đúng 2 giờ thì qua — chặn lỗi sửa thành `<=` khi ai đó "làm chặt" hơn.
        DateTime nhan = DateTime.Now.AddHours(2).AddMinutes(1);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

        Assert.True(result.IsAvailable);
    }

    [Fact]
    public async Task KiemTraTrong_TheoGioDuoi3Gio_ThroiAppException400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);
        DateTime nhan = DateTime.Now.AddDays(5);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(nhan, nhan.AddHours(2), 0), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Equal(ErrorMessages.TheoGioToiThieu3Gio, loi.Message);
    }

    [Fact]
    public async Task KiemTraTrong_TheoGioDung3Gio_ChapNhan()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        db.Rooms.Add(TestDataBuilder.CreateRoom(location, "101"));
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(5);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddHours(3), 0), CancellationToken.None);

        Assert.True(result.IsAvailable);
    }

    [Fact]
    public async Task KiemTraTrong_CachThueLa_ThroiAppException400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);
        DateTime nhan = DateTime.Now.AddDays(5);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(nhan, nhan.AddDays(1), 99), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Equal(ErrorMessages.LoaiThueKhongHopLe, loi.Message);
    }

    // ---------------- Phòng ----------------

    [Fact]
    public async Task KiemTraTrong_PhongBaoTri_TraVeBan()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        room.Status = RoomStatus.MAINTENANCE;
        db.Rooms.Add(room);
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(10);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

        Assert.False(result.IsAvailable);
        Assert.Equal(ErrorMessages.PhongBaoTri, result.Reason);
        await db.DisposeAsync();
    }

    [Fact]
    public async Task KiemTraTrong_PhongMoiVeSinh_ChuaDuGio_TraVeBan()
    {
        // Quy định nghiệp vụ: sau khi trả phòng phải vệ sinh 2 giờ mới nhận đơn
        // mới. Không chặn ở đây thì khách đặt trúng phòng đang lau nhà.
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        room.Status = RoomStatus.CLEANING;
        room.UpdatedAt = DateTime.Now.AddMinutes(-30);
        db.Rooms.Add(room);
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(10);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

        Assert.False(result.IsAvailable);
        Assert.Equal(ErrorMessages.PhongDangVeSinh, result.Reason);
        await db.DisposeAsync();
    }

    [Fact]
    public async Task KiemTraTrong_PhongVeSinhDuGio_ChapNhanDat()
    {
        // Biên quan trọng: job nền chuyển CLEANING→AVAILABLE chạy mỗi phút, nên
        // có lúc phòng vẫn còn CLEANING nhưng đã đủ giờ. Chặn thêm ở đây là
        // chặn oan một phòng thật ra đã dùng được.
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        room.Status = RoomStatus.CLEANING;
        room.UpdatedAt = DateTime.Now.AddHours(-BookingRules.CleaningHoursAfterCheckout);
        db.Rooms.Add(room);
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(10);
        AvailabilityResponse result = await service.KiemTraTrongAsync(
            TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None);

        Assert.True(result.IsAvailable);
        await db.DisposeAsync();
    }

    [Fact]
    public async Task KiemTraTrong_ChiSoSai_ThroiAppException404()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        RoomService service = TaoService(db);
        DateTime nhan = DateTime.Now.AddDays(5);

        AvailabilityRequest request = TaoYeuCau(nhan, nhan.AddDays(1));
        request.LocationIndex = 99;
        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        Assert.Equal(ErrorMessages.KhongTimThayPhong, loi.Message);
    }

    [Fact]
    public async Task KiemTraTrong_DiaDiemNgungHoatDong_ThroiAppException404()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        location.IsActive = false;
        db.Locations.Add(location);
        db.Rooms.Add(TestDataBuilder.CreateRoom(location, "101"));
        await db.SaveChangesAsync();
        RoomService service = TaoService(db);

        DateTime nhan = DateTime.Now.AddDays(5);
        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.KiemTraTrongAsync(TaoYeuCau(nhan, nhan.AddDays(1)), CancellationToken.None));

        // Địa điểm ngừng hoạt động không hiện cho khách — coi như không có phòng.
        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        await db.DisposeAsync();
    }
}
