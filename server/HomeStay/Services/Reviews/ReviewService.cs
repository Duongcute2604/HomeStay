using System.Data;
using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;

namespace HomeStay.Services.Reviews;

/// <summary>
/// Ghi đánh giá của khách và cập nhật lại điểm phòng.
/// </summary>
/// <remarks>
/// <para><b>Ba điều kiện phải đúng, theo đúng thứ tự:</b></para>
/// <list type="number">
/// <item>Đơn phải là của chính người đang đăng nhập.</item>
/// <item>Đơn phải ở trạng thái <c>COMPLETED</c> — chưa trả phòng thì chưa có
/// gì để đánh giá, và đánh giá trước khi ở là đánh giá phỏng đoán.</item>
/// <item>Mỗi đơn chỉ một đánh giá.</item>
/// </list>
///
/// <para>
/// <b>Vì sao chặn trùng ở cả code lẫn CSDL:</b> code kiểm tra trước để trả 409 với
/// thông báo tiếng Việt dễ hiểu; unique index trên `BookingId` là chốt chặn cuối
/// khi hai request đến cùng lúc. Nếu chỉ dựa vào index, lỗi `DbUpdateException`
/// sẽ lọt lên tầng trên và thành 500 — người dùng thấy "đã xảy ra lỗi" mà không
/// biết mình đã đánh giá rồi.
/// </para>
///
/// <para>
/// <b>Không cho khách sửa hay xoá đánh giá của mình.</b> Nếu mở, ai cũng có thể
/// chấm 1 sao rồi sửa lại 5 sao và điểm phòng bị đầu đọc. Sửa vi phạm là việc
/// của Admin (xem `AdminReviewService`), có lưu vết trạng thái ẩn/hiện.
/// </para>
/// </remarks>
public class ReviewService : IReviewService
{
    private readonly HomeStayDbContext _db;
    private readonly ReviewScorer _scorer;

    /// <summary>Khởi tạo service với DbContext và bộ tính điểm.</summary>
    public ReviewService(HomeStayDbContext db, ReviewScorer scorer)
    {
        _db = db;
        _scorer = scorer;
    }

    /// <inheritdoc />
    public async Task<MyReviewDto> TaoDanhGiaAsync(
        int userId, string code, CreateReviewRequest request, CancellationToken ct)
    {
        Entities.Booking don = await TimDonCuaToiAsync(userId, code, ct);
        await KiemTraDuocDanhGiaAsync(don, ct);

        Review danhGia = new()
        {
            Booking = don,
            UserId = userId,
            RoomId = don.RoomId,
            Rating = request.Rating,
            // Nhận xét toàn khoảng trắng thì lưu null chứ không lưu "   ", kẻo
            // giao diện hiện một khối trống và bộ lọc "có nhận xét" nhận nhầm.
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            IsHidden = false,
            CreatedAt = DateTime.UtcNow,
        };

        // Ghi đánh giá + tính lại điểm phải cùng lúc: nếu không, giữa hai bước có
        // khoảnh khắc mà trang phòng hiện điểm chưa cộng đánh giá vừa ghi.
        _db.Reviews.Add(danhGia);
        await GhiVaTinhLaiDiemAsync(don.RoomId, ct);

        return new MyReviewDto
        {
            Rating = danhGia.Rating,
            Comment = danhGia.Comment,
            CreatedAt = danhGia.CreatedAt,
        };
    }

    /// <summary>
    /// Ghi thay đổi + tính lại điểm phòng trong **một** transaction.
    /// </summary>
    /// <remarks>
    /// Thứ tự bên trong là bắt buộc: **ghi trước, đếm sau**. `TinhLaiAsync` đếm
    /// bằng truy vấn đối với CSDL, nên đánh giá vừa `Add` mà chưa flush thì chưa
    /// tồn tại để đếm — điểm phòng sẽ thiếu đúng đánh giá mới nhất. Lần đầu viết
    /// sai chỗ này và 4 unit test đỏ với kỳ vọng `RatingCount = 1`.
    /// </remarks>
    private async Task GhiVaTinhLaiDiemAsync(int roomId, CancellationToken ct)
    {
        await using var giaoDich = await _db.Database
            .BeginTransactionAsync(IsolationLevel.Serializable, ct);

        await _db.SaveChangesAsync(ct);
        await _scorer.TinhLaiAsync(roomId, ct);
        await _db.SaveChangesAsync(ct);
        await giaoDich.CommitAsync(ct);
    }

    /// <summary>
    /// Tìm đơn theo mã nhưng chỉ trong đơn của người này.
    /// </summary>
    /// <remarks>
    /// Trả 404 chứ không phải 403: nếu báo 403 thì khách biết mã đơn đó *có tồn
    /// tại* trong hệ thống — lộ dữ liệu của người khác chỉ bằng cách đoán mã.
    /// Giống hệt cách Bước 11 xử lý xem/huỷ đơn.
    /// </remarks>
    private async Task<Entities.Booking> TimDonCuaToiAsync(
        int userId, string code, CancellationToken ct)
    {
        Entities.Booking? don = await _db.Bookings
            .Include(don => don.Room)
            .FirstOrDefaultAsync(don => don.Code == code && don.UserId == userId, ct);

        return don ?? throw new AppException(
            HttpStatusCode.NotFound,
            ErrorMessages.KhongTimThayDon);
    }

    /// <summary>Chặn đánh giá đơn chưa hoàn tất, hoặc đơn đã có đánh giá rồi.</summary>
    private async Task KiemTraDuocDanhGiaAsync(Entities.Booking don, CancellationToken ct)
    {
        if (don.Status != BookingStatus.COMPLETED)
        {
            throw new AppException(
                HttpStatusCode.Conflict,
                string.Format(
                    ErrorMessages.SaiTrangThaiChoThaoTac,
                    BookingStatusLabels.Ten(BookingStatus.COMPLETED),
                    BookingStatusLabels.Ten(don.Status)));
        }

        bool daDanhGia = await _db.Reviews
            .AnyAsync(danhGia => danhGia.BookingId == don.Id, ct);

        if (daDanhGia)
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.DaDanhGiaDonRoi);
        }
    }
}
