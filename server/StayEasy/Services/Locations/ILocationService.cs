using StayEasy.DTOs;

namespace StayEasy.Services.Locations;

/// <summary>
/// Nghiệp vụ xem địa điểm cho khách: danh sách kèm phòng tóm tắt.
///
/// Logic nằm ở tầng Service để unit test gọi thẳng hàm được
/// (AGENTS.md 5.2). Endpoint này public, không cần đăng nhập.
/// </summary>
public interface ILocationService
{
    /// <summary>
    /// Lấy toàn bộ địa điểm đang hoạt động kèm phòng tóm tắt.
    /// Thứ tự ổn định theo `Id` để giao diện điều hướng bằng chỉ số.
    /// </summary>
    Task<List<LocationListItemDto>> LayDanhSachAsync(CancellationToken ct);
}
