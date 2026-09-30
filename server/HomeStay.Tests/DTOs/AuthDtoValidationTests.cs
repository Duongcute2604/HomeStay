using System.ComponentModel.DataAnnotations;
using HomeStay.Common;
using HomeStay.DTOs;
using HomeStay.Services.Auth;
using Xunit;

namespace HomeStay.Tests.DTOs;

/// <summary>
/// Test cho các thông báo lỗi ghi trên attribute của DTO.
/// </summary>
/// <remarks>
/// Vì sao cần file test này khi đã có <c>AuthServiceTests</c>:
///
/// <para>
/// Với <c>[ApiController]</c>, ASP.NET Core kiểm tra ModelState **trước khi** gọi
/// tầng Service. Nên khi DTO sai định dạng, code trong Service **không bao giờ được
/// chạy** — kể cả phần kiểm tra trùng lặp mà tôi đã viết và test vào.
/// </para>
///
/// <para>
/// Bài học rút ra lúc sửa: đã sửa thông báo trong Service, 150 test vẫn xanh, nhưng
/// gọi API thật vẫn trả thông báo cũ — vì lỗi nằm ở attribute của DTO, không phải ở
/// Service. Test chạm tay vào Service thì không bao giờ chạm được tầng này.
/// </para>
///
/// <para>
/// Vì vậy test ở đây gọi đúng thứ mà framework gọi: <c>Validator.TryValidateObject</c>.
/// </para>
/// </remarks>
public class AuthDtoValidationTests
{
    /// <summary>Chạy đúng cơ chế ModelState của ASP.NET Core trên một đối tượng DTO.</summary>
    private static IList<ValidationResult> Kiem(object duLieu)
    {
        ValidationContext context = new(duLieu);
        List<ValidationResult> ketQua = new();
        Validator.TryValidateObject(duLieu, context, ketQua, validateAllProperties: true);
        return ketQua;
    }

    /// <summary>Gộp toàn bộ thông báo lỗi thành một chuỗi để assert cho dễ đọc.</summary>
    private static string NoiDungLoi(object duLieu)
    {
        return string.Join(" | ", Kiem(duLieu).Select(r => r.ErrorMessage));
    }

    private static RegisterRequest TaoDangKy(string matKhau, string? xacNhan = null)
    {
        return new RegisterRequest
        {
            FullName = "Nguyễn Hải Nam",
            Email = "khachmoi@gmail.com",
            Password = matKhau,
            ConfirmPassword = xacNhan ?? matKhau,
        };
    }

    // ---------------- Mật khẩu: ngắn và dài phải BÁO KHÁC NHAU ----------------

    [Fact]
    public void RegisterRequest_MatKhauQuaNgan_BaoDungThongBaoQuaNgan()
    {
        string loi = NoiDungLoi(TaoDangKy("12345"));

        Assert.Contains(ErrorMessages.MatKhauQuaNgan, loi);
    }

    [Fact]
    public void RegisterRequest_MatKhauQuaDai_BaoDungThongBaoQuaDai()
    {
        string loi = NoiDungLoi(TaoDangKy(new string('a', AuthRules.MaxPasswordLength + 1)));

        // Đây là ca 147 test cũ không bắt được: trước đây attribute dùng
        // `StringLength(100, MinimumLength = 6, ErrorMessage = ...)` nên mật khẩu quá
        // dài cũng hiện "phải có ít nhất 6 ký tự".
        Assert.Contains(ErrorMessages.MatKhauQuaDai, loi);
        Assert.DoesNotContain(ErrorMessages.MatKhauQuaNgan, loi);
    }

    [Fact]
    public void RegisterRequest_MatKhauDungBien_HopLe()
    {
        Assert.Empty(Kiem(TaoDangKy(new string('a', AuthRules.MinPasswordLength))));
        Assert.Empty(Kiem(TaoDangKy(new string('a', AuthRules.MaxPasswordLength))));
    }

    [Fact]
    public void ChangePasswordRequest_MatKhauMoiQuaDai_BaoDungThongBaoMoiQuaDai()
    {
        ChangePasswordRequest duLieu = new()
        {
            CurrentPassword = "matkhau123",
            NewPassword = new string('a', AuthRules.MaxPasswordLength + 1),
            ConfirmNewPassword = new string('a', AuthRules.MaxPasswordLength + 1),
        };

        string loi = NoiDungLoi(duLieu);

        Assert.Contains(ErrorMessages.MatKhauMoiQuaDai, loi);
        Assert.DoesNotContain(ErrorMessages.MatKhauMoiQuaNgan, loi);
    }

    [Fact]
    public void ChangePasswordRequest_MatKhauMoiQuaNgan_BaoDungThongBaoMoiQuaNgan()
    {
        ChangePasswordRequest duLieu = new()
        {
            CurrentPassword = "matkhau123",
            NewPassword = "12345",
            ConfirmNewPassword = "12345",
        };

        string loi = NoiDungLoi(duLieu);

        Assert.Contains(ErrorMessages.MatKhauMoiQuaNgan, loi);
    }

    // ---------------- Các trường còn lại: giới hạn độ dài khớp hằng số ----------------

    [Fact]
    public void RegisterRequest_HoTenQuaDai_BaoLoi()
    {
        RegisterRequest duLieu = TaoDangKy("123456");
        duLieu.FullName = new string('a', AuthRules.MaxFullNameLength + 1);

        Assert.Contains(ErrorMessages.HoTenQuaDai, NoiDungLoi(duLieu));
    }

    [Fact]
    public void RegisterRequest_EmailQuaDai_BaoLoi()
    {
        RegisterRequest duLieu = TaoDangKy("123456");
        duLieu.Email = new string('a', AuthRules.MaxEmailLength + 1);

        Assert.Contains("Email không được vượt quá 150 ký tự", NoiDungLoi(duLieu));
    }

    [Fact]
    public void RegisterRequest_SoDienThoaiQuaDai_BaoLoi()
    {
        RegisterRequest duLieu = TaoDangKy("123456");
        duLieu.PhoneNumber = new string('9', AuthRules.MaxPhoneLength + 1);

        Assert.Contains("Số điện thoại không được vượt quá 15 ký tự", NoiDungLoi(duLieu));
    }

    [Fact]
    public void RegisterRequest_DiaChiQuaDai_BaoLoi()
    {
        RegisterRequest duLieu = TaoDangKy("123456");
        duLieu.Address = new string('a', AuthRules.MaxAddressLength + 1);

        Assert.Contains(ErrorMessages.DiaChiQuaDai, NoiDungLoi(duLieu));
    }

    [Fact]
    public void RegisterRequest_TrongKhongBatBuoc_ChoPhepDeTrong()
    {
        RegisterRequest duLieu = TaoDangKy("123456");
        duLieu.PhoneNumber = string.Empty;
        duLieu.Address = null;

        Assert.Empty(Kiem(duLieu));
    }

    [Fact]
    public void RegisterRequest_XacNhanKhongKhop_BaoLoi()
    {
        string loi = NoiDungLoi(TaoDangKy("123456", xacNhan: "654321"));

        Assert.Contains(ErrorMessages.MatKhauKhongKhop, loi);
    }

    [Fact]
    public void UpdateProfileRequest_HoTenRong_BaoLoi()
    {
        UpdateProfileRequest duLieu = new() { FullName = string.Empty };

        Assert.Contains(ErrorMessages.HoTenRong, NoiDungLoi(duLieu));
    }

    [Fact]
    public void LoginRequest_ThieuTruong_BaoLoiCaHai()
    {
        string loi = NoiDungLoi(new LoginRequest { Email = string.Empty, Password = string.Empty });

        Assert.Contains("Vui lòng nhập email", loi);
        Assert.Contains("Vui lòng nhập mật khẩu", loi);
    }
}
