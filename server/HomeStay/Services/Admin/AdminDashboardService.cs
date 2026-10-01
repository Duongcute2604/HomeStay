using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Enums;

namespace HomeStay.Services.Admin;

/// <summary>
/// Tính số liệu thống kê cho trang quản trị.
///
/// <para><b>Ba định nghĩa nghiệp vụ phải chốt rõ, nếu không số liệu sẽ bị hiểu sai:</b></para>
///
/// <list type="number">
/// <item><b>Doanh thu</b> = tổng <c>TotalAmount</c> của đơn <c>COMPLETED</c>, xếp theo
/// tháng <b>trả phòng</b> (<c>CheckOut</c>). Không tính đơn đang chờ xác nhận
/// vì tiền đó khách còn hủy được. Cũng không tính <c>CANCELLED</c>/<c>REJECTED</c>.</item>
///
/// <item><b>Số đơn theo tháng</b> = đếm đơn theo tháng <b>tạo</b> (<c>CreatedAt</c>),
/// mọi trạng thái. Khác cơ sở với doanh thu là có chủ ý: tháng nào người ta đặt
/// và tháng nào tiền vào là hai câu hỏi khác nhau.</item>
///
/// <item><b>Tỷ lệ lấp đầy</b> = (số đêm phòng đã bán) ÷ (số phòng × số ngày
/// trong khoảng). "Đã bán" tính cho đơn <c>COMPLETED</c> hoặc
/// <c>CHECKED_IN</c> — tức khách <b>thực sự đã ở</b>. Đơn chỉ mới đặt thì
/// phòng chưa bị chiếm, tính vào sẽ thổi phồng tỷ lệ lấp đầy.</item>
/// </list>
///
/// <para>
/// Gom số liệu bằng LINQ trong RAM thay vì <c>GROUP BY</c> trong SQL: cột enum
/// trong CSDL lưu dạng chuỗi nên phải viết <c>GROUP BY YEAR(), MONTH()</c> bằng SQL
/// thô cho mỗi bảng, dễ sai hơn nhiều so với lọc sẵn ở CSDL rồi gom. Dữ liệu
/// đồ án chỉ vài chục dòng nên không đáng kể.
/// </para>
/// </summary>
public class AdminDashboardService : IAdminDashboardService
{
    /// <summary>Chỉ các đơn này mới được tính là khách đã thực sự ở trong phòng.</summary>
    private static readonly BookingStatus[] TrangThaiDaO =
        [BookingStatus.CHECKED_IN, BookingStatus.COMPLETED];

    /// <summary>Số phòng lấy trong bảng xếp hạng.</summary>
    private const int SoPhongTop = 5;

    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public AdminDashboardService(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<DashboardDto> LaySoLieuAsync(int soThang, int soNgay, CancellationToken ct)
    {
        int thang = soThang is < 1 or > 24 ? 6 : soThang;
        int ngay = soNgay is < 1 or > 365 ? 30 : soNgay;

        DateTime homNay = DateTime.Now.Date;
        DateTime dauKy = homNay.AddDays(-(ngay - 1));

        int tongSoPhong = await _db.Rooms.CountAsync(ct);
        int soDemDaBan = await LaySoDemDaBanAsync(dauKy, homNay, ct);
        (double tyLe, int daBan, int tongCong) = TinhTyLeLapDay(soDemDaBan, tongSoPhong, ngay);

        return new DashboardDto
        {
            TuNgay = dauKy.ToString("yyyy-MM-dd"),
            DenNgay = homNay.ToString("yyyy-MM-dd"),
            TongQuan = await LayTongQuanAsync(homNay, tongSoPhong, ct),
            TheoThang = await LayTheoThangAsync(thang, ct),
            TopPhong = await LayTopPhongAsync(ct),
            TrangThaiPhong = await LayTrangThaiPhongAsync(ct),
            TyLeLapDay = tyLe,
            DemDaBan = daBan,
            DemTongCong = tongCong,
        };
    }

    /// <summary>Số liệu 6 con số ở đầu trang.</summary>
    private async Task<DashboardOverviewDto> LayTongQuanAsync(
        DateTime homNay, int tongSoPhong, CancellationToken ct)
    {
        DateTime dauThang = new(homNay.Year, homNay.Month, 1);
        DateTime dauThangSau = dauThang.AddMonths(1);

        // Doanh thu tháng này tính theo tháng TRẢ PHÒNG, đồng bộ với biểu đồ.
        // Doanh thu lấy từ bảng `Payments` chứ không từ `Bookings.TotalAmount`.
        // Khác biệt này quan trọng: một đơn đã hoàn thành nhưng khách chưa trả tiền thì
        // CHƯA phải doanh thu. Tính từ `Bookings` sẽ thổi phóng con số — cũng chính là lỗi
        // đã xảy ra ở Bước 15 khi cắt phần giờ của `(den - tu).Days`.
        decimal doanhThuThangNay = await _db.Payments
            .Where(phieu => phieu.Status == PaymentStatus.PAID
                && phieu.PaidAt >= dauThang
                && phieu.PaidAt < dauThangSau)
            .SumAsync(phieu => phieu.Amount, ct);

        return new DashboardOverviewDto
        {
            TongDon = await _db.Bookings.CountAsync(ct),
            DonThangNay = await _db.Bookings.CountAsync(
                don => don.CreatedAt >= dauThang && don.CreatedAt < dauThangSau, ct),
            DoanhThuThangNay = doanhThuThangNay,
            TongPhong = tongSoPhong,
            TongKhach = await _db.Users.CountAsync(user => user.Role == UserRole.CUSTOMER, ct),
            PhongDangCoKhach = await _db.Rooms.CountAsync(
                phong => phong.Status == RoomStatus.OCCUPIED, ct),
        };
    }

    /// <summary>
    /// Dựng đủ N tháng gần nhất, tháng nào không có dữ liệu vẫn giữ 0.
    ///
    /// Bỏ tháng rỗng sẽ khiến trục ngang của biểu đồ tụt mất tháng, người đọc
    /// tưởng tháng đó không tồn tại. Giữ 0 thì nhìn thấy rõ "tháng này chưa bán
    /// được gì" — đó cũng là thông tin cần biết.
    /// </summary>
    private async Task<List<MonthlyStatDto>> LayTheoThangAsync(int soThang, CancellationToken ct)
    {
        DateTime thangDau = new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1)
            .AddMonths(-(soThang - 1));
        DateTime thangSau = thangDau.AddMonths(soThang);

        // Biểu đồ cũng lấy tiền đã thu — phải khớp với ô "Doanh thu tháng này" ở trên,
        // nếu không thì cùng một tháng mà hai nơi ra hai con số khác nhau.
        List<Entities.Payment> phieuDaThu = await _db.Payments
            .AsNoTracking()
            .Where(phieu => phieu.Status == PaymentStatus.PAID
                && phieu.PaidAt >= thangDau && phieu.PaidAt < thangSau)
            .ToListAsync(ct);

        List<Entities.Booking> donTrongKy = await _db.Bookings
            .AsNoTracking()
            .Where(don => don.CreatedAt >= thangDau && don.CreatedAt < thangSau)
            .ToListAsync(ct);

        var result = new List<MonthlyStatDto>(soThang);

        for (int i = 0; i < soThang; i++)
        {
            DateTime thang = thangDau.AddMonths(i);

            result.Add(new MonthlyStatDto
            {
                Thang = thang.ToString("yyyy-MM"),
                Nhan = $"T{thang.Month}",
                // Dùng `is DateTime` thay vì `.Value`: cột `PaidAt` là nullable, nên
                // `.Value` sẽ ném `InvalidOperationException` nếu có phiếu đã đánh dấu
                // thu mà chưa ghi thời điểm — và trình biên dịch cảnh báo đúng điểm đó.
                DoanhThu = phieuDaThu
                    .Where(phieu => phieu.PaidAt is DateTime daThu
                        && daThu.Year == thang.Year && daThu.Month == thang.Month)
                    .Sum(phieu => phieu.Amount),
                SoDon = donTrongKy.Count(
                    don => don.CreatedAt.Year == thang.Year && don.CreatedAt.Month == thang.Month),
            });
        }

        return result;
    }

    /// <summary>Tổng số đêm phòng đã bán trong khoảng, tính từ các đơn thực sự đã ở.</summary>
    private async Task<int> LaySoDemDaBanAsync(DateTime tuNgay, DateTime denNgay, CancellationToken ct)
    {
        List<Entities.Booking> donDaO = await _db.Bookings
            .AsNoTracking()
            .Where(don => TrangThaiDaO.Contains(don.Status)
                && don.CheckIn <= denNgay
                && don.CheckOut >= tuNgay)
            .ToListAsync(ct);

        return donDaO.Sum(don => DemSoNgayTrongKhoang(don.CheckIn, don.CheckOut, tuNgay, denNgay));
    }

    /// <summary>
    /// Tính tỷ lệ lấp đầy từ hai con số đã gom, giữ hàm thuần tuý để dễ test.
    /// </summary>
    public static (double TyLeLapDay, int DemDaBan, int DemTongCong) TinhTyLeLapDay(
        int soDemDaBan, int tongSoPhong, int soNgay)
    {
        int tongCong = tongSoPhong * soNgay;

        // Không chia cho 0: hệ thống chưa có phòng nào thì tỷ lệ lấp đầy là 0,
        // không phải lỗi — giao diện hiện "0%".
        double tyLe = tongCong == 0 ? 0d : (double)soDemDaBan / tongCong;

        return (Math.Round(tyLe, 4), soDemDaBan, tongCong);
    }

    /// <summary>Số phòng theo từng trạng thái, luôn có đủ 5 trạng thái (kể cả 0 phòng).</summary>
    private async Task<List<RoomStatusCountDto>> LayTrangThaiPhongAsync(CancellationToken ct)
    {
        List<Entities.Room> tatCa = await _db.Rooms.AsNoTracking().ToListAsync(ct);

        return Enum.GetValues<RoomStatus>()
            .Select(trangThai => new RoomStatusCountDto
            {
                TrangThai = trangThai,
                SoPhong = tatCa.Count(phong => phong.Status == trangThai),
            })
            .ToList();
    }

    /// <summary>5 phòng có doanh thu cao nhất, tính từ đơn đã hoàn thành.</summary>
    private async Task<List<TopRoomDto>> LayTopPhongAsync(CancellationToken ct)
    {
        return await _db.Bookings
            .AsNoTracking()
            .Where(don => don.Status == BookingStatus.COMPLETED)
            .GroupBy(don => new { don.RoomId, TenPhong = don.Room.Name, TenCoSo = don.Room.Location.Name })
            .Select(g => new TopRoomDto
            {
                TenPhong = g.Key.TenPhong,
                TenCoSo = g.Key.TenCoSo,
                SoDon = g.Count(),
                DoanhThu = g.Sum(don => don.TotalAmount),
            })
            .OrderByDescending(phong => phong.DoanhThu)
            .ThenBy(phong => phong.TenPhong)
            .Take(SoPhongTop)
            .ToListAsync(ct);
    }

    /// <summary>
    /// Số đêm một đơn chiếm mô phỏng trong khoảng đang thống kê.
    ///
    /// Cắt hai đầu về khoảng trước khi trừ, nếu không thì đơn 3 đêm nhưng
    /// khoảng chỉ có 1 ngày lại ra 3.
    ///
    /// Phải cắt về <b>ngày</b> (`.Date`) chứ không dùng `(den - tu).Days`:
    /// khách nhận phòng 14:00 ngày 9 và trả phòng 12:00 ngày 11 thì đã ở
    /// <b>2 đêm</b> (đêm 9 và đêm 10). Trừ thẳng thời gian rồi cắt cụt ra 1 —
    /// thiếu một đêm cho MỌI đơn, mà giờ nhận/trả là quy định cố định nên lỗi
    /// này không bao giờ lộ với dữ liệu test dùng 00:00.
    /// </summary>
    public static int DemSoNgayTrongKhoang(
        DateTime checkIn, DateTime checkOut, DateTime khoangTu, DateTime khoangDen)
    {
        DateTime tu = checkIn > khoangTu ? checkIn : khoangTu;
        DateTime den = checkOut < khoangDen ? checkOut : khoangDen;

        return den > tu ? (den.Date - tu.Date).Days : 0;
    }
}
