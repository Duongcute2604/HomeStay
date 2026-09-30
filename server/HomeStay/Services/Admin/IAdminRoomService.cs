using HomeStay.DTOs;

namespace HomeStay.Services.Admin;

/// <summary>Quản lý phòng cho Admin: tạo, sửa, đổi trạng thái, xoá.</summary>
public interface IAdminRoomService
{
    /// <summary>Lấy toàn bộ phòng kèm ảnh và tiện nghi.</summary>
    Task<List<AdminRoomDto>> LayDanhSachAsync(CancellationToken ct);

    /// <summary>
    /// Lấy danh mục tiện nghi để dựng checkbox ở form tạo/sửa phòng.
    /// </summary>
    Task<List<AmenityDto>> LayDanhSachTienNghAsync(CancellationToken ct);

    /// <summary>Tạo phòng mới cùng ảnh và tiện nghi.</summary>
    Task<AdminRoomDto> TaoAsync(RoomRequest request, CancellationToken ct);

    /// <summary>Cập nhật phòng. Thay toàn bộ ảnh và tiện nghi theo dữ liệu gửi lên.</summary>
    Task<AdminRoomDto> SuaAsync(int id, RoomRequest request, CancellationToken ct);

    /// <summary>Chỉ đổi trạng thái phòng, không đụng tới các trường khác.</summary>
    Task<AdminRoomDto> DoiTrangThaiAsync(int id, RoomStatusRequest request, CancellationToken ct);

    /// <summary>Xoá phòng. Phòng đã có đơn thì không cho xoá.</summary>
    Task XoaAsync(int id, CancellationToken ct);
}
