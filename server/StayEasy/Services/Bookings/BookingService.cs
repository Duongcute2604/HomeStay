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
