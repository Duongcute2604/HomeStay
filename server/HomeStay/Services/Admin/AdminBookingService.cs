using System.Data;
using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Booking;
using HomeStay.Services.Notifications;

namespace HomeStay.Services.Admin;

/// <summary>
/// Quản lý vòng đời đơn phía Admin.
///
/// Mỗi thao tác đi qua đúng một hàm <c>ChuyenTrangThaiAsync</c> để không lặp
/// lại 4 lần logic transaction + ghi lịch sử. Ma trận "trạng thái nào sang
/// được trạng thái nào" nằm trong <see cref="KiemTraChuyenTrangThai"/> — muốn
/// đổi quy tắc thì sửa đúng một chỗ, không phải rà từng hàm xem có gì sai.
///
/// Mỗi lần chuyển trạng thái đều chạy trong transaction `SERIALIZABLE` và ghi
/// một dòng vào `BookingStatusHistory` kèm người thực hiện, đúng yêu cầu
/// "lịch sử trạng thái" trong đề tài.
/// </summary>
public class AdminBookingService : IAdminBookingService
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public AdminBookingService(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<AdminBookingDto>> LayDanhSachAsync(
        AdminBookingFilter filter, CancellationToken ct)
    {
        int page = filter.Page < 1 ? 1 : filter.Page;
        int pageSize = filter.PageSize is < 1 or > 100 ? 10 : filter.PageSize;

        IQueryable<Entities.Booking> query = _db.Bookings
            .AsNoTracking()
            .Include(don => don.Room)
            .ThenInclude(phong => phong.Location)
            .Include(don => don.User);

        if (filter.Status.HasValue)
        {
            query = query.Where(don => don.Status == filter.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(filter.Keyword))
        {
            // Ép `ToLower()` cả hai vế vì unit test dùng InMemory không có
            // collation `ci` của MySQL — viết tường minh để hai nơi cho kết quả
            // giống hệt (cùng lý do với `RoomService`).
            string tuKhoa = filter.Keyword.Trim().ToLower();

            query = query.Where(don =>
                don.Code.ToLower().Contains(tuKhoa)
                || don.User.FullName.ToLower().Contains(tuKhoa)
                || don.User.Email.ToLower().Contains(tuKhoa));
        }

        int tongSo = await query.CountAsync(ct);

        List<AdminBookingDto> items = await query
            .OrderByDescending(don => don.CreatedAt)
            .ThenByDescending(don => don.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(don => new AdminBookingDto
            {
                Id = don.Id,
                Code = don.Code,
                CustomerName = don.User.FullName,
                CustomerEmail = don.User.Email,
                CustomerPhone = don.User.PhoneNumber,
                RoomName = don.Room.Name,
                LocationName = don.Room.Location.Name,
                BookingType = don.BookingType,
                CheckIn = don.CheckIn,
                CheckOut = don.CheckOut,
                GuestCount = don.GuestCount,
                TotalAmount = don.TotalAmount,
                Status = don.Status,
                Note = don.Note,
                CancelReason = don.CancelReason,
                CreatedAt = don.CreatedAt,
            })
            .ToListAsync(ct);

        return new PagedResultDto<AdminBookingDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = tongSo,
            TotalPages = tongSo == 0 ? 0 : (int)Math.Ceiling(tongSo / (double)pageSize),
        };
    }

    /// <inheritdoc />
    public Task<AdminBookingDto> XacNhanAsync(string code, int adminUserId, CancellationToken ct)
    {
        return ChuyenTrangThaiAsync(
            code,
            adminUserId,
            BookingStatus.PENDING,
            BookingStatus.CONFIRMED,
            RoomStatus.BOOKED,
            "Admin xác nhận đơn",
            ct);
    }

    /// <inheritdoc />
    public Task<AdminBookingDto> TuChoiAsync(string code, int adminUserId, string reason, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(reason))
        {
            // Bắt buộc có lý do: khách cần biết vì sao đơn bị từ chối, nếu để
            // trống thì Admin dễ bấm nhầm và khách nhận thông báo vô nghĩa.
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.ChiTietTuChoiRong);
        }

        return ChuyenTrangThaiAsync(
            code,
            adminUserId,
            BookingStatus.PENDING,
            BookingStatus.REJECTED,
            RoomStatus.AVAILABLE,
            $"Từ chối: {reason.Trim()}",
            ct,
            reason.Trim());
    }

    /// <inheritdoc />
    public Task<AdminBookingDto> CheckInAsync(string code, int adminUserId, CancellationToken ct)
    {
        return ChuyenTrangThaiAsync(
            code,
            adminUserId,
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            RoomStatus.OCCUPIED,
            "Khách nhận phòng",
            ct);
    }

    /// <inheritdoc />
    public Task<AdminBookingDto> CheckOutAsync(string code, int adminUserId, CancellationToken ct)
    {
        // Phòng sang CLEANING chứ không AVAILABLE: sau khi trả phòng phải vệ sinh
        // 2 giờ, chuyển thẳng AVAILABLE là lỗi kinh điển làm khách mới đặt
        // phòng đang dọn.
        return ChuyenTrangThaiAsync(
            code,
            adminUserId,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED,
            RoomStatus.CLEANING,
            "Khách trả phòng — phòng đang vệ sinh",
            ct);
    }

    /// <summary>
    /// Thực hiện một lần chuyển trạng thái trong transaction `SERIALIZABLE`.
    /// </summary>
    /// <param name="code">Mã đơn.</param>
    /// <param name="adminUserId">Id Admin thao tác, ghi vào lịch sử trạng thái.</param>
    /// <param name="tuTrangThai">Trạng thái bắt buộc phải đang là.</param>
    /// <param name="denTrangThai">Trạng thái sẽ chuyển sang.</param>
    /// <param name="trangThaiPhongMoi">Trạng thái phòng sau khi chuyển.</param>
    /// <param name="ghiChu">Ghi vào lịch sử trạng thái.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <param name="ganLyDoHuy">
    /// Lý do hủy/từ chối, chỉ đặt khi thực sự cần ghi vào cột `CancelReason`.
    /// </param>
    private async Task<AdminBookingDto> ChuyenTrangThaiAsync(
        string code,
        int adminUserId,
        BookingStatus tuTrangThai,
        BookingStatus denTrangThai,
        RoomStatus trangThaiPhongMoi,
        string ghiChu,
        CancellationToken ct,
        string? ganLyDoHuy = null)
    {
        await using var giaoDich = await _db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, ct);

        try
        {
            // Nạp bản THEO DÕI trong transaction: vừa để ghi vừa để lấy tên
            // phòng/khách, tránh phải `Include` lần hai bên ngoài transaction.
            Entities.Booking don = await _db.Bookings
                .Include(d => d.User)
                .Include(d => d.Room)
                .ThenInclude(p => p.Location)
                .FirstOrDefaultAsync(d => d.Code == code, ct)
                ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayDon);

            KiemTraChuyenTrangThai(don.Status, tuTrangThai);

            don.Status = denTrangThai;
            don.UpdatedAt = DateTime.Now;

            if (ganLyDoHuy is not null)
            {
                don.CancelReason = ganLyDoHuy;
            }

            // Phòng về CLEANING thì chỉ được coi là trống khi đủ số giờ vệ sinh.
            // Ở đây phòng vừa chuyển nên luôn đủ — nhưng vẫn để một chỗ quyết định
            // để sau này thêm lịch vệ sinh tự động không phải rà lại logic này.
            Entities.Room phong = don.Room;
            phong.Status = trangThaiPhongMoi;
            phong.UpdatedAt = DateTime.Now;

            _db.BookingStatusHistory.Add(new BookingStatusHistory
            {
                BookingId = don.Id,
                FromStatus = tuTrangThai,
                ToStatus = denTrangThai,
                ChangedByUserId = adminUserId,
                Note = ghiChu,
                ChangedAt = DateTime.Now,
            });

            // Đơn chuyển sang HOÀN THÀNH thì mở phiếu thu ngay trong cùng transaction.
            // Mở ở đây chứ không đợi khách tự bấm là vì: khách có thể không bao giờ vào
            // xem lại đơn, còn Admin thì chỉ cần đánh dấu đã thu. Nếu mở phiếu ở bước sau
            // mà bước này rollback thì sẽ có đơn hoàn thành mà không có gì để thu.
            if (denTrangThai == BookingStatus.COMPLETED)
            {
                MoPhieuThu(don, ct);
            }

            // Mọi lần chuyển trạng thái đều sinh thông báo cho khách trong cùng
            // transaction: có đơn chuyển trạng thái mà không có thông báo thì khách
            // phải tự vào đơn kiểm tra, đúng cái trải nghiệm mà chuông thông báo sinh ra
            // để loại bỏ.
            TaoThongBao(don, denTrangThai, ganLyDoHuy);

            await _db.SaveChangesAsync(ct);
            await giaoDich.CommitAsync(ct);

            return ChuyenDto(don);
        }
        catch
        {
            await giaoDich.RollbackAsync(ct);
            throw;
        }
    }

    /// <summary>
    /// Mở phiếu thu cho đơn vừa chuyển sang hoàn thành.
    /// </summary>
    /// <remarks>
    /// Gọi trong transaction của <see cref="ChuyenTrangThaiAsync"/> nên không cần
    /// <c>SaveChanges</c> — lệnh ghi ở đó ghi luôn cả phiếu thu.
    ///
    /// Phương thức để mặc định là tiền mặt và trạng thái là chờ thu: lúc này khách chưa
    /// chọn cách trả, việc đó là của khách. Admin chỉ việc xác nhận đã thu.
    /// </remarks>
    private void MoPhieuThu(Entities.Booking don, CancellationToken ct)
    {
        DateTime now = DateTime.Now;

        _db.Payments.Add(new Payment
        {
            BookingId = don.Id,
            Amount = don.TotalAmount,
            Method = PaymentMethod.CASH,
            Status = PaymentStatus.PENDING,
            CreatedAt = now,
            UpdatedAt = now,
        });
    }

    /// <summary>
    /// Sinh thông báo cho khách khi đơn vừa chuyển trạng thái.
    /// </summary>
    /// <remarks>
    /// Gọi trong transaction của <see cref="ChuyenTrangThaiAsync"/> nên không cần
    /// <c>SaveChanges</c>. Câu chữ do <see cref="NotificationTemplates"/> sinh để sửa
    /// văn bản không đụng vào logic ở đây.
    /// </remarks>
    /// <param name="don">Đơn vừa chuyển trạng thái.</param>
    /// <param name="denTrangThai">Trạng thái mới.</param>
    /// <param name="lyDo">Lý do từ chối/hủy, có ở các trạng thái cần giải thích.</param>
    private void TaoThongBao(Entities.Booking don, BookingStatus denTrangThai, string? lyDo)
    {
        (string tieuDe, string noiDung) = NotificationTemplates.Tao(don, denTrangThai, lyDo);

        _db.Notifications.Add(new Notification
        {
            UserId = don.UserId,
            Title = tieuDe,
            Content = noiDung,
            IsRead = false,
            CreatedAt = DateTime.Now,
        });
    }

    /// <summary>
    /// Ma trận chuyển trạng thái hợp lệ.
    ///
    /// Gom vào một hàm thay vì rải `if` trong từng method để câu hỏi "xác nhận
    /// được đơn đang check-in không" trả lời được ngay ở đúng một chỗ.
    /// </summary>
    private static void KiemTraChuyenTrangThai(
        BookingStatus hienTai,
        BookingStatus tuTrangThai)
    {
        if (hienTai != tuTrangThai)
        {
            throw new AppException(
                HttpStatusCode.Conflict,
                string.Format(
                    ErrorMessages.SaiTrangThaiChoThaoTac,
                    BookingStatusLabels.Ten(tuTrangThai),
                    BookingStatusLabels.Ten(hienTai)));
        }
    }



    private static AdminBookingDto ChuyenDto(Entities.Booking don)
    {
        return new AdminBookingDto
        {
            Id = don.Id,
            Code = don.Code,
            CustomerName = don.User?.FullName ?? string.Empty,
            CustomerEmail = don.User?.Email ?? string.Empty,
            CustomerPhone = don.User?.PhoneNumber,
            RoomName = don.Room?.Name ?? string.Empty,
            LocationName = don.Room?.Location?.Name ?? string.Empty,
            BookingType = don.BookingType,
            CheckIn = don.CheckIn,
            CheckOut = don.CheckOut,
            GuestCount = don.GuestCount,
            TotalAmount = don.TotalAmount,
            Status = don.Status,
            Note = don.Note,
            CancelReason = don.CancelReason,
            CreatedAt = don.CreatedAt,
        };
    }
}
