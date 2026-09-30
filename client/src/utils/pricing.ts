/**
 * Ước tính tiền thuê phòng ở phía giao diện.
 *
 * Sao đúng công thức `BookingCalculator` bên backend (làm tròn LÊN số đơn vị
 * rồi nhân đơn giá): theo giờ = ceil(giờ) × giá giờ, theo ngày = ceil(ngày) ×
 * giá ngày. Ghi rõ "tạm tính" khi hiển thị — số cuối cùng do backend tính ở
 * Bước 10 khi tạo đơn thật.
 */

export const BookingType = {
  HOUR: 'hour',
  DAY: 'day',
} as const
export type BookingType = (typeof BookingType)[keyof typeof BookingType]

/** Nhãn tiếng Việt cho cách thuê. */
export const NHAN_CACH_THUE: Record<BookingType, string> = {
  [BookingType.HOUR]: 'Theo giờ',
  [BookingType.DAY]: 'Theo ngày',
}

/**
 * Số đơn vị thuê, làm tròn lên.
 *
 * Khách ở dở một ngày vẫn trả trọn ngày đó — ví dụ nhận 14:00 hôm nay, trả
 * 09:00 mai (19 giờ) vẫn tính 1 ngày.
 */
export function tinhSoDonVi(loai: BookingType, checkIn: Date, checkOut: Date): number {
  const miliGiay = checkOut.getTime() - checkIn.getTime()

  if (loai === BookingType.HOUR) {
    return Math.ceil(miliGiay / (1000 * 60 * 60))
  }

  return Math.ceil(miliGiay / (1000 * 60 * 60 * 24))
}

/** Tiền tạm tính = đơn giá × số đơn vị. */
export function uocTinhTien(
  loai: BookingType,
  giaTheoGio: number,
  giaTheoNgay: number,
  checkIn: Date,
  checkOut: Date,
): number {
  const donGia = loai === BookingType.HOUR ? giaTheoGio : giaTheoNgay
  return donGia * tinhSoDonVi(loai, checkIn, checkOut)
}

/**
 * Kiểm khoảng thời gian đã chọn. Trả về thông báo lỗi, hoặc null khi hợp lệ.
 *
 * Chỉ kiểm "trả sau nhận" ở đây — quy tắc tối thiểu 3 giờ / đặt trước 2 giờ
 * thuộc về backend ở Bước 10 (cần giờ hiện tại của server, không tin giờ máy khách).
 */
export function kiemKhoangThoiGian(checkIn: Date | null, checkOut: Date | null): string | null {
  if (!checkIn || !checkOut || Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return 'Vui lòng chọn giờ nhận và giờ trả phòng'
  }

  if (checkOut <= checkIn) {
    return 'Giờ trả phòng phải sau giờ nhận phòng'
  }

  return null
}
