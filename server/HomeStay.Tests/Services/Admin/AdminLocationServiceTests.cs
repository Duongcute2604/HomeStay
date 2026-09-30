using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Services.Admin;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;
using Xunit;

namespace HomeStay.Tests.Services.Admin;

/// <summary>
/// Kiểm thử nghiệp vụ quản lý cơ sở của Admin.
///
/// Theo AGENTS.md 5.3, mỗi nhóm hàm cần đủ 3 loại: happy path, edge case và
/// trường hợp không hợp lệ. Ở đây lỗi được kiểm chứng bằng `AppException.StatusCode`
/// chứ không chỉ kiểm tra "ném ra lỗi" — nói rõ client nhận 400 hay 404.
/// </summary>
public class AdminLocationServiceTests
{
    private readonly HomeStayDbContext _db;
    private readonly AdminLocationService _service;

    public AdminLocationServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _service = new AdminLocationService(_db);
    }

    // ----- Lấy danh sách -----

    [Fact]
    public async Task LayDanhSachAsync_CoBaCoSo_TraVeDungSoLuongVaSapXepTheoId()
    {
        _db.Locations.AddRange(
            TaoCoSo("Cơ sở A"),
            TaoCoSo("Cơ sở B"),
            TaoCoSo("Cơ sở C"));
        await _db.SaveChangesAsync();

        List<AdminLocationDto> result = await _service.LayDanhSachAsync(default);

        Assert.Equal(3, result.Count);
        Assert.Equal(new[] { "Cơ sở A", "Cơ sở B", "Cơ sở C" }, result.Select(c => c.Name).ToArray());
    }

    [Fact]
    public async Task LayDanhSachAsync_ChiCoCoSoNgungHoatDong_VanTraVeTatCa()
    {
        // Khác trang khách: Admin phải thấy cơ sở đã tắt để bật lại được.
        _db.Locations.Add(TaoCoSo("Cơ sở đã tắt", isActive: false));
        await _db.SaveChangesAsync();

        List<AdminLocationDto> result = await _service.LayDanhSachAsync(default);

        AdminLocationDto coSo = Assert.Single(result);
        Assert.False(coSo.IsActive);
    }

    [Fact]
    public async Task LayDanhSachAsync_KhongCoCoSoNao_TraVeDanhSachRong()
    {
        List<AdminLocationDto> result = await _service.LayDanhSachAsync(default);

        Assert.Empty(result);
    }

    [Fact]
    public async Task LayDanhSachAsync_CoSoBaPhong_TraVeDungTongSoPhong()
    {
        Location coSo = TaoCoSo("Cơ sở A");
        _db.Locations.Add(coSo);
        for (int i = 1; i <= 3; i++)
        {
            _db.Rooms.Add(TestDataBuilder.CreateRoom(coSo, roomNumber: $"10{i}"));
        }

        await _db.SaveChangesAsync();

        List<AdminLocationDto> result = await _service.LayDanhSachAsync(default);

        Assert.Equal(3, Assert.Single(result).TotalRooms);
    }

    // ----- Tạo cơ sở -----

    [Fact]
    public async Task TaoAsync_DuLieuHopLe_TaoVaChuanHoaTenVaDiaChi()
    {
        FacilityRequest request = new()
        {
            Name = "  Homestay Cà Phê  ",
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "  12 Đường Trần Hưng Đạo  ",
            IsActive = true
        };

        AdminLocationDto result = await _service.TaoAsync(request, default);

        Assert.Equal("Homestay Cà Phê", result.Name);
        Assert.Equal("12 Đường Trần Hưng Đạo", result.Address);
        Assert.Equal(0, result.TotalRooms);
        Assert.Single(await _db.Locations.ToListAsync());
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task TaoAsync_TenRong_ThrowBadRequest(string ten)
    {
        FacilityRequest request = TaoRequest(ten: ten);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_DiaChiRong_ThrowBadRequest()
    {
        FacilityRequest request = TaoRequest(address: "  ");

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_TenQuaDai_ThrowBadRequest()
    {
        FacilityRequest request = TaoRequest(ten: new string('a', AdminRules.MaxLocationNameLength + 1));

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(request, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_TenDungBienGioi_ThanhCong()
    {
        FacilityRequest request = TaoRequest(ten: new string('a', AdminRules.MaxLocationNameLength));

        AdminLocationDto result = await _service.TaoAsync(request, default);

        Assert.Equal(AdminRules.MaxLocationNameLength, result.Name.Length);
    }

    // ----- Sửa cơ sở -----

    [Fact]
    public async Task SuaAsync_CoSoTonTai_CapNhatDuLieu()
    {
        Location coSo = TaoCoSo("Tên cũ");
        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync();

        AdminLocationDto result = await _service.SuaAsync(coSo.Id, TaoRequest(ten: "Tên mới"), default);

        Assert.Equal("Tên mới", result.Name);
        Assert.Equal("Tên mới", (await _db.Locations.FindAsync(coSo.Id))!.Name);
    }

    [Fact]
    public async Task SuaAsync_TatCoSo_TroVeTrangThaiDangDung()
    {
        Location coSo = TaoCoSo("Tên cũ");
        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync();

        AdminLocationDto result = await _service.SuaAsync(
            coSo.Id,
            TaoRequest(ten: "Tên cũ", isActive: false),
            default);

        Assert.False(result.IsActive);
    }

    [Fact]
    public async Task SuaAsync_KhongTonTai_ThrowNotFound()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.SuaAsync(999, TaoRequest(), default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    // ----- Xoá cơ sở -----

    [Fact]
    public async Task XoaAsync_CoSoRong_XoaThanhCong()
    {
        Location coSo = TaoCoSo("Cơ sở cần xoá");
        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync();

        await _service.XoaAsync(coSo.Id, default);

        Assert.Empty(await _db.Locations.ToListAsync());
    }

    [Fact]
    public async Task XoaAsync_CoSoDangCoPhong_ThrowBadRequestVaGiuNguyenCoSo()
    {
        Location coSo = TaoCoSo("Cơ sở có phòng");
        _db.Locations.Add(coSo);
        _db.Rooms.Add(TestDataBuilder.CreateRoom(coSo));
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XoaAsync(coSo.Id, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        Assert.Single(await _db.Locations.ToListAsync());
    }

    [Fact]
    public async Task XoaAsync_KhongTonTai_ThrowNotFound()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XoaAsync(999, default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    private static Location TaoCoSo(string ten, bool isActive = true)
    {
        return new Location
        {
            Name = ten,
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Trần Hưng Đạo",
            IsActive = isActive,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static FacilityRequest TaoRequest(
        string ten = "Cơ sở mới",
        string address = "Đường Lê Lợi",
        bool isActive = true)
    {
        return new FacilityRequest
        {
            Name = ten,
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = address,
            IsActive = isActive
        };
    }
}
