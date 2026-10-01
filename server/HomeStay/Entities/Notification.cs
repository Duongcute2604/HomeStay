namespace HomeStay.Entities;

/// <summary>
/// Thông báo trong ứng dụng (in-app) cho một người dùng.
///
/// <para>
/// <b>Chỉ hiển thị trong hệ thống, không gửi email/SMS.</b> Không có bảng gửi lại, không
/// có hàng đợi — người dùng đăng nhập là thấy. Đây là ranh giới đã chốt của đồ án và được
/// nêu rõ trong báo cáo; nói "đã có thông báo qua email" thì sai.
/// </para>
///
/// <para>
/// Vì sao không có cột <c>Type</c>: mỗi thông báo đã có tiêu đề ghi rõ chuyện gì xảy ra
/// ("Đơn HS-261029-0015 đã được xác nhận"), nên thêm loại chỉ để tô màu là dữ liệu thừa
/// (nguyên tắc YAGNI). Khi nào thật sự cần lọc "xem tất cả thông báo đơn hàng" thì thêm sau.
/// </para>
/// </summary>
public class Notification
{
    /// <summary>Khoá chính, tự tăng.</summary>
    public int Id { get; set; }

    /// <summary>Người nhận thông báo.</summary>
    public int UserId { get; set; }

    /// <summary>Tiêu đề, ví dụ "Đơn HS-261029-0015 đã được xác nhận".</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Nội dung chi tiết, có thể `null` khi tiêu đề đã đủ nghĩa.</summary>
    public string? Content { get; set; }

    /// <summary>Người dùng đã đọc chưa — cơ sở của con số badge trên icon chuông.</summary>
    public bool IsRead { get; set; }

    /// <summary>Thời điểm sinh thông báo.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Người nhận thông báo.</summary>
    public User User { get; set; } = null!;
}