namespace HomeStay.Enums;

/// <summary>
/// Phương thức thanh toán.
///
/// <para>
/// Cố ý <b>không</b> có trạng thái hay mã riêng cho từng cổng thật (VNPay, thẻ tín dụng…):
/// đồ án chỉ <b>ghi nhận</b> khách đã chọn cách nào, không nối API thật. Ghi rõ ranh giới
/// này ở báo cáo để không ai hiểu nhầm là đã tích hợp cổng thanh toán.
/// </para>
/// </summary>
public enum PaymentMethod
{
    /// <summary>Tiền mặt tại chỗ — khách trả khi nhận phòng, Admin xác nhận đã thu.</summary>
    CASH = 0,

    /// <summary>Ví MoMo — chỉ ghi nhận, không gọi API cổng.</summary>
    MOMO = 1,

    /// <summary>Chuyển khoản ngân hàng — chỉ ghi nhận, không gọi API ngân hàng.</summary>
    BANK_TRANSFER = 2,
}