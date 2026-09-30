using Microsoft.EntityFrameworkCore;
using HomeStay.Data;
using HomeStay.Data.Seed;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Booking;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Data;

/// <summary>
/// Kiểm chứng dữ liệu mẫu vừa đủ số lượng, vừa đúng luật nghiệp vụ.
///
/// Vì sao không chỉ kiểm "có bao nhiêu bản ghi": dữ liệu mẫu sai luật thì lúc demo trước
/// GVHD mới phát hiện, mà lúc đó sửa cũng muộn. Sai luật ngay trong test là sửa được ngay.
/// </summary>
public class SeedDataTests
{
    [Fact]
    public async Task SeedAsync_LanDau_TaoDungDayDuSoLuong()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        Assert.Equal(4, await db.Users.CountAsync());
        Assert.Equal(3, await db.Locations.CountAsync());
        Assert.Equal(10, await db.Rooms.CountAsync());
        Assert.Equal(8, await db.Amenities.CountAsync());
        Assert.Equal(20, await db.RoomImages.CountAsync());
        Assert.Equal(15, await db.Bookings.CountAsync());
        Assert.Equal(6, await db.Reviews.CountAsync());
    }

    [Fact]
    public async Task DaCoDuLieuAsync_DatabaseRong_TraVeFalse()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();

        bool daCo = await SeedData.DaCoDuLieuAsync(db, CancellationToken.None);

        Assert.False(daCo);
    }

    [Fact]
    public async Task DaCoDuLieuAsync_SauKhiSeed_TraVeTrue()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        bool daCo = await SeedData.DaCoDuLieuAsync(db, CancellationToken.None);

        Assert.True(daCo);
    }

    [Fact]
    public async Task SeedAsync_ChayHaiLan_KhongNhanBanSao()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        await SeedData.SeedAsync(db, CancellationToken.None);

        Assert.Equal(4, await db.Users.CountAsync());
        Assert.Equal(10, await db.Rooms.CountAsync());
        Assert.Equal(15, await db.Bookings.CountAsync());
        Assert.Equal(6, await db.Reviews.CountAsync());
    }

    [Fact]
    public async Task SeedAsync_MatKhauChung_BCryptXacNhanDungChoMoiTaiKhoan()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<User> taiKhoanList = await db.Users.AsNoTracking().ToListAsync();

        Assert.All(taiKhoanList, x =>
            Assert.True(BCrypt.Net.BCrypt.Verify(DuLieuMau.MatKhauChung, x.PasswordHash), x.Email));
    }

    [Fact]
    public async Task SeedAsync_MaDonDuyNhatVaDungDinhDang()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking().ToListAsync();

        Assert.Equal(donList.Count, donList.Select(x => x.Code).Distinct().Count());
        Assert.All(donList, x => Assert.Matches("^HS-[0-9]{6}-[0-9]{4}$", x.Code));
    }

    [Fact]
    public async Task SeedAsync_CoDuySauTrangThaiDon()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking().ToListAsync();

        Assert.All(Enum.GetValues<BookingStatus>(), trangThai =>
            Assert.Contains(donList, x => x.Status == trangThai));
    }

    [Fact]
    public async Task SeedAsync_MoiPhongKhongCoHaiDonChongLich()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking().ToListAsync();
        List<string> chongLich = [];

        for (int i = 0; i < donList.Count; i++)
        {
            for (int j = i + 1; j < donList.Count; j++)
            {
                bool cungPhong = donList[i].RoomId == donList[j].RoomId;
                bool trungLich = donList[i].CheckIn < donList[j].CheckOut && donList[i].CheckOut > donList[j].CheckIn;

                if (cungPhong && trungLich)
                {
                    chongLich.Add($"{donList[i].Code} va {donList[j].Code}");
                }
            }
        }

        Assert.Empty(chongLich);
    }

    [Fact]
    public async Task SeedAsync_DonTheoGio_DuSoGioToiThieu()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking()
            .Where(x => x.BookingType == BookingType.HOUR).ToListAsync();

        Assert.NotEmpty(donList);
        Assert.All(donList, x => Assert.True(
            (x.CheckOut - x.CheckIn).TotalHours >= BookingRules.MinHoursForHourlyBooking,
            $"Đơn {x.Code} chỉ kéo dài {(x.CheckOut - x.CheckIn).TotalHours} giờ."));
    }

    [Fact]
    public async Task SeedAsync_KhachDatTruocItNhatHaiGio()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking().ToListAsync();

        Assert.All(donList, x => Assert.True(
            x.CheckIn >= x.CreatedAt.AddHours(BookingRules.MinHoursAdvanceNotice),
            $"Đơn {x.Code} chỉ đặt trước {(x.CheckIn - x.CreatedAt).TotalHours} giờ."));
    }

    [Fact]
    public async Task SeedAsync_SoKhachKhongVuotQuaSucChuaCuaPhong()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.Include(x => x.Room).AsNoTracking().ToListAsync();

        Assert.All(donList, x => Assert.True(
            x.GuestCount <= x.Room.Capacity,
            $"Đơn {x.Code} đặt {x.GuestCount} khách cho phòng chỉ chứa {x.Room.Capacity}."));
    }

    [Fact]
    public async Task SeedAsync_TienDonKhopVoiCongThucTinhTien()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.Include(x => x.Room).AsNoTracking().ToListAsync();

        Assert.All(donList, x => Assert.Equal(
            BookingCalculator.TinhTien(
                x.BookingType, x.Room.PricePerHour, x.Room.PricePerDay, x.CheckIn, x.CheckOut),
            x.TotalAmount));
    }

    [Fact]
    public async Task SeedAsync_LuuGiaPhongLucDatDeLichSuDonKhongBiBienDoi()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.Include(x => x.Room).AsNoTracking().ToListAsync();

        Assert.All(donList, x =>
        {
            Assert.Equal(x.Room.PricePerHour, x.PricePerHourSnapshot);
            Assert.Equal(x.Room.PricePerDay, x.PricePerDaySnapshot);
        });
    }

    [Fact]
    public async Task SeedAsync_DonRaiNhieuThang_DeBieuDoDoanhThuCoDuLieu()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.AsNoTracking().ToListAsync();
        int soThangKhacNhau = donList.Select(x => x.CreatedAt.ToString("yyyy-MM")).Distinct().Count();

        Assert.True(soThangKhacNhau >= 3, $"Đơn chỉ rải trên {soThangKhacNhau} tháng.");
    }

    [Fact]
    public async Task SeedAsync_MoiPhongDieuCoDungMotAnhDaiDien()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Room> phongList = await db.Rooms.Include(x => x.Images).AsNoTracking().ToListAsync();

        Assert.All(phongList, x => Assert.Equal(1, x.Images.Count(i => i.IsPrimary)));
        Assert.All(phongList, x => Assert.Equal(2, x.Images.Count));
    }

    [Fact]
    public async Task SeedAsync_CoDuLoaiPhongVaDuTrangThaiPhong()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Room> phongList = await db.Rooms.AsNoTracking().ToListAsync();

        Assert.Equal(3, phongList.Select(x => x.RoomType).Distinct().Count());
        Assert.Equal(5, phongList.Select(x => x.Status).Distinct().Count());
    }

    [Fact]
    public async Task SeedAsync_MoiPhongDieuLienKetNhieuHonMotTienNghi()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<RoomAmenity> lienKetList = await db.RoomAmenities.AsNoTracking().ToListAsync();

        Assert.All(
            lienKetList.GroupBy(x => x.RoomId),
            x => Assert.True(x.Count() >= 5, $"Phòng chỉ có {x.Count()} tiện nghi."));
    }

    [Fact]
    public async Task SeedAsync_LichSuTrangThaiKetThucDungTrangThaiHienTaiCuaDon()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Booking> donList = await db.Bookings.Include(x => x.StatusHistory).AsNoTracking().ToListAsync();

        Assert.All(donList, x => Assert.Equal(
            x.Status,
            x.StatusHistory.OrderBy(h => h.ChangedAt).Last().ToStatus));
    }

    [Fact]
    public async Task SeedAsync_MocThoiGianLichSuKhongBocRaHienTai()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        DateTime mocThoiGian = DateTime.Now;
        List<BookingStatusHistory> lichSuList = await db.BookingStatusHistory.AsNoTracking().ToListAsync();

        Assert.NotEmpty(lichSuList);
        Assert.All(lichSuList, x => Assert.True(x.ChangedAt <= mocThoiGian, $"Lịch sử đơn {x.BookingId} bị lệch tương lai."));
    }

    [Fact]
    public async Task SeedAsync_DanhGiaChiGheVaoDonDaHoanThanh()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Review> danhGiaList = await db.Reviews.Include(x => x.Booking).AsNoTracking().ToListAsync();

        Assert.Equal(6, danhGiaList.Count);
        Assert.All(danhGiaList, x => Assert.Equal(BookingStatus.COMPLETED, x.Booking.Status));
    }

    [Fact]
    public async Task SeedAsync_DiemPhongChiTinhTuDanhGiaChuaAn()
    {
        await using HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);

        List<Room> phongList = await db.Rooms.AsNoTracking().ToListAsync();
        List<Review> danhGiaList = await db.Reviews.AsNoTracking().ToListAsync();

        foreach (Room phong in phongList)
        {
            List<Review> hienThi = danhGiaList.Where(x => x.RoomId == phong.Id && !x.IsHidden).ToList();
            decimal kyVong = hienThi.Count == 0 ? 0m : Math.Round(hienThi.Sum(x => x.Rating) / (decimal)hienThi.Count, 2);

            Assert.Equal(hienThi.Count, phong.RatingCount);
            Assert.Equal(kyVong, phong.RatingAvg);
        }
    }
}
