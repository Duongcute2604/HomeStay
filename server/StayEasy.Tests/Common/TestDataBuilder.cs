using StayEasy.Entities;
using StayEasy.Enums;

namespace StayEasy.Tests.Common;

/// <summary>
/// Tạo dữ liệu mẫu cho test. Gom vào một chỗ để không phải nhập tay dữ liệu ở từng test,
/// và để đổi dữ liệu mẫu chỉ sửa đúng một file.
/// </summary>
public static class TestDataBuilder
{
    /// <summary>
    /// Mốc thời gian cố định để test luôn cho kết quả giống nhau, không phụ thuộc ngày hôm nay.
    /// </summary>
    public static readonly DateTime CheckInTime = new(2026, 10, 1, 14, 0, 0);

    /// <summary>Mốc trả phòng: 12:00 hôm sau — khớp quy định nghiệp vụ.</summary>
    public static readonly DateTime CheckOutTime = new(2026, 10, 2, 12, 0, 0);

    public static User CreateCustomer(string email = "khach1@gmail.com", string fullName = "Nguyễn Văn A")
    {
        return new User
        {
            FullName = fullName,
            Email = email,
            PasswordHash = "hash-bcrypt-gia",
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE
        };
    }

    public static User CreateAdmin(string email = "admin@gmail.com")
    {
        return new User
        {
            FullName = "Quản trị viên",
            Email = email,
            PasswordHash = "hash-bcrypt-admin",
            Role = UserRole.ADMIN,
            Status = UserStatus.ACTIVE
        };
    }

    public static Location CreateLocation(string name = "Homestay Hưng Yên")
    {
        return new Location
        {
            Name = name,
            City = "Hưng Yên",
            Province = "Hưng Yên",
            Address = "Đường Nguyễn Trãi",
            IsActive = true
        };
    }

    public static Room CreateRoom(Location location, string roomNumber = "101")
    {
        return new Room
        {
            Location = location,
            LocationId = location.Id,
            Name = $"Phòng {roomNumber}",
            RoomNumber = roomNumber,
            RoomType = RoomType.STANDARD,
            Capacity = 2,
            PricePerHour = 120_000m,
            PricePerDay = 900_000m,
            Status = RoomStatus.AVAILABLE
        };
    }

    public static Booking CreateBooking(
        User user,
        Room room,
        string code = "HS-250930-4821",
        BookingType bookingType = BookingType.DAY,
        DateTime? checkIn = null,
        DateTime? checkOut = null)
    {
        return new Booking
        {
            Code = code,
            User = user,
            UserId = user.Id,
            Room = room,
            RoomId = room.Id,
            BookingType = bookingType,
            CheckIn = checkIn ?? CheckInTime,
            CheckOut = checkOut ?? CheckOutTime,
            GuestCount = 2,
            TotalAmount = 900_000m,
            PricePerHourSnapshot = 120_000m,
            PricePerDaySnapshot = 900_000m,
            Status = BookingStatus.PENDING
        };
    }

    public static Review CreateReview(Booking booking, int rating = 5)
    {
        return new Review
        {
            Booking = booking,
            BookingId = booking.Id,
            User = booking.User,
            UserId = booking.UserId,
            Room = booking.Room,
            RoomId = booking.RoomId,
            Rating = rating,
            Comment = "Phòng sạch, nhân viên thân thiện",
            IsHidden = false
        };
    }
}
