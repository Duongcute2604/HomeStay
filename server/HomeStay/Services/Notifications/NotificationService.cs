using Microsoft.EntityFrameworkCore;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;

namespace HomeStay.Services.Notifications;

/// <summary>
/// Xử lý thông báo trong ứng dụng (Bước 23).
/// </summary>
/// <remarks>
/// Mọi truy vấn đều lọc theo <c>UserId</c> lấy từ token chứ không lấy từ tham số
/// client — nếu không thì khách đọc được thông báo của người khác chỉ bằng cách đoán
/// số khoá (AGENTS.md 6.6).
/// </remarks>
public class NotificationService : INotificationService
{
    private readonly HomeStayDbContext _db;

    /// <summary>Khởi tạo service với ngữ cảnh cơ sở dữ liệu.</summary>
    public NotificationService(HomeStayDbContext db)
    {
        _db = db;
    }

    /// <inheritdoc />
    public async Task<NotificationListDto> LayDanhSachAsync(int userId, CancellationToken ct)
    {
        var danhSach = await _db.Notifications
            .AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.Id)
            .Take(NotificationRules.SoToiDaMoiTrang)
            .Select(x => new NotificationDto
            {
                Id = x.Id,
                Title = x.Title,
                Content = x.Content,
                IsRead = x.IsRead,
                CreatedAt = x.CreatedAt,
            })
            .ToListAsync(ct);

        // Đếm riêng thay vì đếm trên `danhSach`: danh sách bị cắt còn 50 dòng, đếm trên
        // đó sẽ báo thiếu khi người dùng có hơn 50 thông báo chưa đọc.
        int soChuaDoc = await _db.Notifications
            .AsNoTracking()
            .CountAsync(x => x.UserId == userId && !x.IsRead, ct);

        return new NotificationListDto { Items = danhSach, SoChuaDoc = soChuaDoc };
    }

    /// <inheritdoc />
    public async Task<bool> DanhDauDaDocAsync(int id, int userId, CancellationToken ct)
    {
        var thongBao = await _db.Notifications
            .FirstOrDefaultAsync(x => x.Id == id && x.UserId == userId, ct);

        if (thongBao is null)
        {
            return false;
        }

        // Đánh dấu lại thông báo đã đọc vẫn trả `true`: người dùng bấm nhầm cũng không
        // phải chịu lỗi, và việc này là thao tác lặp lại rất thường xuyên.
        if (!thongBao.IsRead)
        {
            thongBao.IsRead = true;
            await _db.SaveChangesAsync(ct);
        }

        return true;
    }

    /// <inheritdoc />
    public async Task<int> DanhDauDaDocTatCaAsync(int userId, CancellationToken ct)
    {
        var chuaDoc = await _db.Notifications
            .Where(x => x.UserId == userId && !x.IsRead)
            .ToListAsync(ct);

        if (chuaDoc.Count == 0)
        {
            return 0;
        }

        foreach (var thongBao in chuaDoc)
        {
            thongBao.IsRead = true;
        }

        await _db.SaveChangesAsync(ct);
        return chuaDoc.Count;
    }
}
