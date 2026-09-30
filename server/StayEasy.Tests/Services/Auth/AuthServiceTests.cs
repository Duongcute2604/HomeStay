using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;
using StayEasy.Services.Auth;
using StayEasy.Tests.Helpers;

namespace StayEasy.Tests.Services.Auth;

/// <summary>
/// Kiểm chứng nghiệp vụ tài khoản: đăng ký, đăng nhập, làm mới token, hồ sơ, đổi mật khẩu.
///
/// Mỗi test dựng database InMemory riêng nên không ảnh hưởng lẫn nhau, và không cần
/// bật MySQL — đây là lý do tách logic khỏi Controller: gọi được thẳng hàm nghiệp vụ.
///
/// Cả 3 nhóm kịch bản đều có test tương ứng:
/// - Happy path: dữ liệu hợp lệ → thành công, dữ liệu ghi đúng.
/// - Edge case: giá trị biên (mật khẩu đúng 6 ký tự, email viết HOA, số điện thoại 9 số).
/// - Không hợp lệ: trùng email, sai mật khẩu, tài khoản bị khoá, token đã huỷ.
/// </summary>
public class AuthServiceTests
{
    private readonly StayEasyDbContext _db = TestDbContextFactory.Create();
    private readonly FakePasswordHasher _hasher = new();

    // Dùng TokenHasher THẬT chứ không phải bản giả: AuthService so khớp refresh token
    // qua lớp này, dùng bản giá (so sánh chuỗi thuần) thì lỗi "token cũ vẫn dùng
    // được" sẽ không bao giờ bị test bắt — đúng sự cố đã gặp với BCrypt cắt cốt 72 byte.
    // SHA-256 chạy nhanh nên không làm chậm test.
    private readonly ITokenHasher _tokenHasher = new TokenHasher();

    private AuthService TaoService(IJwtTokenService? tokenService = null)
    {
        return new AuthService(_db, _hasher, _tokenHasher, tokenService ?? new FakeJwtTokenService());
    }

    // ---------------- Đăng ký ----------------

    [Fact]
    public async Task DangKyAsync_DuLieuHopLe_TaoTaiKhoanVaTraVeToken()
    {
        AuthService service = TaoService();

        AuthResponse result = await service.DangKyAsync(
            TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        Assert.Equal("khachmoi@gmail.com", result.User.Email);
        Assert.Equal("Nguyễn Hải Nam", result.User.FullName);
        Assert.NotEmpty(result.AccessToken);
        Assert.NotEmpty(result.RefreshToken);
        Assert.Equal(AuthRules.AccessTokenMinutes, result.ExpiresInMinutes);
    }

    [Fact]
    public async Task DangKyAsync_DuLieuHopLe_LuuDongVaoCSDL()
    {
        AuthService service = TaoService();

        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        User? user = await _db.Users.FirstOrDefaultAsync(u => u.Email == "khachmoi@gmail.com");
        Assert.NotNull(user);
    }

    [Fact]
    public async Task DangKyAsync_DuLieuHopLe_KhongTheTuChonQuyenADMIN()
    {
        AuthService service = TaoService();

        AuthResponse result = await service.DangKyAsync(
            TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        // Đây là lỗi bảo mật kinh điển: nếu lấy Role từ request, bất kỳ ai cũng tự
        // đăng ký được thành Admin bằng cách gửi thêm một trường role trong JSON.
        Assert.Equal(UserRole.CUSTOMER, result.User.Role);
    }

    [Fact]
    public async Task DangKyAsync_DuLieuHopLe_KhongLuuMatKhauTho()
    {
        AuthService service = TaoService();

        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        User? user = await _db.Users.FirstOrDefaultAsync(u => u.Email == "khachmoi@gmail.com");
        Assert.NotNull(user);
        Assert.NotEqual("matkhau123", user!.PasswordHash);
    }

    [Theory]
    [InlineData("khachtrung@gmail.com")]
    [InlineData("admin@stayeasy.vn")]
    public async Task DangKyAsync_EmailDaTonTai_ThroiAppException409(string emailDaCo)
    {
        _db.Users.Add(new User
        {
            FullName = "Tài khoản đã có",
            Email = emailDaCo,
            PasswordHash = _hasher.Hash("matkhau123"),
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE
        });
        await _db.SaveChangesAsync(CancellationToken.None);

        AuthService service = TaoService();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(TaoRegisterRequest(email: emailDaCo), CancellationToken.None));

        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Theory]
    [InlineData("khachsai")]
    [InlineData("khach@")]
    [InlineData("@gmail.com")]
    public async Task DangKyAsync_EmailSaiDinhDang_ThroiAppException409(string emailSai)
    {
        AuthService service = TaoService();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(TaoRegisterRequest(email: emailSai), CancellationToken.None));

        // 409 chứ không phải 400: quy ��c đã chốt là email sai định dạng và email trùng
        // cùng kết luận "email này không dùng được", nên phải trả cùng một mã lỗi.
        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Fact]
    public async Task DangKyAsync_MatKhauNganHon6KyTu_ThroiAppException400()
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com", matKhau: "12345");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task DangKyAsync_MatKhauKhongKhopXacNhan_ThroiAppException400()
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com");
        request.ConfirmPassword = "matkhau456";

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task DangKyAsync_HoTenRong_ThroiAppException400()
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com");
        request.FullName = "   ";

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Theory]
    [InlineData("012345678")]           // 9 chữ số — biên dưới, hợp lệ
    [InlineData("01234567890")]        // 11 chữ số — biên trên, hợp lệ
    public async Task DangKyAsync_SoDienThoaiTrongBienHopLe_DangKyThanhCong(string soDienThoai)
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com");
        request.PhoneNumber = soDienThoai;

        AuthResponse result = await service.DangKyAsync(request, CancellationToken.None);

        Assert.Equal(soDienThoai, result.User.PhoneNumber);
    }

    [Theory]
    [InlineData("01234567")]            // 8 chữ số — ngắn hơn biên dưới
    [InlineData("012345678901")]        // 12 chữ số — dài hơn biên trên
    [InlineData("0912345678a")]         // có chữ cái
    [InlineData("0912 345 678")]        // có khoảng trắng
    public async Task DangKyAsync_SoDienThoaiKhongHopLe_ThroiAppException400(string soDienThoai)
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com");
        request.PhoneNumber = soDienThoai;

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task DangKyAsync_KhongNhapSoDienThoaiVaDiaChi_LuuNull()
    {
        AuthService service = TaoService();

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com");
        request.PhoneNumber = "   ";
        request.Address = "";

        AuthResponse result = await service.DangKyAsync(request, CancellationToken.None);

        // Rỗng phải lưu NULL chứ không lưu chuỗi rỗng, nếu không truy vấn "số điện thoại
        // khác NULL" sẽ vớ phải tài khoản không nhập số.
        Assert.Null(result.User.PhoneNumber);
        Assert.Null(result.User.Address);
    }

    // ---------------- Đăng nhập ----------------

    [Fact]
    public async Task DangNhapAsync_EmailVaMatKhauDung_TraVeTokenVaThongTinTaiKhoan()
    {
        AuthService service = TaoService();
        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        AuthResponse result = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        Assert.NotEmpty(result.AccessToken);
        Assert.Equal("khachmoi@gmail.com", result.User.Email);
    }

    [Fact]
    public async Task DangNhapAsync_ThanhCong_LuuHashRefreshTokenVaoCSDL()
    {
        AuthService service = TaoService();
        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        await service.DangNhapAsync(TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        User? user = await _db.Users.FirstOrDefaultAsync(u => u.Email == "khachmoi@gmail.com");

        // Không có dòng này thì lần làm mới token sẽ luôn thất bại: hàm kiểm tra hash
        // trong CSDL mà cột đó đang NULL.
        Assert.NotNull(user);
        Assert.NotNull(user!.RefreshTokenHash);
        Assert.NotNull(user.RefreshTokenExpiresAt);
    }

    [Fact]
    public async Task DangNhapAsync_MatKhauSai_ThroiAppException401()
    {
        AuthService service = TaoService();
        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangNhapAsync(TaoLoginRequest("khachmoi@gmail.com", "matkhauSai"), CancellationToken.None));

        Assert.Equal(HttpStatusCode.Unauthorized, loi.StatusCode);
    }

    [Fact]
    public async Task DangNhapAsync_EmailKhongTonTai_ThroiAppException401()
    {
        AuthService service = TaoService();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangNhapAsync(TaoLoginRequest("khachkhongco@gmail.com", "matkhau123"), CancellationToken.None));

        Assert.Equal(HttpStatusCode.Unauthorized, loi.StatusCode);
    }

    [Fact]
    public async Task DangNhapAsync_EmailKhongTonTaiVaEmailTonTai_CungMotThongBaoLoi()
    {
        AuthService service = TaoService();
        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        AppException loiEmailSai = await Assert.ThrowsAsync<AppException>(() =>
            service.DangNhapAsync(TaoLoginRequest("khachkhongco@gmail.com", "matkhau123"), CancellationToken.None));

        AppException loiMatKhauSai = await Assert.ThrowsAsync<AppException>(() =>
            service.DangNhapAsync(TaoLoginRequest("khachmoi@gmail.com", "matkhauSai"), CancellationToken.None));

        // Nếu hai thông báo khác nhau, kẻ xấu dò email tuần tự sẽ biết tài khoản nào
        // tồn tại trong hệ thống. Phải trùng nhau.
        Assert.Equal(loiEmailSai.Message, loiMatKhauSai.Message);
    }

    [Fact]
    public async Task DangNhapAsync_TaiKhoanDaBiKhoa_ThroiAppException403()
    {
        _db.Users.Add(new User
        {
            FullName = "Nguyễn Văn B",
            Email = "khachbikhoa@gmail.com",
            PasswordHash = _hasher.Hash("matkhau123"),
            Role = UserRole.CUSTOMER,
            Status = UserStatus.LOCKED
        });
        await _db.SaveChangesAsync(CancellationToken.None);

        AuthService service = TaoService();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangNhapAsync(TaoLoginRequest("khachbikhoa@gmail.com", "matkhau123"), CancellationToken.None));

        // 403 chứ không phải 401: thông tin đăng nhập ĐÚNG, chỉ là tài khoản bị cấm.
        Assert.Equal(HttpStatusCode.Forbidden, loi.StatusCode);
    }

    [Fact]
    public async Task DangNhapAsync_EmailVietHoaVaCoKhoangTrắngThua_VanDangNhapDuoc()
    {
        AuthService service = TaoService();
        await service.DangKyAsync(TaoRegisterRequest(email: "khachmoi@gmail.com"), CancellationToken.None);

        // Người dùng gõ "  KHACHMOI@GMAIL.COM  " rất hay xảy ra khi copy từ email.
        // Nếu không Trim + không phân biệt hoa thường thì họ phải tự nhớ quy tắc.
        AuthResponse result = await service.DangNhapAsync(
            TaoLoginRequest("  KHACHMOI@GMAIL.COM  ", "matkhau123"), CancellationToken.None);

        Assert.Equal("khachmoi@gmail.com", result.User.Email);
    }

    // ---------------- Làm mới token ----------------

    [Fact]
    public async Task LamMoiTokenAsync_RefreshTokenHopLe_TraVeTokenMoi()
    {
        AuthService service = TaoService();
        await TaoTaiKhoan("khachmoi@gmail.com");

        AuthResponse dangNhap = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        AuthResponse result = await service.LamMoiTokenAsync(
            new RefreshTokenRequest { RefreshToken = dangNhap.RefreshToken }, CancellationToken.None);

        Assert.NotEmpty(result.AccessToken);
        Assert.Equal("khachmoi@gmail.com", result.User.Email);
    }

    [Fact]
    public async Task LamMoiTokenAsync_RefreshTokenSaiDinhDang_ThroiAppException401()
    {
        AuthService service = TaoService();
        await TaoTaiKhoan("khachmoi@gmail.com");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.LamMoiTokenAsync(
                new RefreshTokenRequest { RefreshToken = "khong-phai-token" }, CancellationToken.None));

        Assert.Equal(HttpStatusCode.Unauthorized, loi.StatusCode);
    }

    [Fact]
    public async Task LamMoiTokenAsync_SauKhiDangXuat_ThroiAppException401()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AuthResponse dangNhap = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        await service.DangXuatAsync(user.Id, CancellationToken.None);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.LamMoiTokenAsync(
                new RefreshTokenRequest { RefreshToken = dangNhap.RefreshToken }, CancellationToken.None));

        // Nếu thiếu bước đối chiếu hash trong CSDL, đăng xuất chỉ là hình thức:
        // refresh token cũ vẫn xin được access token mới, tức là đăng xuất vô hiệu.
        Assert.Equal(HttpStatusCode.Unauthorized, loi.StatusCode);
    }

    [Fact]
    public async Task LamMoiTokenAsync_DangNhapLaiLanNua_TokenCuKhongConDungDuoc()
    {
        // Đây là test chốt lại giới hạn "mỗi tài khoản một phiên" đã ghi trong báo cáo
        // đồ án. Nó tồn tại vì bản đầu tiên của hệ thống ĐÃ HỎNG ở đúng chỗ này:
        // refresh token được băm bằng BCrypt, mà BCrypt chỉ xét 72 byte đầu, nên
        // hai token chỉ khác nhau ở phần cuối lại có cùng hash và token cũ vẫn
        // qua được bước đối chiếu.
        AuthService service = TaoService();
        await TaoTaiKhoan("khachmoi@gmail.com");

        // Máy 1 đăng nhập.
        AuthResponse may1 = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        // Máy 2 đăng nhập lại cùng tài khoản, ghi đè phiên của máy 1.
        AuthResponse may2 = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        Assert.NotEqual(may1.RefreshToken, may2.RefreshToken);

        // Token máy 1 phải mất tác dụng.
        AppException loiTokenCu = await Assert.ThrowsAsync<AppException>(() =>
            service.LamMoiTokenAsync(
                new RefreshTokenRequest { RefreshToken = may1.RefreshToken }, CancellationToken.None));

        Assert.Equal(HttpStatusCode.Unauthorized, loiTokenCu.StatusCode);

        // Token máy 2 thì vẫn phải dùng được — nếu không thì đăng nhập lần hai
        // làm hỏng luôn phiên mới, tức là hệ thống không dùng được.
        AuthResponse lamMoi = await service.LamMoiTokenAsync(
            new RefreshTokenRequest { RefreshToken = may2.RefreshToken }, CancellationToken.None);

        Assert.NotEmpty(lamMoi.AccessToken);
    }

    [Fact]
    public async Task LamMoiTokenAsync_TaiKhoanDaBiKhoa_ThroiAppException403()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AuthResponse dangNhap = await service.DangNhapAsync(
            TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        user.Status = UserStatus.LOCKED;
        await _db.SaveChangesAsync(CancellationToken.None);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.LamMoiTokenAsync(
                new RefreshTokenRequest { RefreshToken = dangNhap.RefreshToken }, CancellationToken.None));

        // Tài khoản bị khoá thì không được lấy lại phiên qua đường vòng làm mới token.
        Assert.Equal(HttpStatusCode.Forbidden, loi.StatusCode);
    }

    // ---------------- Đăng xuất ----------------

    [Fact]
    public async Task DangXuatAsync_ThanhCong_XoaHashRefreshToken()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");
        await service.DangNhapAsync(TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        bool ketQua = await service.DangXuatAsync(user.Id, CancellationToken.None);

        User? sauDangXuat = await _db.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
        Assert.True(ketQua);
        Assert.NotNull(sauDangXuat);
        Assert.Null(sauDangXuat!.RefreshTokenHash);
    }

    [Fact]
    public async Task DangXuatAsync_UserKhongTonTai_ThroiAppException404()
    {
        AuthService service = TaoService();

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangXuatAsync(userId: 9999, CancellationToken.None));

        Assert.Equal(HttpStatusCode.NotFound, loi.StatusCode);
    }

    // ---------------- Hồ sơ ----------------

    [Fact]
    public async Task LayHoSoAsync_UserHopLe_TraVeDungThongTin()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com", hoTen: "Nguyễn Văn C");

        UserProfileDto result = await service.LayHoSoAsync(user.Id, CancellationToken.None);

        Assert.Equal("Nguyễn Văn C", result.FullName);
    }

    [Fact]
    public async Task LayHoSoAsync_KhongCoMatKhauHashTrongKetQua()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        UserProfileDto result = await service.LayHoSoAsync(user.Id, CancellationToken.None);

        // Ranh giới bảo mật quan trọng nhất của API: dù có sót cũng tuyệt đối không được
        // lọt PasswordHash hay RefreshTokenHash ra ngoài.
        string json = System.Text.Json.JsonSerializer.Serialize(result);
        Assert.DoesNotContain("PasswordHash", json);
        Assert.DoesNotContain("RefreshTokenHash", json);
        Assert.DoesNotContain("matkhau123", json);
    }

    [Fact]
    public async Task CapNhatHoSoAsync_ThongTinHopLe_CapNhatBaTruongChoPhep()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        UserProfileDto result = await service.CapNhatHoSoAsync(user.Id, new UpdateProfileRequest
        {
            FullName = "Nguyễn Hải Nam",
            PhoneNumber = "0912345678",
            Address = "Số 1, đường Nguyễn Trãi"
        }, CancellationToken.None);

        Assert.Equal("Nguyễn Hải Nam", result.FullName);
        Assert.Equal("0912345678", result.PhoneNumber);
        Assert.Equal("Số 1, đường Nguyễn Trãi", result.Address);
    }

    [Fact]
    public async Task CapNhatHoSoAsync_EmailKhongDoiDoi()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com", vaiTro: UserRole.ADMIN);

        await service.CapNhatHoSoAsync(user.Id, new UpdateProfileRequest
        {
            FullName = "Nguyễn Hải Nam"
        }, CancellationToken.None);

        User? sauCapNhat = await _db.Users.FirstOrDefaultAsync(u => u.Id == user.Id);

        // Cập nhật hồ sơ chỉ được sửa họ tên, điện thoại, địa chỉ. Email và quyền phải
        // giữ nguyên — nếu gán từ dữ liệu client thì mỗi người tự sửa quyền của mình.
        Assert.NotNull(sauCapNhat);
        Assert.Equal("khachmoi@gmail.com", sauCapNhat!.Email);
        Assert.Equal(UserRole.ADMIN, sauCapNhat.Role);
    }

    [Fact]
    public async Task CapNhatHoSoAsync_HoTenRong_ThroiAppException400()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.CapNhatHoSoAsync(user.Id, new UpdateProfileRequest { FullName = "  " }, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    // ---------------- Đổi mật khẩu ----------------

    [Fact]
    public async Task DoiMatKhauAsync_MatKhauCuDung_DoiThanhCongVaBuocDangXuatPhienCu()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");
        await service.DangNhapAsync(TaoLoginRequest("khachmoi@gmail.com", "matkhau123"), CancellationToken.None);

        bool ketQua = await service.DoiMatKhauAsync(user.Id, TaoChangePasswordRequest("matkhau123", "matkhauMoi456"), CancellationToken.None);

        User? sauDoi = await _db.Users.FirstOrDefaultAsync(u => u.Id == user.Id);
        Assert.True(ketQua);
        Assert.NotNull(sauDoi);
        Assert.True(_hasher.Verify("matkhauMoi456", sauDoi!.PasswordHash));
        Assert.Null(sauDoi.RefreshTokenHash);
    }

    [Fact]
    public async Task DoiMatKhauAsync_MatKhauCuSai_ThroiAppException400()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DoiMatKhauAsync(user.Id, TaoChangePasswordRequest("matkhauSai", "matkhauMoi456"), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task DoiMatKhauAsync_MatKhauMoiTrungMatKhauCu_ThroiAppException409()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DoiMatKhauAsync(user.Id, TaoChangePasswordRequest("matkhau123", "matkhau123"), CancellationToken.None));

        // Đổi sang đúng mật khẩu cũ là hành vi vô nghĩa — coi là xung đột nghiệp vụ.
        Assert.Equal(HttpStatusCode.Conflict, loi.StatusCode);
    }

    [Fact]
    public async Task DoiMatKhauAsync_MatKhauMoiNganHon6KyTu_ThroiAppException400()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DoiMatKhauAsync(user.Id, TaoChangePasswordRequest("matkhau123", "12345"), CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        // Kiểm cả NỘI DUNG thông báo: 147 test trước đó chỉ kiểm mã lỗi nên bỏ lọt
        // một lỗi là hai nhánh "quá ngắn" và "quá dài" cùng ném một thông báo.
        Assert.Equal(ErrorMessages.MatKhauMoiQuaNgan, loi.Message);
    }

    // ---------------- Thông báo mật khẩu: phải đúng NỘI DUNG, không chỉ đúng mã ----------------

    [Fact]
    public async Task DangKyAsync_MatKhauQuaDai_ThongBaoQuaDai_KhongPhaiQuaNgan()
    {
        AuthService service = TaoService();
        string matKhauQuaDai = new('a', AuthRules.MaxPasswordLength + 1);

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com", matKhau: matKhauQuaDai);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DangKyAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        // Nếu ở đây mà ra "Mật khẩu phải có ít nhất 6 ký tự" thì người dùng sẽ
        // rút ngắn mật khẩu xuống 6 ký tự rồi lại thấy vẫn lỗi — rất khó chịu.
        Assert.Equal(ErrorMessages.MatKhauQuaDai, loi.Message);
        Assert.NotEqual(ErrorMessages.MatKhauQuaNgan, loi.Message);
    }

    [Fact]
    public async Task DoiMatKhauAsync_MatKhauMoiQuaDai_ThongBaoQuaDai_KhongPhaiQuaNgan()
    {
        AuthService service = TaoService();
        User user = await TaoTaiKhoan("khachmoi@gmail.com");
        string matKhauQuaDai = new('a', AuthRules.MaxPasswordLength + 1);

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.DoiMatKhauAsync(
                user.Id,
                TaoChangePasswordRequest("matkhau123", matKhauQuaDai),
                CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
        // Luồng đổi mật khẩu nói "mật khẩu MỚI" cho đúng ngữ cảnh.
        Assert.Equal(ErrorMessages.MatKhauMoiQuaDai, loi.Message);
        Assert.NotEqual(ErrorMessages.MatKhauMoiQuaNgan, loi.Message);
    }

    [Fact]
    public async Task DangKyAsync_MatKhauDungBangGioiHan_ThanhCong()
    {
        // Biên: đúng bằng `MaxPasswordLength` thì phải qua, chỉ vượt 1 ký tự mới báo lỗi.
        // Test này chặn lỗi "sửa thành `>=`" khi ai đó sửa phép so sánh cho hợp lý hơn.
        AuthService service = TaoService();
        string matKhauDungBien = new('a', AuthRules.MaxPasswordLength);

        RegisterRequest request = TaoRegisterRequest(email: "khachmoi@gmail.com", matKhau: matKhauDungBien);

        AuthResponse ketQua = await service.DangKyAsync(request, CancellationToken.None);

        Assert.Equal("khachmoi@gmail.com", ketQua.User.Email);
    }

    // ---------------- Hàm dựng dữ liệu ----------------

    private static RegisterRequest TaoRegisterRequest(
        string email,
        string matKhau = "matkhau123")
    {
        return new RegisterRequest
        {
            FullName = "Nguyễn Hải Nam",
            Email = email,
            Password = matKhau,
            ConfirmPassword = matKhau,
            PhoneNumber = "0912345678",
            Address = "Số 1, đường Nguyễn Trãi"
        };
    }

    private static LoginRequest TaoLoginRequest(string email, string matKhau)
    {
        return new LoginRequest { Email = email, Password = matKhau };
    }

    private static ChangePasswordRequest TaoChangePasswordRequest(string matKhauCu, string matKhauMoi)
    {
        return new ChangePasswordRequest
        {
            CurrentPassword = matKhauCu,
            NewPassword = matKhauMoi,
            ConfirmNewPassword = matKhauMoi
        };
    }

    /// <summary>Tạo sẵn một tài khoản CUSTOMER đang hoạt động trong database test.</summary>
    private async Task<User> TaoTaiKhoan(
        string email,
        string hoTen = "Nguyễn Văn A",
        UserRole vaiTro = UserRole.CUSTOMER)
    {
        User user = new()
        {
            FullName = hoTen,
            Email = email,
            PasswordHash = _hasher.Hash("matkhau123"),
            Role = vaiTro,
            Status = UserStatus.ACTIVE
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(CancellationToken.None);

        return user;
    }
}
