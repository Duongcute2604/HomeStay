using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Admin;
using StayEasy.Tests.Common;
using StayEasy.Tests.Helpers;
using Xunit;

namespace StayEasy.Tests.Services.Admin;

/// <summary>
/// Kiểm thử số liệu thống kê (Bước 15).
///
/// Ba nguyên tắc dễ làm sai nhất, mỗi nguyên tắc ít nhất 1 test:
/// 1. **Doanh thu chỉ tính đơn `COMPLETED`** — tính cả đơn đang chờ là ra doanh
///    thu ảo, mà khách còn hủy được.
/// 2. **Tỷ lệ lấp đầy chỉ tính đơn khách đã thực sự ở** (`CHECKED_IN`,
///    `COMPLETED`) và cắt đúng theo khoảng thống kê.
/// 3. **Tháng không có dữ liệu vẫn phải có mặt** trong biểu đồ (giá trị 0).
///
/// Ngày tháng trong test tính tương đối so với `DateTime.Now` vì các quy tắc
/// này phụ thuộc "tháng hiện tại" — dùng ngày cố định sẽ hỏng theo thời gian.
/// </summary>
public class AdminDashboardServiceTests : IDisposable
{
    private readonly StayEasyDbContext _db;
    private readonly AdminDashboardService _service;

    public AdminDashboardServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _service = new AdminDashboardService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ---------------- Tổng quan ----------------

    [Fact]
    public async Task TongQuan_DemDungDonKhachVaPhong()
    {
        await TaoCoSoVaPhongAsync(soPhong: 3);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayThangTruoc(5), tra: NgayThangTruoc(7), tien: 900_000m);
        await TaoDonAsync(BookingStatus.PENDING, nhan: NgayTrongThangNay(3), tra: NgayTrongThangNay(5), tien: 500_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        Assert.Equal(2, result.TongQuan.TongDon);
        Assert.Equal(3, result.TongQuan.TongPhong);
        // Cả 2 khách đều CUSTOMER nên TongKhach tính cả 2 (không đếm Admin).
        Assert.Equal(2, result.TongQuan.TongKhach);
    }

    [Fact]
    public async Task TongQuan_PhongDangCoKhach_ChiDemPhongOCCUPIED()
    {
        await TaoCoSoVaPhongAsync(soPhong: 4);
        // `DbSet` không bảo đảm thứ tự nên phải `ToList()` trước khi lấy theo chỉ số.
        List<Room> danhSach = _db.Rooms.ToList();
        danhSach[1].Status = RoomStatus.OCCUPIED;
        danhSach[2].Status = RoomStatus.CLEANING;
        await _db.SaveChangesAsync();

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        Assert.Equal(1, result.TongQuan.PhongDangCoKhach);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(28)]
    public void NgayTrongThangNay_LuonRoiTrongThangHienTai(int ngay)
    {
        DateTime thucTe = NgayTrongThangNay(ngay);

        // Đây là hợp đồng mà cả nhóm test "doanh thu tháng này" dựa vào. Trước khi
        // có hàm này, test dùng "hôm nay ± N ngày" và đỏ vào đêm cuối tháng —
        // đúng cái đã xảy ra khi chuyển từ 30/09 sang 01/10.
        Assert.Equal(DateTime.Now.Year, thucTe.Year);
        Assert.Equal(DateTime.Now.Month, thucTe.Month);
        Assert.Equal(ngay, thucTe.Day);
    }

    // ---------------- Doanh thu ----------------

    [Fact]
    public async Task DoanhThu_ChiTinhDonCOMPLETED_KeDonChoVaBiHuy()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTrongThangNay(5), tra: NgayTrongThangNay(7), tien: 1_000_000m);
        await TaoDonAsync(BookingStatus.PENDING, nhan: NgayTrongThangNay(4), tra: NgayTrongThangNay(6), tien: 700_000m);
        await TaoDonAsync(BookingStatus.CANCELLED, nhan: NgayTrongThangNay(4), tra: NgayTrongThangNay(6), tien: 300_000m);
        await TaoDonAsync(BookingStatus.REJECTED, nhan: NgayTrongThangNay(4), tra: NgayTrongThangNay(6), tien: 200_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        // 1.000.000 (COMPLETED) — KHÔNG cộng 700.000 + 300.000 + 200.000.
        Assert.Equal(1_000_000m, result.TongQuan.DoanhThuThangNay);
    }

    [Fact]
    public async Task DoanhThu_TheoThang_DungDonDaTraTrongThangDo()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);
        // Trả phòng tháng trước → dồn vào cột tháng trước, không phải tháng này.
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayThangTruoc(5), tra: NgayThangTruoc(7), tien: 800_000m);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTrongThangNay(5), tra: NgayTrongThangNay(7), tien: 1_200_000m);

        DashboardDto result = await _service.LaySoLieuAsync(3, 30, default);

        Assert.Equal(1_200_000m, result.TheoThang[2].DoanhThu);
        Assert.Equal(0m, result.TheoThang[0].DoanhThu);
    }

    [Fact]
    public async Task DoanhThu_TheoThang_ThangRongVanCoMatDeBieuDoKhongTut()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTrongThangNay(5), tra: NgayTrongThangNay(7), tien: 500_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        // Đủ 6 tháng dù chỉ 1 tháng có dữ liệu — bỏ tháng rỗng thì trục ngang
        // của biểu đồ bị tụt mất tháng, người đọc tưởng tháng đó không tồn tại.
        Assert.Equal(6, result.TheoThang.Count);
        Assert.All(result.TheoThang, thang => Assert.False(string.IsNullOrWhiteSpace(thang.Thang)));
    }

    [Fact]
    public async Task SoDonTheoThang_DemTheoThangTaoDon()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);
        await TaoDonAsync(BookingStatus.CANCELLED, nhan: NgayTrongThangNay(4), tra: NgayTrongThangNay(6), tien: 300_000m);
        await TaoDonAsync(BookingStatus.PENDING, nhan: NgayTrongThangNay(3), tra: NgayTrongThangNay(5), tien: 300_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        // Cả 2 đơn tạo trong tháng này, kể cả đơn đã hủy.
        Assert.Equal(2, result.TongQuan.DonThangNay);
        Assert.Equal(2, result.TheoThang[^1].SoDon);
    }

    // ---------------- Tỷ lệ lấp đầy ----------------

    [Fact]
    public async Task TyLeLapDay_DonDaO_ChiemDungSoDem()
    {
        await TaoCoSoVaPhongAsync(soPhong: 2);
        // 1 đơn 3 đêm (COMPLETED) + 1 đơn 2 đêm (CHECKED_IN) trong 30 ngày.
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTuHomNay(-10), tra: NgayTuHomNay(-7), tien: 900_000m);
        await TaoDonAsync(BookingStatus.CHECKED_IN, nhan: NgayTuHomNay(-5), tra: NgayTuHomNay(-3), tien: 700_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        Assert.Equal(5, result.DemDaBan);
        Assert.Equal(60, result.DemTongCong);
        Assert.Equal(0.0833, result.TyLeLapDay, 4);
    }

    [Fact]
    public async Task TyLeLapDay_DonMoiDatKhongTinh_PhongChuaBiChiem()
    {
        await TaoCoSoVaPhongAsync(soPhong: 2);
        // Đơn PENDING / CONFIRMED: phòng còn trống, khách chưa ở.
        await TaoDonAsync(BookingStatus.PENDING, nhan: NgayTuHomNay(-5), tra: NgayTuHomNay(-2), tien: 900_000m);
        await TaoDonAsync(BookingStatus.CONFIRMED, nhan: NgayTuHomNay(-4), tra: NgayTuHomNay(-1), tien: 900_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        Assert.Equal(0, result.DemDaBan);
        Assert.Equal(0d, result.TyLeLapDay);
    }

    [Fact]
    public async Task TyLeLapDay_DonTramBienCatDungTheoKhoang()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);
        // Đơn 10 đêm (từ 10 ngày trước tới hôm nay) nhưng khoảng thống kê chỉ
        // 5 ngày cuối → chỉ tính phần nằm trong khoảng là 4 đêm, không phải 10.
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTuHomNay(-10), tra: NgayTuHomNay(0), tien: 900_000m);

        DashboardDto result = await _service.LaySoLieuAsync(6, 5, default);

        Assert.Equal(4, result.DemDaBan);
    }

    [Theory]
    [InlineData(1, 10, 1, 10, 9)]    // đơn trùng khít khoảng → 9 ngày
    [InlineData(10, 20, 1, 10, 0)]   // đơn bắt đầu đúng ngày cuối khoảng → 0 ngày trong khoảng
    [InlineData(1, 20, 5, 10, 5)]    // đơn 20 ngày, khoảng chỉ 5 ngày giữa → cắt còn 5
    [InlineData(1, 10, 11, 20, 0)]   // nằm ngoài khoảng → 0
    [InlineData(1, 10, 20, 10, 0)]   // khoảng lộn về trước → 0
    [InlineData(5, 5, 1, 10, 0)]     // đơn 0 đêm → 0
    public void DemSoNgayTrongKhoang_CatHaiDauVeKhoang(
        int nhan, int tra, int tu, int den, int kyVong)
    {
        int thucTe = AdminDashboardService.DemSoNgayTrongKhoang(
            new DateTime(2026, 10, nhan), new DateTime(2026, 10, tra),
            new DateTime(2026, 10, tu), new DateTime(2026, 10, den));

        Assert.Equal(kyVong, thucTe);
    }

    [Fact]
    public void DemSoNgayTrongKhoang_GioNhan14hGioTra12h_TinhDungSoDem()
    {
        // Day la ca da lam hong so lieu that: 14:00 ngay 9 -> 12:00 ngay 11 la
        // 2 dem (dem 9, dem 10), nhung `(den - tu).Days` ra 1 vi 46 gio bi cat
        // cut. Test khac dung du lieu 00:00 nen khong bao gio bat duoc loi nay.
        int thucTe = AdminDashboardService.DemSoNgayTrongKhoang(
            new DateTime(2026, 10, 9, 14, 0, 0),
            new DateTime(2026, 10, 11, 12, 0, 0),
            new DateTime(2026, 10, 1),
            new DateTime(2026, 10, 31));

        Assert.Equal(2, thucTe);
    }

    [Fact]
    public void TinhTyLeLapDay_KhongCoPhong_TraVe0KhongChiaCho0()
    {
        (double tyLe, int daBan, int tongCong) = AdminDashboardService.TinhTyLeLapDay(0, 0, 30);

        // Hệ thống chưa có phòng: tỷ lệ 0 chứ không phải lỗi chia cho 0.
        Assert.Equal(0d, tyLe);
        Assert.Equal(0, tongCong);
    }

    // ---------------- Trạng thái phòng & top phòng ----------------

    [Fact]
    public async Task TrangThaiPhong_LuuDuCa5TrangThaiKeCa0Phong()
    {
        await TaoCoSoVaPhongAsync(soPhong: 2);
        _db.Rooms.ToList()[0].Status = RoomStatus.MAINTENANCE;
        await _db.SaveChangesAsync();

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        // Biểu đồ tròn cần đủ 5 mảng, thiếu trạng thái nào thì chú giải khó đọc.
        Assert.Equal(5, result.TrangThaiPhong.Count);
        Assert.Equal(1, result.TrangThaiPhong.Single(t => t.TrangThai == RoomStatus.MAINTENANCE).SoPhong);
        Assert.Equal(0, result.TrangThaiPhong.Single(t => t.TrangThai == RoomStatus.OCCUPIED).SoPhong);
    }

    [Fact]
    public async Task TopPhong_XepTheoDoanhThuGiamDanVaChiLayDaHoanThanh()
    {
        Location coSo = await TaoCoSoVaPhongAsync(soPhong: 2);
        // Phòng 1: 2 đơn hoàn thành. Phòng 2: 1 đơn hoàn thành + 1 đơn chờ.
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTuHomNay(-30), tra: NgayTuHomNay(-28), tien: 500_000m, soPhong: 0);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTuHomNay(-20), tra: NgayTuHomNay(-18), tien: 400_000m, soPhong: 0);
        await TaoDonAsync(BookingStatus.COMPLETED, nhan: NgayTuHomNay(-10), tra: NgayTuHomNay(-8), tien: 1_000_000m, soPhong: 1);
        await TaoDonAsync(BookingStatus.PENDING, nhan: NgayTuHomNay(-2), tra: NgayTuHomNay(1), tien: 9_000_000m, soPhong: 1);

        DashboardDto result = await _service.LaySoLieuAsync(6, 30, default);

        TopRoomDto caoNhat = result.TopPhong[0];
        Assert.Equal("Phòng 2", caoNhat.TenPhong);
        Assert.Equal(coSo.Name, caoNhat.TenCoSo);
        Assert.Equal(1_000_000m, caoNhat.DoanhThu);
        // Đơn PENDING 9.000.000 KHÔNG được tính vào doanh thu.
        Assert.Equal(1, caoNhat.SoDon);
    }

    [Fact]
    public async Task ThongSoLieu_TraVeKhoangNgayDangThongKe()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);

        DashboardDto result = await _service.LaySoLieuAsync(6, 7, default);

        // 7 ngày gần nhất tính cả hôm nay: hôm nay lùi 6 ngày.
        Assert.Equal(DateTime.Now.Date.AddDays(-6).ToString("yyyy-MM-dd"), result.TuNgay);
        Assert.Equal(DateTime.Now.Date.ToString("yyyy-MM-dd"), result.DenNgay);
    }

    [Fact]
    public async Task SoThangVaSoNgayQuaGioiHan_TuChuanVeMacDinh()
    {
        await TaoCoSoVaPhongAsync(soPhong: 1);

        // 0 và 9999 đều vô nghĩa — phải tự chặn thay vì tin client.
        DashboardDto result = await _service.LaySoLieuAsync(0, 9999, default);

        Assert.Equal(6, result.TheoThang.Count);
        Assert.Equal(30, result.DemTongCong);
    }

    // ---------------- Dữ liệu mẫu ----------------

    /// <summary>Dựng cơ sở + N phòng, trả về cơ sở để test gắn thêm thông tin.</summary>
    private async Task<Location> TaoCoSoVaPhongAsync(int soPhong)
    {
        Location coSo = new()
        {
            Name = "Homestay Hưng Yên",
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Trần Hưng Đạo",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Locations.Add(coSo);

        for (int i = 0; i < soPhong; i++)
        {
            _db.Rooms.Add(new Entities.Room
            {
                Location = coSo,
                Name = $"Phòng {i + 1}",
                RoomNumber = $"10{i + 1}",
                RoomType = RoomType.COZY,
                Capacity = 2,
                PricePerHour = 90_000m,
                PricePerDay = 550_000m,
                Status = RoomStatus.AVAILABLE,
                CreatedAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync();
        return coSo;
    }

    /// <summary>
    /// Ngày thứ <paramref name="ngay"/> của **tháng hiện tại**.
    /// </summary>
    /// <remarks>
    /// Vì sao không dùng `hôm nay ± N ngày`: ngày 1 tháng 10 thì "hôm nay − 5 ngày"
    /// rơi vào tháng 9, mà quy tắc "doanh thu tháng này" thì theo tháng hiện tại ⇒ test
    /// đỏ đúng vào đêm cuối tháng. Ô nhập 1..7 luôn nằm trong mọi tháng (tháng có ít
    /// nhất 28 ngày), nên tháng nào chạy cũng cho kết quả như nhau.
    /// </remarks>
    private static DateTime NgayTrongThangNay(int ngay)
    {
        DateTime dauThang = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        return dauThang.AddDays(ngay - 1);
    }

    /// <summary>
    /// Ngày cách <paramref name="soNgay"/> ngày so với hôm nay.
    /// </summary>
    /// <remarks>
    /// Dùng cho các quy tắc **không** phụ thuộc tháng (ví dụ tỷ lệ lấp đầy trong
    /// 30 ngày), nên lệch vài ngày sang tháng kề vẫn không đổi kết quả.
    /// </remarks>
    private static DateTime NgayTuHomNay(int soNgay)
    {
        return DateTime.Now.Date.AddDays(soNgay);
    }

    /// <summary>Ngày thứ <paramref name="ngay"/> của tháng trước tháng hiện tại.</summary>
    private static DateTime NgayThangTruoc(int ngay)
    {
        DateTime dauThang = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1).AddMonths(-1);
        return dauThang.AddDays(ngay - 1);
    }

    /// <summary>
    /// Tạo 1 khách mới + 1 đơn.
    /// </summary>
    /// <remarks>
    /// <paramref name="nhan"/> và <paramref name="tra"/> là **ngày tuyệt đối**, do
    /// test truyền vào qua <see cref="NgayTrongThangNay"/> / <see cref="NgayThangTruoc"/>
    /// chứ không tự tính từ hôm nay — lý do xem ở <see cref="NgayTrongThangNay"/>.
    /// </remarks>

    private async Task<Booking> TaoDonAsync(
        BookingStatus trangThai,
        DateTime nhan,
        DateTime tra,
        decimal tien,
        int soPhong = 0)
    {
        User khach = new()
        {
            FullName = $"Khách {Guid.NewGuid():N}"[..20],
            Email = $"{Guid.NewGuid():N}@test.com",
            PasswordHash = "fake:123456",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(khach);

        Entities.Room phong = _db.Rooms.Local.ElementAt(soPhong);

        Booking don = new()
        {
            Code = $"HS-{Guid.NewGuid():N}"[..12],
            User = khach,
            Room = phong,
            BookingType = BookingType.DAY,
            CheckIn = nhan,
            CheckOut = tra,
            GuestCount = 2,
            TotalAmount = tien,
            PricePerDaySnapshot = tien,
            Status = trangThai,
            // `CreatedAt` đặt theo `CheckIn` để test "số đơn theo tháng tạo" có dữ liệu.
            CreatedAt = nhan,
        };

        _db.Bookings.Add(don);
        await _db.SaveChangesAsync();
        return don;
    }
}
