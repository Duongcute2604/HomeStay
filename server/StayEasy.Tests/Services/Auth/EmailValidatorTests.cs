using StayEasy.Services.Auth;

namespace StayEasy.Tests.Services.Auth;

/// <summary>
/// Kiểm chứng nhận diện định dạng email.
///
/// Đây là hàm quyết định trả 409 hay 400 khi đăng ký, nên phải chặt cả 2 chiều:
/// email hợp lệ không bị từ chối oan, email sai bị chặn. Chạy trên hàm thuần nên
/// không cần database, xong trong mili giây.
/// </summary>
public class EmailValidatorTests
{
    [Theory]
    [InlineData("khach1@gmail.com")]
    [InlineData("Nguyen.Hai.Nam@Stayeasy.vn")]
    [InlineData("a@b.co")]
    [InlineData("khach+homestay@gmail.com")]
    [InlineData("khach_2026@homestay.vn")]
    [InlineData("khach%test@gmail.com")]
    public void IsValid_EmailDungDinhDang_TraVeTrue(string email)
    {
        Assert.True(EmailValidator.IsValid(email));
    }

    [Theory]
    [InlineData("khachgmail.com")]        // thiếu dấu @
    [InlineData("khach@gmail")]           // thiếu phần sau dấu chấm
    [InlineData("@gmail.com")]           // thiếu phần trước @
    [InlineData("khach @gmail.com")]      // có khoảng trắng
    [InlineData("khach@.com")]            // miền rỗng
    [InlineData("khach@@gmail.com")]      // hai dấu @
    [InlineData("khach@gmail.c")]         // hậu tố quá ngắn
    public void IsValid_EmailSaiDinhDang_TraVeFalse(string email)
    {
        Assert.False(EmailValidator.IsValid(email));
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void IsValid_EmailRong_TraVeFalse(string? email)
    {
        Assert.False(EmailValidator.IsValid(email));
    }

    [Fact]
    public void IsValid_EmailDaiQuaGioiHan_TraVeFalse()
    {
        // 200 ký tự vượt giới hạn 150 ký tự của cột Email trong CSDL — nếu cho qua,
        // lúc SaveChanges MySQL sẽ cắt báo lỗi thành 500 thay vì trả 409 cho người dùng.
        string emailTooLong = new string('a', 200) + "@gmail.com";

        Assert.False(EmailValidator.IsValid(emailTooLong));
    }
}
