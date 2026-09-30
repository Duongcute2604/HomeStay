import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type {
  BookingDetail,
  BookingResult,
  CreateBookingPayload,
  CreateReviewPayload,
  MyBooking,
  MyReview,
} from '../types/booking'
import type { PagedResult } from '../types/room'
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

  /** Danh sách đơn của chính người đang đăng nhập, mới nhất trước. */
  async layCuaToi(page = 1, pageSize = 20): Promise<PagedResult<MyBooking>> {
    const response = await apiClient.get<ApiResponse<PagedResult<MyBooking>>>(
      `/bookings/my?page=${page}&pageSize=${pageSize}`,
    )
    return bocDuLieu(response.data)
  },

  /** Chi tiết một đơn của chính mình. Tra cứu bằng `Code`, không dùng `Id`. */
  async layChiTiet(code: string): Promise<BookingDetail> {
    const response = await apiClient.get<ApiResponse<BookingDetail>>(
      `/bookings/${encodeURIComponent(code)}`,
    )
    return bocDuLieu(response.data)
  },

  /** Hủy đơn của chính mình. Lý do không bắt buộc. */
  /**
   * Ghi đánh giá cho đơn đã trả phòng (Bước 16).
   *
   * Chỉ đơn `COMPLETED` của chính mình mới được đánh giá, mỗi đơn 1 lần —
   * hai điều kiện này do backend chặn, không kiểm tra lại ở giao diện để tránh
   * hai nơi một quy tắc.
   */
  async danhGia(code: string, payload: CreateReviewPayload): Promise<MyReview> {
    const response = await apiClient.post<ApiResponse<MyReview>>(
      `/bookings/${code}/review`,
      payload,
    )
    return bocDuLieu(response.data)
  },

  async huyDon(code: string, reason?: string): Promise<BookingDetail> {
    const response = await apiClient.post<ApiResponse<BookingDetail>>(
      `/bookings/${encodeURIComponent(code)}/cancel`,
      // Lý do rỗng thì gửi object rỗng — backend cho phép body thiếu lý do.
      reason?.trim() ? { reason: reason.trim() } : {},
    )
    return bocDuLieu(response.data)
  },
}
