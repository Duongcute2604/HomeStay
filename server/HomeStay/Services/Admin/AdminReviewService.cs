using System.Data;
using System.Linq.Expressions;
using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Services.Reviews;

namespace HomeStay.Services.Admin;

/// <summary>
/// Quản lý đánh giá phía Admin.
/// </summary>
/// <remarks>
/// <para>
/// Có **hai** cách xử lý đánh giá vi phạm, và cả hai đều cần: <b>ẩn</b> để tạm
/// gỡ khỏi giao diện nhưng vẫn giữ bản ghi để đối chiếu khi có khiếu nại; <b>xoá</b>
/// khi đó rác rồi (spam, quảng cáo). Chỉ có ẩn thì rác vẫn chiếm chỗ; chỉ có xoá
/// thì mất dấu vết khiếu nại.
/// </para>
///
/// <para>
/// Cả hai đường đều gọi lại `ReviewScorer` để tính lại điểm phòng. Đánh giá bị
/// ẩn hoặc bị xoá sẽ không còn được tính vào điểm — điểm phòng phải khớp với
/// đúng những gì khách nhìn thấy ở trang chi tiết phòng.
/// </para>
/// </remarks>
public class AdminReviewService : IAdminReviewService
{
    private readonly HomeStayDbContext _db;
    private readonly ReviewScorer _scorer;

    /// <summary>Khởi tạo service với DbContext và bộ tính điểm.</summary>
    public AdminReviewService(HomeStayDbContext db, ReviewScorer scorer)
    {
        _db = db;
        _scorer = scorer;
    }

    /// <inheritdoc />
    public async Task<PagedResultDto<AdminReviewDto>> LayDanhSachAsync(
        bool? anId, int? soSao, int page, int pageSize, CancellationToken ct)
    {
        int trang = page < 1 ? 1 : page;
        int soDong = pageSize is < 1 or > 50 ? 20 : pageSize;

        IQueryable<Review> truyVan = ApLoc(_db.Reviews.AsNoTracking(), anId, soSao);
        int tong = await truyVan.CountAsync(ct);

        List<AdminReviewDto> duLieu = await truyVan
            .OrderByDescending(danhGia => danhGia.CreatedAt)
            .ThenByDescending(d => d.Id)
            .Skip((trang - 1) * soDong)
            .Take(soDong)
            .Select(ThanhDto)
            .ToListAsync(ct);

        return new PagedResultDto<AdminReviewDto>
        {
            Items = duLieu,
            TotalItems = tong,
            Page = trang,
            PageSize = soDong,
            TotalPages = (int)Math.Ceiling(tong / (double)soDong),
        };
    }

    /// <summary>
    /// Gắn điều kiện lọc. Bỏ trống tham số nào thì không lọc theo chiều đó.
    /// </summary>
    private static IQueryable<Review> ApLoc(
        IQueryable<Review> truyVan, bool? anId, int? soSao)
    {
        if (anId.HasValue)
        {
            truyVan = truyVan.Where(danhGia => danhGia.IsHidden == anId.Value);
        }

        if (soSao.HasValue)
        {
            truyVan = truyVan.Where(danhGia => danhGia.Rating == soSao.Value);
        }

        return truyVan;
    }

    /// <summary>
    /// Chiếu bản ghi sang DTO, kèm tên người viết / tên phòng / tên cơ sở.
    /// </summary>
    /// <remarks>
    /// Gộp vào một biểu thức để dùng được trong `Select(...)` của LINQ — tách
    /// thành hàm thường thì truy vấn sẽ không dịch được xuống SQL.
    /// </remarks>
    private static readonly Expression<Func<Review, AdminReviewDto>> ThanhDto =
        danhGia => new AdminReviewDto
        {
            Id = danhGia.Id,
            BookingCode = danhGia.Booking.Code,
            ReviewerName = danhGia.User.FullName,
            RoomName = danhGia.Room.Name,
            LocationName = danhGia.Room.Location.Name,
            Rating = danhGia.Rating,
            Comment = danhGia.Comment,
            IsHidden = danhGia.IsHidden,
            CreatedAt = danhGia.CreatedAt,
        };

    /// <inheritdoc />
    public async Task<ReviewVisibilityDto> DoiTrangThaiHienThiAsync(
        int id, bool an, CancellationToken ct)
    {
        Review danhGia = await TimDanhGiaAsync(id, ct);
        danhGia.IsHidden = an;

        return await LuuVaTinhLaiDiemAsync(danhGia.RoomId, danhGia.Id, an, ct);
    }

    /// <inheritdoc />
    public async Task<ReviewVisibilityDto> XoaAsync(int id, CancellationToken ct)
    {
        Review danhGia = await TimDanhGiaAsync(id, ct);
        int roomId = danhGia.RoomId;

        // Ghi việc xoá vào bộ nhớ đệm trước, để `LuuVaTinhLaiDiemAsync` flush
        // xong mới đếm lại — nếu đếm trước khi giao dịch ghi thì dòng vừa xoá
        // vẫn còn trong kết quả truy vấn và điểm phòng không giảm.
        _db.Reviews.Remove(danhGia);

        return await LuuVaTinhLaiDiemAsync(roomId, id, true, ct);
    }

    /// <summary>
    /// Ghi thay đổi + tính lại điểm phòng trong **một** transaction.
    /// </summary>
    /// <remarks>
    /// Nếu tách ra hai lần `SaveChanges` thì giữa đó điểm phòng lệch với danh sách
    /// đánh giá: trang phòng có thể hiện điểm đã bỏ đánh giá ẩn nhưng đánh giá đó
    /// vẫn còn trong danh sách quản trị.
    /// </remarks>
    private async Task<ReviewVisibilityDto> LuuVaTinhLaiDiemAsync(
        int roomId, int id, bool an, CancellationToken ct)
    {
        await using var giaoDich = await _db.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, ct);

        // Thứ tự bắt buộc: ghi thay đổi (thêm/ẩn/xoá) trước, tính lại sau.
        // `TinhLaiAsync` đếm bằng truy vấn đối với CSDL nên phải thấy dữ liệu
        // đã nằm trong giao dịch thì mới ra đúng con số.
        await _db.SaveChangesAsync(ct);
        (decimal diem, int soDanhGia) = await _scorer.TinhLaiAsync(roomId, ct);
        await _db.SaveChangesAsync(ct);
        await giaoDich.CommitAsync(ct);

        return new ReviewVisibilityDto
        {
            Id = id,
            IsHidden = an,
            PhongDiemTrungBinh = diem,
            PhongSoDanhGia = soDanhGia,
        };
    }

    /// <summary>Tìm đánh giá theo khoá chính, 404 nếu không có.</summary>
    private async Task<Review> TimDanhGiaAsync(int id, CancellationToken ct)
    {
        Review? danhGia = await _db.Reviews.FirstOrDefaultAsync(d => d.Id == id, ct);

        return danhGia ?? throw new AppException(
            HttpStatusCode.NotFound,
            ErrorMessages.KhongTimThayDanhGia);
    }
}
