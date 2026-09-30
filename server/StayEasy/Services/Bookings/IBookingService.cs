using System.Data;
using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Booking;
using StayEasy.Services.Rooms;

namespace StayEasy.Services.Bookings;

/// <summary>
/// Nghiệp vụ tạo đơn đặt phòng của khách.
///
/// Mọi quy tắc về ngày/giờ/trùng lịch tái sử dụng `IRoomService.KiemTraTrongAsync`
/// thay vì viết lại (DRY) — đặt được hay không do đúng một nơi quyết định.
/// </summary>
public interface IBookingService
{
    /// <summary>
    /// Tạo đơn mới ở trạng thái `PENDING` trong transaction `SERIALIZABLE`.
    /// </summary>
    /// <exception cref="AppException">
    /// 400 khi thiếu ngày, trả trước nhận, đặt gấp, theo giờ dưới 3 giờ, quá
    /// sức chứa, hoặc cách thuê không hợp lệ. 404 khi chỉ số sai phòng.
    /// 409 khi phòng bận trong khoảng đã chọn.
    /// </exception>
    Task<BookingResponseDto> TaoDonAsync(int userId, CreateBookingRequest request, CancellationToken ct);
}
