namespace StayEasy.Services.Auth;

/// <summary>Thông tin đọc được từ một token đã ký.</summary>
/// <param name="UserId">Định danh người dùng.</param>
/// <param name="ExpiresAt">Thời điểm hết hạn.</param>
public record TokenClaims(int UserId, DateTime ExpiresAt);
