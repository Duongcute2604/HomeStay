using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
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
/// Kiểm thử nghiệp vụ quản lý phòng của Admin.
///
/// Trọng tâm là hai quy tắc dễ sai nhất: xoá phòng đang có đơn, và sửa phòng
/// phải THAY TOÀN BỘ ảnh/tiện nghi chứ không cộng dồn.
/// </summary>
public class AdminRoomServiceTests
{
    private readonly StayEasyDbContext _db;
    private readonly AdminRoomService _service;

    public AdminRoomServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _service = new AdminRoomService(_db);
    }

    // ----- Tạo phòng -----

    [Fact]
    public async Task TaoAsync_DuLieuHopLe_TaoPhongVaGanAnhTienNgh()
    {
        Location coSo = await TaoCoSoAsync();
        _db.Amenities.AddRange(TaoTienNgh("Wifi"), TaoTienNgh("Máy pha cà phê"));
        await _db.SaveChangesAsync();
        int[] tienNghIds = _db.Amenities.Select(a => a.Id).ToArray();

        RoomRequest request = TaoRequest(coSo.Id, tienNghIds, "/images/cozy-1.jpg", "/images/cozy-2.jpg");

        AdminRoomDto result = await _service.TaoAsync(request, default);

        Assert.Equal("Phòng Cozy", result.Name);
        Assert.Equal("Homestay Hưng Yên", result.LocationName);
        Assert.Equal(RoomStatus.AVAILABLE, result.Status);

        Room phong = Assert.Single(await _db.Rooms.ToListAsync());
        Assert.Equal(2, await _db.RoomImages.CountAsync(a => a.RoomId == phong.Id));
        Assert.Equal(2, await _db.RoomAmenities.CountAsync(l => l.RoomId == phong.Id));
    }

    [Fact]
    public async Task TaoAsync_NhieuAnh_DatAnhDauTienLamAnhChinh()
    {
        // Ảnh chính là ảnh khách thấy trong danh sách tìm kiếm, nên thứ tự trong
        // form phải được giữ đúng — đây là điểm dễ sai nhất khi thêm ảnh mới.
        Location coSo = await TaoCoSoAsync();
        RoomRequest request = TaoRequest(coSo.Id, [], "/a.jpg", "/b.jpg", "/c.jpg");

        AdminRoomDto result = await _service.TaoAsync(request, default);

        Assert.Equal(new[] { "/a.jpg", "/b.jpg", "/c.jpg" }, result.Images.ToArray());

        List<RoomImage> anh = await _db.RoomImages.OrderBy(a => a.SortOrder).ToListAsync();
        Assert.True(anh[0].IsPrimary);
        Assert.False(anh[1].IsPrimary);
        Assert.False(anh[2].IsPrimary);
    }

    [Fact]
    public async Task TaoAsync_TienNghTrungLapChiGhiMotLan()
    {
        Location coSo = await TaoCoSoAsync();
        Amenity tienNgh = TaoTienNgh("Wifi");
        _db.Amenities.Add(tienNgh);
        await _db.SaveChangesAsync();

        RoomRequest request = TaoRequest(coSo.Id, [tienNgh.Id, tienNgh.Id]);

        await _service.TaoAsync(request, default);

        Assert.Equal(1, await _db.RoomAmenities.CountAsync());
    }

    [Fact]
    public async Task TaoAsync_CoSoKhongTonTai_ThrowBadRequest()
    {
        RoomRequest request = TaoRequest(999, []);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Empty(await _db.Rooms.ToListAsync());
    }

    [Fact]
    public async Task TaoAsync_TienNghKhongTonTai_ThrowBadRequest()
    {
        Location coSo = await TaoCoSoAsync();

        RoomRequest request = TaoRequest(coSo.Id, [999]);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-2)]
    public async Task TaoAsync_SoKhachKhongHopLe_ThrowBadRequest(int soKhach)
    {
        Location coSo = await TaoCoSoAsync();
        RoomRequest request = TaoRequest(coSo.Id, []);
        request.Capacity = soKhach;

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_GiaGioBangKhong_ThrowBadRequest()
    {
        Location coSo = await TaoCoSoAsync();
        RoomRequest request = TaoRequest(coSo.Id, []);
        request.PricePerHour = 0;

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_AnhVuotQuaGioiHan_ThrowBadRequest()
    {
        Location coSo = await TaoCoSoAsync();
        string[] anh = Enumerable
            .Range(0, AdminRules.MaxImagesPerRoom + 1)
            .Select(i => $"/anh-{i}.jpg")
            .ToArray();

        RoomRequest request = TaoRequest(coSo.Id, [], anh);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    // ----- Sửa phòng -----

    [Fact]
    public async Task SuaAsync_PhongTonTai_ThayToanBoAnhVaTienNgh()
    {
        Location coSo = await TaoCoSoAsync();
        Amenity cu = TaoTienNgh("Wifi");
        Amenity moi = TaoTienNgh("Bồn tắm nóng");
        _db.Amenities.AddRange(cu, moi);
        await _db.SaveChangesAsync();

        await _service.TaoAsync(TaoRequest(coSo.Id, [cu.Id], "/cu-1.jpg", "/cu-2.jpg"), default);
        int roomId = (await _db.Rooms.SingleAsync()).Id;

        RoomRequest sua = TaoRequest(coSo.Id, [moi.Id], "/moi-1.jpg");

        AdminRoomDto result = await _service.SuaAsync(roomId, sua, default);

        Assert.Equal(new[] { "/moi-1.jpg" }, result.Images.ToArray());
        Assert.Equal(new[] { moi.Id }, result.AmenityIds.ToArray());
        Assert.Equal(1, await _db.RoomImages.CountAsync(a => a.RoomId == roomId));
        Assert.Equal(1, await _db.RoomAmenities.CountAsync(l => l.RoomId == roomId));
    }

    [Fact]
    public async Task SuaAsync_PhongKhongTonTai_ThrowNotFound()
    {
        Location coSo = await TaoCoSoAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.SuaAsync(999, TaoRequest(coSo.Id, []), default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    [Fact]
    public async Task SuaAsync_DoiTenVaGia_CapNhatDungTruong()
    {
        Location coSo = await TaoCoSoAsync();
        await _service.TaoAsync(TaoRequest(coSo.Id, []), default);
        int roomId = (await _db.Rooms.SingleAsync()).Id;

        RoomRequest sua = TaoRequest(coSo.Id, []);
        sua.Name = "Phòng mới đổi tên";
        sua.PricePerDay = 999_000m;

        AdminRoomDto result = await _service.SuaAsync(roomId, sua, default);

        Assert.Equal("Phòng mới đổi tên", result.Name);
        Assert.Equal(999_000m, result.PricePerDay);
    }

    // ----- Đổi trạng thái -----

    [Fact]
    public async Task DoiTrangThaiAsync_PhongTonTai_DoiDungTrangThaiKhongDoiTruongKhac()
    {
        Location coSo = await TaoCoSoAsync();
        await _service.TaoAsync(TaoRequest(coSo.Id, []), default);
        int roomId = (await _db.Rooms.SingleAsync()).Id;
        string tenCu = (await _db.Rooms.SingleAsync()).Name;

        AdminRoomDto result = await _service.DoiTrangThaiAsync(
            roomId,
            new RoomStatusRequest { Status = RoomStatus.MAINTENANCE },
            default);

        Assert.Equal(RoomStatus.MAINTENANCE, result.Status);
        Assert.Equal(tenCu, result.Name);
    }

    [Fact]
    public async Task DoiTrangThaiAsync_PhongKhongTonTai_ThrowNotFound()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.DoiTrangThaiAsync(999, new RoomStatusRequest(), default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    // ----- Xoá phòng -----

    [Fact]
    public async Task XoaAsync_PhongKhongCoDon_XoaKemAnhVaTienNgh()
    {
        Location coSo = await TaoCoSoAsync();
        Amenity tienNgh = TaoTienNgh("Wifi");
        _db.Amenities.Add(tienNgh);
        await _db.SaveChangesAsync();
        await _service.TaoAsync(TaoRequest(coSo.Id, [tienNgh.Id], "/a.jpg"), default);
        int roomId = (await _db.Rooms.SingleAsync()).Id;

        await _service.XoaAsync(roomId, default);

        Assert.Empty(await _db.Rooms.ToListAsync());
        Assert.Empty(await _db.RoomImages.ToListAsync());
        Assert.Empty(await _db.RoomAmenities.ToListAsync());
    }

    [Fact]
    public async Task XoaAsync_PhongDangCoDon_ThrowBadRequestVaGiuNguyenPhong()
    {
        Location coSo = await TaoCoSoAsync();
        User khach = TestDataBuilder.CreateCustomer();
        _db.Users.Add(khach);
        await _db.SaveChangesAsync();
        await _service.TaoAsync(TaoRequest(coSo.Id, []), default);
        Room phong = await _db.Rooms.SingleAsync();
        _db.Bookings.Add(TestDataBuilder.CreateBooking(khach, phong));
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XoaAsync(phong.Id, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Single(await _db.Rooms.ToListAsync());
    }

    [Fact]
    public async Task XoaAsync_PhongKhongTonTai_ThrowNotFound()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XoaAsync(999, default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    // ----- Lấy danh sách -----

    [Fact]
    public async Task LayDanhSachAsync_AoAnhVaTienNgh_TraVeDungTenVaDanhSach()
    {
        Location coSo = await TaoCoSoAsync();
        Amenity tienNgh = TaoTienNgh("Wifi");
        _db.Amenities.Add(tienNgh);
        await _db.SaveChangesAsync();
        await _service.TaoAsync(TaoRequest(coSo.Id, [tienNgh.Id], "/a.jpg"), default);

        List<AdminRoomDto> result = await _service.LayDanhSachAsync(default);

        AdminRoomDto phong = Assert.Single(result);
        Assert.Equal("Phòng Cozy", phong.Name);
        Assert.Equal("Homestay Hưng Yên", phong.LocationName);
        Assert.Equal(new[] { "Wifi" }, phong.AmenityNames.ToArray());
    }

    private async Task<Location> TaoCoSoAsync()
    {
        Location coSo = new()
        {
            Name = "Homestay Hưng Yên",
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Trần Hưng Đạo",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync();

        return coSo;
    }

    private static Amenity TaoTienNgh(string ten)
    {
        return new Amenity { Name = ten, Icon = "wifi" };
    }

    private static RoomRequest TaoRequest(int locationId, int[] tienNghIds, params string[] anh)
    {
        return new RoomRequest
        {
            LocationId = locationId,
            Name = "Phòng Cozy",
            RoomNumber = "101",
            RoomType = RoomType.COZY,
            Capacity = 2,
            PricePerHour = 120_000m,
            PricePerDay = 850_000m,
            Description = "Phòng ấm cúng, hợp trốn phố",
            ImageUrls = anh.ToList(),
            AmenityIds = tienNghIds.ToList()
        };
    }
}
