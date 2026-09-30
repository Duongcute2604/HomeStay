using Microsoft.EntityFrameworkCore;
using HomeStay.Data;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Tests.Common;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Data;

/// <summary>
/// Kiểm chứng DbContext khi ghi và đọc dữ liệu: quan hệ giữa các bảng, cascade delete,
/// và việc tự động điền mốc thời gian.
/// Phần kiểm tra cấu hình CSDL nằm ở <see cref="HomeStayDbContextModelTests"/>.
/// </summary>
public class HomeStayDbContextDataTests
{
    [Fact]
    public async Task LuuDuLieuDayDu_9Bang_ThaCongChinhKhongBiLoi()
    {
        await using HomeStayDbContext context = TestDbContextFactory.Create();

        User customer = TestDataBuilder.CreateCustomer();
        User admin = TestDataBuilder.CreateAdmin();
        Location location = TestDataBuilder.CreateLocation();
        Room room = TestDataBuilder.CreateRoom(location);
        Amenity amenity = new() { Name = "Wifi", Icon = "wifi" };

        room.AmenityLinks.Add(new RoomAmenity { Room = room, Amenity = amenity });
        room.Images.Add(new RoomImage { Room = room, ImageUrl = "phong101.jpg", IsPrimary = true, SortOrder = 1 });

        Booking booking = TestDataBuilder.CreateBooking(customer, room);
        booking.StatusHistory.Add(new BookingStatusHistory
        {
            Booking = booking,
            ToStatus = BookingStatus.PENDING,
            ChangedByUser = customer,
            ChangedByUserId = customer.Id,
            ChangedAt = DateTime.Now
        });
        booking.Review = TestDataBuilder.CreateReview(booking);

        context.AddRange(customer, admin, location, room, amenity, booking);

        await context.SaveChangesAsync();

        Assert.All(
            new[] { customer.Id, admin.Id, location.Id, room.Id, amenity.Id, booking.Id },
            x => Assert.True(x > 0, "Entity phải được sinh khóa chính"));

        Booking? savedBooking = await context.Bookings
            .Include(x => x.StatusHistory)
            .Include(x => x.Review)
            .SingleOrDefaultAsync();

        Assert.NotNull(savedBooking);
        Assert.Equal("HS-250930-4821", savedBooking!.Code);
        Assert.Single(savedBooking.StatusHistory);
        Assert.NotNull(savedBooking.Review);
        Assert.Equal(admin.Id, (await context.Users.SingleAsync(x => x.Email == "admin@gmail.com")).Id);
    }

    [Fact]
    public async Task XoaPhong_TuDongXoaAnhVaLienKetTienNghi_AnhKhongConOrphan()
    {
        await using HomeStayDbContext context = TestDbContextFactory.Create();

        Location location = TestDataBuilder.CreateLocation();
        Room room = TestDataBuilder.CreateRoom(location);
        room.Images.Add(new RoomImage { Room = room, ImageUrl = "anh1.jpg", SortOrder = 1 });
        room.AmenityLinks.Add(new RoomAmenity { Room = room, Amenity = new Amenity { Name = "Wifi" } });

        context.AddRange(location, room);
        await context.SaveChangesAsync();

        context.Rooms.Remove(room);
        await context.SaveChangesAsync();

        Assert.Empty(await context.RoomImages.ToListAsync());
        Assert.Empty(await context.RoomAmenities.ToListAsync());
        Assert.Single(await context.Locations.ToListAsync());
    }

    [Fact]
    public async Task ThemMoi_TuDienCreatedAtVaUpdatedAt_KhongCanServiceTuSet()
    {
        await using HomeStayDbContext context = TestDbContextFactory.Create();

        User user = TestDataBuilder.CreateCustomer();
        context.Users.Add(user);

        await context.SaveChangesAsync();

        Assert.NotEqual(default, user.CreatedAt);
        Assert.NotEqual(default, user.UpdatedAt);
    }

    [Fact]
    public async Task SuaDoi_ChiCapNhatUpdatedAt_GiuNguyenCreatedAt()
    {
        await using HomeStayDbContext context = TestDbContextFactory.Create();

        User user = TestDataBuilder.CreateCustomer();
        context.Users.Add(user);
        await context.SaveChangesAsync();

        DateTime createdAt = user.CreatedAt;

        user.FullName = "Tên đã đổi";
        await context.SaveChangesAsync();

        Assert.Equal(createdAt, user.CreatedAt);
        Assert.True(user.UpdatedAt >= createdAt);
    }

    [Fact]
    public async Task ThoiDiemDaTuDien_KhongBiGhiDe_DeServiceCoTheDatYMinh()
    {
        await using HomeStayDbContext context = TestDbContextFactory.Create();

        Booking booking = TestDataBuilder.CreateBooking(
            TestDataBuilder.CreateCustomer(),
            TestDataBuilder.CreateRoom(TestDataBuilder.CreateLocation()));
        DateTime customTime = new(2026, 1, 1, 8, 30, 0);

        booking.CreatedAt = customTime;
        context.Bookings.Add(booking);

        await context.SaveChangesAsync();

        Assert.Equal(customTime, booking.CreatedAt);
    }
}
