using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using HomeStay.Entities;
using HomeStay.Enums;

namespace HomeStay.Data;

/// <summary>
/// Ngữ cảnh dữ liệu của hệ thống — định nghĩa 9 bảng và các ràng buộc nghiệp vụ ở tầng CSDL.
/// </summary>
public class HomeStayDbContext : DbContext
{
    public HomeStayDbContext(DbContextOptions<HomeStayDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Location> Locations => Set<Location>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomImage> RoomImages => Set<RoomImage>();
    public DbSet<Amenity> Amenities => Set<Amenity>();
    public DbSet<RoomAmenity> RoomAmenities => Set<RoomAmenity>();
    public DbSet<Booking> Bookings => Set<Booking>();
    public DbSet<BookingStatusHistory> BookingStatusHistory => Set<BookingStatusHistory>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Lưu enum thành chữ chứ không phải số. Khi GVHD mở MySQL xem trực tiếp sẽ thấy 'PENDING'
        // thay vì số 0, không phải tra bảng tra cứu mới hiểu.
        configurationBuilder.Properties<BookingStatus>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<BookingType>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<RoomStatus>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<RoomType>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<UserRole>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<UserStatus>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<PaymentMethod>().HaveConversion<string>().HaveMaxLength(20);
        configurationBuilder.Properties<PaymentStatus>().HaveConversion<string>().HaveMaxLength(20);
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        ConfigureUsers(modelBuilder);
        ConfigureLocations(modelBuilder);
        ConfigureRooms(modelBuilder);
        ConfigureRoomImages(modelBuilder);
        ConfigureAmenities(modelBuilder);
        ConfigureRoomAmenities(modelBuilder);
        ConfigureBookings(modelBuilder);
        ConfigureBookingStatusHistory(modelBuilder);
        ConfigureReviews(modelBuilder);
        ConfigurePayments(modelBuilder);
    }

    private static void ConfigureUsers(ModelBuilder modelBuilder)
    {
        var user = modelBuilder.Entity<User>();
        user.ToTable("Users");
        user.HasKey(x => x.Id);
        user.Property(x => x.FullName).HasMaxLength(100).IsRequired();
        user.Property(x => x.Email).HasMaxLength(150).IsRequired();
        user.Property(x => x.PhoneNumber).HasMaxLength(15);
        user.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
        user.Property(x => x.Address).HasMaxLength(255);
        user.Property(x => x.RefreshTokenHash).HasMaxLength(100);

        // Email là tài khoản đăng nhập nên phải duy nhất — chặn trùng ngay ở tầng CSDL
        user.HasIndex(x => x.Email).IsUnique();
    }

    private static void ConfigureLocations(ModelBuilder modelBuilder)
    {
        var location = modelBuilder.Entity<Location>();
        location.ToTable("Locations");
        location.HasKey(x => x.Id);
        location.Property(x => x.Name).HasMaxLength(150).IsRequired();
        location.Property(x => x.City).HasMaxLength(80).IsRequired();
        location.Property(x => x.Province).HasMaxLength(80).IsRequired();
        location.Property(x => x.Address).HasMaxLength(255).IsRequired();
        location.Property(x => x.Description).HasMaxLength(1000);
        location.Property(x => x.ImageUrl).HasMaxLength(500);

        // Lọc địa điểm đang hoạt động luôn đi kèm điều kiện IsActive
        location.HasIndex(x => x.IsActive);
    }

    private static void ConfigureRooms(ModelBuilder modelBuilder)
    {
        var room = modelBuilder.Entity<Room>();

        // Ràng buộc chặn dữ liệu vô lý ngay khi ghi, không đợi tới lúc đọc ra mới phát hiện.
        // EF Core 8 yêu cầu khai báo trong ToTable, không dùng entity.HasCheckConstraint (đã obsolete).
        room.ToTable("Rooms", table =>
        {
            table.HasCheckConstraint("CK_Rooms_Capacity", "`Capacity` > 0");
            table.HasCheckConstraint("CK_Rooms_Price", "`PricePerHour` >= 0 AND `PricePerDay` >= 0");
            table.HasCheckConstraint("CK_Rooms_Rating", "`RatingAvg` >= 0 AND `RatingAvg` <= 5");
        });

        room.HasKey(x => x.Id);
        room.Property(x => x.Name).HasMaxLength(150).IsRequired();
        room.Property(x => x.RoomNumber).HasMaxLength(20).IsRequired();
        room.Property(x => x.Description).HasMaxLength(1000);
        room.Property(x => x.PricePerHour).HasColumnType("decimal(18,2)");
        room.Property(x => x.PricePerDay).HasColumnType("decimal(18,2)");
        room.Property(x => x.RatingAvg).HasColumnType("decimal(3,2)");

        room.HasIndex(x => x.LocationId);
        room.HasIndex(x => x.Status);
        room.HasIndex(x => x.PricePerDay);

        room.HasOne(x => x.Location)
            .WithMany(x => x.Rooms)
            .HasForeignKey(x => x.LocationId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureRoomImages(ModelBuilder modelBuilder)
    {
        var image = modelBuilder.Entity<RoomImage>();
        image.ToTable("RoomImages");
        image.HasKey(x => x.Id);
        image.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();
        image.HasIndex(x => new { x.RoomId, x.SortOrder });

        image.HasOne(x => x.Room)
            .WithMany(x => x.Images)
            .HasForeignKey(x => x.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureAmenities(ModelBuilder modelBuilder)
    {
        var amenity = modelBuilder.Entity<Amenity>();
        amenity.ToTable("Amenities");
        amenity.HasKey(x => x.Id);
        amenity.Property(x => x.Name).HasMaxLength(100).IsRequired();
        amenity.Property(x => x.Description).HasMaxLength(255);
        amenity.Property(x => x.Icon).HasMaxLength(50);

        // Tên tiện nghi là duy nhất để tránh nhập trùng "Wifi" và "WiFi" thành 2 tiện nghi
        amenity.HasIndex(x => x.Name).IsUnique();
    }

    private static void ConfigureRoomAmenities(ModelBuilder modelBuilder)
    {
        var link = modelBuilder.Entity<RoomAmenity>();
        link.ToTable("RoomAmenities");

        // Khoá chính ghép: một phòng không thể có 2 dòng cùng 1 tiện nghi
        link.HasKey(x => new { x.RoomId, x.AmenityId });

        link.HasOne(x => x.Room)
            .WithMany(x => x.AmenityLinks)
            .HasForeignKey(x => x.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        link.HasOne(x => x.Amenity)
            .WithMany(x => x.RoomLinks)
            .HasForeignKey(x => x.AmenityId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    private static void ConfigureBookings(ModelBuilder modelBuilder)
    {
        var booking = modelBuilder.Entity<Booking>();

        booking.ToTable("Bookings", table =>
        {
            table.HasCheckConstraint("CK_Bookings_GuestCount", "`GuestCount` > 0");
            table.HasCheckConstraint("CK_Bookings_TimeRange", "`CheckOut` > `CheckIn`");
        });

        booking.HasKey(x => x.Id);
        booking.Property(x => x.Code).HasMaxLength(20).IsRequired();
        booking.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
        booking.Property(x => x.PricePerHourSnapshot).HasColumnType("decimal(18,2)");
        booking.Property(x => x.PricePerDaySnapshot).HasColumnType("decimal(18,2)");
        booking.Property(x => x.Note).HasMaxLength(500);
        booking.Property(x => x.CancelReason).HasMaxLength(500);

        // Mã hiển thị cho khách thay cho Id — bắt buộc duy nhất
        booking.HasIndex(x => x.Code).IsUnique();
        booking.HasIndex(x => x.UserId);

        // Kiểm tra trùng lịch luôn quét theo (phòng, khoảng thời gian).
        // Không có index này thì mỗi lần đặt phòng phải quét cả bảng bookings — chậm dần theo thời gian.
        booking.HasIndex(x => x.RoomId);
        booking.HasIndex(x => new { x.CheckIn, x.CheckOut });
        booking.HasIndex(x => x.Status);

        booking.HasOne(x => x.User)
            .WithMany(x => x.Bookings)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        booking.HasOne(x => x.Room)
            .WithMany(x => x.Bookings)
            .HasForeignKey(x => x.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureBookingStatusHistory(ModelBuilder modelBuilder)
    {
        var history = modelBuilder.Entity<BookingStatusHistory>();
        history.ToTable("BookingStatusHistory");
        history.HasKey(x => x.Id);
        history.Property(x => x.Note).HasMaxLength(500);
        history.HasIndex(x => x.BookingId);

        history.HasOne(x => x.Booking)
            .WithMany(x => x.StatusHistory)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        history.HasOne(x => x.ChangedByUser)
            .WithMany(x => x.StatusChanges)
            .HasForeignKey(x => x.ChangedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    private static void ConfigureReviews(ModelBuilder modelBuilder)
    {
        var review = modelBuilder.Entity<Review>();

        review.ToTable("Reviews", table =>
        {
            table.HasCheckConstraint("CK_Reviews_Rating", "`Rating` >= 1 AND `Rating` <= 5");
        });

        review.HasKey(x => x.Id);
        review.Property(x => x.Comment).HasMaxLength(1000);

        // Unique index là cách duy nhất đảm bảo "1 đơn 1 đánh gia" chắc chắn.
        // Kiểm tra bằng code sẽ có đường trống khi 2 người gửi cùng lúc.
        review.HasIndex(x => x.BookingId).IsUnique();
        review.HasIndex(x => x.RoomId);

        review.HasOne(x => x.Booking)
            .WithOne(x => x.Review)
            .HasForeignKey<Review>(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);

        review.HasOne(x => x.User)
            .WithMany(x => x.Reviews)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        review.HasOne(x => x.Room)
            .WithMany(x => x.Reviews)
            .HasForeignKey(x => x.RoomId)
            .OnDelete(DeleteBehavior.Restrict);
    }


    /// <summary>
    /// Cấu hình bảng thanh toán.
    ///
    /// <para>
    /// Unique index trên <c>BookingId</c> là thứ bảo đảm "1 đơn = 1 phiếu thu" ở tầng CSDL,
    /// không phải bằng kiểm tra trong code — hai lần gọi API đồng thời sẽ không tạo được
    /// dòng thứ hai. Cùng cách làm với unique index trên <c>Reviews.BookingId</c>.
    /// </para>
    /// </summary>
    private static void ConfigurePayments(ModelBuilder modelBuilder)
    {
        var payment = modelBuilder.Entity<Payment>();
        payment.ToTable("Payments", table =>
        {
            table.HasCheckConstraint("CK_Payments_Amount", "`Amount` >= 0");
        });
        payment.HasKey(x => x.Id);
        // Tiền dùng `decimal(18,2)` như `Bookings.TotalAmount` — mặc định
        // `decimal(65,30)` của EF tốn gấp nhiều lần bộ nhớ và làm so sánh khó hiểu.
        payment.Property(x => x.Amount).HasColumnType("decimal(18,2)");
        payment.Property(x => x.Note).HasMaxLength(500);
        // Tìm theo trạng thái để lấy "đơn còn nợ tiền" mà không phải quét cả bảng.
        payment.HasIndex(x => x.Status);
        payment.HasIndex(x => x.BookingId).IsUnique();
        payment.HasOne(x => x.Booking)
            .WithMany(x => x.Payments)
            .HasForeignKey(x => x.BookingId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public override int SaveChanges()
    {
        ApplyTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    /// <summary>
    /// Tự điền CreatedAt/UpdatedAt ở đây thay vì mỗi service tự set.
    /// Nếu để mỗi service tự set thì sẽ có chỗ quên, mà quên thì lỗi dữ liệu không lộ ra cho đến khi thầy mở DB kiểm tra.
    /// </summary>
    private void ApplyTimestamps()
    {
        DateTime now = DateTime.Now;

        foreach (EntityEntry entry in ChangeTracker.Entries())
        {
            if (entry.State == EntityState.Added)
            {
                SetTimestamp(entry, nameof(Room.CreatedAt), now, onlyIfUnset: true);
                SetTimestamp(entry, nameof(Room.UpdatedAt), now, onlyIfUnset: true);
            }
            else if (entry.State == EntityState.Modified)
            {
                SetTimestamp(entry, nameof(Room.UpdatedAt), now, onlyIfUnset: false);
            }
        }
    }

    private static void SetTimestamp(EntityEntry entry, string propertyName, DateTime value, bool onlyIfUnset)
    {
        PropertyEntry? property = entry.Properties.FirstOrDefault(x => x.Metadata.Name == propertyName);
        if (property is null)
        {
            // BookingStatusHistory không có CreatedAt/UpdatedAt mà có ChangedAt — bỏ qua, không phải lỗi
            return;
        }

        bool isUnset = property.CurrentValue is DateTime current && current == default;
        if (!onlyIfUnset || isUnset)
        {
            property.CurrentValue = value;
        }
    }
}
