using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Admin;
using HomeStay.Services.Reviews;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;
using Xunit;

namespace HomeStay.Tests.Services.Admin;

/// <summary>
/// Kiểm thử đánh giá & nhận xét (Bước 16).
///
/// Năm quy tắc dễ làm sai nhất, mỗi quy tắc ít nhất 1 test:
/// 1. **Chỉ đơn `COMPLETED` của chính mình** mới được đánh giá.
/// 2. **Mỗi đơn chỉ 1 đánh giá** — code trả 409, CSDL có unique index chặn nốt.
/// 3. **Điểm phòng phải tính lại** sau mọi thay đổi, và đánh giá bị ẩn thì
///    **không** được tính vào điểm.
/// 4. Khách **không** sửa/xoá được đánh giá của mình (chỉ Admin).
/// 5. Tính điểm lại từ đầu nên tự sửa được mọi sai lệch, kể cả khi xoá.
/// </summary>
public class ReviewServiceTests : IDisposable
{
    private readonly HomeStayDbContext _db;
    private readonly ReviewService _service;
    private readonly ReviewScorer _scorer;
    private readonly AdminReviewService _adminService;

    public ReviewServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _scorer = new ReviewScorer(_db);
        _service = new ReviewService(_db, _scorer);
        _adminService = new AdminReviewService(_db, _scorer);
    }

    public void Dispose() => _db.Dispose();

    // ---------------- Khách ghi đánh giá ----------------

    [Fact]
    public async Task TaoDanhGia_DonHoanThanh_GhiVaTinhLaiDiemPhong()
    {
        (Booking don, Room phong, _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();

        MyReviewDto result = await _service.TaoDanhGiaAsync(
            don.UserId, don.Code, new CreateReviewRequest { Rating = 4, Comment = "  Sạch, ồn  " },
            CancellationToken.None);

        Assert.Equal(4, result.Rating);
        // Nhận xét được cắt khoảng trắng thừa trước khi lưu.
        Assert.Equal("Sạch, ồn", result.Comment);

        Review daLuu = await _db.Reviews.SingleAsync();
        Assert.Equal(don.Id, daLuu.BookingId);
        Assert.Equal(phong.Id, daLuu.RoomId);
        Assert.False(daLuu.IsHidden);

        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(1, phong.RatingCount);
        Assert.Equal(4m, phong.RatingAvg);
    }

    [Fact]
    public async Task TaoDanhGia_NhanXetRong_LuuNullThayViChuoiTrong()
    {
        (Booking don, Room _, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();

        MyReviewDto result = await _service.TaoDanhGiaAsync(
            don.UserId, don.Code, new CreateReviewRequest { Rating = 5, Comment = "    " },
            CancellationToken.None);

        // Lưu "   " thì giao diện hiện một khối trống và bộ lọc "có nhận xét"
        // nhận nhầm là có nội dung.
        Assert.Null(result.Comment);
        Assert.Null((await _db.Reviews.SingleAsync()).Comment);
    }

    [Theory]
    [InlineData(BookingStatus.PENDING)]
    [InlineData(BookingStatus.CONFIRMED)]
    [InlineData(BookingStatus.CHECKED_IN)]
    [InlineData(BookingStatus.CANCELLED)]
    [InlineData(BookingStatus.REJECTED)]
    public async Task TaoDanhGia_DonChuaHoanThanh_ThrowConflict(BookingStatus trangThai)
    {
        (Booking don, Room _, User _) = await TaoDuLieu();
        don.Status = trangThai;
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            _service.TaoDanhGiaAsync(
                don.UserId, don.Code, new CreateReviewRequest { Rating = 5 },
                CancellationToken.None));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        // Thông báo phải nói rõ đơn đang ở trạng thái nào, Admin/khách biết phải
        // làm gì tiếp thay vì chỉ thấy "không được".
        Assert.Contains(BookingStatusLabels.Ten(trangThai), loi.Message);
        Assert.Empty(await _db.Reviews.ToListAsync());
    }

    [Fact]
    public async Task TaoDanhGia_DonCuaNguoiKhac_ThrowNotFound()
    {
        (Booking don, Room _, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        User nguoiKhac = new()
        {
            FullName = "Người Khác",
            Email = "nguoikhac@test.com",
            PasswordHash = "fake:123456",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
        };
        await _db.SaveChangesAsync();

        // 404 chứ không phải 403: báo 403 là lộ mã đơn đó có tồn tại.
        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            _service.TaoDanhGiaAsync(
                nguoiKhac.Id, don.Code, new CreateReviewRequest { Rating = 5 },
                CancellationToken.None));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        Assert.Empty(await _db.Reviews.ToListAsync());
    }

    [Fact]
    public async Task TaoDanhGia_MaDonKhongTonTai_ThrowNotFound()
    {
        (_, _, User khach) = await TaoDuLieu();
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            _service.TaoDanhGiaAsync(
                khach.Id, "HS-999999-0000", new CreateReviewRequest { Rating = 5 },
                CancellationToken.None));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    [Fact]
    public async Task TaoDanhGia_DonDaCoDanhGia_ThrowConflict()
    {
        (Booking don, Room phong, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();
        _db.Reviews.Add(TestDataBuilder.CreateReview(don, 4));
        await _db.SaveChangesAsync();

        decimal diemTruocKhiThu = (await _db.Rooms.SingleAsync(p => p.Id == phong.Id)).RatingAvg;
        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            _service.TaoDanhGiaAsync(
                don.UserId, don.Code, new CreateReviewRequest { Rating = 1 },
                CancellationToken.None));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Assert.Contains("đã đánh giá", loi.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Single(await _db.Reviews.ToListAsync());

        // Điểm phòng phải giữ nguyên so với trước khi gọi — lần ghi bị chặn thì
        // không được đụng vào điểm. So sánh kiểu này đúng hơn so với một con số
        // viết cứng, vì không phụ thuộc việc ai đã tính điểm trước đó.
        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(diemTruocKhiThu, phong.RatingAvg);
    }

    [Fact]
    public async Task TaoDanhGia_ThemNhieuDanhGia_DiemPhongLaTrungBinhTatCa()
    {
        (Booking don1, Room phong, User khach) = await TaoDuLieu();
        don1.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();

        // 2 đơn nữa của cùng khách trên cùng phòng, cùng đã hoàn tất.
        Booking don2 = await DonMoiAsync(phong, khach, "HS-2", BookingStatus.COMPLETED);
        Booking don3 = await DonMoiAsync(phong, khach, "HS-3", BookingStatus.COMPLETED);
        await _db.SaveChangesAsync();

        await _service.TaoDanhGiaAsync(don1.UserId, don1.Code, new CreateReviewRequest { Rating = 5 }, default);
        await _service.TaoDanhGiaAsync(don2.UserId, don2.Code, new CreateReviewRequest { Rating = 4 }, default);
        await _service.TaoDanhGiaAsync(don3.UserId, don3.Code, new CreateReviewRequest { Rating = 2 }, default);

        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        // (5 + 4 + 2) / 3 = 3,67
        Assert.Equal(3, phong.RatingCount);
        Assert.Equal(3.67m, phong.RatingAvg);
    }

    // ---------------- Admin ẩn / xoá ----------------

    [Fact]
    public async Task AdminAnDanhGia_DanhGiaAnKhongConTinhVaoDiem()
    {
        (Booking don1, Room phong, User khach) = await TaoDuLieu();
        don1.Status = BookingStatus.COMPLETED;
        Booking don2 = await DonMoiAsync(phong, khach, "HS-2", BookingStatus.COMPLETED);
        await _db.SaveChangesAsync();

        await _service.TaoDanhGiaAsync(don1.UserId, don1.Code, new CreateReviewRequest { Rating = 5 }, default);
        await _service.TaoDanhGiaAsync(don2.UserId, don2.Code, new CreateReviewRequest { Rating = 2 }, default);

        Review canAn = await _db.Reviews.SingleAsync(r => r.BookingId == don1.Id);
        ReviewVisibilityDto result = await _adminService.DoiTrangThaiHienThiAsync(
            canAn.Id, true, default);

        Assert.True(result.IsHidden);
        // Ẩn đánh giá 5 sao thì chỉ còn lại đánh giá 2 sao → điểm = 2.
        Assert.Equal(1, result.PhongSoDanhGia);
        Assert.Equal(2m, result.PhongDiemTrungBinh);

        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(2m, phong.RatingAvg);
    }

    [Fact]
    public async Task AdminHienLaiDanhGia_DiemPhongTangTroLai()
    {
        (Booking don, Room phong, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();
        _db.Reviews.Add(TestDataBuilder.CreateReview(don, 5));
        await _db.SaveChangesAsync();

        Review danhGia = await _db.Reviews.SingleAsync();
        await _adminService.DoiTrangThaiHienThiAsync(danhGia.Id, true, default);
        ReviewVisibilityDto khoiPhuc = await _adminService.DoiTrangThaiHienThiAsync(
            danhGia.Id, false, default);

        Assert.False(khoiPhuc.IsHidden);
        Assert.Equal(5m, khoiPhuc.PhongDiemTrungBinh);
        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(5m, phong.RatingAvg);
    }

    [Fact]
    public async Task AdminXoaDanhGia_BanGhiBiXoaVaDiemTinhLai()
    {
        (Booking don1, Room phong, User khach) = await TaoDuLieu();
        don1.Status = BookingStatus.COMPLETED;
        Booking don2 = await DonMoiAsync(phong, khach, "HS-2", BookingStatus.COMPLETED);
        await _db.SaveChangesAsync();

        await _service.TaoDanhGiaAsync(don1.UserId, don1.Code, new CreateReviewRequest { Rating = 5 }, default);
        await _service.TaoDanhGiaAsync(don2.UserId, don2.Code, new CreateReviewRequest { Rating = 3 }, default);

        Review canXoa = await _db.Reviews.SingleAsync(r => r.BookingId == don1.Id);
        ReviewVisibilityDto result = await _adminService.XoaAsync(canXoa.Id, default);

        Assert.Equal(1, result.PhongSoDanhGia);
        Assert.Equal(3m, result.PhongDiemTrungBinh);
        Assert.Empty(await _db.Reviews.Where(r => r.Id == canXoa.Id).ToListAsync());
    }

    [Fact]
    public async Task AdminXoaDanhGia_PhongHetDanhGia_DiemVe0KhongChiaCho0()
    {
        (Booking don, Room phong, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();
        await _service.TaoDanhGiaAsync(
            don.UserId, don.Code, new CreateReviewRequest { Rating = 5 }, default);

        Review danhGia = await _db.Reviews.SingleAsync();
        ReviewVisibilityDto result = await _adminService.XoaAsync(danhGia.Id, default);

        Assert.Equal(0, result.PhongSoDanhGia);
        Assert.Equal(0m, result.PhongDiemTrungBinh);
        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(0m, phong.RatingAvg);
    }

    [Fact]
    public async Task AdminThaoTacDanhGiaKhongTonTai_ThrowNotFound()
    {
        await Assert.ThrowsAsync<AppException>(() =>
            _adminService.DoiTrangThaiHienThiAsync(999, true, default));
        await Assert.ThrowsAsync<AppException>(() =>
            _adminService.XoaAsync(999, default));
    }

    [Fact]
    public async Task AdminXoaDanhGiaAn_RoomCungKhongDoiDiem()
    {
        (Booking don, Room phong, User _) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();
        _db.Reviews.Add(TestDataBuilder.CreateReview(don, 4));
        await _db.SaveChangesAsync();

        Review danhGia = await _db.Reviews.SingleAsync();
        await _adminService.DoiTrangThaiHienThiAsync(danhGia.Id, true, default);
        await _adminService.XoaAsync(danhGia.Id, default);

        // Đánh giá đã ẩn thì xoá cũng không làm điểm tụt thêm (đang là 0).
        phong = await _db.Rooms.SingleAsync(p => p.Id == phong.Id);
        Assert.Equal(0m, phong.RatingAvg);
    }

    // ---------------- Danh sách quản trị ----------------

    [Fact]
    public async Task LayDanhSach_LocTheoTrangThaiVaSao()
    {
        (Booking don1, Room phong, User khach) = await TaoDuLieu();
        don1.Status = BookingStatus.COMPLETED;
        Booking don2 = await DonMoiAsync(phong, khach, "HS-2", BookingStatus.COMPLETED);
        await _db.SaveChangesAsync();

        await _service.TaoDanhGiaAsync(don1.UserId, don1.Code, new CreateReviewRequest { Rating = 5 }, default);
        await _service.TaoDanhGiaAsync(don2.UserId, don2.Code, new CreateReviewRequest { Rating = 2 }, default);
        Review canAn = await _db.Reviews.SingleAsync(r => r.Rating == 5);
        await _adminService.DoiTrangThaiHienThiAsync(canAn.Id, true, default);

        PagedResultDto<AdminReviewDto> tatCa = await _adminService.LayDanhSachAsync(null, null, 1, 20, default);
        PagedResultDto<AdminReviewDto> dangAn = await _adminService.LayDanhSachAsync(true, null, 1, 20, default);


        Assert.Equal(2, tatCa.TotalItems);
        Assert.Equal(1, dangAn.TotalItems);
        Assert.Equal(5, dangAn.Items[0].Rating);
        Assert.True(dangAn.Items[0].IsHidden);
        Assert.Equal(1, dangAn.Page);
        Assert.Equal(20, dangAn.PageSize);
        Assert.Equal(1, dangAn.TotalPages);

        PagedResultDto<AdminReviewDto> haiSao = await _adminService.LayDanhSachAsync(null, 2, 1, 20, default);
        Assert.Single(haiSao.Items);
    }


    [Fact]
    public async Task LayDanhSach_PhanTranVaChuanThamSoVuaGioiHan()
    {
        (Booking don, Room phong, User khach) = await TaoDuLieu();
        don.Status = BookingStatus.COMPLETED;
        await _db.SaveChangesAsync();
        await _service.TaoDanhGiaAsync(
            don.UserId, don.Code, new CreateReviewRequest { Rating = 5 }, default);

        PagedResultDto<AdminReviewDto> result =
            await _adminService.LayDanhSachAsync(null, null, 0, 9999, default);

        // page=0 và pageSize=9999 đều vô nghĩa — phải tự chuẩn, không tin client.
        Assert.Equal(1, result.Page);
        Assert.Equal(20, result.PageSize);
        Assert.Single(result.Items);
    }

    [Fact]
    public async Task LayDanhSach_KhongCoDanhGia_TraVeRongKhongLoi()
    {
        PagedResultDto<AdminReviewDto> result =
            await _adminService.LayDanhSachAsync(null, null, 1, 20, default);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0, result.TotalPages);
    }

    // ---------------- Hàm thuần ----------------

    [Theory]
    [InlineData(new int[0], 0)]
    [InlineData(new[] { 5 }, 5)]
    [InlineData(new[] { 4, 5 }, 4.5)]
    [InlineData(new[] { 1, 2, 2 }, 1.67)]
    public void TinhDiemTrungBinh_TinhDungVaLamTronHaiChuSo(int[] diem, decimal kyVong)
    {
        Assert.Equal(kyVong, ReviewScorer.TinhDiemTrungBinh(diem));
    }

    [Fact]
    public void TinhDiemTrungBinh_DanhSachRong_TraVe0KhongChiaCho0()
    {
        Assert.Equal(0m, ReviewScorer.TinhDiemTrungBinh([]));
    }

    // ---------------- Dữ liệu mẫu ----------------

    /// <summary>Dựng khách + cơ sở + 1 phòng + 1 đơn `PENDING`, lưu và trả về.</summary>
    private async Task<(Booking Don, Room Phong, User Khach)> TaoDuLieu()
    {
        User khach = new()
        {
            FullName = "Trần Thị Mai",
            Email = "khachtest@test.com",
            PasswordHash = "fake:123456",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
        };
        _db.Users.Add(khach);

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

        Room phong = TestDataBuilder.CreateRoom(coSo, "101");
        _db.Rooms.Add(phong);

        Booking don = TestDataBuilder.CreateBooking(khach, phong, "HS-260930-0001");
        _db.Bookings.Add(don);

        await _db.SaveChangesAsync();
        return (don, phong, khach);
    }

    /// <summary>Tạo thêm một đơn của khách trên phòng đã có, mã đơn riêng.</summary>
    private async Task<Booking> DonMoiAsync(
        Room phong, User khach, string maDon, BookingStatus trangThai)
    {
        Booking don = TestDataBuilder.CreateBooking(khach, phong, maDon);
        don.Status = trangThai;
        _db.Bookings.Add(don);
        await _db.SaveChangesAsync();

        return don;
    }
}
