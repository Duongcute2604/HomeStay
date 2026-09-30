namespace StayEasy.Services.Booking;

/// <summary>
/// Các con số cố định của nghiệp vụ đặt phòng.
/// Gom một chỗ để khi GVHD hỏi "tối thiểu mấy giờ" thì chỉ vào đúng một dòng,
/// thay vì phải lục khắp code xem có chỗ nào ghi khác nhau không.
///
/// Lưu ý: quy tắc "sau khi trả phòng phải vệ sinh 2 giờ" đã bị gỡ khỏi đây vì
/// **chưa có dòng code nào thực thi nó** (AGENTS.md 3.4 cấm code thừa cho tương
/// lai). Sẽ thêm lại cùng lúc với Bước 10, kèm unit test. Thêm mà không có test
/// thì lại là một con số nằm im không ai kiểm chứng.
/// </summary>
public static class BookingRules
{
    /// <summary>Đặt theo giờ phải đủ số giờ này trở lên, tính từ lúc khách nhận phòng.</summary>
    public const int MinHoursForHourlyBooking = 3;

    /// <summary>Khách phải đặt trước tối thiểu số giờ này kể từ thời điểm đặt.</summary>
    public const int MinHoursAdvanceNotice = 2;

    /// <summary>Giờ nhận phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckInHour = 14;

    /// <summary>Giờ trả phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckOutHour = 12;
}
