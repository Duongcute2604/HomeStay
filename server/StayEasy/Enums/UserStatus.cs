namespace StayEasy.Enums;

/// <summary>
/// Trạng thái tài khoản. Dùng để khoá khách vi phạm thay vì xoá hẳn — giữ nguyên lịch sử đơn.
/// </summary>
public enum UserStatus
{
    /// <summary>Đang hoạt động — đăng nhập và sử dụng hệ thống bình thường.</summary>
    ACTIVE = 0,

    /// <summary>Bị khoá bởi Admin — đăng nhập bị từ chối với thông báo rõ ràng.</summary>
    LOCKED = 1
}
