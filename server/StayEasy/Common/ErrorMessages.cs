namespace StayEasy.Common;

/// <summary>
/// Thông báo lỗi hiển thị cho người dùng.
///
/// Gom vào một chỗ để không lặp chuỗi tiếng Việt ở nhiều nơi — sau này đổi câu
/// chữ thì sửa một file, không phải rà từng Service (nguyên tắc DRY).
/// </summary>
public static class ErrorMessages
{
    // ----- Đăng ký -----

    public const string EmailKhongHopLe = "Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: ten@gmail.com";
    public const string EmailDaTonTai = "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác";
    public const string MatKhauQuaNgan = "Mật khẩu phải có ít nhất 6 ký tự";
    public const string MatKhauKhongKhop = "Mật khẩu xác nhận không khớp";

    // Số 6 và 100 trong các thông báo phải khớp `AuthRules.MinPasswordLength` và
    // `AuthRules.MaxPasswordLength`. Không nối trực tiếp vì `ErrorMessages` nằm ở
    // tầng Common, không được phụ thuộc ngược lại tầng Services.
    public const string MatKhauQuaDai = "Mật khẩu không được vượt quá 100 ký tự";
    public const string HoTenRong = "Vui lòng nhập họ và tên";
    public const string HoTenQuaDai = "Họ và tên không được vượt quá 100 ký tự";
    public const string SoDienThoaiKhongHopLe = "Số điện thoại chỉ được gồm 9 đến 11 chữ số";
    public const string DiaChiQuaDai = "Địa chỉ không được vượt quá 255 ký tự";

    // ----- Đăng nhập / phiên -----

    /// <summary>
    /// Cố tình trả chung cho cả "email không tồn tại" lẫn "sai mật khẩu": nếu báo riêng,
    /// kẻ xấu dò email xem tài khoản nào có trong hệ thống.
    /// </summary>
    public const string ThongTinDangNhapSai = "Email hoặc mật khẩu không đúng";
    public const string TaiKhoanDaBiKhoa = "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên";
    public const string TokenKhongHopLe = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại";
    public const string TokenDaHetHan = "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại";
    public const string ChuaDangNhap = "Bạn chưa đăng nhập. Vui lòng đăng nhập để tiếp tục";
    public const string KhongDuQuyen = "Bạn không có quyền thực hiện thao tác này";

    /// <summary>
    /// Dùng khi body gửi lên không đọc được thành JSON, hoặc thiếu trường bắt buộc.
    /// Cố tình không lấy nguyên văn message do .NET sinh ra: chuỗi đó kiểu
    /// "'d' is an invalid start of a value. Path: $ | LineNumber: 0" là chi tiết kỹ thuật
    /// của thư viện, đưa ra ngoài là lộ thông tin hệ thống (AGENTS.md mục 6.5).
    /// </summary>
    public const string DuLieuKhongHopLe = "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại";
    public const string KhongTimThayDuLieu = "Không tìm thấy dữ liệu yêu cầu";
    public const string DinhDangKhongHoTro = "Định dạng dữ liệu gửi lên không được hỗ trợ";

    // ----- Mật khẩu & hồ sơ -----

    public const string MatKhauCuSai = "Mật khẩu hiện tại không đúng";
    public const string MatKhauMoiTrungMatKhauCu = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    public const string MatKhauMoiQuaNgan = "Mật khẩu mới phải có ít nhất 6 ký tự";
    public const string MatKhauMoiQuaDai = "Mật khẩu mới không được vượt quá 100 ký tự";
    public const string KhongTimThayNguoiDung = "Không tìm thấy thông tin tài khoản";
    public const string LoiHeThong = "Đã xảy ra lỗi. Vui lòng thử lại sau";
}
