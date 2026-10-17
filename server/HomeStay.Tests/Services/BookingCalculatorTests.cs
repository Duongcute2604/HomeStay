using HomeStay.Enums;
using HomeStay.Services.Booking;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng công thức tính tiền — hàm này quyết định khách trả bao nhiêu nên sai số là mất tiền thật.
/// Chạy trên hàm thuần nên không cần dựng database, kết quả trong mili giây.
/// </summary>
public class BookingCalculatorTests
{
    [Fact]
    public void TinhSoDonVi_DatTheoGio_ThuNhanSoGio()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 20, 0, 0);

        int soDonVi = BookingCalculator.TinhSoDonVi(BookingType.HOUR, checkIn, checkOut);

        Assert.Equal(6, soDonVi);
    }

    [Fact]
    public void TinhSoDonVi_DatTheoGio_ChuaTrònLenNeuDungMotGio()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 15, 0, 0);

        int soDonVi = BookingCalculator.TinhSoDonVi(BookingType.HOUR, checkIn, checkOut);

        Assert.Equal(1, soDonVi);
    }

    [Fact]
    public void TinhSoDonVi_DatTheoGio_ThieuMotPhut_PhaiLamTronLenGioKeTiep()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 17, 0, 1);

        int soDonVi = BookingCalculator.TinhSoDonVi(BookingType.HOUR, checkIn, checkOut);

        // 3 giờ 1 phút vẫn phải tính 4 giờ — cắt phút thì lúc nào cũng bị khách khiếu nại
        Assert.Equal(4, soDonVi);
    }

    [Fact]
    public void TinhSoDonVi_MotDemTheoQuyDinh_TinhMotNgay()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 2, 12, 0, 0);

        int soDonVi = BookingCalculator.TinhSoDonVi(BookingType.DAY, checkIn, checkOut);

        // 14:00 hôm nay → 12:00 ngày mai là 22 giờ, vẫn là 1 đêm chứ không phải 2 ngày
        Assert.Equal(1, soDonVi);
    }

    [Fact]
    public void TinhTien_DatTheoNgay_BaDem_ThuBaLanGiaNgay()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 4, 12, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.DAY, 120_000m, 900_000m, checkIn, checkOut);

        Assert.Equal(2_700_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_DungBaGio_ThuTronGoiGiaCoSoBaGioDau()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 17, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 120_000m, 900_000m, checkIn, checkOut);

        // 3 giờ đầu tính TRỌN GÓI giá cơ sở (chốt với người dùng 16/10):
        // không nhân 3 lần nữa. Đúng 3 giờ = đúng giá cơ sở.
        Assert.Equal(120_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_BonGio_ThemDungMotGioVuotQua()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 18, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 200_000m, 900_000m, checkIn, checkOut);

        // 200.000 (3 giờ đầu) + 1 giờ vượt × 50.000 = 250.000.
        Assert.Equal(250_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_SauGio_ThemBaGioVuotQua()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 20, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 300_000m, 900_000m, checkIn, checkOut);

        // 300.000 (3 giờ đầu phòng lớn) + 3 giờ vượt × 50.000 = 450.000.
        Assert.Equal(450_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_NuocNgot_ChiuThem50NganMoiGio()
    {
        // 3 giờ 1 phút → làm tròn lên 4 giờ → chỉ 1 giờ vượt quá khung 3 giờ đầu.
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 17, 0, 1);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 200_000m, 900_000m, checkIn, checkOut);

        Assert.Equal(250_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_KhongDungGiaNgay()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 19, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 120_000m, 900_000m, checkIn, checkOut);

        // 120.000 (3 giờ đầu) + 2 giờ vượt × 50.000 = 220.000 —
        // vẫn không bao giờ dùng giá ngày (900.000).
        Assert.Equal(220_000m, tongTien);
    }
}
