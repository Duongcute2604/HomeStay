namespace StayEasy.Services.Booking;

/// <summary>
/// Các con số cố định của nghiệp vụ đặt phòng.
/// Gom một chỗ để khi GVHD hỏi "tối thiểu mấy giờ" thì chỉ vào đúng một dòng,
/// thay vì phải lục khắp code xem có chỗ nào ghi khác nhau không.
/// </summary>
public static class BookingRules
{
    /// <summary>Đặt theo giờ phải đủ số giờ này trở lên, tính từ lúc khách nhận phòng.</summary>
    public const int MinHoursForHourlyBooking = 3;

    /// <summary>Khách phải đặt trước tối thiểu số giờ này kể từ thời điểm đặt.</summary>
    public const int MinHoursAdvanceNotice = 2;

    /// <summary>Sau khi khách trả phòng, phòng phải vệ sinh số giờ này mới cho đặt tiếp.</summary>
    public const int CleaningHoursAfterCheckout = 2;

    /// <summary>Giờ nhận phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckInHour = 14;

    /// <summary>Giờ trả phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckOutHour = 12;
}
