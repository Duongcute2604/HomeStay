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
