/**
 * Ước tính tiền thuê phòng ở phía giao diện.
 *
 * Sao đúng công thức `BookingCalculator` bên backend (chốt với người dùng
 * 16/10): theo giờ = 3 giờ đầu TRỌN GÓI `giaTheoGio` + mỗi giờ vượt quá
 * `GIA_GIO_VUOT_QUA`; theo ngày = ceil(ngày) × giá ngày. Ghi rõ "tạm tính"
 * khi hiển thị — số cuối cùng do backend tính ở Bước 10 khi tạo đơn thật.
 */

export const BookingType = {
  HOUR: 'hour',
  DAY: 'day',
} as const
export type BookingType = (typeof BookingType)[keyof typeof BookingType]

/** Số giờ đầu tính trọn gói một giá cơ sở (khớp `BookingRules.BaseHoursForHourlyBooking`). */
export const SO_GIO_DAU_TRON_GOI = 3

/** Giá mỗi giờ vượt quá khung 3 giờ đầu (khớp `BookingRules.ExtraHourPrice`). */
export const GIA_GIO_VUOT_QUA = 50_000

/** Diện tích (m²) tối đa của phòng nhỏ — ≤ mức này là nhỏ, hơn là phòng lớn. */
export const DIEN_TICH_PHONG_NHO = 40

/** Giá 3 giờ đầu mặc định của phòng nhỏ (khớp seed backend). */
export const GIA_3_GIO_DAU_NHO = 200_000

/** Giá 3 giờ đầu mặc định của phòng lớn. */
export const GIA_3_GIO_DAU_LON = 300_000

/**
 * Giá 3 giờ đầu mặc định theo diện tích phòng (quy tắc chốt 16/10):
 * ≤ 40 m² là phòng nhỏ → 200.000 ₫, lớn hơn là phòng lớn → 300.000 ₫.
 */
export function gia3GioDau(dienTich: number): number {
  return dienTich <= DIEN_TICH_PHONG_NHO ? GIA_3_GIO_DAU_NHO : GIA_3_GIO_DAU_LON
}

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

/**
 * Tiền tạm tính.
 *
 * Theo giờ: `giaTheoGio` là giá TRỌN GÓI cho 3 giờ đầu, không phải giá 1 giờ;
 * từ giờ thứ 4 trở đi mỗi giờ cộng thêm `GIA_GIO_VUOT_QUA` (công thức cũ
 * "số giờ × đơn giá" đã bị thay ngày 16/10 — test bên dưới khoá lại).
 */
export function uocTinhTien(
  loai: BookingType,
  giaTheoGio: number,
  giaTheoNgay: number,
  checkIn: Date,
  checkOut: Date,
): number {
  if (loai === BookingType.HOUR) {
    const soGio = tinhSoDonVi(loai, checkIn, checkOut)
    const gioVuotQua = Math.max(0, soGio - SO_GIO_DAU_TRON_GOI)
    return giaTheoGio + gioVuotQua * GIA_GIO_VUOT_QUA
  }

  return giaTheoNgay * tinhSoDonVi(loai, checkIn, checkOut)
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
