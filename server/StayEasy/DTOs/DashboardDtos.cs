using StayEasy.Enums;

namespace StayEasy.DTOs;

/// <summary>Số liệu tổng quan hiển thị ở đầu trang thống kê.</summary>
public class DashboardOverviewDto
{
    /// <summary>Tổng số đơn đặt phòng từ trước tới nay.</summary>
    public int TongDon { get; set; }

    /// <summary>Số đơn khách tạo trong tháng đang xem.</summary>
    public int DonThangNay { get; set; }

    /// <summary>
    /// Doanh thu tháng đang xem (VNĐ).
    ///
    /// Chỉ tính đơn `COMPLETED` — tiền được ghi nhận khi khách đã trả phòng.
    /// Tính cả đơn đang chờ xác nhận sẽ ra doanh thu "ảo" mà khách có thể hủy.
    /// </summary>
    public decimal DoanhThuThangNay { get; set; }

    /// <summary>Tổng số phòng của hệ thống.</summary>
    public int TongPhong { get; set; }

    /// <summary>Tổng số tài khoản khách hàng.</summary>
    public int TongKhach { get; set; }

    /// <summary>
    /// Số phòng đang có khách ở, để Admin nhanh biết hệ thống đang lấp đầy.
    /// </summary>
    public int PhongDangCoKhach { get; set; }
}

/// <summary>Một cột của biểu đồ theo tháng.</summary>
public class MonthlyStatDto
{
    /// <summary>Tháng theo định dạng `yyyy-MM` — dùng làm khoá khi dựng biểu đồ.</summary>
    public string Thang { get; set; } = string.Empty;

    /// <summary>Nhãn rút gọn kiểu `T9` để hiển thị trên trục ngang.</summary>
    public string Nhan { get; set; } = string.Empty;

    /// <summary>Doanh thu trong tháng (VNĐ), chỉ tính đơn `COMPLETED`.</summary>
    public decimal DoanhThu { get; set; }

    /// <summary>Số đơn khách tạo ra trong tháng, mọi trạng thái.</summary>
    public int SoDon { get; set; }
}

/// <summary>Một phòng trong bảng xếp hạng doanh thu.</summary>
public class TopRoomDto
{
    /// <summary>Tên phòng.</summary>
    public string TenPhong { get; set; } = string.Empty;

    /// <summary>Tên cơ sở chứa phòng — phòng trùng tên ở 2 cơ sở vẫn phân biệt được.</summary>
    public string TenCoSo { get; set; } = string.Empty;

    /// <summary>Số đơn `COMPLETED` của phòng này.</summary>
    public int SoDon { get; set; }

    /// <summary>Tổng doanh thu của phòng (VNĐ).</summary>
    public decimal DoanhThu { get; set; }
}

/// <summary>Số phòng theo từng trạng thái — dùng vẽ biểu đồ tròn.</summary>
public class RoomStatusCountDto
{
    /// <summary>Trạng thái phòng, dạng số — giao diện tự gắn nhãn tiếng Việt.</summary>
    public RoomStatus TrangThai { get; set; }

    /// <summary>Số phòng đang ở trạng thái này.</summary>
    public int SoPhong { get; set; }
}

/// <summary>
/// Toàn bộ số liệu trả về cho trang thống kê, gom một lần gọi.
///
/// Gom vì dashboard cần 6 con số cùng lúc: 6 request riêng thì tải 6 lần dữ
/// liệu và các con số có thể lệch nhau do đọc ở 6 thời điểm khác nhau.
/// </summary>
public class DashboardDto
{
    /// <summary>Khoảng thời gian đang thống kê, định dạng `yyyy-MM-dd`.</summary>
    public string TuNgay { get; set; } = string.Empty;

    /// <summary>Ngày cuối của khoảng thống kê, định dạng `yyyy-MM-dd`.</summary>
    public string DenNgay { get; set; } = string.Empty;

    /// <summary>Số liệu tổng quan.</summary>
    public DashboardOverviewDto TongQuan { get; set; } = new();

    /// <summary>Doanh thu + số đơn theo từng tháng, cũ nhất trước.</summary>
    public List<MonthlyStatDto> TheoThang { get; set; } = new();

    /// <summary>
    /// Tỷ lệ lấp đầy trong khoảng thống kê, 0..1 (giao diện nhân 100 để hiện %).
    /// </summary>
    public double TyLeLapDay { get; set; }

    /// <summary>Tổng số đêm phòng đã bán (phục vụ để đối chiếu với tỷ lệ lấp đầy).</summary>
    public int DemDaBan { get; set; }

    /// <summary>Tổng số đêm phòng có thể bán trong khoảng thống kê.</summary>
    public int DemTongCong { get; set; }

    /// <summary>Số phòng theo trạng thái.</summary>
    public List<RoomStatusCountDto> TrangThaiPhong { get; set; } = new();

    /// <summary>5 phòng doanh thu cao nhất.</summary>
    public List<TopRoomDto> TopPhong { get; set; } = new();
}
