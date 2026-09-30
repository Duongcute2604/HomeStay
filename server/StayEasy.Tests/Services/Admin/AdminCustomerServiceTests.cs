using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Admin;
using StayEasy.Tests.Helpers;
using StayEasy.Tests.Services.Auth;
using Xunit;

namespace StayEasy.Tests.Services.Admin;

/// <summary>
/// Kiểm thử nghiệp vụ quản lý khách hàng của Admin.
///
/// Ba điều cần chứng minh bằng test: danh sách chỉ chứa khách (không lẫn Admin),
/// email trùng bị chặn bằng 409, và không khoá được chính tài khoản Admin.
/// </summary>
public class AdminCustomerServiceTests
{
    private readonly StayEasyDbContext _db;
    private readonly AdminCustomerService _service;

    public AdminCustomerServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _service = new AdminCustomerService(_db, new FakePasswordHasher());
    }

    // ----- Lấy danh sách -----

    [Fact]
    public async Task LayDanhSachAsync_CoCaKhachVaAdmin_ChiTraVeKhach()
    {
        _db.Users.AddRange(
            TaoKhach("khach1@gmail.com", "Nguyễn Văn A"),
            TaoAdmin("admin@gmail.com"),
            TaoKhach("khach2@gmail.com", "Trần Thị B"));
        await _db.SaveChangesAsync();

        List<CustomerDto> result = await _service.LayDanhSachAsync(default);

        Assert.Equal(2, result.Count);
        Assert.DoesNotContain(result, c => c.Email == "admin@gmail.com");
    }

    [Fact]
    public async Task LayDanhSachAsync_KhachCoDon_TraVeDungSoDon()
    {
        User khach = TaoKhach("khach1@gmail.com", "Nguyễn Văn A");
        _db.Users.Add(khach);
        await _db.SaveChangesAsync();
        User admin = TaoAdmin("admin@gmail.com");
        _db.Users.Add(admin);
        await _db.SaveChangesAsync();
        Location coSo = TaoCoSo();
        _db.Locations.Add(coSo);
        await _db.SaveChangesAsync();
        Room phong = TaoPhong(coSo);
        _db.Rooms.Add(phong);
        await _db.SaveChangesAsync();
        _db.Bookings.AddRange(
            TaoDon(khach, phong),
            TaoDon(khach, phong));
        await _db.SaveChangesAsync();

        List<CustomerDto> result = await _service.LayDanhSachAsync(default);

        Assert.Equal(2, Assert.Single(result).TotalBookings);
    }

    [Fact]
    public async Task LayDanhSachAsync_KhachBiKhoa_TraVeIsLockedTrue()
    {
        User khach = TaoKhach("khach1@gmail.com", "Nguyễn Văn A");
        khach.Status = UserStatus.LOCKED;
        _db.Users.Add(khach);
        await _db.SaveChangesAsync();

        List<CustomerDto> result = await _service.LayDanhSachAsync(default);

        Assert.True(Assert.Single(result).IsLocked);
    }

    // ----- Tạo khách -----

    [Fact]
    public async Task TaoAsync_DuLieuHopLe_TaoKhachVaBamMatKhau()
    {
        CustomerCreateRequest request = TaoRequest("khachmoi@gmail.com", "Lê Văn C", "123456");

        CustomerDto result = await _service.TaoAsync(request, default);

        Assert.Equal("Lê Văn C", result.FullName);
        Assert.Equal("khachmoi@gmail.com", result.Email);
        Assert.False(result.IsLocked);
        Assert.Equal(0, result.TotalBookings);

        User khach = Assert.Single(await _db.Users.ToListAsync());
        Assert.Equal(UserRole.CUSTOMER, khach.Role);
        Assert.NotEqual("123456", khach.PasswordHash);
    }

    [Fact]
    public async Task TaoAsync_EmailVietHoaDuocChuanHoaVeChuThu()
    {
        CustomerCreateRequest request = TaoRequest("KHACHMOI@Gmail.COM", "Lê Văn C", "123456");

        CustomerDto result = await _service.TaoAsync(request, default);

        Assert.Equal("khachmoi@gmail.com", result.Email);
    }

    [Fact]
    public async Task TaoAsync_EmailDaTonTai_ThrowConflict()
    {
        _db.Users.Add(TaoKhach("khach1@gmail.com", "Nguyễn Văn A"));
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(TaoRequest("khach1@gmail.com", "Người Khác", "123456"), default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Assert.Single(await _db.Users.ToListAsync());
    }

    [Theory]
    [InlineData("khach@")]
    [InlineData("khach")]
    [InlineData("  ")]
    public async Task TaoAsync_EmailKhongHopLe_ThrowBadRequest(string email)
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(TaoRequest(email, "Lê Văn C", "123456"), default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task TaoAsync_MatKhauNganHonQuyDinh_ThrowBadRequest()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(TaoRequest("khachmoi@gmail.com", "Lê Văn C", "12345"), default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task TaoAsync_HoTenRong_ThrowBadRequest(string hoTen)
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TaoAsync(TaoRequest("khachmoi@gmail.com", hoTen, "123456"), default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    // ----- Khoá / mở khoá -----

    [Fact]
    public async Task DoiTrangThaiAsync_KhoaKhach_DoiSangTrangThaiLocked()
    {
        User khach = TaoKhach("khach1@gmail.com", "Nguyễn Văn A");
        _db.Users.Add(khach);
        await _db.SaveChangesAsync();

        CustomerDto result = await _service.DoiTrangThaiAsync(
            khach.Id,
            new CustomerStatusRequest { IsLocked = true },
            default);

        Assert.True(result.IsLocked);
        Assert.Equal(UserStatus.LOCKED, (await _db.Users.FindAsync(khach.Id))!.Status);
    }

    [Fact]
    public async Task DoiTrangThaiAsync_MoKhoaKhach_DoiSangTrangThaiActive()
    {
        User khach = TaoKhach("khach1@gmail.com", "Nguyễn Văn A");
        khach.Status = UserStatus.LOCKED;
        _db.Users.Add(khach);
        await _db.SaveChangesAsync();

        CustomerDto result = await _service.DoiTrangThaiAsync(
            khach.Id,
            new CustomerStatusRequest { IsLocked = false },
            default);

        Assert.False(result.IsLocked);
    }

    [Fact]
    public async Task DoiTrangThaiAsync_TaiKhoanAdmin_ThrowForbidden()
    {
        // Chặn để Admin không tự khoá mình khỏi hệ thống giữa chừng.
        User admin = TaoAdmin("admin@gmail.com");
        _db.Users.Add(admin);
        await _db.SaveChangesAsync();

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.DoiTrangThaiAsync(admin.Id, new CustomerStatusRequest { IsLocked = true }, default));

        Assert.Equal(HttpStatusCode.Forbidden, loi.StatusCode);
    }

    [Fact]
    public async Task DoiTrangThaiAsync_KhongTonTai_ThrowNotFound()
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.DoiTrangThaiAsync(999, new CustomerStatusRequest(), default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    private static User TaoKhach(string email, string hoTen)
    {
        return new User
        {
            FullName = hoTen,
            Email = email,
            PhoneNumber = "0912345678",
            PasswordHash = "fake:123456",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static User TaoAdmin(string email)
    {
        return new User
        {
            FullName = "Quản trị viên",
            Email = email,
            PasswordHash = "fake:123456",
            Role = UserRole.ADMIN,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Location TaoCoSo()
    {
        return new Location
        {
            Name = "Homestay Hưng Yên",
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Trần Hưng Đạo",
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Room TaoPhong(Location coSo)
    {
        return new Room
        {
            LocationId = coSo.Id,
            Name = "Phòng Cozy",
            RoomNumber = "101",
            RoomType = RoomType.COZY,
            Capacity = 2,
            PricePerHour = 120_000m,
            PricePerDay = 850_000m,
            Status = RoomStatus.AVAILABLE,
            CreatedAt = DateTime.UtcNow
        };
    }

    private static Booking TaoDon(User khach, Room phong)
    {
        return StayEasy.Tests.Common.TestDataBuilder.CreateBooking(khach, phong);
    }

    private static CustomerCreateRequest TaoRequest(string email, string hoTen, string matKhau)
    {
        return new CustomerCreateRequest
        {
            FullName = hoTen,
            Email = email,
            PhoneNumber = "0912345678",
            Password = matKhau
        };
    }
}
