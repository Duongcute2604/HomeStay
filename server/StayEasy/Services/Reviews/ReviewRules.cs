namespace StayEasy.Services.Reviews;

/// <summary>
/// Các ràng buộc nghiệp vụ của đánh giá, khai báo MỘT LẦN duy nhất.
/// </summary>
/// <remarks>
/// Số sao và độ dài nhận xét phải khớp với ràng buộc ở tầng CSDL
/// (`CK_Reviews_Rating`, cột `Comment` dài 1000). Khai ở hai nơi thì dễ lệch —
/// khi CSDL nới ràng buộc mà service chưa theo thì lỗi chỉ lộ ra lúc chạy thật.
/// </remarks>
public static class ReviewRules
{
    /// <summary>Số sao thấp nhất.</summary>
    public const int MinRating = 1;

    /// <summary>Số sao cao nhất.</summary>
    public const int MaxRating = 5;

    /// <summary>Độ dài tối đa nhận xét, khớp cột `Comment` trong CSDL.</summary>
    public const int MaxCommentLength = 1000;

    /// <summary>Số đánh giá hiển thị trên trang chi tiết phòng.</summary>
    public const int SoDanhGiaHienThi = 5;
}
