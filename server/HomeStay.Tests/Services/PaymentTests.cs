using System.Net;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Admin;
using HomeStay.Services.Booking;
using HomeStay.Services.Payments;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;
using Microsoft.EntityFrameworkCore;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng nghiệp vụ thanh toán.
///
/// <para>
/// Ba quy tắc quan trọng nhất được khoá lại ở đây: <b>chỉ đơn hoàn thành mới thu được</b>,
/// <b>không thu hai lần</b>, và <b>số tiền phải khớp tổng tiền đơn</b> — đúng ba điều kiện
/// mà đặc tả Bước 22 yêu cầu có test.
/// </para>
/// </summary>
public class PaymentTests
{
    // ---------- Chuẩn bị dữ liệu ----------

    /// <summary>Đơn đã hoàn thành của một khách, chưa có phiếu thu.</summary>
    private static async Task<(HomeStayDbContext Db, Entities.User Khach, Entities.Booking Don)> TaoDonHoanThanhAsync(
        string email = "khach1@gmail.com")
    {
        // KHÔNG `await using` ở đây: hàm trả về chính `db`, mà `await using` sẽ dispose nó
        // ngay khi hàm kết thúc rồi test nhận về một context đã chết — lỗi
        // `ObjectDisposedException` chứ không phải lỗi nghiệp vụ. Test gọi hàm này tự dispose.
        HomeStayDbContext db = TestDbContextFactory.Create();

        Entities.User khach = TestDataBuilder.CreateCustomer(email);
        Entities.Location coSo = TestDataBuilder.CreateLocation();
        Entities.Room phong = TestDataBuilder.CreateRoom(coSo);
        Entities.Booking don = TestDataBuilder.CreateBooking(khach, phong);
        don.Status = BookingStatus.COMPLETED;

        db.AddRange(khach, coSo, phong, don);
        await db.SaveChangesAsync();

        return (db, khach, don);
    }

    // ---------- Đơn hoàn thành mới được mở phiếu thu ----------

    [Fact]
    public async Task ChonPhuongThuc_DonHoanThanh_MoPhieuThuDungSoTien()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        IPaymentService service = new PaymentService(db2);

        PaymentDto result = await service.ChonPhuongThucAsync(
            khach.Id, don.Code, new CreatePaymentRequest { Method = (int)PaymentMethod.MOMO }, default);

        Assert.Equal(PaymentStatus.PENDING, (PaymentStatus)result.Status);
        Assert.Equal((int)PaymentMethod.MOMO, result.Method);
        // Số tiền phải chụp từ đơn, không phải từ request — request không có trường amount.
        Assert.Equal(don.TotalAmount, result.Amount);
        Assert.Null(result.PaidAt);

        Payment? trongDb = await db2.Payments.SingleAsync();
        Assert.Equal(don.Id, trongDb.BookingId);
    }

    [Fact]
    public async Task ChonPhuongThuc_DonChuaHoanThanh_TranLoi()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Entities.User khach = TestDataBuilder.CreateCustomer();
        Entities.Location coSo = TestDataBuilder.CreateLocation();
        Entities.Room phong = TestDataBuilder.CreateRoom(coSo);
        Entities.Booking don = TestDataBuilder.CreateBooking(khach, phong);
        don.Status = BookingStatus.CONFIRMED;
        db.AddRange(khach, coSo, phong, don);
        await db.SaveChangesAsync();

        IPaymentService service = new PaymentService(db);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.ChonPhuongThucAsync(khach.Id, don.Code, new CreatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Empty(db.Payments);
    }

    [Fact]
    public async Task ChonPhuongThuc_MaDonKhongTonTai_TranLoi404()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        IPaymentService service = new PaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.ChonPhuongThucAsync(khach.Id, "HS-999999-9999", new CreatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    [Fact]
    public async Task ChonPhuongThuc_DonCuaNguoiKhach_TranLoi404KhongLoThongTin()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Entities.User nguoiLa = TestDataBuilder.CreateCustomer("khach2@gmail.com");
        db2.Add(nguoiLa);
        await db2.SaveChangesAsync();
        IPaymentService service = new PaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.ChonPhuongThucAsync(nguoiLa.Id, don.Code, new CreatePaymentRequest { Method = 0 }, default));

        // 404 chứ không phải 403: trả 403 sẽ lộ ra "đơn này tồn tại nhưng không phải của bạn".
        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    [Fact]
    public async Task ChonPhuongThuc_PhuongThucNgoaiEnum_TranLoi400()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        IPaymentService service = new PaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.ChonPhuongThucAsync(khach.Id, don.Code, new CreatePaymentRequest { Method = 99 }, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task ChonPhuongThuc_GoiHaiLan_DoiPhuongThucKhongTaoPhieuThuHai()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        IPaymentService service = new PaymentService(db2);

        await service.ChonPhuongThucAsync(khach.Id, don.Code, new CreatePaymentRequest { Method = 0 }, default);
        PaymentDto lanHai = await service.ChonPhuongThucAsync(
            khach.Id, don.Code, new CreatePaymentRequest { Method = (int)PaymentMethod.BANK_TRANSFER }, default);

        Assert.Equal((int)PaymentMethod.BANK_TRANSFER, lanHai.Method);
        // Unique index chỉ chặn 2 phiếu CÙNG LÚC; ở đây kiểm tra phía service vẫn 1 phiếu.
        Assert.Single(db2.Payments);
    }

    // ---------- Không thu hai lần ----------

    [Fact]
    public async Task DanhDauDaThu_DaThuRoi_TranLoi409()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don);
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DanhDauDaThuAsync(phieu.Id, new UpdatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Fact]
    public async Task DanhDauDaThu_GoiHaiLan_LanHaiBiChanVaThoiDiemKhongDoi()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don, status: PaymentStatus.PENDING);
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        PaymentDto lanDau = await service.DanhDauDaThuAsync(
            phieu.Id, new UpdatePaymentRequest { Method = 0 }, default);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DanhDauDaThuAsync(phieu.Id, new UpdatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Payment trongDb = await db2.Payments.AsNoTracking().SingleAsync();
        Assert.Equal(PaymentStatus.PAID, trongDb.Status);
        Assert.Equal(lanDau.PaidAt, trongDb.PaidAt);
    }

    [Fact]
    public async Task DanhDauDaThu_PhieuDaThatBai_TranLoi409()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don, status: PaymentStatus.FAILED);
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DanhDauDaThuAsync(phieu.Id, new UpdatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Fact]
    public async Task DanhDauThatBai_DaThuTienRoi_TranLoi409()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don);
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DanhDauThatBaiAsync(phieu.Id, "Khach chuyen sai", default));

        // Đã thu rồi thì không được đánh thất bại — người đã trả tiền sẽ không lấy lại được.
        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    // ---------- Số tiền phải khớp tổng tiền đơn ----------

    [Fact]
    public async Task DanhDauDaThu_SoTienLechTongTienDon_TranLoi400()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don, status: PaymentStatus.PENDING);
        phieu.Amount = don.TotalAmount + 1m;
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DanhDauDaThuAsync(phieu.Id, new UpdatePaymentRequest { Method = 0 }, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Equal(ErrorMessages.SoTienKhongKhop, loi.Message);
    }

    [Fact]
    public async Task DanhDauDaThu_SoTienLechRaoNhoTrongPhep_Den()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don, status: PaymentStatus.PENDING);
        // Sai số nằm trong ngưỡng cho phép nên vẫn thu được — tránh chặn nhầm do làm tròn.
        phieu.Amount = don.TotalAmount + PaymentRules.SaiSoTienToiDa / 2m;
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        PaymentDto result = await service.DanhDauDaThuAsync(
            phieu.Id, new UpdatePaymentRequest { Method = 0 }, default);

        Assert.Equal(PaymentStatus.PAID, (PaymentStatus)result.Status);
    }

    [Fact]
    public async Task DanhDauDaThu_KhopTinhTien_HoanTatVaGhiThoiDiemThu()
    {
        (HomeStayDbContext db, Entities.User khach, Entities.Booking don) = await TaoDonHoanThanhAsync();
        await using HomeStayDbContext db2 = db;
        Payment phieu = TestDataBuilder.CreatePayment(don, status: PaymentStatus.PENDING);
        db2.Add(phieu);
        await db2.SaveChangesAsync();
        IAdminPaymentService service = new AdminPaymentService(db2);

        PaymentDto result = await service.DanhDauDaThuAsync(
            phieu.Id,
            new UpdatePaymentRequest { Method = (int)PaymentMethod.MOMO, Note = " Đã nhận tiền mặt " },
            default);

        Assert.Equal(PaymentStatus.PAID, (PaymentStatus)result.Status);
        Assert.NotNull(result.PaidAt);
        Assert.Equal((int)PaymentMethod.MOMO, result.Method);
        Assert.Equal("Đã nhận tiền mặt", result.Note);
        // Số tiền phải bằng đúng công thức tính tiền của đơn.
        Assert.Equal(
            BookingCalculator.TinhTien(don.BookingType, don.PricePerHourSnapshot, don.PricePerDaySnapshot,
                don.CheckIn, don.CheckOut),
            result.Amount);
    }

    // ---------- Regression: nạp phiếu phải kèm đơn ----------

    /// <summary>
    /// Nạp phiếu thu từ cơ sở dữ liệu phải đối chiếu được với tổng tiền đơn.
    /// </summary>
    /// <remarks>
    /// Test này cố tình tạo phiếu **chỉ gán <c>BookingId</c>**, không gán navigation
    /// <c>Booking</c>, rồi mở context thứ hai cùng tên database để buộc service phải đọc
    /// lại dữ liệu từ kho thay vì dùng đối tượng trong bộ nhớ. Đây chính là tình huống lúc
    /// chạy thật.
    ///
    /// Lý do phải có test này: trong các test khác dữ liệu được dựng trong bộ nhớ với
    /// <c>Booking = don</c> nên navigation luôn có sẵn, và test vẫn xanh dù service đọc
    /// <c>phieu.Booking.TotalAmount</c> mà quên nạp đơn. Lỗi đó chỉ lộ ra ngoài đời thành
    /// <c>500</c> — đã xảy ra thật một lần khi kiểm thử tay. Cách sửa là chiếu thẳng
    /// <c>Bookings.TotalAmount</c> thay vì đi qua navigation.
    /// </remarks>
    [Fact]
    public async Task DanhDauDaThu_PhieuNapTuCSDL_KhongPhaiLoi500()
    {
        const string tenDatabase = "payment-include-test";
        int idPhieu;

        // Cùng TÊN database cho cả hai context: context thứ hai không dùng lại dữ liệu
        // trong bộ nhớ của context thứ nhất, nên nó phải đọc lại từ kho dữ liệu thật sự.
        await using (HomeStayDbContext seed = TestDbContextFactory.Create(tenDatabase))
        {
            Entities.User khach = TestDataBuilder.CreateCustomer();
            Entities.Location coSo = TestDataBuilder.CreateLocation();
            Entities.Room phong = TestDataBuilder.CreateRoom(coSo);
            Entities.Booking don = TestDataBuilder.CreateBooking(khach, phong);
            don.Status = BookingStatus.COMPLETED;
            seed.AddRange(khach, coSo, phong, don);
            await seed.SaveChangesAsync();

            // CHỈ gán `BookingId`, cố tình không gán `Booking`.
            Payment phieu = new()
            {
                BookingId = don.Id,
                Amount = don.TotalAmount,
                Method = PaymentMethod.CASH,
                Status = PaymentStatus.PENDING,
            };
            seed.Payments.Add(phieu);
            await seed.SaveChangesAsync();
            idPhieu = phieu.Id;
        }

        await using HomeStayDbContext db = TestDbContextFactory.Create(tenDatabase);
        IAdminPaymentService service = new AdminPaymentService(db);

        PaymentDto result = await service.DanhDauDaThuAsync(
            idPhieu, new UpdatePaymentRequest { Method = (int)PaymentMethod.CASH }, default);

        Assert.Equal(PaymentStatus.PAID, (PaymentStatus)result.Status);
        Assert.NotNull(result.PaidAt);
    }

    // ---------- Xem danh sách ----------

    [Fact]
    public async Task LayCuaToi_ChiTraPhieuCuaChinhKhach()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Entities.User khach = TestDataBuilder.CreateCustomer("khach1@gmail.com");
        Entities.User khachKhac = TestDataBuilder.CreateCustomer("khach2@gmail.com");
        Entities.Location coSo = TestDataBuilder.CreateLocation();
        Entities.Room phong = TestDataBuilder.CreateRoom(coSo);
        Entities.Booking donCuaMinh = TestDataBuilder.CreateBooking(khach, phong, "HS-A-0001");
        Entities.Booking donCuaHo = TestDataBuilder.CreateBooking(khachKhac, phong, "HS-B-0001");
        db.AddRange(khach, khachKhac, coSo, phong, donCuaMinh, donCuaHo);
        await db.SaveChangesAsync();
        db.Payments.Add(TestDataBuilder.CreatePayment(donCuaMinh));
        db.Payments.Add(TestDataBuilder.CreatePayment(donCuaHo));
        await db.SaveChangesAsync();

        IPaymentService service = new PaymentService(db);

        IReadOnlyList<PaymentDto> result = await service.LayCuaToiAsync(khach.Id, default);

        Assert.Single(result);
        Assert.Equal("HS-A-0001", result[0].BookingCode);
    }

    [Fact]
    public async Task LayDanhSachAdmin_LocTrangThai_ChiTraDungNhom()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        Entities.User khach = TestDataBuilder.CreateCustomer();
        Entities.Location coSo = TestDataBuilder.CreateLocation();
        Entities.Room phong = TestDataBuilder.CreateRoom(coSo);
        Entities.Booking don1 = TestDataBuilder.CreateBooking(khach, phong, "HS-A-0001");
        Entities.Booking don2 = TestDataBuilder.CreateBooking(khach, phong, "HS-A-0002");
        db.AddRange(khach, coSo, phong, don1, don2);
        await db.SaveChangesAsync();
        db.Payments.Add(TestDataBuilder.CreatePayment(don1, status: PaymentStatus.PAID));
        db.Payments.Add(TestDataBuilder.CreatePayment(don2, status: PaymentStatus.PENDING));
        await db.SaveChangesAsync();

        IAdminPaymentService service = new AdminPaymentService(db);

        PagedResultDto<PaymentDto> daThu =
            await service.LayDanhSachAsync((int)PaymentStatus.PAID, 1, 10, default);
        PagedResultDto<PaymentDto> tatCa =
            await service.LayDanhSachAsync(null, 1, 10, default);

        Assert.Equal(1, daThu.TotalItems);
        Assert.Equal(2, tatCa.TotalItems);
    }

    [Fact]
    public async Task LayDanhSachAdmin_TrangThaiNgoaiEnum_TranLoi400()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        IAdminPaymentService service = new AdminPaymentService(db);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.LayDanhSachAsync(99, 1, 10, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }
}