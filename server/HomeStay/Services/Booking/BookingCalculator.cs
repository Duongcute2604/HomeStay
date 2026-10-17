using HomeStay.Enums;

namespace HomeStay.Services.Booking;

/// <summary>
/// Tính tiền và suy ra số đơn vị thuê từ một khoảng thời gian.
///
/// Vì sao tách riêng: nếu để trong BookingService thì muốn kiểm chứng công thức tính tiền
/// cũng phải dựng cả database. Tách ra thành hàm thuần thì unit test chạy trong mili giây.
/// </summary>
public static class BookingCalculator
{
    /// <summary>
    /// Tổng tiền của một đơn.
    ///
    /// Theo ngày: số ngày × giá ngày (giữ nguyên cách tính cũ).
    /// Theo giờ (chốt với người dùng 16/10): 3 giờ đầu tính TRỌN GÓI giá cơ
    /// sở — tức `giaTheoGio` là giá cho khung 3 giờ đầu, không phải giá 1 giờ —
    /// rồi mỗi giờ vượt quá cộng thêm <see cref="BookingRules.ExtraHourPrice"/>.
    /// </summary>
    /// <param name="loai">Khách thuê theo giờ hay theo ngày.</param>
    /// <param name="giaTheoGio">Giá TRỌN GÓI cho 3 giờ đầu (phòng nhỏ 200.000, lớn 300.000).</param>
    /// <param name="giaTheoNgay">Giá của 1 ngày.</param>
    /// <param name="checkIn">Thời điểm nhận phòng.</param>
    /// <param name="checkOut">Thời điểm trả phòng.</param>
    public static decimal TinhTien(
        BookingType loai,
        decimal giaTheoGio,
        decimal giaTheoNgay,
        DateTime checkIn,
        DateTime checkOut)
    {
        if (loai != BookingType.HOUR)
        {
            return giaTheoNgay * TinhSoDonVi(BookingType.DAY, checkIn, checkOut);
        }

        int soGio = TinhSoDonVi(BookingType.HOUR, checkIn, checkOut);
        int gioVuotQua = Math.Max(0, soGio - BookingRules.BaseHoursForHourlyBooking);

        return giaTheoGio + gioVuotQua * BookingRules.ExtraHourPrice;
    }

    /// <summary>
    /// Số đơn vị thuê: đặt theo giờ thì tính giờ, đặt theo ngày thì tính ngày.
    ///
    /// Luôn làm tròn LÊN vì khách ở dở một ngày thì vẫn phải trả tiền trọn ngày đó —
    /// ví dụ nhận phòng 14:00 hôm nay, trả phòng 09:00 ngày mai (19 giờ) vẫn tính 1 ngày.
    /// </summary>
    public static int TinhSoDonVi(BookingType loai, DateTime checkIn, DateTime checkOut)
    {
        TimeSpan khoangThoiGian = checkOut - checkIn;

        return loai == BookingType.HOUR
            ? (int)Math.Ceiling(khoangThoiGian.TotalHours)
            : (int)Math.Ceiling(khoangThoiGian.TotalDays);
    }
}
