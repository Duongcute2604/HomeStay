using System.Net;
using HomeStay.Common;
using HomeStay.DTOs;

namespace HomeStay.Services.Admin;

/// <summary>
/// Số liệu thống kê cho trang quản trị.
///
/// Tách riêng khỏi `IAdminBookingService` vì đây là câu hỏi khác hẳn: bên
/// booking trả về dữ liệu từng dòng để Admin thao tác, bên đây gộp lại thành
/// số liệu để Admin ra quyết định. Gộp chung sẽ khiến service phải biết cả
/// cách vẽ biểu đồ lẫn cách chuyển trạng thái.
/// </summary>
public interface IAdminDashboardService
{
    /// <summary>
    /// Lấy toàn bộ số liệu thống kê.
    /// </summary>
    /// <param name="soThang">Số tháng gần nhất tính doanh thu (mặc định 6, tối đa 24).</param>
    /// <param name="soNgay">
    /// Số ngày gần nhất tính tỷ lệ lấp đầy (mặc định 30, tối đa 365).
    /// </param>
    /// <param name="ct">Token huỷ.</param>
    Task<DashboardDto> LaySoLieuAsync(int soThang, int soNgay, CancellationToken ct);
}
