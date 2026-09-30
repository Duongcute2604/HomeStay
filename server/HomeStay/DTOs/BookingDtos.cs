using System.ComponentModel.DataAnnotations;
using HomeStay.Enums;

namespace HomeStay.DTOs;

/// <summary>Dữ liệu gửi lên khi khách tạo đơn đặt phòng.</summary>
/// <remarks>
/// Phòng định danh bằng cặp chỉ số (như availability) thay vì `Id`.
/// `userId` lấy từ token, KHÔNG nhận từ client.
/// </remarks>
public class CreateBookingRequest
{
    /// <summary>Chỉ số địa điểm theo thứ tự của `GET /api/locations`.</summary>
    [Range(0, int.MaxValue, ErrorMessage = "Chỉ số địa điểm không được âm")]
    public int LocationIndex { get; set; }

    /// <summary>Chỉ số phòng trong địa điểm đó.</summary>
    [Range(0, int.MaxValue, ErrorMessage = "Chỉ số phòng không được âm")]
    public int RoomIndex { get; set; }

    /// <summary>Cách thuê: 0 = theo giờ, 1 = theo ngày.</summary>
    public int Type { get; set; } = (int)BookingType.DAY;

    /// <summary>Thời điểm dự kiến nhận phòng.</summary>
    public DateTime? CheckIn { get; set; }

    /// <summary>Thời điểm dự kiến trả phòng.</summary>
    public DateTime? CheckOut { get; set; }

    /// <summary>Số khách — phải từ 1 đến sức chứa của phòng.</summary>
    public int GuestCount { get; set; } = 1;

    /// <summary>Ghi chú của khách, tối đa 500 ký tự, không bắt buộc.</summary>
    [StringLength(500, ErrorMessage = "Ghi chú không được vượt quá 500 ký tự")]
    public string? Note { get; set; }
}

/// <summary>Đơn vừa tạo xong trả về cho khách.</summary>
/// <remarks>
/// Cố tình KHÔNG có `Id` — khách tra cứu bằng `Code` (AGENTS.md 6.3).
/// </remarks>
public class BookingResponseDto
{
    /// <summary>Mã đơn dạng `HS-250930-4821` — hiển thị thay cho Id.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Tên phòng đã đặt.</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>Tên địa điểm chứa phòng.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Cách thuê, dạng số.</summary>
    public BookingType BookingType { get; set; }

    /// <summary>Thời điểm nhận phòng.</summary>
    public DateTime CheckIn { get; set; }

    /// <summary>Thời điểm trả phòng.</summary>
    public DateTime CheckOut { get; set; }

    /// <summary>Số khách.</summary>
    public int GuestCount { get; set; }

    /// <summary>Tổng tiền đã chốt (VNĐ) — không đổi khi giá phòng đổi sau này.</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Trạng thái đơn, dạng số — đơn mới luôn `PENDING`.</summary>
    public BookingStatus Status { get; set; }

    /// <summary>Ghi chú của khách.</summary>
    public string? Note { get; set; }

    /// <summary>Thời điểm tạo đơn.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Dữ liệu gửi lên khi khách hủy đơn của chính mình.</summary>
public class CancelBookingRequest
{
    /// <summary>Lý do hủy, không bắt buộc, tối đa 500 ký tự.</summary>
    [StringLength(500, ErrorMessage = "Lý do hủy không được vượt quá 500 ký tự")]
    public string? Reason { get; set; }
}

/// <summary>Một đơn trong danh sách "Đơn của tôi". Không có `Id`.</summary>
public class MyBookingDto
{
    /// <summary>Mã đơn để tra cứu và hủy.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Tên phòng.</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>Tên địa điểm.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Cách thuê, dạng số.</summary>
    public BookingType BookingType { get; set; }

    /// <summary>Thời điểm nhận phòng.</summary>
    public DateTime CheckIn { get; set; }

    /// <summary>Thời điểm trả phòng.</summary>
    public DateTime CheckOut { get; set; }

    /// <summary>Số khách.</summary>
    public int GuestCount { get; set; }

    /// <summary>Tổng tiền đã chốt (VNĐ).</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Trạng thái đơn, dạng số.</summary>
    public BookingStatus Status { get; set; }

    /// <summary>Thời điểm tạo đơn.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Một dòng lịch sử trạng thái của đơn.</summary>
public class BookingHistoryDto
{
    /// <summary>Trạng thái trước, null ở dòng tạo đơn.</summary>
    public BookingStatus? FromStatus { get; set; }

    /// <summary>Trạng thái sau.</summary>
    public BookingStatus ToStatus { get; set; }

    /// <summary>Tên người thực hiện (khách hoặc Admin).</summary>
    public string ChangedByName { get; set; } = string.Empty;

    /// <summary>Ghi chú kèm theo, có thể null.</summary>
    public string? Note { get; set; }

    /// <summary>Thời điểm đổi.</summary>
    public DateTime ChangedAt { get; set; }
}

/// <summary>Chi tiết một đơn kèm toàn bộ lịch sử — dùng `Code` để tra cứu.</summary>
public class BookingDetailDto : MyBookingDto
{
    /// <summary>Ghi chú của khách lúc đặt.</summary>
    public string? Note { get; set; }

    /// <summary>Lý do hủy/từ chối, có thể null.</summary>
    public string? CancelReason { get; set; }

    /// <summary>Lịch sử trạng thái, cũ nhất trước.</summary>
    public List<BookingHistoryDto> History { get; set; } = new();

    /// <summary>
    /// Số phòng thực tế, ví dụ `A101`.
    /// </summary>
    /// <remarks>
    /// Thêm ở Bước 16: trước đó giao diện hiện số phòng nhưng DTO không có trường
    /// này nên chỗ trống — kiểu `BookingDetail` ở TypeScript khai nó là bắt buộc
    /// dù API không gửi, và TypeScript không bắt được lỗi đó.
    /// </remarks>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Sức chứa của phòng, để khách nhớ mình đặt phòng mấy người.</summary>
    public int Capacity { get; set; }

    /// <summary>
    /// Đơn này đã có đánh giá của chính người đang xem hay chưa.
    /// </summary>
    /// <remarks>
    /// Giao diện dựa vào cờ này để quyết định hiện form đánh giá hay hiện dòng
    /// "Bạn đã đánh giá". Không có cờ này thì hoặc phải để khách bấm gửi rồi mới
    /// nhận 409, hoặc phải thêm một endpoint riêng chỉ để hỏi câu "đánh giá chưa".
    /// </remarks>
    public bool DaDanhGia { get; set; }

    /// <summary>Đánh giá của chính người đang xem, null khi chưa đánh giá.</summary>
    public MyReviewDto? DanhGiaCuaToi { get; set; }
}
