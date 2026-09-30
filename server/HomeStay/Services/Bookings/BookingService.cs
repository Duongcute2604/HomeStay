using System.Data;
using System.Data.Common;
using System.Net;
using System.Security.Cryptography;
using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using Microsoft.EntityFrameworkCore.Storage;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Booking;
using HomeStay.Services.Rooms;

namespace HomeStay.Services.Bookings;

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
    private readonly HomeStayDbContext _db;
    private readonly IRoomService _roomService;

    /// <summary>Khởi tạo service với DbContext và service phòng (tái dùng kiểm trống).</summary>
    public BookingService(HomeStayDbContext db, IRoomService roomService)
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
        // Vì sao KHÔNG dùng await using: khi InnoDB báo DEADLOCK, nó đã tự hủy
        // transaction phía server. Khi luồng đi ra khỏi khối try, await using gọi
        // DisposeAsync rồi RollbackAsync lần nữa; lỗi này THAY THẾ lỗi 409 mà ta
        // định ném ra và người dùng nhận 500. Đây chính là lỗi mà test chống đặt
        // trùng của Bước 18 bắt được (mã trả về [500, 201]). Nên ta tự quản lý và
        // giải phóng trong finally qua hàm nuốt lỗi.
        IDbContextTransaction giaoDich = await _db.Database.BeginTransactionAsync(
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
        // Hai request đặt cùng phòng + cùng khung giờ chạy SONG SONG có thể bị
        // InnoDB báo DEADLOCK (1213) hoặc khoá chờ quá lâu (1205) thay vì chỉ vi
        // phạm unique index. Cả hai đều nghĩa là chỗ này đã có người trước, nên
        // trả 409 cho người dùng thay vì 500 (lỗi hệ thống).
        catch (Exception loi) when (LaTranhChungCungDong(loi))
        {
            await RollbackAnToanAsync(giaoDich, ct);

            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.PhongDaCoDon);
        }
        catch
        {
            await RollbackAnToanAsync(giaoDich, ct);
            throw;
        }
        finally
        {
            await GiaiPhongAnToanAsync(giaoDich);
        }
    }


    /// <summary>
    /// Lỗi CSDL này có nghĩa là "chỗ này đã có người trước" không?
    /// </summary>
    /// <remarks>
    /// <para>
    /// Khi hai request đặt trùng phòng + trùng khung giờ chạy <b>song song</b>, InnoDB có thể báo:
    /// </para>
    /// <list type="bullet">
    /// <item><description>1213 — DEADLOCK: hai transaction đang đợi khoá của nhau.</description></item>
    /// <item><description>1205 — LOCK WAIT TIMEOUT: chờ khoá quá lâu.</description></item>
    /// <item><description>1062 — vi phạm UNIQUE INDEX (lớp chống chặn cuối).</description></item>
    /// </list>
    /// <para>
    /// Phải dò <b>cả chuỗi exception</b> chứ không bắt đúng một tầng: Pomelo bọc lỗi gốc
    /// của MySQL thành <c>InvalidOperationException</c> (execution strategy) rồi
    /// <c>DbUpdateException</c> rồi mới tới <c>MySqlException</c>. Bắt tầng ngoài cùng
    /// thì không thấy mã lỗi, nguyên nhân gốc lọt ra thành 500.
    /// </para>
    /// </remarks>
    private static bool LaTranhChungCungDong(Exception loi)
    {
        // Phải dò CẢ CHUỖI exception: Pomelo bọc lỗi gốc của MySQL thành
        // InvalidOperationException (execution strategy) rồi DbUpdateException rồi mới
        // tới MySqlException. Bắt tầng ngoài cùng thì không thấy mã lỗi.
        for (Exception? hienTai = loi; hienTai is not null; hienTai = hienTai.InnerException)
        {
            // MySQL: đọc `Number`. KHÔNG đọc `DbException.ErrorCode` — với MySqlConnector
            // nó trả về HResult (0x80004005) chứ không phải mã lỗi 1213, nên so với
            // 1213 sẽ không bao giờ khớp. Đây là lý do bản sửa đầu tiên không có tác dụng.
            if (hienTai is MySqlException loiMySql && LaMaLoiTranhChung(loiMySql.Number))
            {
                return true;
            }

            // Dự phòng cho nhà cung cấp CSDL khác (ErrorCode là mã lỗi riêng của chúng).
            if (hienTai is DbException loiDb && LaMaLoiTranhChung(loiDb.ErrorCode))
            {
                return true;
            }
        }

        return false;
    }

    /// <summary>
    /// Ba mã lỗi MySQL đều có nghĩa giống nhau: chỗ này đã có người trước.</summary>
    /// <remarks>
    /// 1213 = DEADLOCK (hai transaction đợi khoá của nhau) · 1205 = LOCK WAIT TIMEOUT ·
    /// 1062 = vi phạm UNIQUE INDEX.
    /// <para>
    /// Tách riêng thành hàm thuần để unit test được — tạo được
    /// <c>MySqlException</c> trong unit test thì không (constructor của nó là internal),
    /// còn hàm này chỉ cần một con số.
    /// </para>
    /// </remarks>
    internal static bool LaMaLoiTranhChung(int maLoi) => maLoi is 1213 or 1205 or 1062;

    /// <summary>
    /// Rollback mà không để lỗi rollback nuốt mất lỗi nghiệp vụ đang cần trả về.
    /// </summary>
    /// <remarks>
    /// Khi InnoDB báo DEADLOCK, nó đã tự hủy transaction phía server. Gọi
    /// <c>RollbackAsync</c> lần nữa có thể ném lỗi — và lỗi đó sẽ <b>thay thế</b> lỗi
    /// gốc. Đây đúng là lỗi làm test chống đặt trùng của Bước 18 lộ ra: dòng
    /// <c>catch { await Rollback(); throw; }</c> — dòng <c>throw</c> không bao giờ
    /// chạy được vì dòng ngay trên nó đã ném lỗi.
    /// </remarks>
    private static async Task RollbackAnToanAsync(IDbContextTransaction giaoDich, CancellationToken ct)
    {
        try
        {
            await giaoDich.RollbackAsync(ct);
        }
        catch
        {
            // Transaction đã hỏng nên không rollback được — cũng không sao,
            // MySQL tự giải phóng khoá khi đóng connection.
        }
    }

    /// <summary>
    /// Giải phóng transaction, nuốt lỗi.
    /// </summary>
    /// <remarks>
    /// Thay cho <c>await using</c>. Nếu dùng <c>await using</c>, khi luồng đi ra khỏi
    /// khối <c>try</c> thì <c>DisposeAsync</c> chạy <em>sau</em> dòng
    /// <c>throw new AppException(409)</c> — mà nó thì có thể ném lỗi, lỗi đó sẽ thay
    /// thế 409 và người dùng nhận 500. Bước 18 đã quan sát đúng hiện tượng này:
    /// đặt trùng song song trả về mã <c>[500, 201]</c>.
    /// </remarks>
    private static async Task GiaiPhongAnToanAsync(IDbContextTransaction giaoDich)
    {
        try
        {
            await giaoDich.DisposeAsync();
        }
        catch
        {
            // Xem Ghi chú của RollbackAnToanAsync.
        }
    }
    /// <inheritdoc />
    public async Task<PagedResultDto<MyBookingDto>> LayCuaToiAsync(
        int userId, int page, int pageSize, int? status, CancellationToken ct)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 50);

        IQueryable<Entities.Booking> query = _db.Bookings
            .AsNoTracking()
            .Where(don => don.UserId == userId);

        // Chi loc khi gia tri nam trong khoang enum. Phai kiem `is int` chu khong
        // dung `HasValue` vi tham so la `int?`: truyen `status=0` la PENDING
        // - hop le - nen 0 phai duoc giu nguyen, khac voi khong truyen tham so.
        if (status is int maTrangThai && Enum.IsDefined(typeof(BookingStatus), maTrangThai))
        {
            query = query.Where(don => don.Status == (BookingStatus)maTrangThai);
        }

        // Sap xep truoc roi moi phan trang, va dem tren cung bo loc dang ap dung
        // nen tongSo khop voi so dong tra ve.
        query = query
            .OrderByDescending(don => don.CreatedAt)
            .ThenByDescending(don => don.Id);

        int tongSo = await query.CountAsync(ct);
        List<MyBookingDto> items = await ChonDonCuaToi(query)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
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

    /// <summary>
    /// Chuyển đơn thành DTO. Tách riêng để `LayCuaToiAsync` không vượt quá 40 dòng
    /// và để ánh xạ chỉ nằm ở một chỗ.
    ///
    /// Dùng `Select` thẳng ra DTO (AGENTS 6.4) nên không có N+1 query: tên phòng
    /// và tên địa điểm được lấy ngay trong SQL.
    /// </summary>
    private static IQueryable<MyBookingDto> ChonDonCuaToi(IQueryable<Entities.Booking> query)
    {
        return query.Select(don => new MyBookingDto
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
        });
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
