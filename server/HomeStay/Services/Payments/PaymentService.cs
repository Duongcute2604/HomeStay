using System.Net;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using Microsoft.EntityFrameworkCore;

namespace HomeStay.Services.Payments;

/// <summary>
/// Phía khách: xem lịch sử thanh toán và chọn phương thức thanh toán cho đơn của mình.
///
/// <para>
/// <b>Chỉ ghi nhận, không nối API cổng thanh toán.</b> Không có lời gọi mạng nào trong
/// file này. Đây là ranh giới đã chốt của đồ án và được ghi rõ trong báo cáo — nói
/// "đã tích hợp thanh toán trực tuyến" thì sai, đúng là "ghi nhận phương thức thanh toán".
/// </para>
/// </summary>
public sealed class PaymentService : IPaymentService
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public PaymentService(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<IReadOnlyList<PaymentDto>> LayCuaToiAsync(int userId, CancellationToken ct)
    {
        List<Payment> phieuList = await _db.Payments
            .AsNoTracking()
            .Include(x => x.Booking).ThenInclude(x => x.Room).ThenInclude(x => x.Location)
            .Where(x => x.Booking.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .ToListAsync(ct);

        return phieuList.Select(x => ChuyenDoi(x)).ToList();
    }

    /// <inheritdoc />
    public async Task<PaymentDto?> LayTheoDonAsync(int userId, string code, CancellationToken ct)
    {
        // Gọi `TimDonAsync` trước để đơn không tồn tại hoặc không thuộc về người này
        // trả `404` thay vì `200` với dữ liệu rỗng — giống hệt cách `TaoDanhGiaAsync`
        // xử lý. Nếu trả `200` + null, client không phân biệt được "đơn chưa có phiếu thu"
        // với "mã đơn sai", và giao diện sẽ hiện thông báo sai.
        Entities.Booking don = await TimDonAsync(userId, code, ct);

        Payment? phieu = await _db.Payments
            .AsNoTracking()
            .Include(x => x.Booking).ThenInclude(x => x.Room).ThenInclude(x => x.Location)
            .FirstOrDefaultAsync(x => x.BookingId == don.Id, ct);

        return phieu is null ? null : ChuyenDoi(phieu);
    }
    /// <inheritdoc />
    public async Task<PaymentDto> ChonPhuongThucAsync(
        int userId, string code, CreatePaymentRequest request, CancellationToken ct)
    {
        if (!Enum.IsDefined(typeof(PaymentMethod), request.Method))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DuLieuKhongHopLe);
        }

        Entities.Booking don = await TimDonAsync(userId, code, ct);
        Payment phieu = await MoPhieuNeuChuaCoAsync(don, ct);
        KiemTraChoPhepThayDoi(phieu);

        phieu.Method = (PaymentMethod)request.Method;
        phieu.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync(ct);
        return await TaiPhieuAsync(don.Id, ct);
    }

    /// <summary>Tìm đơn của chính khách, không thấy thì `404` chứ không phải `403`.</summary>
    private async Task<Entities.Booking> TimDonAsync(int userId, string code, CancellationToken ct)
    {
        Entities.Booking? don = await _db.Bookings
            .FirstOrDefaultAsync(x => x.UserId == userId && x.Code == code, ct);

        // 404 chứ không phải 403: nếu trả 403 thì lộ ra "đơn này tồn tại nhưng không phải
        // của bạn" — người lạ đoán mã đơn là xem được trạng thái đơn của người khác.
        return don ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayDon);
    }

    /// <summary>
    /// Lấy phiếu thu của đơn, hoặc mở phiếu mới nếu đơn mới chuyển sang hoàn thành.
    /// </summary>
    private async Task<Payment> MoPhieuNeuChuaCoAsync(Entities.Booking don, CancellationToken ct)
    {
        Payment? existing = await _db.Payments.FirstOrDefaultAsync(x => x.BookingId == don.Id, ct);
        if (existing is not null)
        {
            return existing;
        }

        if (don.Status != BookingStatus.COMPLETED)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.ChiDonHoanThanh);
        }

        DateTime now = DateTime.Now;
        Payment phieu = new()
        {
            BookingId = don.Id,
            // Số tiền chụp từ đơn chứ không nhận từ client — client gửi số tiền nhỏ hơn
            // cũng qua nếu ta tin, và tiền thu được không khớp tiền phải thu.
            Amount = don.TotalAmount,
            Method = PaymentMethod.CASH,
            Status = PaymentStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now,
        };

        _db.Payments.Add(phieu);
        return phieu;
    }

    /// <summary>Chặn thao tác trên phiếu đã chốt tiền hoặc đã bị đánh dấu thất bại.</summary>
    private static void KiemTraChoPhepThayDoi(Payment phieu)
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

    /// <summary>Nạp lại phiếu kèm quan hệ để dựng DTO — tránh trả entity thô.</summary>
    private async Task<PaymentDto> TaiPhieuAsync(int bookingId, CancellationToken ct)
    {
        Payment phieu = await _db.Payments
            .AsNoTracking()
            .Include(x => x.Booking).ThenInclude(x => x.Room).ThenInclude(x => x.Location)
            .FirstAsync(x => x.BookingId == bookingId, ct);

        return ChuyenDoi(phieu);
    }

    /// <summary>Ánh xạ entity sang DTO. Không lộ khoá nội bộ ra giao diện (AGENTS.md 6.3).</summary>
    private static PaymentDto ChuyenDoi(Payment phieu)
    {
        Room phong = phieu.Booking.Room;

        return new PaymentDto
        {
            Id = phieu.Id,
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
