namespace HomeStay.Common;

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

    // ----- Đặt phòng -----

    public const string GioTraPhaiSauGioNhan = "Giờ trả phòng phải sau giờ nhận phòng";
    public const string DatTruocItNhat2Gio = "Phải đặt trước ít nhất 2 giờ";
    public const string TheoGioToiThieu3Gio = "Đặt theo giờ tối thiểu 3 giờ";
    public const string LoaiThueKhongHopLe = "Cách thuê không hợp lệ";
    public const string KhongTimThayPhong = "Không tìm thấy phòng";
    public const string PhongBaoTri = "Phòng đang bảo trì, không nhận đặt";
    public const string PhongDaCoDon = "Phòng đã có người đặt trong khoảng thời gian này";

    // ----- Mật khẩu & hồ sơ -----

    public const string MatKhauCuSai = "Mật khẩu hiện tại không đúng";
    public const string MatKhauMoiTrungMatKhauCu = "Mật khẩu mới không được trùng với mật khẩu hiện tại";
    public const string MatKhauMoiQuaNgan = "Mật khẩu mới phải có ít nhất 6 ký tự";
    public const string MatKhauMoiQuaDai = "Mật khẩu mới không được vượt quá 100 ký tự";
    public const string KhongTimThayNguoiDung = "Không tìm thấy thông tin tài khoản";
    public const string LoiHeThong = "Đã xảy ra lỗi. Vui lòng thử lại sau";

    // ----- Quản trị: cơ sở, phòng, khách hàng -----

    public const string KhongTimThayCoSo = "Không tìm thấy cơ sở";
    public const string TenCoSoRong = "Vui lòng nhập tên cơ sở";
    public const string TenCoSoQuaDai = "Tên cơ sở không được vượt quá 150 ký tự";
    public const string DiaChiCoSoRong = "Vui lòng nhập địa chỉ cơ sở";
    public const string KhongXoaCoSoDangCoPhong = "Không thể xoá cơ sở đang có phòng. Vui lòng xoá hoặc chuyển các phòng trước";

    public const string TenPhongRong = "Vui lòng nhập tên phòng";
    public const string TenPhongQuaDai = "Tên phòng không được vượt quá 150 ký tự";
    public const string MoTaPhongQuaDai = "Mô tả phòng không được vượt quá 1000 ký tự";
    public const string SoPhongQuaDai = "Số phòng không được vượt quá 20 ký tự";
    public const string SoKhachKhongHopLe = "Số khách tối đa phải từ 1 đến 20";
    public const string GiaGioKhongHopLe = "Giá theo giờ phải lớn hơn 0";
    public const string GiaNgayKhongHopLe = "Giá theo ngày phải lớn hơn 0";
    public const string AnhPhongQuaNhieu = "Mỗi phòng chỉ được tải tối đa 10 ảnh";
    public const string TienNghiKhongHopLe = "Có tiện nghi không tồn tại trong danh mục";
    public const string KhongXoaPhongDangCoDon = "Không thể xoá phòng đã có đơn đặt. Vui lòng chuyển phòng sang bảo trì";
    public const string PhongDangVeSinh = "Phòng vừa được vệ sinh, chưa sẵn sàng nhận đơn mới";

    public const string KhongTimThayKhach = "Không tìm thấy khách hàng";
    public const string KhongDuQuyenThaoTac = "Chỉ quản trị viên mới được thực hiện thao tác này";

    // ----- Quản trị: vòng đời đơn -----

    public const string KhongTimThayDon = "Không tìm thấy đơn đặt phòng";
    public const string ChiTietTuChoiRong = "Vui lòng nhập lý do từ chối để khách biết vì sao đơn bị hủy";

    /// <summary>
    /// Báo thao tác không hợp lệ với trạng thái hiện tại của đơn. Có 2 tham số
    /// theo thứ tự: <c>{0}</c> = trạng thái mà thao tác này yêu cầu,
    /// <c>{1}</c> = trạng thái đơn đang thật sự ở.
    /// </summary>
    /// <remarks>
    /// Cố tình KHÔNG nói "không thể chuyển sang trạng thái X": với thao tác
    /// một chiều như trả phòng, câu đó đọc ra thành nghĩa ngược (đơn đã hoàn
    /// tất mà bảo "không thể chuyển sang đã hoàn tất"). Chỉ nêu trạng thái
    /// đang cần và đang có là đủ để Admin hiểu phải làm gì tiếp.
    /// </remarks>
    public const string SaiTrangThaiChoThaoTac = "Thao tác này chỉ áp dụng cho đơn đang \"{0}\". Đơn hiện ở trạng thái \"{1}\"";

    // ----- Đánh giá & nhận xét (Bước 16) -----

    /// <summary>
    /// Khách cố đánh giá đơn đã có đánh giá. Cố tình **không** nói cho khả năng
    /// sửa lại: hệ thống không cho khách sửa đánh giá của mình (tránh chấm 1 sao
    /// rồi sửa thành 5 sao), nên hướng dẫn "sửa lại" sẽ dẫn tới chỗ không có.
    /// </summary>
    public const string DaDanhGiaDonRoi = "Bạn đã đánh giá đơn này rồi. Mỗi đơn chỉ được đánh giá một lần";

    public const string KhongTimThayDanhGia = "Không tìm thấy đánh giá";
    // ----- Thanh toán -----

    public const string ChiDonHoanThanh = "Chỉ đơn đã hoàn thành mới thanh toán được.";
    public const string DaThuTienRoi = "Phiếu thu này đã đánh dấu thu tiền rồi.";
    public const string DaThatBai = "Phiếu thu đã đánh dấu thất bại, không thu được.";
    public const string SoTienKhongKhop = "Số tiền ghi nhận không khớp tổng tiền của đơn.";
    public const string ChiChuDon = "Chỉ khách chủ đơn mới xem được thanh toán của đơn này.";
    public const string ChuaCoPhieuThu = "Đơn này chưa có phiếu thu.";
    public const string DonChuaHoanThanhChuaDuocThanhToan = "Đơn chưa hoàn thành nên chưa có phiếu thu.";
}
