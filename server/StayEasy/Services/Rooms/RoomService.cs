using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Enums;
using StayEasy.Services.Booking;

namespace StayEasy.Services.Rooms;

/// <summary>Tìm kiếm và lọc phòng cho khách.</summary>
public class RoomService : IRoomService
{
    private readonly StayEasyDbContext _db;

    /// <summary>Khởi tạo service với DbContext.</summary>
    public RoomService(StayEasyDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<RoomSearchItemDto>> SearchAsync(RoomSearchRequest request, CancellationToken ct)
    {
        KiemTraThamSo(request);

        IQueryable<StayEasy.Entities.Room> query = _db.Rooms
            .AsNoTracking()
            .Include(phong => phong.Location)
            .Include(phong => phong.Images)
            .Where(phong => phong.Location.IsActive);

        // 1. Lọc theo từ khoá (tên phòng, không phân biệt hoa thường).
        // Ép `ToLower()` cả hai vế: MySQL collation `ci` vốn đã đúng, nhưng viết
        // tường minh để InMemory của unit test cũng cho kết quả giống hệt.
        if (!string.IsNullOrWhiteSpace(request.Keyword))
        {
            string tuKhoa = request.Keyword.Trim().ToLower();
            query = query.Where(phong => phong.Name.ToLower().Contains(tuKhoa));
        }

        // 2. Lọc theo địa điểm bằng CHỈ SỐ (response không có `Id`).
        // Cùng thứ tự `OrderBy Id` với `GET /api/locations` để chỉ số khớp nhau.
        // Bảng chỉ số dùng chung cho cả lọc và đánh số kết quả.
        Dictionary<int, int> chiSoDiaDiem = await LayChiSoDiaDiemAsync(ct);

        if (request.LocationIndex.HasValue)
        {
            // Vượt phạm vi là "không có kết quả", không phải lỗi — giao diện hiện
            // Empty state thay vì báo lỗi.
            // Không dùng `FirstOrDefault` ở đây: nó trả về struct nên không bao giờ
            // null, phân biệt "không thấy" với "thấy" phải so sánh thủ công.
            if (!chiSoDiaDiem.Values.Contains(request.LocationIndex.Value))
            {
                return TrangRong(request);
            }

            int locationId = chiSoDiaDiem.First(x => x.Value == request.LocationIndex.Value).Key;
            query = query.Where(phong => phong.LocationId == locationId);
        }

        // 3. Lọc theo loại phòng.
        if (request.RoomType.HasValue)
        {
            query = query.Where(phong => (int)phong.RoomType == request.RoomType.Value);
        }

        // 4. Lọc theo khoảng giá ngày.
        if (request.MinPrice.HasValue)
        {
            query = query.Where(phong => phong.PricePerDay >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(phong => phong.PricePerDay <= request.MaxPrice.Value);
        }

        // 5. Lọc theo sức chứa — phòng phải chứa ĐỦ số khách.
        if (request.Capacity.HasValue)
        {
            query = query.Where(phong => phong.Capacity >= request.Capacity.Value);
        }

        // 6. Sắp xếp. Giá trị `sort` đã kiểm hợp lệ ở `KiemTraThamSo`.
        query = request.Sort switch
        {
            RoomSortOptions.PriceAsc => query.OrderBy(phong => phong.PricePerDay).ThenBy(phong => phong.Id),
            RoomSortOptions.PriceDesc => query.OrderByDescending(phong => phong.PricePerDay).ThenBy(phong => phong.Id),
            RoomSortOptions.RatingDesc => query.OrderByDescending(phong => phong.RatingAvg).ThenBy(phong => phong.Id),
            _ => query.OrderByDescending(phong => phong.CreatedAt).ThenBy(phong => phong.Id),
        };

        int tongSo = await query.CountAsync(ct);

        // Chỉ số phòng tính trên TOÀN BỘ phòng (không phải trang hiện tại) và KHÔNG
        // phụ thuộc sắp xếp/lọc. Dữ liệu nhỏ nên truy vấn phụ này nhẹ.
        Dictionary<(int LocationId, int RoomId), int> chiSoPhong =
            await LayChiSoPhongAsync(ct);

        var hang = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            // `Select` ra kiểu nặc danh giữ `LocationId`/`RoomId` để đánh chỉ số
            // ở bộ nhớ — DTO trả về không lộ `Id`, không lấy thừa cột (AGENTS.md 6.4).
            .Select(phong => new
            {
                LocationId = phong.LocationId,
                RoomId = phong.Id,
                Name = phong.Name,
                RoomNumber = phong.RoomNumber,
                RoomType = phong.RoomType,
                Capacity = phong.Capacity,
                PricePerHour = phong.PricePerHour,
                PricePerDay = phong.PricePerDay,
                RatingAvg = phong.RatingAvg,
                RatingCount = phong.RatingCount,
                Status = phong.Status,
                ThumbnailUrl = phong.Images
                    .OrderByDescending(anh => anh.IsPrimary)
                    .ThenBy(anh => anh.SortOrder)
                    .Select(anh => anh.ImageUrl)
                    .FirstOrDefault(),
                LocationName = phong.Location.Name,
            })
            .ToListAsync(ct);

        List<RoomSearchItemDto> items = hang
            .Select(h => new RoomSearchItemDto
            {
                Name = h.Name,
                RoomNumber = h.RoomNumber,
                RoomType = h.RoomType,
                Capacity = h.Capacity,
                PricePerHour = h.PricePerHour,
                PricePerDay = h.PricePerDay,
                RatingAvg = h.RatingAvg,
                RatingCount = h.RatingCount,
                Status = h.Status,
                ThumbnailUrl = h.ThumbnailUrl,
                LocationName = h.LocationName,
                LocationIndex = chiSoDiaDiem[h.LocationId],
                RoomIndex = chiSoPhong[(h.LocationId, h.RoomId)],
            })
            .ToList();

        return new PagedResultDto<RoomSearchItemDto>
        {
            Items = items,
            Page = request.Page,
            PageSize = request.PageSize,
            TotalItems = tongSo,
            TotalPages = tongSo == 0 ? 0 : (int)Math.Ceiling(tongSo / (double)request.PageSize),
        };
    }

    /// <inheritdoc />
    public async Task<AvailabilityResponse> KiemTraTrongAsync(AvailabilityRequest request, CancellationToken ct)
    {
        // 1. Cách thuê phải hợp lệ trước nhất — các kiểm tra sau đều cần nó.
        if (!Enum.IsDefined(typeof(BookingType), request.Type))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.LoaiThueKhongHopLe);
        }

        // 2. Phải có đủ hai mốc thời gian.
        if (!request.CheckIn.HasValue || !request.CheckOut.HasValue)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DuLieuKhongHopLe);
        }

        DateTime checkIn = request.CheckIn.Value;
        DateTime checkOut = request.CheckOut.Value;

        // 3. Trả phải sau nhận.
        if (checkOut <= checkIn)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.GioTraPhaiSauGioNhan);
        }

        // 4. Phải đặt trước ít nhất 2 giờ — tính bằng giờ server, không tin giờ máy khách.
        // Kiểm trước khi tìm phòng: lỗi hình thức báo trước, 404 báo sau.
        if (checkIn < DateTime.Now.AddHours(BookingRules.MinHoursAdvanceNotice))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DatTruocItNhat2Gio);
        }

        // 5. Theo giờ tối thiểu 3 giờ.
        if ((BookingType)request.Type == BookingType.HOUR
            && (checkOut - checkIn).TotalHours < BookingRules.MinHoursForHourlyBooking)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.TheoGioToiThieu3Gio);
        }

        // 6. Chỉ số phải trỏ đúng một phòng đang hiện cho khách.
        Dictionary<int, int> chiSoDiaDiem = await LayChiSoDiaDiemAsync(ct);
        Dictionary<(int LocationId, int RoomId), int> chiSoPhong = await LayChiSoPhongAsync(ct);

        int? locationId = chiSoDiaDiem
            .Where(x => x.Value == request.LocationIndex)
            .Select(x => (int?)x.Key)
            .FirstOrDefault();

        int? roomId = null;
        if (locationId.HasValue)
        {
            roomId = chiSoPhong
                .Where(x => x.Key.LocationId == locationId.Value && x.Value == request.RoomIndex)
                .Select(x => (int?)x.Key.RoomId)
                .FirstOrDefault();
        }

        if (roomId is null)
        {
            throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayPhong);
        }

        // 7. Phòng bảo trì thì không nhận đặt dù ngày còn trống.
        RoomStatus trangThai = await _db.Rooms
            .AsNoTracking()
            .Where(phong => phong.Id == roomId.Value)
            .Select(phong => phong.Status)
            .FirstAsync(ct);

        if (trangThai == RoomStatus.MAINTENANCE)
        {
            return new AvailabilityResponse { IsAvailable = false, Reason = ErrorMessages.PhongBaoTri };
        }

        // 8. Trùng với đơn còn hiệu lực thì bận. Chạm biên không tính trùng:
        // trả 12:00, khách mới nhận 12:00 vẫn được.
        // Chỉ PENDING/CONFIRMED/CHECKED_IN giữ phòng — huỷ/từ chối/trả rồi thì thôi.
        bool biTrung = await _db.Bookings
            .AsNoTracking()
            .Where(don => don.RoomId == roomId.Value
                && (don.Status == BookingStatus.PENDING
                    || don.Status == BookingStatus.CONFIRMED
                    || don.Status == BookingStatus.CHECKED_IN)
                && don.CheckIn < checkOut
                && don.CheckOut > checkIn)
            .AnyAsync(ct);

        if (biTrung)
        {
            return new AvailabilityResponse { IsAvailable = false, Reason = ErrorMessages.PhongDaCoDon };
        }

        return new AvailabilityResponse { IsAvailable = true, Reason = null };
    }

    /// <summary>
    /// Vị trí của từng địa điểm đang hoạt động trong thứ tự `OrderBy Id` —
    /// cùng thứ tự với `GET /api/locations` để chỉ số khớp nhau.
    /// </summary>
    private async Task<Dictionary<int, int>> LayChiSoDiaDiemAsync(CancellationToken ct)
    {
        List<int> danhSachId = await _db.Locations
            .AsNoTracking()
            .Where(diaDiem => diaDiem.IsActive)
            .OrderBy(diaDiem => diaDiem.Id)
            .Select(diaDiem => diaDiem.Id)
            .ToListAsync(ct);

        return danhSachId
            .Select((id, chiSo) => (id, chiSo))
            .ToDictionary(x => x.id, x => x.chiSo);
    }

    /// <summary>Vị trí của từng phòng trong địa điểm của nó (sắp theo `Id`).</summary>
    private async Task<Dictionary<(int LocationId, int RoomId), int>> LayChiSoPhongAsync(CancellationToken ct)
    {
        var danhSach = await _db.Rooms
            .AsNoTracking()
            .Where(phong => phong.Location.IsActive)
            .OrderBy(phong => phong.LocationId)
            .ThenBy(phong => phong.Id)
            .Select(phong => new { phong.LocationId, RoomId = phong.Id })
            .ToListAsync(ct);

        return danhSach
            .GroupBy(x => x.LocationId)
            .SelectMany(nhom => nhom.Select((x, chiSo) => (x.LocationId, x.RoomId, chiSo)))
            .ToDictionary(x => (x.LocationId, x.RoomId), x => x.chiSo);
    }

    /// <summary>
    /// Kiểm các quan hệ giữa tham số mà attribute không kiểm được:
    /// `minPrice &lt;= maxPrice`, `roomType` trong 0–3, `sort` hợp lệ.
    /// </summary>
    private static void KiemTraThamSo(RoomSearchRequest request)
    {
        if (request.MinPrice.HasValue && request.MaxPrice.HasValue
            && request.MinPrice.Value > request.MaxPrice.Value)
        {
            throw new AppException(
                HttpStatusCode.BadRequest,
                "Giá thấp nhất không được lớn hơn giá cao nhất");
        }

        if (request.RoomType.HasValue && !Enum.IsDefined(typeof(StayEasy.Enums.RoomType), request.RoomType.Value))
        {
            throw new AppException(HttpStatusCode.BadRequest, "Loại phòng không hợp lệ");
        }

        if (request.Sort != RoomSortOptions.PriceAsc
            && request.Sort != RoomSortOptions.PriceDesc
            && request.Sort != RoomSortOptions.RatingDesc
            && request.Sort != RoomSortOptions.Newest)
        {
            throw new AppException(HttpStatusCode.BadRequest, "Cách sắp xếp không hợp lệ");
        }
    }

    /// <summary>Trang rỗng giữ nguyên số trang client gửi — giao diện vẫn hiện phân trang đúng.</summary>
    private static PagedResultDto<RoomSearchItemDto> TrangRong(RoomSearchRequest request)
    {
        return new PagedResultDto<RoomSearchItemDto>
        {
            Items = new(),
            Page = request.Page,
            PageSize = request.PageSize,
            TotalItems = 0,
            TotalPages = 0,
        };
    }
}
