using Microsoft.EntityFrameworkCore;
using HomeStay.Data;

namespace HomeStay.Services.Reviews;

/// <summary>
/// Tính lại điểm trung bình của một phòng từ toàn bộ đánh giá đang hiển thị.
/// </summary>
/// <remarks>
/// <para>
/// Vì sao tách riêng thành lớp dùng chung: việc tính lại điểm xảy ra ở **ba**
/// nơi — khách vừa viết đánh giá, Admin vừa ẩn/hiện, Admin vừa xoá. Nếu mỗi nơi
/// tự viết một vòng `Sum`/`Count` thì sớm muộn cũng có một chỗ quên điều kiện
/// "không tính đánh giá bị ẩn", và điểm phòng sẽ lệch so với danh sách khách
/// nhìn thấy. Một chỗ duy nhất thì sửa một lần là xong.
/// </para>
///
/// <para>
/// Vì sao <b>tính lại từ đầu</b> thay vì cộng dồn: cộng dồn kiểu
/// `(điểm cũ × số cũ + điểm mới) / (số cũ + 1)` cần đọc trạng thái trước đó và
/// dễ sai khi đánh giá bị xoá giữa chừng. Tính lại bằng `SUM/COUNT` tự sửa được
/// mọi sai lệch tích luỹ, và số đánh giá của một phòng rất nhỏ nên không tốn gì.
/// </para>
/// </remarks>
public sealed class ReviewScorer
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo scorer với DbContext.</summary>
    public ReviewScorer(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Tính lại rồi ghi `RatingAvg`/`RatingCount` của phòng. Chưa `SaveChangesAsync` —
    /// người gọi quyết định, để gói chung vào một transaction.
    /// </summary>
    /// <param name="roomId">Khoá phòng cần tính lại.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <returns>Cặp (điểm trung bình, số đánh gia đang được tính).</returns>
    public async Task<(decimal DiemTrungBinh, int SoDanhGia)> TinhLaiAsync(
        int roomId, CancellationToken ct)
    {
        Entities.Room? phong = await _db.Rooms.FirstOrDefaultAsync(p => p.Id == roomId, ct);

        if (phong is null)
        {
            return (0m, 0);
        }

        List<int> diem = await _db.Reviews
            .AsNoTracking()
            .Where(danhGia => danhGia.RoomId == roomId && !danhGia.IsHidden)
            .Select(danhGia => danhGia.Rating)
            .ToListAsync(ct);

        phong.RatingCount = diem.Count;
        phong.RatingAvg = TinhDiemTrungBinh(diem);

        return (phong.RatingAvg, phong.RatingCount);
    }

    /// <summary>
    /// Trung bình một danh sách số sao, làm tròn 2 chữ số thập phân.
    /// </summary>
    /// <remarks>
    /// Hàm thuần, không cần database — tách riêng để test được trực tiếp và để
    /// nơi gọi không phải biết quy tắc làm tròn. Danh sách rỗng trả về 0 (phòng
    /// chưa có đánh giá nào), không phải lỗi chia cho 0 — `CK_Rooms_Rating` cho
    /// phép giá trị 0 chính là để dành cho trường hợp này.
    /// </remarks>
    public static decimal TinhDiemTrungBinh(IReadOnlyCollection<int> diem)
    {
        if (diem.Count == 0)
        {
            return 0m;
        }

        return Math.Round(diem.Sum() / (decimal)diem.Count, 2);
    }
}
