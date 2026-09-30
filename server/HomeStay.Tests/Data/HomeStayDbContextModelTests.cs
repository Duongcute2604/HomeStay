using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using HomeStay.Data;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Data;

/// <summary>
/// Kiểm chứng CẤU HÌNH 9 bảng của Bước 3: tên bảng, index, khoá chính, check constraint
/// và kiểu lưu của enum.
/// Mọi chức năng nghiệp vụ sau này đều đứng trên nền cấu hình này — hỏng ở đây thì mọi thứ phía trên đều hỏng theo.
/// </summary>
public class HomeStayDbContextModelTests
{
    private static readonly string[] ExpectedEntityNames =
    [
        "User", "Location", "Room", "RoomImage", "Amenity",
        "RoomAmenity", "Booking", "BookingStatusHistory", "Review"
    ];

    private static readonly string[] ExpectedTableNames =
    [
        "Amenities", "BookingStatusHistory", "Bookings", "Locations",
        "Reviews", "RoomAmenities", "RoomImages", "Rooms", "Users"
    ];

    // ---------- Cấu trúc ----------

    [Fact]
    public void Model_ChuaDung9Bang_DuDoiLuongBang()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        string[] actualNames = GetDesignTimeModel(context).GetEntityTypes().Select(x => x.ClrType.Name).ToArray();

        Assert.Equal(9, actualNames.Length);
        Assert.All(ExpectedEntityNames, expectedName => Assert.Contains(expectedName, actualNames));
    }

    [Fact]
    public void Model_DatTenBangBangPascalCase_SoNhiu()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        string[] actualTableNames = GetDesignTimeModel(context).GetEntityTypes()
            .Select(x => x.GetTableName())
            .OfType<string>()
            .OrderBy(x => x, StringComparer.Ordinal)
            .ToArray();

        Assert.Equal(ExpectedTableNames, actualTableNames);
    }

    // ---------- Enum lưu dạng chữ ----------

    [Theory]
    [InlineData(typeof(BookingStatus))]
    [InlineData(typeof(BookingType))]
    [InlineData(typeof(RoomStatus))]
    [InlineData(typeof(RoomType))]
    [InlineData(typeof(UserRole))]
    [InlineData(typeof(UserStatus))]
    public void Enum_LuuDangChu_KhiDocMySQLThayViDocSo(Type enumType)
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IProperty? property = GetDesignTimeModel(context)
            .GetEntityTypes()
            .SelectMany(x => x.GetProperties())
            .FirstOrDefault(x => x.ClrType == enumType);

        Assert.NotNull(property);

        // Kiểm tra kiểu cột thật trong MySQL. EF Core 8 không lưu enum thành ValueConverter
        // mà chuyển qua type mapping, nên phải đọc GetColumnType() mới biết nó lưu thành chữ hay số.
        string columnType = property!.GetColumnType()!;

        Assert.Equal("varchar(20)", columnType);
        Assert.Equal(typeof(string), property.GetProviderClrType());
    }

    // ---------- Ràng buộc duy nhất ----------

    [Fact]
    public void Users_Email_LamUnique_DeChongTrungTaiKhoanDangNhap()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType user = GetEntityType(context, typeof(User));

        Assert.True(HasUniqueIndexOn(user, "Email"));
    }

    [Fact]
    public void Bookings_Code_LamUnique_DeDungMaHienThiThayChoId()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType booking = GetEntityType(context, typeof(Booking));

        Assert.True(HasUniqueIndexOn(booking, "Code"));
    }

    [Fact]
    public void Reviews_BookingId_LamUnique_DeDamBaoMotDonMotDanhGia()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType review = GetEntityType(context, typeof(Review));

        Assert.True(HasUniqueIndexOn(review, "BookingId"));
    }

    // ---------- Index phục vụ truy vấn ----------

    [Theory]
    [InlineData("RoomId")]
    [InlineData("CheckIn", "CheckOut")]
    [InlineData("Status")]
    [InlineData("UserId")]
    public void Bookings_CoIndexCongBoKiemTraTrungLich(string firstProperty, params string[] otherProperties)
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType booking = GetEntityType(context, typeof(Booking));
        string[] propertyNames = [firstProperty, .. otherProperties];

        Assert.True(
            HasIndexOn(booking, propertyNames),
            $"Thiếu index trên Bookings({string.Join(", ", propertyNames)}) — "
            + "thiếu index thì mỗi lần đặt phòng phải quét cả bảng bookings.");
    }

    [Fact]
    public void RoomAmenities_DungKhoaChinhGhep_DeChanTrungTienNghi()
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType link = GetEntityType(context, typeof(RoomAmenity));
        string[] primaryKeyProperties = link.FindPrimaryKey()!.Properties.Select(x => x.Name).ToArray();

        Assert.Equal(["RoomId", "AmenityId"], primaryKeyProperties);
    }

    // ---------- Check constraint ----------

    [Theory]
    [InlineData(typeof(Room), "CK_Rooms_Capacity")]
    [InlineData(typeof(Room), "CK_Rooms_Price")]
    [InlineData(typeof(Room), "CK_Rooms_Rating")]
    [InlineData(typeof(Booking), "CK_Bookings_TimeRange")]
    [InlineData(typeof(Booking), "CK_Bookings_GuestCount")]
    [InlineData(typeof(Review), "CK_Reviews_Rating")]
    public void Model_CoCheckConstraint_ChanDuLieuVoLy(Type entityClrType, string expectedName)
    {
        using HomeStayDbContext context = TestDbContextFactory.CreateForSchemaInspection();

        IEntityType entityType = GetEntityType(context, entityClrType);
        bool hasConstraint = entityType.GetCheckConstraints().Any(x => x.Name == expectedName);

        Assert.True(hasConstraint, $"Thiếu check constraint '{expectedName}' trên bảng {entityClrType.Name}");
    }

    // ---------- Hàm phụ ----------

    private static IEntityType GetEntityType(HomeStayDbContext context, Type clrType)
    {
        return GetDesignTimeModel(context).FindEntityType(clrType)
            ?? throw new InvalidOperationException($"Model không có entity {clrType.Name}");
    }

    private static bool HasIndexOn(IEntityType entityType, params string[] propertyNames)
    {
        return entityType.GetIndexes()
            .Any(x => x.Properties.Select(p => p.Name).SequenceEqual(propertyNames));
    }

    private static bool HasUniqueIndexOn(IEntityType entityType, params string[] propertyNames)
    {
        return entityType.GetIndexes()
            .Any(x => x.IsUnique && x.Properties.Select(p => p.Name).SequenceEqual(propertyNames));
    }

    /// <summary>
    /// context.Model là model tối ưu cho đọc lúc chạy — nó CỐ TÌNH bỏ các thông tin chỉ dùng cho MySQL
    /// như tên bảng, check constraint và cách chuyển enum thành chữ.
    /// Muốn kiểm tra cấu hình đó thì phải lấy model thiết kế.
    /// </summary>
    private static IModel GetDesignTimeModel(HomeStayDbContext context)
    {
        return context.GetService<IDesignTimeModel>().Model;
    }
}
