namespace HomeStay.Services.Booking;

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

    /// <summary>
    /// 3 giờ đầu tính TRỌN GÓI một giá cơ sở (phòng nhỏ 200.000, phòng lớn
    /// 300.000 theo diện tích), không nhân theo số giờ. Quy tắc này do người
    /// dùng chốt ngày 16/10, thay cho cách tính cũ "số giờ × giá giờ".
    /// </summary>
    public const int BaseHoursForHourlyBooking = 3;

    /// <summary>
    /// Giá mỗi giờ VƯỢT QUÁ khung 3 giờ đầu — cộng thêm vào giá cơ sở.
    /// </summary>
    public const decimal ExtraHourPrice = 50_000m;

    /// <summary>Diện tích (m²) tối đa của phòng nhỏ — hơn mức này là phòng lớn.</summary>
    public const decimal SmallRoomMaxArea = 40m;

    /// <summary>Giá 3 giờ đầu mặc định của phòng nhỏ.</summary>
    public const decimal SmallRoomBasePrice = 200_000m;

    /// <summary>Giá 3 giờ đầu mặc định của phòng lớn.</summary>
    public const decimal LargeRoomBasePrice = 300_000m;

    /// <summary>
    /// Giá 3 giờ đầu mặc định theo diện tích phòng (chốt với người dùng 16/10):
    /// ≤ 40 m² là phòng nhỏ, hơn là phòng lớn. Dùng cho dữ liệu seed và làm
    /// gợi ý mặc định khi Admin tạo phòng mới — Admin vẫn tự sửa được giá sau đó.
    /// </summary>
    /// <param name="dienTich">Diện tích phòng tính bằng m².</param>
    public static decimal TinhGiaBaGioDau(decimal dienTich) =>
        dienTich <= SmallRoomMaxArea ? SmallRoomBasePrice : LargeRoomBasePrice;

    /// <summary>Khách phải đặt trước tối thiểu số giờ này kể từ thời điểm đặt.</summary>
    public const int MinHoursAdvanceNotice = 2;

    /// <summary>Giờ nhận phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckInHour = 14;

    /// <summary>Giờ trả phòng quy định khi thuê theo ngày.</summary>
    public const int StandardCheckOutHour = 12;

    /// <summary>
    /// Sau khi khách trả phòng, phòng phải vệ sinh tối thiểu số giờ này mới
    /// nhận đơn mới. Bắt buộc 2 giờ theo quy định nghiệp vụ — có unit test
    /// (`CanDatPhongDangDọnDep_PhaiChoHetGioVeSinh`).
    /// </summary>
    public const int CleaningHoursAfterCheckout = 2;
}
