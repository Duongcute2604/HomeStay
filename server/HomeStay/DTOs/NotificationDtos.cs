namespace HomeStay.DTOs;

/// <summary>Một dòng thông báo trả về cho giao diện.</summary>
public class NotificationDto
{
    /// <summary>Khoá thông báo, dùng cho thao tác "đánh dấu đã đọc".</summary>
    /// <remarks>
    /// <b>Không hiển thị</b> ra giao diện — cùng cách làm với <c>PaymentDto.Id</c> và
    /// <c>AdminReviewDto.Id</c> (AGENTS.md 6.3).
    /// </remarks>
    public int Id { get; set; }

    /// <summary>Tiêu đề, ví dụ "Đơn HS-261029-0015 đã được xác nhận".</summary>
    public string Title { get; set; } = string.Empty;

    /// <summary>Nội dung chi tiết.</summary>
    public string? Content { get; set; }

    /// <summary>Đã đọc chưa — quyết định nền đậm và dấu chấm xanh trên chuông.</summary>
    public bool IsRead { get; set; }

    /// <summary>Thời điểm sinh thông báo.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Kết quả trả về cho màn hình chuông: danh sách kèm số chưa đọc.</summary>
/// <remarks>
/// Gộp hai thứ vào một lần gọi vì header cần cả danh sách lẫn con số badge; tách
/// thành hai endpoint thì mỗi lần mở trang phải gọi 2 lần và dễ lệch số liệu giữa
/// hai lần gọi.
/// </remarks>
public class NotificationListDto
{
    /// <summary>Các thông báo mới nhất trước.</summary>
    public List<NotificationDto> Items { get; set; } = new();

    /// <summary>Số thông báo chưa đọc — đưa lên badge trên icon chuông.</summary>
    public int SoChuaDoc { get; set; }
}
