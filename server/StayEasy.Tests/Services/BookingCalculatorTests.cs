using StayEasy.Enums;
using StayEasy.Services.Booking;

namespace StayEasy.Tests.Services;

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
    public void TinhTien_DatTheoGio_DungBaGio_ThuDungBaLanGiaGio()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 17, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 120_000m, 900_000m, checkIn, checkOut);

        Assert.Equal(360_000m, tongTien);
    }

    [Fact]
    public void TinhTien_DatTheoGio_KhongDungGiaNgay()
    {
        DateTime checkIn = new(2026, 10, 1, 14, 0, 0);
        DateTime checkOut = new(2026, 10, 1, 19, 0, 0);

        decimal tongTien = BookingCalculator.TinhTien(BookingType.HOUR, 120_000m, 900_000m, checkIn, checkOut);

        // 5 × 120.000 = 600.000, không phải 900.000 của giá ngày
        Assert.Equal(600_000m, tongTien);
    }
}
