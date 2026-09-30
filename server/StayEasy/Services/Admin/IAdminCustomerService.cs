using StayEasy.DTOs;

namespace StayEasy.Services.Admin;

/// <summary>Quản lý khách hàng cho Admin: xem, thêm mới, khoá/mở khoá.</summary>
public interface IAdminCustomerService
{
    /// <summary>Lấy toàn bộ tài khoản khách kèm số đơn đã đặt.</summary>
    Task<List<CustomerDto>> LayDanhSachAsync(CancellationToken ct);

    /// <summary>Admin tự tạo tài khoản khách (ví dụ khách gọi điện đặt trước).</summary>
    Task<CustomerDto> TaoAsync(CustomerCreateRequest request, CancellationToken ct);

    /// <summary>Khoá hoặc mở khoá tài khoản khách.</summary>
    Task<CustomerDto> DoiTrangThaiAsync(int id, CustomerStatusRequest request, CancellationToken ct);
}
