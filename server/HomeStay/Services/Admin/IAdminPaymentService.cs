using HomeStay.DTOs;

namespace HomeStay.Services.Admin;

/// <summary>Phía quản trị viên: xem phiếu thu, xác nhận đã thu tiền, đánh dấu thất bại.</summary>
public interface IAdminPaymentService
{
    /// <summary>Danh sách phiếu thu phân trang, mới nhất trước.</summary>
    /// <param name="trangThai">Lọc theo trạng thái thanh toán. Null = tất cả.</param>
    /// <param name="page">Trang bắt đầu từ 1.</param>
    /// <param name="pageSize">Số dòng mỗi trang, tối đa 50.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<PagedResultDto<PaymentDto>> LayDanhSachAsync(
        int? trangThai, int page, int pageSize, CancellationToken ct);

    /// <summary>Xác nhận đã thu tiền: chuyển phiếu sang <c>PAID</c> và ghi thời điểm.</summary>
    /// <param name="id">Khoá phiếu thu.</param>
    /// <param name="request">Phương thức thực tế đã thu + ghi chú.</param>
    /// <param name="ct">Token huỷ.</param>
    /// <exception cref="Common.AppException">
    /// 404 khi không thấy phiếu · 409 khi đã thu tiền rồi hoặc phiếu đang thất bại ·
    /// 400 khi số tiền trong phiếu không khớp tổng tiền đơn.
    /// </exception>
    Task<PaymentDto> DanhDauDaThuAsync(int id, UpdatePaymentRequest request, CancellationToken ct);

    /// <summary>Đánh dấu thất bại để khách tạo lại giao dịch mới.</summary>
    /// <param name="id">Khoá phiếu thu.</param>
    /// <param name="lyDo">Lý do thất bại, hiển thị cho khách.</param>
    /// <param name="ct">Token huỷ.</param>
    Task<PaymentDto> DanhDauThatBaiAsync(int id, string? lyDo, CancellationToken ct);
}