namespace HomeStay.Enums;

/// <summary>Trạng thái thanh toán của một đơn đặt phòng.</summary>
public enum PaymentStatus
{
    /// <summary>Chờ thu — đơn đã hoàn thành nhưng Admin chưa xác nhận đã nhận tiền.</summary>
    PENDING = 0,

    /// <summary>Đã thu tiền — nguồn của doanh thu thật trên báo cáo thống kê.</summary>
    PAID = 1,

    /// <summary>Thất bại — khách báo không chuyển được, cần tạo lại giao dịch mới.</summary>
    FAILED = 2,
}