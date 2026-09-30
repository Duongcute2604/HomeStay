using StayEasy.DTOs;

namespace StayEasy.Services.Rooms;

/// <summary>
/// Nghiệp vụ tìm kiếm phòng cho khách.
///
/// Logic nằm ở tầng Service để unit test gọi thẳng hàm được (AGENTS.md 5.2).
/// Endpoint public, không cần đăng nhập.
/// </summary>
public interface IRoomService
{
    /// <summary>
    /// Tìm phòng theo bộ lọc, sắp xếp rồi phân trang.
    /// `locationIndex` vượt phạm vi → trả trang rỗng (không báo lỗi).
    /// </summary>
    /// <exception cref="StayEasy.Common.AppException">
    /// 400 khi `minPrice &gt; maxPrice`, `roomType` ngoài 0–3, hoặc `sort` không hợp lệ.
    /// </exception>
    Task<PagedResultDto<RoomSearchItemDto>> SearchAsync(RoomSearchRequest request, CancellationToken ct);
}
