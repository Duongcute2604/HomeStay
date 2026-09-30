using System.ComponentModel.DataAnnotations;
using StayEasy.Enums;

namespace StayEasy.DTOs;

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
