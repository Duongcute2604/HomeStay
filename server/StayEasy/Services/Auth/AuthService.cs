using System.Net;
using Microsoft.EntityFrameworkCore;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.DTOs;
using StayEasy.Entities;
using StayEasy.Enums;

namespace StayEasy.Services.Auth;

/// <summary>
/// Hiện thực nghiệp vụ tài khoản.
///
/// Cấu trúc các hàm:
/// 1. Kiểm tra đầu vào (hàm thuần, không chạm DB) — để lỗi 400/409 trả về
///    trước khi mất công truy vấn.
/// 2. Truy vấn dữ liệu.
/// 3. Kiểm tra nghiệp vụ phụ thuộc dữ liệu (trùng email, bị khoá...).
/// 4. Ghi và trả kết quả.
/// </summary>
public class AuthService : IAuthService
{
    private readonly StayEasyDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly ITokenHasher _tokenHasher;
    private readonly IJwtTokenService _tokenService;

    /// <summary>Khởi tạo service với các phụ thuộc đã đăng ký trong DI.</summary>
    public AuthService(
        StayEasyDbContext db,
        IPasswordHasher hasher,
        ITokenHasher tokenHasher,
        IJwtTokenService tokenService)
    {
        _db = db;
        _hasher = hasher;
        _tokenHasher = tokenHasher;
        _tokenService = tokenService;
    }

    /// <inheritdoc />
    public async Task<AuthResponse> DangKyAsync(RegisterRequest request, CancellationToken ct)
    {
        // Kiểm tra lại ở tầng Service chứ không trông chờ vào [Required] của DTO.
        // Lý do: unit test gọi thẳng AuthService, bỏ qua hoàn toàn bước validate model
        // của ASP.NET. Luật nghiệp vụ nằm ở Controller thì test được thì mới học được
        // (AGENTS.md mục 5.2) — mà chỗ nào không test được thì cũng chính là chỗ dễ sai.
        KiemTraHoTen(request.FullName);
        KiemTraEmailHopLe(request.Email);
        KiemTraMatKhau(
            request.Password,
            request.ConfirmPassword,
            ErrorMessages.MatKhauQuaNgan,
            ErrorMessages.MatKhauQuaDai);
        KiemTraSoDienThoai(request.PhoneNumber);
        KiemTraDoDaiDiaChi(request.Address);

        string email = ChuanHoaEmail(request.Email);

        // Dùng AsNoTracking vì chỉ cần hỏi "đã tồn tại chưa", không sửa dòng này.
        bool daTonTai = await _db.Users.AsNoTracking().AnyAsync(u => u.Email == email, ct);

        if (daTonTai)
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.EmailDaTonTai);
        }

        // Không lấy Role từ request. Đây là lỗi bảo mật kinh điển: nếu để client gửi
        // Role lên, bất kỳ ai cũng tự đăng ký được thành Admin. Tài khoản Admin duy nhất
        // do dữ liệu mẫu tạo ra, không có API nào cấp quyền đó.
        User user = new()
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PhoneNumber = KiemTraRong(request.PhoneNumber),
            Address = KiemTraRong(request.Address),
            PasswordHash = _hasher.Hash(request.Password),
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        AuthResponse response = await CapTokenCho(user, ct);
        return response;
    }

    /// <inheritdoc />
    public async Task<AuthResponse> DangNhapAsync(LoginRequest request, CancellationToken ct)
    {
        string email = ChuanHoaEmail(request.Email);

        // Cố tình KHÔNG dùng AsNoTracking ở đây: sau khi đăng nhập thành công, hàm CapTokenCho
        // ghi RefreshTokenHash vào chính dòng user này rồi SaveChanges. Nếu đọc bằng
        // AsNoTracking, dòng đó không được theo dõi nên SaveChanges sẽ không phát sinh
        // lệnh UPDATE — đăng nhập vẫn trả token về nhưng refresh token không được lưu,
        // và lần làm mới token sau đó luôn thất bại.
        User? user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == email, ct);

        // Cố ý trả CHUNG một thông báo cho cả "không có email" lẫn "sai mật khẩu".
        // Nếu tách thành 2 thông báo, kẻ xấu dò email tuần tự sẽ biết tài khoản nào tồn tại.
        bool matKhauDung = user is not null && _hasher.Verify(request.Password, user.PasswordHash);

        if (user is null || !matKhauDung)
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.ThongTinDangNhapSai);
        }

        if (user.Status == UserStatus.LOCKED)
        {
            throw new AppException(HttpStatusCode.Forbidden, ErrorMessages.TaiKhoanDaBiKhoa);
        }

        AuthResponse response = await CapTokenCho(user, ct);
        return response;
    }

    /// <inheritdoc />
    public async Task<AuthResponse> LamMoiTokenAsync(RefreshTokenRequest request, CancellationToken ct)
    {
        TokenClaims? claims = _tokenService.DocClaims(request.RefreshToken);

        if (claims is null)
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenKhongHopLe);
        }

        User? user = await _db.Users.FirstOrDefaultAsync(u => u.Id == claims.UserId, ct);

        if (user is null)
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenKhongHopLe);
        }

        if (user.Status == UserStatus.LOCKED)
        {
            throw new AppException(HttpStatusCode.Forbidden, ErrorMessages.TaiKhoanDaBiKhoa);
        }

        // Đối chiếu hash của refresh token trong DB. Nhờ bước này mà sau khi đăng xuất
        // (xoá RefreshTokenHash) thì refresh token cũ không dùng lại được — nếu thiếu,
        // token đã logout vẫn xin được access token mới, tức là đăng xuất vô hiệu.
        if (string.IsNullOrEmpty(user.RefreshTokenHash)
            || !_tokenHasher.Verify(request.RefreshToken, user.RefreshTokenHash))
        {
            throw new AppException(HttpStatusCode.Unauthorized, ErrorMessages.TokenDaHetHan);
        }

        AuthResponse response = await CapTokenCho(user, ct);
        return response;
    }

    /// <inheritdoc />
    public async Task<bool> DangXuatAsync(int userId, CancellationToken ct)
    {
        User user = await TaiTaiKhoanDeGhiAsync(userId, ct);

        VoHieuHoaPhien(user);

        await _db.SaveChangesAsync(ct);
        return true;
    }

    /// <inheritdoc />
    public async Task<UserProfileDto> LayHoSoAsync(int userId, CancellationToken ct)
    {
        User user = await TaiTaiKhoanDeDocAsync(userId, ct);

        return ThanhHoSo(user);
    }

    /// <inheritdoc />
    public async Task<UserProfileDto> CapNhatHoSoAsync(int userId, UpdateProfileRequest request, CancellationToken ct)
    {
        KiemTraHoTen(request.FullName);
        KiemTraSoDienThoai(request.PhoneNumber);
        KiemTraDoDaiDiaChi(request.Address);

        User user = await TaiTaiKhoanDeGhiAsync(userId, ct);

        // Chỉ gán đúng ba trường cho phép sửa. Không bao giờ gán Email, Role hay Status
        // từ dữ liệu client — đó là đường để tự nâng quyền hoặc tự gỡ lệnh khoá.
        user.FullName = request.FullName.Trim();
        user.PhoneNumber = KiemTraRong(request.PhoneNumber);
        user.Address = KiemTraRong(request.Address);

        await _db.SaveChangesAsync(ct);

        return ThanhHoSo(user);
    }

    /// <inheritdoc />
    public async Task<bool> DoiMatKhauAsync(int userId, ChangePasswordRequest request, CancellationToken ct)
    {
        KiemTraMatKhau(
            request.NewPassword,
            request.ConfirmNewPassword,
            ErrorMessages.MatKhauMoiQuaNgan,
            ErrorMessages.MatKhauMoiQuaDai);

        User user = await TaiTaiKhoanDeGhiAsync(userId, ct);

        if (!_hasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.MatKhauCuSai);
        }

        if (_hasher.Verify(request.NewPassword, user.PasswordHash))
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.MatKhauMoiTrungMatKhauCu);
        }

        user.PasswordHash = _hasher.Hash(request.NewPassword);

        // Đổi mật khẩu phải buộc đăng xuất mọi phiên đang mở, tránh kẻ đánh cắp phiên
        // cũ vẫn dùng được sau khi chủ tài khoản đổi mật khẩu.
        VoHieuHoaPhien(user);

        await _db.SaveChangesAsync(ct);
        return true;
    }

    // ---------------- Hàm riêng tư ----------------

    /// <summary>
    /// Tải tài khoản để <b>ghi</b> thay đổi, hoặc báo 404.
    /// </summary>
    /// <remarks>
    /// Không dùng <c>AsNoTracking</c> vì thao tác này sẽ sửa bản ghi rồi
    /// <c>SaveChangesAsync</c> — không theo dõi thì thay đổi không được ghi.
    /// </remarks>
    private async Task<User> TaiTaiKhoanDeGhiAsync(int userId, CancellationToken ct)
    {
        User? user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        return user ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayNguoiDung);
    }

    /// <summary>
    /// Tải tài khoản để <b>đọc</b>, không theo dõi thay đổi, hoặc báo 404.
    /// </summary>
    private async Task<User> TaiTaiKhoanDeDocAsync(int userId, CancellationToken ct)
    {
        User? user = await _db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId, ct);
        return user ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayNguoiDung);
    }

    /// <summary>
    /// Xoá dấu vết refresh token — đây là cách vô hiệu hoá phiên: refresh token cũ
    /// từ đây không còn khớp hash nào nên bị từ chối. Không cần bảng riêng lưu danh
    /// sách token đã thu hồi.
    /// </summary>
    private static void VoHieuHoaPhien(User user)
    {
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
    }

    private async Task<AuthResponse> CapTokenCho(User user, CancellationToken ct)
    {
        DateTime accessHetHan = _tokenService.TinhThoiDiemHetHanAccessToken();
        string accessToken = _tokenService.TaoAccessToken(user, accessHetHan);

        // Đây là giới hạn đã biết và đã ghi trong báo cáo: mỗi tài khoản chỉ giữ được
        // một refresh token tại một thời điểm, nên đăng nhập ở máy thứ hai sẽ làm token
        // máy thứ nhất mất tác dụng. Chấp nhận được ở phạm vi đồ án.
        string refreshToken = _tokenService.TaoRefreshToken(
            user,
            DateTime.Now.AddDays(AuthRules.RefreshTokenDays));

        user.RefreshTokenHash = _tokenHasher.Hash(refreshToken);
        user.RefreshTokenExpiresAt = DateTime.Now.AddDays(AuthRules.RefreshTokenDays);
        await _db.SaveChangesAsync(ct);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresInMinutes = AuthRules.AccessTokenMinutes,
            User = ThanhHoSo(user)
        };
    }

    private static void KiemTraEmailHopLe(string email)
    {
        // Phải Trim TRƯỚC khi kiểm định dạng. Người dùng hay dán email kèm khoảng
        // trắng (" ten@gmail.com ") — nếu kiểm tra luôn chuỗi thô thì regex sẽ báo
        // sai định dạng và người dùng không hiểu vì sao email của họ bị từ chối.
        if (!EmailValidator.IsValid(ChuanHoaEmail(email)))
        {
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.EmailKhongHopLe);
        }
    }

    private static void KiemTraHoTen(string? fullName)
    {
        if (string.IsNullOrWhiteSpace(fullName))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.HoTenRong);
        }

        if (fullName.Length > AuthRules.MaxFullNameLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.HoTenQuaDai);
        }
    }

    /// <summary>
    /// Kiểm tra mật khẩu mới, dùng chung cho đăng ký và đổi mật khẩu.
    /// </summary>
    /// <param name="thongBaoQuaNgan">Thông báo khi mật khẩu quá ngắn — hai luồng nói khác nhau.</param>
    /// <param name="thongBaoQuaDai">Thông báo khi mật khẩu quá dài — hai luồng nói khác nhau.</param>
    /// <remarks>
    /// Trước đây cả hai nhánh "quá ngắn" và "quá dài" đều ném
    /// <see cref="ErrorMessages.MatKhauQuaNgan"/>, nên người dùng nhập mật khẩu 150 ký
    /// tự sẽ đọc "Mật khẩu phải có ít nhất 6 ký tự" — thông báo sai hoàn toàn, họ sẽ
    /// rút ngắn xuống 6 ký tự rồi lại thấy vẫn lỗi.
    /// </remarks>
    private static void KiemTraMatKhau(
        string matKhau,
        string? xacNhan,
        string thongBaoQuaNgan,
        string thongBaoQuaDai)
    {
        if (string.IsNullOrWhiteSpace(matKhau) || matKhau.Length < AuthRules.MinPasswordLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, thongBaoQuaNgan);
        }

        if (matKhau.Length > AuthRules.MaxPasswordLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, thongBaoQuaDai);
        }

        if (matKhau != xacNhan)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.MatKhauKhongKhop);
        }
    }

    private static void KiemTraDoDaiDiaChi(string? diaChi)
    {
        if (!string.IsNullOrWhiteSpace(diaChi) && diaChi.Length > AuthRules.MaxAddressLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.DiaChiQuaDai);
        }
    }

    private static void KiemTraSoDienThoai(string? soDienThoai)
    {
        if (string.IsNullOrWhiteSpace(soDienThoai))
        {
            return;
        }

        if (soDienThoai.Length > AuthRules.MaxPhoneLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.SoDienThoaiKhongHopLe);
        }

        bool chiCoChuSo = soDienThoai.All(char.IsDigit);

        bool duNgan = soDienThoai.Length >= AuthRules.MinPhoneDigits;
        bool khongQuaDai = soDienThoai.Length <= AuthRules.MaxPhoneDigits;

        if (!chiCoChuSo || !duNgan || !khongQuaDai)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.SoDienThoaiKhongHopLe);
        }
    }

    /// <summary>
    /// Cắt khoảng trắng thừa và ép về chữ thường.
    ///
    /// Ép chữ thường là bắt buộc, không phải tuỳ thích: so sánh chuỗi trong LINQ phụ
    /// thuộc vào collation của hệ quản trị. MySQL mặc định (utf8mb4_0900_ai_ci) coi
    /// "A@x.com" và "a@x.com" là bằng nhau, còn provider InMemory dùng trong unit test
    /// lại so sánh phân biệt hoa thường. Nếu chỉ dựa vào collation, cùng một quy tắc
    /// sẽ cho kết quả khác nhau giữa môi trường thật và test — đúng loại lỗi mà test
    /// xanh lại hỏng ngoài đời. Chuẩn hoá tại code khiến hành vi giống nhau ở mọi nơi.
    /// </summary>
    private static string ChuanHoaEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    /// <summary>Rút gọn chuỗi rỗng thành null để CSDL ghi NULL thay vì chuỗi rỗng.</summary>
    private static string? KiemTraRong(string? giaTri)
    {
        return string.IsNullOrWhiteSpace(giaTri) ? null : giaTri.Trim();
    }

    private static UserProfileDto ThanhHoSo(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            Role = user.Role,
            Status = user.Status,
            CreatedAt = user.CreatedAt
        };
    }
}
