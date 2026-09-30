using StayEasy.DTOs;

namespace StayEasy.Services.Admin;

/// <summary>Quản lý cơ sở (địa điểm) cho Admin.</summary>
public interface IAdminLocationService
{
    /// <summary>Lấy toàn bộ cơ sở, kể cả cơ sở đã ngừng hoạt động.</summary>
    Task<List<AdminLocationDto>> LayDanhSachAsync(CancellationToken ct);

    /// <summary>Tạo cơ sở mới.</summary>
    Task<AdminLocationDto> TaoAsync(FacilityRequest request, CancellationToken ct);

    /// <summary>Cập nhật thông tin cơ sở.</summary>
    Task<AdminLocationDto> SuaAsync(int id, FacilityRequest request, CancellationToken ct);

    /// <summary>Xoá cơ sở. Cơ sở còn phòng thì không cho xoá.</summary>
    Task XoaAsync(int id, CancellationToken ct);
}
