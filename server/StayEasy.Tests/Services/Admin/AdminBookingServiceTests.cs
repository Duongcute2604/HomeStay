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
/// Kiểm thử vòng đời đơn phía Admin: xác nhận → check-in → check-out,
/// cộng với ma trận chuyển trạng thái (đây là phần dễ sai nhất — nhảy cóc
/// trạng thái sẽ làm phòng bị khoá vĩnh viễn hoặc cho 2 khách cùng ở 1 phòng).
///
/// Mỗi test kiểm tra CẢ 2 mặt: trạng thái đơn VÀ trạng thái phòng, vì hai thứ
/// này phải khớp nhau — đơn `CONFIRMED` mà phòng còn `AVAILABLE` thì khách mới
/// vẫn đặt được và sẽ thành 2 đơn trùng phòng.
/// </summary>
public class AdminBookingServiceTests : IDisposable
{
    /// <summary>
    /// Id Admin giả lập. Service không đọc id này từ CSDL mà nhận từ token,
    /// nên test chỉ cần một số bất kỳ — mục đích là chứng minh giá trị đó được
    /// ghi vào lịch sử, không phải chứng minh token hoạt động.
    /// </summary>
    private const int AdminId = 999;

    private readonly StayEasyDbContext _db;
    private readonly AdminBookingService _service;

    public AdminBookingServiceTests()
    {
        _db = TestDbContextFactory.Create();
        _service = new AdminBookingService(_db);
    }

    public void Dispose() => _db.Dispose();

    // ----- Xác nhận -----

    [Fact]
    public async Task XacNhanAsync_DonChờXacNhan_DonVaPhongCungSangConfirmedVaBooked()
    {
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        AdminBookingDto result = await _service.XacNhanAsync(don.Code, AdminId, default);

        Assert.Equal(BookingStatus.CONFIRMED, result.Status);
        Assert.Equal(RoomStatus.BOOKED, (await _db.Rooms.SingleAsync()).Status);
    }

    [Fact]
    public async Task XacNhanAsync_GhiLichSuTrangThai_GhiDungAdminIdKhongPhaiIdKhach()
    {
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        await _service.XacNhanAsync(don.Code, AdminId, default);

        BookingStatusHistory lichSu = await _db.BookingStatusHistory.SingleAsync();
        Assert.Equal(BookingStatus.PENDING, lichSu.FromStatus);
        Assert.Equal(BookingStatus.CONFIRMED, lichSu.ToStatus);
        // Phải là id Admin, KHÔNG phải id khách đặt phòng — ghi nhầm thì khi
        // tra lịch sử sẽ thấy "khách tự xác nhận đơn của mình", sai hoàn toàn.
        Assert.Equal(AdminId, lichSu.ChangedByUserId);
        Assert.NotEqual(don.UserId, lichSu.ChangedByUserId);
        Assert.False(string.IsNullOrWhiteSpace(lichSu.Note));
    }

    // ----- Từ chối -----

    [Fact]
    public async Task TuChoiAsync_DonChờXacNhan_DonVaPhongSangRejectedVaAvailableVaLuuLyDo()
    {
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        AdminBookingDto result = await _service.TuChoiAsync(don.Code, AdminId, "Phòng đang bảo trì", default);

        Assert.Equal(BookingStatus.REJECTED, result.Status);
        Assert.Equal("Phòng đang bảo trì", result.CancelReason);
        Assert.Equal(RoomStatus.AVAILABLE, (await _db.Rooms.SingleAsync()).Status);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public async Task TuChoiAsync_KhongCoLyDo_ThrowBadRequest(string lyDo)
    {
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.TuChoiAsync(don.Code, AdminId, lyDo, default));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    // ----- Check-in / check-out -----

    [Fact]
    public async Task CheckInAsync_DonDaXacNhan_PhongSangOccupied()
    {
        Booking don = await TaoDonAsync(BookingStatus.CONFIRMED, RoomStatus.BOOKED);

        AdminBookingDto result = await _service.CheckInAsync(don.Code, AdminId, default);

        Assert.Equal(BookingStatus.CHECKED_IN, result.Status);
        Assert.Equal(RoomStatus.OCCUPIED, (await _db.Rooms.SingleAsync()).Status);
    }

    [Fact]
    public async Task CheckOutAsync_KhachDangO_PhongSangCleaningChuaPhaiAvailable()
    {
        // Quan trọng: sau khi trả phòng phải vệ sinh 2 giờ, không được nhận đơn
        // mới ngay. Chuyển thẳng AVAILABLE là lỗi làm khách mới đặt trúng phòng
        // đang dọn.
        Booking don = await TaoDonAsync(BookingStatus.CHECKED_IN, RoomStatus.OCCUPIED);

        AdminBookingDto result = await _service.CheckOutAsync(don.Code, AdminId, default);

        Assert.Equal(BookingStatus.COMPLETED, result.Status);
        Assert.Equal(RoomStatus.CLEANING, (await _db.Rooms.SingleAsync()).Status);
    }

    [Fact]
    public async Task CheckOutAsync_GhiDayDu4BuocVaoLichSu()
    {
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        await _service.XacNhanAsync(don.Code, AdminId, default);
        await _service.CheckInAsync(don.Code, AdminId, default);
        await _service.CheckOutAsync(don.Code, AdminId, default);

        List<BookingStatus> chuoi = await _db.BookingStatusHistory
            .OrderBy(l => l.ChangedAt)
            .ThenBy(l => l.Id)
            .Select(l => l.ToStatus)
            .ToListAsync();

        // 3 dòng mới (đơn đã có 1 dòng PENDING từ lúc khách đặt).
        Assert.Equal(
            new[] { BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED },
            chuoi);
    }

    // ----- Ma trận chuyển trạng thái (bất thường) -----

    [Theory]
    [InlineData(BookingStatus.CONFIRMED)]
    [InlineData(BookingStatus.CHECKED_IN)]
    [InlineData(BookingStatus.COMPLETED)]
    [InlineData(BookingStatus.CANCELLED)]
    [InlineData(BookingStatus.REJECTED)]
    public async Task XacNhanAsync_DonKhongChoXacNhan_ThrowConflictVaGiuNguyenTrangThai(BookingStatus trangThai)
    {
        Booking don = await TaoDonAsync(trangThai, RoomStatus.AVAILABLE);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XacNhanAsync(don.Code, AdminId, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Assert.Equal(trangThai, (await _db.Bookings.SingleAsync()).Status);
    }

    [Fact]
    public async Task CheckInAsync_DonChuaXacNhan_ThrowConflict()
    {
        // Nhảy từ PENDING sang CHECKED_IN là lỗi nghiêm trọng: khách chưa được
        // Admin xác nhận mà đã nhận phòng, mất dấu vết phê duyệt.
        Booking don = await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.CheckInAsync(don.Code, AdminId, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Assert.Equal(RoomStatus.AVAILABLE, (await _db.Rooms.SingleAsync()).Status);
    }

    [Fact]
    public async Task CheckOutAsync_DonDaXacNhanChuaCheckIn_ThrowConflict()
    {
        Booking don = await TaoDonAsync(BookingStatus.CONFIRMED, RoomStatus.BOOKED);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.CheckOutAsync(don.Code, AdminId, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        Assert.Equal(RoomStatus.BOOKED, (await _db.Rooms.SingleAsync()).Status);
    }

    [Fact]
    public async Task CheckOutAsync_LanHai_ThrowConflict()
    {
        Booking don = await TaoDonAsync(BookingStatus.CHECKED_IN, RoomStatus.OCCUPIED);
        await _service.CheckOutAsync(don.Code, AdminId, default);

        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.CheckOutAsync(don.Code, AdminId, default));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Theory]
    [InlineData("HS-KHONG-CO")]
    public async Task XacNhanAsync_MaKhongTonTai_ThrowNotFound(string code)
    {
        AppException loi = await Assert.ThrowsAsync<AppException>(
            () => _service.XacNhanAsync(code, AdminId, default));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    // ----- Lọc danh sách -----

    [Fact]
    public async Task LayDanhSachAsync_CoNhieuTrangThai_ChiTraVeDungTrangThaiDaLoc()
    {
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-01");
        await TaoDonAsync(BookingStatus.CONFIRMED, RoomStatus.BOOKED, "HS-02");
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-03");

        var filter = new AdminBookingFilter { Status = BookingStatus.PENDING };
        var result = await _service.LayDanhSachAsync(filter, default);

        Assert.Equal(2, result.TotalItems);
        Assert.All(result.Items, d => Assert.Equal(BookingStatus.PENDING, d.Status));
    }

    [Fact]
    public async Task LayDanhSachAsync_TimTheoTenKhach_KhongPhanBietHoaThuong()
    {
        // Hai khách khác tên, email cũng khác (Email có unique index).
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-01",
            "mai@gmail.com", "Trần Thị Mai");
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-02",
            "nam@gmail.com", "Nguyễn Văn Nam");

        var filter = new AdminBookingFilter { Keyword = "trần thị mai" };
        var result = await _service.LayDanhSachAsync(filter, default);

        AdminBookingDto don = Assert.Single(result.Items);
        Assert.Equal("HS-01", don.Code);
    }

    [Fact]
    public async Task LayDanhSachAsync_TimTheoMaDon_TraVeDungDon()
    {
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-01");
        await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, "HS-02");

        var filter = new AdminBookingFilter { Keyword = "HS-02" };
        var result = await _service.LayDanhSachAsync(filter, default);

        Assert.Equal("HS-02", Assert.Single(result.Items).Code);
    }

    [Fact]
    public async Task LayDanhSachAsync_PhanTrang_ChiaDungSoTrangVaKhongTrungMa()
    {
        for (int i = 1; i <= 5; i++)
        {
            await TaoDonAsync(BookingStatus.PENDING, RoomStatus.AVAILABLE, $"HS-{i:D2}");
        }

        var filter = new AdminBookingFilter { Page = 2, PageSize = 2 };
        var result = await _service.LayDanhSachAsync(filter, default);

        Assert.Equal(5, result.TotalItems);
        Assert.Equal(3, result.TotalPages);
        Assert.Equal(2, result.Items.Count);
        Assert.Equal(2, result.Page);
    }

    [Fact]
    public async Task LayDanhSachAsync_KhongCoDon_ItemRongNhungTongSoDung()
    {
        var result = await _service.LayDanhSachAsync(new AdminBookingFilter(), default);

        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalItems);
        Assert.Equal(0, result.TotalPages);
    }

    // ----- Dữ liệu mẫu -----

    /// <summary>
    /// Tạo khách + cơ sở + phòng + 1 đơn đã có sẵn dòng lịch sử `PENDING` —
    /// mô phỏng đúng trạng thái sau khi khách bấm "Đặt phòng".
    /// </summary>
    private async Task<Booking> TaoDonAsync(
        BookingStatus trangThaiDon,
        RoomStatus trangThaiPhong,
        string? code = null,
        string email = "khach@test.com",
        string hoTen = "Trần Thị Mai")
    {
        User khach = TaoKhachMoi(email, hoTen);
        Location coSo = new()
        {
            Name = "Homestay Hưng Yên",
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Trần Hưng Đạo",
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        Room phong = new()
        {
            Location = coSo,
            Name = "Phòng Hạnh Phúc",
            RoomNumber = "A101",
            RoomType = RoomType.COZY,
            Capacity = 2,
            PricePerHour = 90_000m,
            PricePerDay = 550_000m,
            Status = trangThaiPhong,
            CreatedAt = DateTime.UtcNow,
        };

        var don = new Booking
        {
            Code = code ?? $"HS-{Guid.NewGuid():N}"[..12],
            User = khach,
            Room = phong,
            BookingType = BookingType.DAY,
            CheckIn = new DateTime(2026, 10, 1, 14, 0, 0),
            CheckOut = new DateTime(2026, 10, 2, 12, 0, 0),
            GuestCount = 2,
            TotalAmount = 550_000m,
            PricePerHourSnapshot = 90_000m,
            PricePerDaySnapshot = 550_000m,
            Status = trangThaiDon,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Bookings.Add(don);
        await _db.SaveChangesAsync();

        if (trangThaiDon != BookingStatus.PENDING)
        {
            // Dựng sẵn lịch sử tới trạng thái đích để dữ liệu mẫu khớp thực tế:
            // không có đơn `CHECKED_IN` nào mà lịch sử chỉ ghi `PENDING`.
            _db.BookingStatusHistory.Add(new BookingStatusHistory
            {
                Booking = don,
                FromStatus = BookingStatus.PENDING,
                ToStatus = trangThaiDon,
                ChangedAt = DateTime.UtcNow,
            });
            await _db.SaveChangesAsync();
        }

        return don;
    }

    private static User TaoKhachMoi(string email, string hoTen)
    {
        return new User
        {
            FullName = hoTen,
            Email = email,
            PhoneNumber = "0912345678",
            PasswordHash = "fake:123456",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow,
        };
    }
}
