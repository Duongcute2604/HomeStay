namespace StayEasy.Services.Admin;

/// <summary>
/// Các quy ước nghiệp vụ khi Admin nhập dữ liệu, khai báo MỘT LẦN duy nhất.
///
/// Riêng cho phía quản trị vì khác bên khách: khách chỉ xem, Admin nhập liệu
/// nên cần chặn sớm dữ liệu rác (giá âm, tên quá dài, ảnh quá nhiều) thay vì
/// để CSDL hoặc giao diện mới báo lỗi.
/// </summary>
public static class AdminRules
{
    /// <summary>Độ dài tối đa tên cơ sở, khớp với cột Name trong CSDL.</summary>
    public const int MaxLocationNameLength = 150;

    /// <summary>Độ dài tối đa tên phòng, khớp với cột Name trong CSDL.</summary>
    public const int MaxRoomNameLength = 150;

    /// <summary>Độ dài tối đa mô tả, khớp với cột Description trong CSDL.</summary>
    public const int MaxDescriptionLength = 1000;

    /// <summary>Độ dài tối đa số phòng, khớp với cột RoomNumber trong CSDL.</summary>
    public const int MaxRoomNumberLength = 20;

    /// <summary>Số khách tối đa một phòng chịu được.</summary>
    public const int MaxCapacity = 20;

    /// <summary>Giá tối thiểu 1 giờ (VNĐ) — chặn giá 0 hoặc âm do nhập nhầm.</summary>
    public const decimal MinPricePerHour = 1000m;

    /// <summary>Giá tối đa 1 ngày (VNĐ), chặn nhập nhầm thừa số 0.</summary>
    public const decimal MaxPricePerDay = 100_000_000m;

    /// <summary>Số ảnh tối đa một phòng, để trang quản trị không đơ khi sửa.</summary>
    public const int MaxImagesPerRoom = 10;
}
