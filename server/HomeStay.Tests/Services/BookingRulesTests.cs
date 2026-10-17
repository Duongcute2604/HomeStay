using HomeStay.Services.Booking;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng quy tắc giá 3 giờ đầu theo diện tích — quy tắc này quyết định
/// phòng nhỏ trả 200.000 hay phòng lớn trả 300.000 nên sai là thu sai tiền.
/// </summary>
public class BookingRulesTests
{
    [Fact]
    public void TinhGiaBaGioDau_DienTich40VuongTroXuong_GiaPhongNho()
    {
        // 40 m² là mốc "phòng nhỏ" — đúng bằng mốc vẫn tính nhỏ.
        Assert.Equal(BookingRules.SmallRoomBasePrice, BookingRules.TinhGiaBaGioDau(40m));
        Assert.Equal(200_000m, BookingRules.TinhGiaBaGioDau(35m));
    }

    [Fact]
    public void TinhGiaBaGioDau_Vuot40_GiaPhongLon()
    {
        Assert.Equal(BookingRules.LargeRoomBasePrice, BookingRules.TinhGiaBaGioDau(41m));
        Assert.Equal(300_000m, BookingRules.TinhGiaBaGioDau(55.5m));
    }

    [Fact]
    public void TinhGiaBaGioDau_41DiVuongTroXuong_TrongGiaPhongNho_VoiPhongLon()
    {
        // 40,1 m² đã là phòng lớn — ranh giới phải sắc, không làm tròn về 40.
        Assert.Equal(BookingRules.LargeRoomBasePrice, BookingRules.TinhGiaBaGioDau(40.1m));
    }

    [Fact]
    public void KhungGioDauVaGiaThemMoiGio_KhopQuyTacDaChot()
    {
        // Khung trọn gói là 3 giờ, mỗi giờ vượt cộng 50.000 — đừng đổi lệch
        // khỏi phần hiển thị ở giao diện (pricing.ts).
        Assert.Equal(3, BookingRules.BaseHoursForHourlyBooking);
        Assert.Equal(3, BookingRules.MinHoursForHourlyBooking);
        Assert.Equal(50_000m, BookingRules.ExtraHourPrice);
    }
}
