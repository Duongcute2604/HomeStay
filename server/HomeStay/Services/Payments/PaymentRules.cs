namespace HomeStay.Services.Payments;

/// <summary>
/// Các con số ràng buộc của nghiệp vụ thanh toán.
///
/// <para>
/// Chỉ chứa **hằng số**, không chứa câu chữ thông báo — thông báo nằm tập trung trong
/// <c>Common/ErrorMessages.cs</c> đúng như phần còn lại của dự án, để sửa một thông báo
/// thì chỉ sửa một chỗ (nguyên tắc DRY, AGENTS.md 3.2).
/// </para>
/// </summary>
public static class PaymentRules
{
    /// <summary>
    /// Sai số tối đa cho phép giữa số tiền ghi nhận và tổng tiền của đơn.
    /// </summary>
    /// <remarks>
    /// Vì sao không so sánh bằng `==` thẳng: `decimal` lưu cơ sở 10 nên kết quả phép nhân
    /// và chia có thể lệch ở chữ số rất xa (ví dụ chia 3 lần). So sánh bằng sai số tuyệt
    /// đối vẫn bắt được lỗi thật mà không nhạy quá mức với sai số làm tròn của CSDL.
    /// </remarks>
    public const decimal SaiSoTienToiDa = 0.0001m;

    /// <summary>Ghi chú tối đa bao nhiêu ký tự — khớp với `HasMaxLength` ở tầng CSDL.</summary>
    public const int DoDaiGhiChuToiDa = 500;

    /// <summary>Độ dài tối đa của mã đơn dạng `HS-YYMMDD-XXXX`.</summary>
    public const int DoDaiMaDon = 15;
}