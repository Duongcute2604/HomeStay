using HomeStay.Services.Bookings;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng việc dò mã lỗi CSDL khi 2 request đặt phòng trùng chạy song song.
///
/// <para><b>Vì sao bước này tồn tại:</b> khi InnoDB báo DEADLOCK, mã lỗi MySQL
/// nằm trong <c>MySqlException.Number</c>. Bản sửa đầu tiên của tôi so
/// <c>DbException.ErrorCode</c> với 1213 — nhưng với MySqlConnector,
/// <c>ErrorCode</c> trả về HResult (<c>0x80004005</c>) chứ không phải mã lỗi, nên
/// điều kiện không bao giờ đúng và hệ thống vẫn trả 500. Bài học nằm ở
/// <c>lessons.md</c> mục 75.</para>
///
/// <para><b>Vì sao test được ở đây:</b> không tạo được <c>MySqlException</c> trong
/// unit test (constructor của nó là <c>internal</c>). Nên phần kiểm mã lỗi được tách
/// thành hàm thuần <see cref="BookingService.LaMaLoiTranhChung"/> — chỉ cần một con
/// số. Phần còn lại (duyệt chuỗi exception) chỉ kiểm được bằng MySQL thật, và đó
/// chính là lý do tồn tại bộ test Postman của Bước 18 (3 test chống đặt trùng).</para>
/// </summary>
public class RaceConditionTests
{
    [Theory]
    [InlineData(1213)] // DEADLOCK — hai transaction đợi khoá của nhau
    [InlineData(1205)] // LOCK WAIT TIMEOUT — chờ khoá quá lâu
    [InlineData(1062)] // vi phạm UNIQUE INDEX
    public void LaMaLoiTranhChung_MaLoiTrungChung_TraVeTrue(int maLoi)
    {
        // Cả ba đều nghĩa là "chỗ này đã có người trước" ⇒ phải trả 409 cho
        // người dùng, không phải 500 (lỗi hệ thống).
        Assert.True(BookingService.LaMaLoiTranhChung(maLoi));
    }

    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(1045)] // Access denied — sai thông tin kết nối, KHÔNG phải trùng lịch
    [InlineData(1049)] // Unknown database
    [InlineData(1146)] // Table không tồn tại
    [InlineData(-1)]
    [InlineData(int.MinValue)]
    public void LaMaLoiTranhChung_MaLoiKhac_TraVeFalse(int maLoi)
    {
        // Quan trọng: lỗi CSDL khác (sai cấu hình, hết kết nối) phải đi ra 500 như
        // bình thường. Biến mọi lỗi thành 409 sẽ khiến Admin tưởng phòng đã kín
        // trong khi thực ra hệ thống đang hỏng.
        Assert.False(BookingService.LaMaLoiTranhChung(maLoi));
    }

    [Fact]
    public void LaMaLoiTranhChung_KhongNham_HResult_CuaMySqlConnector()
    {
        // Bản sửa sai lần đầu dùng ErrorCode; với MySqlConnector nó là HResult
        // dạng số âm. Test này khoá lại để không ai vô tình quay về dùng ErrorCode.
        Assert.False(BookingService.LaMaLoiTranhChung(unchecked((int)0x80004005)));
        Assert.True(BookingService.LaMaLoiTranhChung(1213));
    }
}
