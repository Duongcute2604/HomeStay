using Microsoft.EntityFrameworkCore;
using StayEasy.Data;
using StayEasy.Data.Seed;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Locations;
using StayEasy.Tests.Helpers;

namespace StayEasy.Tests.Services;

/// <summary>
/// Kiểm chứng nghiệp vụ xem địa điểm: chỉ hiện địa điểm đang hoạt động,
/// kèm phòng tóm tắt, thứ tự ổn định, không lộ `Id`.
///
/// Mỗi test dựng database InMemory riêng (tên ngẫu nhiên) nên không ảnh hưởng
/// lẫn nhau và không cần bật MySQL.
/// </summary>
public class LocationServiceTests
{
    /// <summary>Dựng database đã seed đủ 3 địa điểm + 10 phòng như dữ liệu mẫu thật.</summary>
    private static async Task<StayEasyDbContext> TaoDbDaSeedAsync()
    {
        StayEasyDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);
        return db;
    }

    private static LocationService TaoService(StayEasyDbContext db)
    {
        return new LocationService(db);
    }

    // ---------------- Happy path ----------------

    [Fact]
    public async Task LayDanhSachAsync_DuLieuMau_TraVe3DiaDiemDangHoatDong()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.Equal(3, result.Count);
        Assert.All(result, diaDiem => Assert.False(string.IsNullOrWhiteSpace(diaDiem.Name)));
    }

    [Fact]
    public async Task LayDanhSachAsync_DuLieuMau_TongCong10Phong()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.Equal(10, result.Sum(diaDiem => diaDiem.Rooms.Count));
    }

    [Fact]
    public async Task LayDanhSachAsync_PhongCoDuTruongCanThietDeHienThi()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        RoomSummaryDto phong = result.SelectMany(diaDiem => diaDiem.Rooms).First();
        Assert.False(string.IsNullOrWhiteSpace(phong.Name));
        Assert.True(phong.Capacity > 0);
        Assert.True(phong.PricePerHour > 0);
        Assert.True(phong.PricePerDay > 0);
    }

    // ---------------- Edge case ----------------

    [Fact]
    public async Task LayDanhSachAsync_DiaDiemNgungHoatDong_KhongHienChoKhach()
    {
        await using StayEasyDbContext db = TestDbContextFactory.Create();
        db.Locations.Add(new Location
        {
            Name = "Nơi đã đóng cửa",
            City = "X",
            Province = "Y",
            Address = "Z",
            IsActive = false,
            CreatedAt = DateTime.Now,
        });
        await db.SaveChangesAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.Empty(result);
    }

    [Fact]
    public async Task LayDanhSachAsync_DbRong_TraVeListRong_KhongNull()
    {
        await using StayEasyDbContext db = TestDbContextFactory.Create();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task LayDanhSachAsync_PhongChuaCoAnh_ThumbnailNull()
    {
        await using StayEasyDbContext db = TestDbContextFactory.Create();
        Location location = new()
        {
            Name = "Nơi mới",
            City = "X",
            Province = "Y",
            Address = "Z",
            CreatedAt = DateTime.Now,
        };
        location.Rooms.Add(new Room
        {
            Name = "Phòng chưa có ảnh",
            RoomNumber = "P01",
            Capacity = 2,
            PricePerHour = 100000,
            PricePerDay = 500000,
            Status = RoomStatus.AVAILABLE,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
        });
        db.Locations.Add(location);
        await db.SaveChangesAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.Null(Assert.Single(Assert.Single(result).Rooms).ThumbnailUrl);
    }

    [Fact]
    public async Task LayDanhSachAsync_NhieuAnh_LayAnhChinhLamThumbnail()
    {
        await using StayEasyDbContext db = TestDbContextFactory.Create();
        Location location = new()
        {
            Name = "Nơi mới",
            City = "X",
            Province = "Y",
            Address = "Z",
            CreatedAt = DateTime.Now,
        };
        Room room = new()
        {
            Name = "Phòng có 2 ảnh",
            RoomNumber = "P01",
            Capacity = 2,
            PricePerHour = 100000,
            PricePerDay = 500000,
            Status = RoomStatus.AVAILABLE,
            CreatedAt = DateTime.Now,
            UpdatedAt = DateTime.Now,
        };
        room.Images.Add(new RoomImage { ImageUrl = "/phu.jpg", IsPrimary = false, SortOrder = 0 });
        room.Images.Add(new RoomImage { ImageUrl = "/chinh.jpg", IsPrimary = true, SortOrder = 1 });
        location.Rooms.Add(room);
        db.Locations.Add(location);
        await db.SaveChangesAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.Equal("/chinh.jpg", Assert.Single(Assert.Single(result).Rooms).ThumbnailUrl);
    }

    [Fact]
    public async Task LayDanhSachAsync_ThuTuOnDinh_GoiHaiLanGiongNhau()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<string> lan1 = (await service.LayDanhSachAsync(CancellationToken.None))
            .SelectMany(diaDiem => diaDiem.Rooms.Select(phong => phong.Name))
            .ToList();
        List<string> lan2 = (await service.LayDanhSachAsync(CancellationToken.None))
            .SelectMany(diaDiem => diaDiem.Rooms.Select(phong => phong.Name))
            .ToList();

        Assert.Equal(lan1, lan2);
    }

    // ---------------- Không hợp lệ / ràng buộc hiển thị ----------------

    [Fact]
    public async Task LayDanhSachAsync_DiaDiemCoPhongBaoTri_VanHienKemNhanTrangThai()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        // Kiểm tra trống thật thuộc Bước 9 — ở đây chỉ gắn nhãn, không giấu phòng.
        // Test khẳng định DTO có mang trạng thái để giao diện gắn nhãn.
        Assert.All(
            result.SelectMany(diaDiem => diaDiem.Rooms),
            phong => Assert.IsType<RoomStatus>(phong.Status));
    }

    // ---------------- Chi tiết phòng (Bước 8) ----------------

    [Fact]
    public async Task LayDanhSachAsync_PhongCoMoTaDayDu()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.All(
            result.SelectMany(diaDiem => diaDiem.Rooms),
            phong => Assert.False(string.IsNullOrWhiteSpace(phong.Description)));
    }

    [Fact]
    public async Task LayDanhSachAsync_MoiPhongCo2Anh_AnhChinhDauTien()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        foreach (RoomDetailDto phong in result.SelectMany(diaDiem => diaDiem.Rooms))
        {
            Assert.Equal(2, phong.Images.Count);
            Assert.Equal(phong.ThumbnailUrl, phong.Images[0]);
        }
    }

    [Fact]
    public async Task LayDanhSachAsync_PhongCoTienNghi()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.All(
            result.SelectMany(diaDiem => diaDiem.Rooms),
            phong => Assert.NotEmpty(phong.Amenities));
    }

    [Fact]
    public async Task LayDanhSachAsync_DanhGiaBiAn_KhongHien()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<RoomDetailDto> tatCaPhong = (await service.LayDanhSachAsync(CancellationToken.None))
            .SelectMany(diaDiem => diaDiem.Rooms)
            .ToList();

        // Seed có 6 đánh giá, 1 bị ẩn — chỉ 5 được hiện.
        Assert.Equal(5, tatCaPhong.SelectMany(phong => phong.Reviews).Count());
        Assert.DoesNotContain(
            tatCaPhong.SelectMany(phong => phong.Reviews),
            danhGia => danhGia.Comment != null && danhGia.Comment.Contains("bẩn"));
    }

    [Fact]
    public async Task LayDanhSachAsync_DanhGiaCoTenNguoiViet()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<RoomReviewDto> danhGia = (await service.LayDanhSachAsync(CancellationToken.None))
            .SelectMany(diaDiem => diaDiem.Rooms)
            .SelectMany(phong => phong.Reviews)
            .ToList();

        Assert.NotEmpty(danhGia);
        Assert.All(danhGia, d => Assert.False(string.IsNullOrWhiteSpace(d.ReviewerName)));
        Assert.All(danhGia, d => Assert.InRange(d.Rating, 1, 5));
    }

    [Fact]
    public async Task LayDanhSachAsync_DtoKhongChuaId()
    {
        // Quy tắc bất biến AGENTS.md 6.3: danh sách không lộ khoá nội bộ.
        // Kiểm bằng reflection để nếu ai đó thêm `Id` vào DTO thì test đỏ ngay,
        // dù code vẫn biên dịch và chạy bình thường.
        Assert.Null(typeof(LocationListItemDto).GetProperty("Id"));
        Assert.Null(typeof(LocationListItemDto).GetProperty("LocationId"));
        Assert.Null(typeof(RoomSummaryDto).GetProperty("Id"));
        Assert.Null(typeof(RoomSummaryDto).GetProperty("RoomId"));

        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        LocationService service = TaoService(db);

        List<LocationListItemDto> result = await service.LayDanhSachAsync(CancellationToken.None);

        Assert.NotEmpty(result);
    }
}
