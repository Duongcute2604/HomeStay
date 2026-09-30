using StayEasy.Enums;

namespace StayEasy.DTOs;

/// <summary>Tham số lọc danh sách đơn ở trang quản trị.</summary>
public class AdminBookingFilter
{
    /// <summary>
    /// Trạng thái cần lọc. `null` = không lọc (xem tất cả).
    /// Kiểu `BookingStatus?` vì số 0 (`PENDING`) là giá trị hợp lệ, không phải "rỗng".
    /// </summary>
    public BookingStatus? Status { get; set; }

    /// <summary>Từ khoá tìm trong mã đơn hoặc tên/email khách, không phân biệt hoa thường.</summary>
    public string? Keyword { get; set; }

    /// <summary>Chỉ số trang, bắt đầu từ 1.</summary>
    public int Page { get; set; } = 1;

    /// <summary>Số đơn mỗi trang.</summary>
    public int PageSize { get; set; } = 10;
}

/// <summary>Một đơn trong bảng quản trị.</summary>
/// <remarks>Có `Id` để Admin gọi API; giao diện hiển thị mã `Code`, không hiện Id.</remarks>
public class AdminBookingDto
{
    /// <summary>Khoá nội bộ, giao diện không hiển thị.</summary>
    public int Id { get; set; }

    /// <summary>Mã đơn `HS-YYMMDD-XXXX` — thứ khách nhìn thấy.</summary>
    public string Code { get; set; } = string.Empty;

    /// <summary>Tên khách đặt.</summary>
    public string CustomerName { get; set; } = string.Empty;

    /// <summary>Email khách — Admin dùng để liên hệ khi cần.</summary>
    public string CustomerEmail { get; set; } = string.Empty;

    /// <summary>Số điện thoại khách.</summary>
    public string? CustomerPhone { get; set; } = string.Empty;

    /// <summary>Tên phòng.</summary>
    public string RoomName { get; set; } = string.Empty;

    /// <summary>Tên cơ sở chứa phòng.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Cách thuê (theo giờ / theo ngày).</summary>
    public BookingType BookingType { get; set; }

    /// <summary>Thời điểm nhận phòng.</summary>
    public DateTime CheckIn { get; set; }

    /// <summary>Thời điểm trả phòng.</summary>
    public DateTime CheckOut { get; set; }

    /// <summary>Số khách.</summary>
    public int GuestCount { get; set; }

    /// <summary>Tổng tiền (VNĐ).</summary>
    public decimal TotalAmount { get; set; }

    /// <summary>Trạng thái đơn, dạng số — giao diện tự gắn nhãn tiếng Việt.</summary>
    public BookingStatus Status { get; set; }

    /// <summary>Ghi chú của khách khi đặt.</summary>
    public string? Note { get; set; }

    /// <summary>Lý do hủy / từ chối.</summary>
    public string? CancelReason { get; set; }

    /// <summary>Thời điểm tạo đơn.</summary>
    public DateTime CreatedAt { get; set; }
}

/// <summary>Dữ liệu Admin gửi lên khi từ chối đơn (bắt buộc có lý do).</summary>
public class RejectBookingRequest
{
    /// <summary>Lý do từ chối, hiển thị cho khách nên không được để trống.</summary>
    public string Reason { get; set; } = string.Empty;
}
