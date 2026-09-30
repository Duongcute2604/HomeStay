using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Bookings;
using HomeStay.Services.Rooms;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng đơn của tôi, hủy đơn, lịch sử trạng thái.
///
/// Nguyên tắc phân biệt 404/409 ở đây: mã sai hoặc đơn người khác → 404 (không
/// lộ tồn tại); đơn đúng người nhưng sai bước → 409.
/// </summary>
public class MyBookingsTests
{
    /// <summary>
    /// Dựng DB có 1 địa điểm + 1 phòng + 2 khách (mỗi khách 1 đơn PENDING).
    /// Trả về service dùng chung DbContext đó.
    /// </summary>
    private static async Task<(HomeStayDbContext Db, BookingService Service, User Khach1, User Khach2, Booking Don1)> TaoDbHaiKhachAsync()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        Location location = TestDataBuilder.CreateLocation();
        db.Locations.Add(location);
        Room room = TestDataBuilder.CreateRoom(location, "101");
        db.Rooms.Add(room);
        User khach1 = TestDataBuilder.CreateCustomer("khach1@gmail.com");
        User khach2 = TestDataBuilder.CreateCustomer("khach2@gmail.com", "Nguyễn Văn B");
        db.Users.AddRange(khach1, khach2);
        await db.SaveChangesAsync();

        BookingService service = new(db, new RoomService(db));
        DateTime nhan1 = DateTime.Now.Date.AddDays(5).AddHours(14);
        DateTime nhan2 = DateTime.Now.Date.AddDays(8).AddHours(14);

        await service.TaoDonAsync(khach1.Id, new CreateBookingRequest
        {
            LocationIndex = 0,
            RoomIndex = 0,
            Type = (int)BookingType.DAY,
            CheckIn = nhan1,
            CheckOut = nhan1.AddDays(1),
            GuestCount = 2,
        }, CancellationToken.None);

        await service.TaoDonAsync(khach2.Id, new CreateBookingRequest
        {
            LocationIndex = 0,
            RoomIndex = 0,
            Type = (int)BookingType.DAY,
            CheckIn = nhan2,
            CheckOut = nhan2.AddDays(1),
            GuestCount = 1,
        }, CancellationToken.None);

        Booking don1 = await db.Bookings.SingleAsync(d => d.UserId == khach1.Id);
        return (db, service, khach1, khach2, don1);
    }

    // ---------------- Danh sách của tôi ----------------

    [Fact]
    public async Task LayCuaToiAsync_ChiTraVeDonCuaChinhMinh()
    {
        var (db, service, khach1, _, _) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            PagedResultDto<MyBookingDto> result =
                await service.LayCuaToiAsync(khach1.Id, 1, 20, CancellationToken.None);

            Assert.Equal(1, result.TotalItems);
            Assert.All(result.Items, don => Assert.Equal(khach1.Id, db.Bookings.Single(d => d.Code == don.Code).UserId));
        }
    }

    [Fact]
    public async Task LayCuaToiAsync_MoiNhatTruoc()
    {
        var (db, service, khach1, _, _) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            DateTime nhan = DateTime.Now.Date.AddDays(12).AddHours(14);
            await service.TaoDonAsync(khach1.Id, new CreateBookingRequest
            {
                LocationIndex = 0,
                RoomIndex = 0,
                Type = (int)BookingType.DAY,
                CheckIn = nhan,
                CheckOut = nhan.AddDays(1),
                GuestCount = 2,
            }, CancellationToken.None);

            PagedResultDto<MyBookingDto> result =
                await service.LayCuaToiAsync(khach1.Id, 1, 20, CancellationToken.None);

            Assert.Equal(2, result.TotalItems);
            Assert.True(result.Items[0].CreatedAt >= result.Items[1].CreatedAt);
        }
    }

    [Fact]
    public async Task LayCuaToiAsync_KhongCoDon_TraVeRong()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        await using (db)
        {
            BookingService service = new(db, new RoomService(db));

            PagedResultDto<MyBookingDto> result =
                await service.LayCuaToiAsync(9999, 1, 20, CancellationToken.None);

            Assert.Equal(0, result.TotalItems);
            Assert.Empty(result.Items);
        }
    }

    // ---------------- Chi tiết ----------------

    [Fact]
    public async Task LayChiTietAsync_DonCuaMinh_TraVeKemLichSu()
    {
        var (db, service, khach1, _, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            BookingDetailDto result = await service.LayChiTietAsync(khach1.Id, don1.Code, CancellationToken.None);

            Assert.Equal(don1.Code, result.Code);
            Assert.False(string.IsNullOrWhiteSpace(result.RoomName));
            Assert.False(string.IsNullOrWhiteSpace(result.LocationName));
            BookingHistoryDto lichSu = Assert.Single(result.History);
            Assert.Null(lichSu.FromStatus);
            Assert.Equal(BookingStatus.PENDING, lichSu.ToStatus);
            Assert.Equal(khach1.FullName, lichSu.ChangedByName);
        }
    }

    [Fact]
    public async Task LayChiTietAsync_DonCuaNguoiKhac_ThroiAppException404()
    {
        var (db, service, _, khach2, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.LayChiTietAsync(khach2.Id, don1.Code, CancellationToken.None));

            Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        }
    }

    [Fact]
    public async Task LayChiTietAsync_MaSai_ThroiAppException404()
    {
        var (db, service, khach1, _, _) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.LayChiTietAsync(khach1.Id, "HS-000000-0000", CancellationToken.None));

            Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
        }
    }

    // ---------------- Hủy đơn ----------------

    [Fact]
    public async Task HuyDonAsync_DonPending_ChuyenSangCancelled_GhiLichSu()
    {
        var (db, service, khach1, _, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            BookingDetailDto result = await service.HuyDonAsync(
                khach1.Id, don1.Code, "Đổi kế hoạch", CancellationToken.None);

            Assert.Equal(BookingStatus.CANCELLED, result.Status);
            Assert.Equal("Đổi kế hoạch", result.CancelReason);
            Assert.Equal(2, result.History.Count);
            BookingHistoryDto cuoi = result.History[^1];
            Assert.Equal(BookingStatus.PENDING, cuoi.FromStatus);
            Assert.Equal(BookingStatus.CANCELLED, cuoi.ToStatus);
            Assert.Equal(khach1.FullName, cuoi.ChangedByName);
        }
    }

    [Fact]
    public async Task HuyDonAsync_KhongLyDo_LuuNull()
    {
        var (db, service, khach1, _, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            BookingDetailDto result = await service.HuyDonAsync(
                khach1.Id, don1.Code, "   ", CancellationToken.None);

            Assert.Equal(BookingStatus.CANCELLED, result.Status);
            Assert.Null(result.CancelReason);
        }
    }

    [Fact]
    public async Task HuyDonAsync_DonDaHuy_HuyLai_ThroiAppException409()
    {
        var (db, service, khach1, _, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            await service.HuyDonAsync(khach1.Id, don1.Code, null, CancellationToken.None);

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.HuyDonAsync(khach1.Id, don1.Code, null, CancellationToken.None));

            Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        }
    }

    [Fact]
    public async Task HuyDonAsync_DonDangO_ThroiAppException409()
    {
        var (db, service, khach1, _, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            don1.Status = BookingStatus.CHECKED_IN;
            await db.SaveChangesAsync();

            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.HuyDonAsync(khach1.Id, don1.Code, null, CancellationToken.None));

            // Đang ở thì phải trả phòng chứ không được hủy ngang.
            Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
        }
    }

    [Fact]
    public async Task HuyDonAsync_DonNguoiKhac_ThroiAppException404()
    {
        var (db, service, _, khach2, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            AppException loi = await Assert.ThrowsAsync<AppException>(() =>
                service.HuyDonAsync(khach2.Id, don1.Code, null, CancellationToken.None));

            Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
            // Đơn không bị đụng tới (DB có 2 đơn nên phải lọc đúng đơn).
            Assert.Equal(
                BookingStatus.PENDING,
                (await db.Bookings.SingleAsync(d => d.Id == don1.Id)).Status);
        }
    }

    [Fact]
    public async Task HuyDonAsync_DonDaHuy_KhongGiuPhongNua()
    {
        var (db, service, khach1, khach2, don1) = await TaoDbHaiKhachAsync();
        await using (db)
        {
            await service.HuyDonAsync(khach1.Id, don1.Code, null, CancellationToken.None);

            // Khung giờ cũ giờ trống — khách khác đặt được ngay.
            Booking donMoi = await db.Bookings.SingleAsync(d => d.UserId == khach1.Id);
            BookingResponseDto result = await service.TaoDonAsync(khach2.Id, new CreateBookingRequest
            {
                LocationIndex = 0,
                RoomIndex = 0,
                Type = (int)donMoi.BookingType,
                CheckIn = donMoi.CheckIn,
                CheckOut = donMoi.CheckOut,
                GuestCount = 1,
            }, CancellationToken.None);

            Assert.Equal(BookingStatus.PENDING, result.Status);
        }
    }
}
