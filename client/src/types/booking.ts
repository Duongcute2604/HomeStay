import type { BookingType } from '../utils/pricing'

/**
 * Kiểu dữ liệu phía giao diện cho phần đặt phòng.
 *
 * Nguồn là `server/StayEasy/DTOs/BookingDtos.cs`. Quy tắc bất biến AGENTS.md 6.3:
 * đơn hiển thị `Code` (dạng `HS-250930-4821`), TUYỆT ĐỐI không hiển thị `Id`.
 */

/** Dữ liệu gửi lên khi tạo đơn. Phòng định danh bằng cặp chỉ số. */
export interface CreateBookingPayload {
  locationIndex: number
  roomIndex: number
  type: BookingType
  checkIn: string
  checkOut: string
  guestCount: number
  note?: string
}

/** Đơn vừa tạo xong. Không có `Id` — tra cứu bằng `code`. */
export interface BookingResult {
  code: string
  roomName: string
  locationName: string
  bookingType: number
  checkIn: string
  checkOut: string
  guestCount: number
  totalAmount: number
  status: number
  note: string | null
  createdAt: string
}

/** Trạng thái đơn. Backend serialize enum thành SỐ. */
export const BookingStatus = {
  PENDING: 0,
  CONFIRMED: 1,
  CHECKED_IN: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  REJECTED: 5,
} as const
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

/** Nhãn tiếng Việt cho trạng thái đơn. */
export const NHAN_TRANG_THAI_DON: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'Chờ xác nhận',
  [BookingStatus.CONFIRMED]: 'Đã xác nhận',
  [BookingStatus.CHECKED_IN]: 'Đang ở',
  [BookingStatus.COMPLETED]: 'Hoàn thành',
  [BookingStatus.CANCELLED]: 'Đã hủy',
  [BookingStatus.REJECTED]: 'Bị từ chối',
}

/** Một đơn trong danh sách "Đơn của tôi". */
export interface MyBooking {
  code: string
  roomName: string
  locationName: string
  bookingType: number
  checkIn: string
  checkOut: string
  guestCount: number
  totalAmount: number
  status: BookingStatus
  createdAt: string
}

/** Một dòng lịch sử trạng thái của đơn. */
export interface BookingHistory {
  fromStatus: BookingStatus | null
  toStatus: BookingStatus
  changedByName: string
  note: string | null
  changedAt: string
}

/** Chi tiết một đơn kèm lịch sử. */
export interface BookingDetail extends MyBooking {
  note: string | null
  cancelReason: string | null
  history: BookingHistory[]
  // Thông tin bổ sung từ API chi tiết phòng
  description?: string
  pricePerHour: number
  pricePerDay: number
  ratingAvg?: number
  ratingCount?: number
  roomNumber: string
  capacity: number
  reviews: Array<{
    reviewerName: string
    rating: number
    comment: string | null
    createdAt: string
  }>
}

/** Nhãn tiếng Việt cho loại thuê (backend trả về số: 1=theo giờ, 2=theo ngày). */
export const NHAN_LOAI_THUE: Record<number, string> = {
  1: 'Theo giờ',
  2: 'Theo ngày',
}
