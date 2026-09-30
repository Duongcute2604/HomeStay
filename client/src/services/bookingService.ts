import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type { BookingResult, CreateBookingPayload } from '../types/booking'
import { BookingType } from '../utils/pricing'

/**
 * Các lời gọi phần đặt phòng.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái (AGENTS.md 7.2).
 * Endpoint yêu cầu đăng nhập — interceptor tự gắn token, 401 thì tự refresh.
 */
export const bookingService = {
  /**
   * Tạo đơn đặt phòng mới. Server trả 201 kèm mã đơn `Code`.
   * Trùng lịch → 409, tham số sai → 400/404 (ném lỗi để trang hiển thị).
   */
  async taoDon(payload: CreateBookingPayload): Promise<BookingResult> {
    const response = await apiClient.post<ApiResponse<BookingResult>>('/bookings', {
      locationIndex: payload.locationIndex,
      roomIndex: payload.roomIndex,
      // API nhận số (0 = giờ, 1 = ngày), giao diện dùng chuỗi.
      type: payload.type === BookingType.HOUR ? 0 : 1,
      checkIn: payload.checkIn,
      checkOut: payload.checkOut,
      guestCount: payload.guestCount,
      // Ghi chú toàn khoảng trắng thì bỏ — phải `trim()` trước vì `'  '`
      // là truthy, `|| undefined` không bắt được.
      note: payload.note?.trim() || undefined,
    })
    return bocDuLieu(response.data)
  },
}
