namespace StayEasy.Enums;

/// <summary>
/// Vai trò của tài khoản. Hệ thống chỉ có 2 tác nhân duy nhất — không tạo thêm loại khác.
/// </summary>
public enum UserRole
{
    /// <summary>Khách hàng — đăng ký, tìm kiếm, đặt phòng, đánh giá.</summary>
    CUSTOMER = 0,

    /// <summary>Quản trị viên — quản lý danh mục, vòng đời đơn đặt phòng, xem thống kê.</summary>
    ADMIN = 1
}
