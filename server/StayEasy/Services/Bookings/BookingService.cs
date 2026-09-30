using System.Data;
using System.Net;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Booking;
using StayEasy.Services.Rooms;

namespace StayEasy.Services.Bookings;

/// <summary>
/// 4 thông tin của phòng cần cho chi tiết đơn: tên phòng, tên cơ sở, số phòng,
/// sức chứa.
/// </summary>
/// <remarks>
/// Khai báo rõ tên thay vì dùng kiểu ẩn danh, vì chỗ gọi đã cần ?. và phải
/// kiểm tra null — có tên thì ý nghĩa rõ và tái dùng được sau này.
/// </remarks>
internal sealed class ThongTinPhong
{
    /// <summary>Tên phòng.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Tên cơ sở chứa phòng.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Số phòng thực tế, ví dụ A101.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Số khách tối đa.</summary>
    public int Capacity { get; set; }
}

/// <summary>Tạo đơn đặt phòng của khách.</summary>
public class BookingService : IBookingService
{
    private readonly StayEasyDbContext _db;
    private readonly IRoomService _roomService;

    /// <summary>Khởi tạo service với DbContext và service phòng (tái dùng kiểm trống).</summary>
    public BookingService(StayEasyDbContext db, IRoomService roomService)
    {
        _db = db;
        _roomService = roomService;
    }

    /// <inheritdoc />
    public async Task<BookingResponseDto> TaoDonAsync(int userId, CreateBookingRequest request, CancellationToken ct)
    {
        // 1. Lỗi hình thức báo trước, không tốn truy vấn.
        if (request.GuestCount < 1)
        {
            throw new AppException(HttpStatusCode.BadRequest, "Số khách phải từ 1 trở lên");
        }

        // Chống 2 tab cùng đặt một phòng một khung giờ: transaction SERIALIZABLE
        // biến các SELECT kiểm tra thành đọc khoá — tab thứ hai phải đợi tab thứ
        // nhất xong mới đọc, lúc đó đã thấy đơn vừa chèn nên báo trùng.
        // Lưu ý trung thực: provider InMemory của unit test không thực thi khoá
        // thật, nên chống trùng đồng thời chỉ chứng minh được bằng test tay 2 tab.
        await using var giaoDich = await _db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, ct);

        try
        {
            // 2. Tái dùng đúng 6 quy tắc của kiểm trống. Bận → 409 kèm lý do;
            // 400/404 lan tiếp nguyên vẹn.
            AvailabilityResponse tinhTrang = await _roomService.KiemTraTrongAsync(
                new AvailabilityRequest
                {
                    LocationIndex = request.LocationIndex,
                    RoomIndex = request.RoomIndex,
                    Type = request.Type,
                    CheckIn = request.CheckIn,
                    CheckOut = request.CheckOut,
                },
                ct);

            if (!tinhTrang.IsAvailable)
            {
                throw new AppException(
                    HttpStatusCode.Conflict,
                    tinhTrang.Reason ?? ErrorMessages.PhongDaCoDon);
            }

            // 3. Tải phòng để chốt giá và kiểm sức chứa. Không thể null ở đây vì
            // kiểm trống đã 404 khi chỉ số sai — nhưng vẫn kiểm tường minh thay
            // vì `!` vì dữ liệu có thể đổi giữa hai truy vấn.
            Room? phong = await _roomService.TimPhongAsync(
                request.LocationIndex, request.RoomIndex, ct);

            if (phong is null)
            {
                throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);
            }

            if (request.GuestCount > phong.Capacity)
            {
                throw new AppException(
                    HttpStatusCode.BadRequest,
                    $"Phòng chỉ chứa tối đa {phong.Capacity} khách");
            }

            DateTime checkIn = request.CheckIn!.Value;
            DateTime checkOut = request.CheckOut!.Value;
            BookingType loai = (BookingType)request.Type;

            // `Entities.Booking` viết đầy đủ vì tên namespace `Bookings` che mất
            // tên entity khi biên dịch trong namespace này.
            Entities.Booking don = new()
            {
                Code = await SinhMaDonAsync(checkIn, ct),
                UserId = userId,
                RoomId = phong.Id,
                BookingType = loai,
                CheckIn = checkIn,
                CheckOut = checkOut,
                GuestCount = request.GuestCount,
                // Chốt giá lúc đặt: Admin sửa giá phòng sau không làm đơn cũ đổi tiền.
                PricePerHourSnapshot = phong.PricePerHour,
                PricePerDaySnapshot = phong.PricePerDay,
                TotalAmount = BookingCalculator.TinhTien(
                    loai, phong.PricePerHour, phong.PricePerDay, checkIn, checkOut),
                Status = BookingStatus.PENDING,
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
            };

            _db.Bookings.Add(don);

            // Ghi lịch sử ngay lúc tạo: FromStatus null vì chưa có trạng thái nào trước đó.
            _db.BookingStatusHistory.Add(new BookingStatusHistory
            {
                Booking = don,
                FromStatus = null,
                ToStatus = BookingStatus.PENDING,
                ChangedByUserId = userId,
                ChangedAt = DateTime.Now,
            });

            // Một SaveChanges cho cả đơn + lịch sử — một trong hai hỏng thì cả hai
            // cùng lùi, không bao giờ có đơn không lịch sử.
            await _db.SaveChangesAsync(ct);
            await giaoDich.CommitAsync(ct);

            string tenDiaDiem = await _db.Locations
                .AsNoTracking()
                .Where(diaDiem => diaDiem.Id == phong.LocationId)
                .Select(diaDiem => diaDiem.Name)
                .FirstAsync(ct);

            return new BookingResponseDto
            {
                Code = don.Code,
                RoomName = phong.Name,
                LocationName = tenDiaDiem,
                BookingType = don.BookingType,
                CheckIn = don.CheckIn,
                CheckOut = don.CheckOut,
                GuestCount = don.GuestCount,
                TotalAmount = don.TotalAmount,
                Status = don.Status,
                Note = don.Note,
                CreatedAt = don.CreatedAt,
            };
        }
        catch
        {
            await giaoDich.RollbackAsync(ct);
            throw;
        }
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<MyBookingDto>> LayCuaToiAsync(
        int userId, int page, int pageSize, CancellationToken ct)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        IQueryable<Entities.Booking> query = _db.Bookings
            .AsNoTracking()
            .Where(don => don.UserId == userId)
            .OrderByDescending(don => don.CreatedAt)
            .ThenByDescending(don => don.Id);

        int tongSo = await query.CountAsync(ct);

        List<MyBookingDto> items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(don => new MyBookingDto
            {
                Code = don.Code,
                RoomName = don.Room.Name,
                LocationName = don.Room.Location.Name,
                BookingType = don.BookingType,
                CheckIn = don.CheckIn,
                CheckOut = don.CheckOut,
                GuestCount = don.GuestCount,
                TotalAmount = don.TotalAmount,
                Status = don.Status,
                CreatedAt = don.CreatedAt,
            })
            .ToListAsync(ct);

        return new PagedResultDto<MyBookingDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = tongSo,
            TotalPages = tongSo == 0 ? 0 : (int)Math.Ceiling(tongSo / (double)pageSize),
        };
    }

    /// <inheritdoc />
    public async Task<BookingDetailDto> LayChiTietAsync(int userId, string code, CancellationToken ct)
    {
        Entities.Booking don = await TimDonCuaKhachAsync(userId, code, ct);

        return await ThanhChiTietAsync(don, ct);
    }

    /// <inheritdoc />
    public async Task<BookingDetailDto> HuyDonAsync(int userId, string code, string? reason, CancellationToken ct)
    {
        Entities.Booking don = await TimDonCuaKhachAsync(userId, code, ct);

        // Chỉ đơn chưa vào sử dụng mới được hủy: đang ở thì phải trả phòng chứ
        // không được hủy ngang; xong/huỷ/từ chối rồi thì không còn gì để hủy.
        if (don.Status != BookingStatus.PENDING && don.Status != BookingStatus.CONFIRMED)
        {
            throw new AppException(
                HttpStatusCode.Conflict,
                "Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận");
        }

        await using var giaoDich = await _db.Database.BeginTransactionAsync(
            IsolationLevel.Serializable, ct);

        try
        {
            // Tải lại bản THEO DÕI để ghi: `don` ở trên là `AsNoTracking`, gắn nó
            // bằng `Attach` sẽ vỡ khi context đang giữ sẵn một instance cùng Id
            // (ví dụ tạo rồi hủy ngay trong cùng một scope). `FirstAsync` trả về
            // đúng instance đang track nếu có, không thì tải mới và track.
            Entities.Booking donGhi = await _db.Bookings.FirstAsync(d => d.Id == don.Id, ct);

            BookingStatus trangThaiCu = donGhi.Status;
            donGhi.Status = BookingStatus.CANCELLED;
            donGhi.CancelReason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim();
            donGhi.UpdatedAt = DateTime.Now;

            // Phòng về trống khi đơn xác nhận bị hủy. Hiện tại phòng luôn
            // AVAILABLE (Bước 13 mới đổi khi xác nhận) nên đây là no-op, nhưng
            // viết sẵn cho đúng sau Bước 13. Chỉ đụng `BOOKED` — không đụng
            // `OCCUPIED` vì đó có thể là đơn khác đang ở.
            Entities.Room? phong = await _db.Rooms
                .FirstOrDefaultAsync(p => p.Id == don.RoomId, ct);

            if (phong is not null && phong.Status == RoomStatus.BOOKED)
            {
                phong.Status = RoomStatus.AVAILABLE;
            }

            _db.BookingStatusHistory.Add(new BookingStatusHistory
            {
                BookingId = don.Id,
                FromStatus = trangThaiCu,
                ToStatus = BookingStatus.CANCELLED,
                ChangedByUserId = userId,
                ChangedAt = DateTime.Now,
            });

            await _db.SaveChangesAsync(ct);
            await giaoDich.CommitAsync(ct);

            // Đồng bộ lại bản đọc (`don` tải AsNoTracking, `donGhi` mới là bản
            // đã đổi) — nếu không DTO trả về vẫn mang trạng thái cũ.
            don.Status = donGhi.Status;
            don.CancelReason = donGhi.CancelReason;
            don.UpdatedAt = donGhi.UpdatedAt;

            return await ThanhChiTietAsync(don, ct);
        }
        catch
        {
            await giaoDich.RollbackAsync(ct);
            throw;
        }
    }

    /// <summary>
    /// Tìm đơn theo mã và chủ sở hữu. Đơn của người khác hoặc mã sai đều 404 —
    /// không để lộ đơn của ai có tồn tại hay không.
    /// </summary>
    private async Task<Entities.Booking> TimDonCuaKhachAsync(int userId, string code, CancellationToken ct)
    {
        Entities.Booking? don = await _db.Bookings
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.Code == code && d.UserId == userId, ct);

        return don
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayDuLieu);
    }

    /// <summary>Dựng chi tiết đơn kèm lịch sử (cũ nhất trước).</summary>
    private async Task<BookingDetailDto> ThanhChiTietAsync(Entities.Booking don, CancellationToken ct)
    {
        // Gộp 4 trường của phòng vào 1 truy vấn: trước đây tên phòng và địa điểm
        // phải hỏi riêng, thêm số phòng/sức chữa nữa thì thành 4 vòng đọc cho
        // cùng một dòng (N+1 ngụy trang).
        ThongTinPhong? phong = await _db.Rooms
            .AsNoTracking()
            .Where(p => p.Id == don.RoomId)
            .Select(p => new ThongTinPhong
            {
                Name = p.Name,
                LocationName = p.Location.Name,
                RoomNumber = p.RoomNumber,
                Capacity = p.Capacity,
            })
            .FirstOrDefaultAsync(ct);

        if (phong is null)
        {
            throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);
        }

        // Chiếu thẳng ra DTO thay vì tải entity `Review`: chỉ cần 3 cột, mà
        // entity kéo theo quan hệ `Booking`/`User`/`Room` không dùng tới.
        MyReviewDto? danhGia = await _db.Reviews
            .AsNoTracking()
            .Where(d => d.BookingId == don.Id)
            .Select(d => new MyReviewDto
            {
                Rating = d.Rating,
                Comment = d.Comment,
                CreatedAt = d.CreatedAt,
            })
            .FirstOrDefaultAsync(ct);

        List<BookingHistoryDto> lichSu = await _db.BookingStatusHistory
            .AsNoTracking()
            .Where(lich => lich.BookingId == don.Id)
            .OrderBy(lich => lich.ChangedAt)
            .ThenBy(lich => lich.Id)
            .Select(lich => new BookingHistoryDto
            {
                FromStatus = lich.FromStatus,
                ToStatus = lich.ToStatus,
                ChangedByName = lich.ChangedByUser.FullName,
                Note = lich.Note,
                ChangedAt = lich.ChangedAt,
            })
            .ToListAsync(ct);

        return new BookingDetailDto
        {
            Code = don.Code,
            RoomName = phong.Name,
            LocationName = phong.LocationName,
            RoomNumber = phong.RoomNumber,
            Capacity = phong.Capacity,
            BookingType = don.BookingType,
            CheckIn = don.CheckIn,
            CheckOut = don.CheckOut,
            GuestCount = don.GuestCount,
            TotalAmount = don.TotalAmount,
            Status = don.Status,
            Note = don.Note,
            CancelReason = don.CancelReason,
            CreatedAt = don.CreatedAt,
            History = lichSu,
            DaDanhGia = danhGia is not null,
            DanhGiaCuaToi = danhGia,

        };
    }

    /// <summary>
    /// Sinh mã đơn `HS-yyMMdd-XXXX` với 4 số ngẫu nhiên mật mã, kiểm tồn tại rồi
    /// mới dùng. Unique index trên cột `Code` là chốt chặn cuối nếu vẫn trùng.
    /// </summary>
    private async Task<string> SinhMaDonAsync(DateTime checkIn, CancellationToken ct)
    {
        string dau = $"HS-{checkIn:yyMMdd}-";

        for (int lan = 0; lan < 10; lan++)
        {
            string code = $"{dau}{RandomNumberGenerator.GetInt32(0, 10000):D4}";
            bool tonTai = await _db.Bookings
                .AsNoTracking()
                .AnyAsync(don => don.Code == code, ct);

            if (!tonTai)
            {
                return code;
            }
        }

        throw new AppException(HttpStatusCode.InternalServerError, ErrorMessages.LoiHeThong);
    }
}