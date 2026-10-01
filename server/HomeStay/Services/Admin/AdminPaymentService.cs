using System.Net;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Payments;
using Microsoft.EntityFrameworkCore;

namespace HomeStay.Services.Admin;

/// <summary>
/// Quản lý phiếu thu phía Admin.
///
/// <para>
/// Vì sao có cả "đã thu" và "thất bại": khách báo chuyển khoản nhưng tiền chưa về là
/// chuyện thật. Nếu chỉ có hai trạng thái thì hoặc phải ghi nhận oan (tiền chưa về mà báo
/// đã thu — sai doanh thu), hoặc phải báo thất bại rồi xoá (mất dấu vết). Trạng thái
/// <c>FAILED</c> giữ lại lịch sử và cho khách mở giao dịch mới.
/// </para>
/// </summary>
public sealed class AdminPaymentService : IAdminPaymentService
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public AdminPaymentService(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<PaymentDto>> LayDanhSachAsync(
        int? trangThai, int page, int pageSize, CancellationToken ct)
    {
        IQueryable<Payment> query = _db.Payments
            .AsNoTracking()
            .Include(x => x.Booking).ThenInclude(x => x.Room).ThenInclude(x => x.Location);

        if (trangThai.HasValue)
        {
            if (!Enum.IsDefined(typeof(PaymentStatus), trangThai.Value))
            {
                throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DuLieuKhongHopLe);
            }

            int giaTri = trangThai.Value;
            query = query.Where(x => (int)x.Status == giaTri);
        }

        int tongSo = await query.CountAsync(ct);
        List<Payment> hang = await query
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResultDto<PaymentDto>
        {
            Items = hang.Select(ChuyenDoi).ToList(),
            Page = page,
            PageSize = pageSize,
            TotalItems = tongSo,
            TotalPages = tongSo == 0 ? 0 : (int)Math.Ceiling(tongSo / (double)pageSize),
        };
    }

    /// <inheritdoc />
    public async Task<PaymentDto> DanhDauDaThuAsync(
        int id, UpdatePaymentRequest request, CancellationToken ct)
    {
        if (!Enum.IsDefined(typeof(PaymentMethod), request.Method))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DuLieuKhongHopLe);
        }

        Payment phieu = await TimPhieuAsync(id, ct);
        KiemTraChoPhepThu(phieu);
        await KiemTraTienKhongKhopAsync(phieu, ct);

        phieu.Status = PaymentStatus.PAID;
        phieu.Method = (PaymentMethod)request.Method;
        phieu.PaidAt = DateTime.Now;
        phieu.UpdatedAt = phieu.PaidAt.Value;
        if (!string.IsNullOrWhiteSpace(request.Note))
        {
            phieu.Note = request.Note.Trim();
        }

        await _db.SaveChangesAsync(ct);
        return await TaiLaiAsync(phieu.Id, ct);
    }

    /// <inheritdoc />
    public async Task<PaymentDto> DanhDauThatBaiAsync(int id, string? lyDo, CancellationToken ct)
    {
        Payment phieu = await TimPhieuAsync(id, ct);

        if (phieu.Status == PaymentStatus.PAID)
        {
            // Đã thu rồi thì không được đánh thất bại — sẽ làm doanh thu trong tháng mất
            // số tiền đã thu, mà người đã trả tiền thì không lấy lại được.
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.DaThuTienRoi);
        }

        phieu.Status = PaymentStatus.FAILED;
        phieu.PaidAt = null;
        phieu.UpdatedAt = DateTime.Now;
        phieu.Note = string.IsNullOrWhiteSpace(lyDo) ? null : lyDo.Trim();

        await _db.SaveChangesAsync(ct);
        return await TaiLaiAsync(phieu.Id, ct);
    }

    /// <summary>
    /// Nạp phiếu thu.
    /// </summary>
    /// <remarks>
    /// Cố ý **không** <c>Include(x => x.Booking)</c>: việc đối chiếu số tiền đã chuyển
    /// sang <see cref="KiemTraTienKhongKhopAsync"/> vốn chiếu thẳng từ bảng <c>Bookings</c>.
    /// Nạp thêm cả đơn chỉ để dựng DTO là dữ liệu thừa.
    /// </remarks>
    private async Task<Payment> TimPhieuAsync(int id, CancellationToken ct)
    {
        return await _db.Payments.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.ChuaCoPhieuThu);
    }

    private static void KiemTraChoPhepThu(Payment phieu)
    {
        if (phieu.Status == PaymentStatus.PAID)
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.DaThuTienRoi);
        }

        if (phieu.Status == PaymentStatus.FAILED)
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.DaThatBai);
        }
    }

    /// <summary>Số tiền phiếu phải khớp tổng tiền đơn thì mới thu.</summary>
    /// <remarks>
    /// <b>Vì sao chiếu thẳng <c>Bookings.TotalAmount</c> thay vì đọc
    /// <c>phieu.Booking.TotalAmount</c>:</b> đọc qua navigation phải dựa vào việc đã
    /// <c>Include</c> đúng chỗ, và khi quên thì <c>phieu.Booking</c> là <c>null</c> —
    /// hàm ném <c>NullReferenceException</c> và người dùng thấy lỗi <c>500</c> vô nghĩa.
    /// Lỗi này đã xảy ra thật. Chiếu một con số đơn lẻ không cần navigation nào, không
    /// có chuyện quên <c>Include</c>, và cũng đúng nguyên tắc "ưu tiên <c>Select</c> thẳng
    /// ra giá trị cần dùng" (AGENTS.md 6.4).
    /// </remarks>
    private async Task KiemTraTienKhongKhopAsync(Payment phieu, CancellationToken ct)
    {
        decimal tongTienDon = await _db.Bookings
            .Where(don => don.Id == phieu.BookingId)
            .Select(don => don.TotalAmount)
            .FirstAsync(ct);

        decimal lech = Math.Abs(phieu.Amount - tongTienDon);

        // Lệch ở đây nghĩa là dữ liệu phiếu đã bị can thiệp từ nơi khác — chặn lại thay vì
        // thu tiền sai con số rồi báo cáo sai.
        if (lech > PaymentRules.SaiSoTienToiDa)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.SoTienKhongKhop);
        }
    }

    private async Task<PaymentDto> TaiLaiAsync(int id, CancellationToken ct)
    {
        Payment phieu = await _db.Payments
            .AsNoTracking()
            .Include(x => x.Booking).ThenInclude(x => x.Room).ThenInclude(x => x.Location)
            .FirstAsync(x => x.Id == id, ct);

        return ChuyenDoi(phieu);
    }

    /// <summary>Ánh xạ entity sang DTO — dùng chung với phía khách để hai bên hiện cùng số liệu.</summary>
    internal static PaymentDto ChuyenDoi(Payment phieu)
    {
        Room phong = phieu.Booking.Room;

        return new PaymentDto
        {
            BookingCode = phieu.Booking.Code,
            RoomName = phong.Name,
            RoomNumber = phong.RoomNumber,
            LocationName = phong.Location.Name,
            Amount = phieu.Amount,
            Method = (int)phieu.Method,
            Status = (int)phieu.Status,
            PaidAt = phieu.PaidAt,
            Note = phieu.Note,
            CreatedAt = phieu.CreatedAt,
        };
    }
}