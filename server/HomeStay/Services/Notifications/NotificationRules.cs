namespace HomeStay.Services.Notifications;

/// <summary>
/// Các con số ràng buộc của nghiệp vụ thông báo.
///
/// <para>
/// Chỉ chứa **hằng số**; câu chữ thông báo nằm tập trung trong
/// <c>Common/ErrorMessages.cs</c> đúng phần còn lại của dự án (nguyên tắc DRY).
/// </para>
/// </summary>
public static class NotificationRules
{
    /// <summary>Tiêu đề tối đa bao nhiêu ký tự — khớp với <c>HasMaxLength</c>.</summary>
    public const int DoDaiTieuDeToiDa = 200;

    /// <summary>Nội dung tối đa bao nhiêu ký tự — khớp với <c>HasMaxLength</c>.</summary>
    public const int DoDaiNoiDungToiDa = 500;

    /// <summary>
    /// Lấy tối đa bao nhiêu thông báo cho một lần tải trang.
    /// </summary>
    /// <remarks>
    /// Chuông là thứ người dùng mở rất thường xuyên nên cần tải nhanh, nhưng danh sách
    /// thông báo cũng không có ý nghĩa để xem hết. Giới hạn 50 là đủ dùng và đồng thời
    /// chặn truy vấn không giới hạn.
    /// </remarks>
    public const int SoToiDaMoiTrang = 50;

    /// <summary>Số thông báo mới nhất lấy cho con số badge trên header.</summary>
    public const int SoBadgeToiDa = 99;
}