import { apiClient, bocDuLieu } from '../api/client'
import { toLocalIsoString } from '../utils/format'
import type { ApiResponse } from '../types/auth'
import { BookingType } from '../utils/pricing'
import type { PagedResult, RoomSearchItem, SearchFilters } from '../types/room'

/** Kết quả kiểm tra phòng trống từ API. */
export interface Availability {
  isAvailable: boolean
  reason: string | null
}

/**
 * Các lời gọi phần tìm kiếm phòng.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái (AGENTS.md 7.2).
 * Endpoint public, không cần đăng nhập.
 */
export const roomService = {
  /**
   * Tìm phòng theo bộ lọc. Chỉ gửi tham số có giá trị — tham số null gửi lên
   * vừa thừa vừa có thể làm server hiểu sai (ví dụ `minPrice=` rỗng).
   */
  async timKiem(loc: SearchFilters): Promise<PagedResult<RoomSearchItem>> {
    const thamSo = new URLSearchParams()

    if (loc.keyword.trim() !== '') {
      thamSo.set('keyword', loc.keyword.trim())
    }
    if (loc.locationIndex !== null) {
      thamSo.set('locationIndex', String(loc.locationIndex))
    }
    if (loc.roomType !== null) {
      thamSo.set('roomType', String(loc.roomType))
    }
    if (loc.minPrice !== null) {
      thamSo.set('minPrice', String(loc.minPrice))
    }
    if (loc.maxPrice !== null) {
      thamSo.set('maxPrice', String(loc.maxPrice))
    }
    if (loc.capacity !== null) {
      thamSo.set('capacity', String(loc.capacity))
    }
    thamSo.set('sort', loc.sort)
    thamSo.set('page', String(loc.page))
    thamSo.set('pageSize', String(loc.pageSize))

    const response = await apiClient.get<ApiResponse<PagedResult<RoomSearchItem>>>(
      `/rooms/search?${thamSo.toString()}`,
    )
    return bocDuLieu(response.data)
  },

  /**
   * Kiểm tra phòng có đặt được trong khoảng đã chọn không.
   *
   * Phòng bận vẫn trả 200 với `isAvailable: false` — chỉ tham số sai mới ném lỗi.
   */
  async kiemTraTrong(
    locationIndex: number,
    roomIndex: number,
    loai: BookingType,
    checkIn: Date,
    checkOut: Date,
  ): Promise<Availability> {
    const thamSo = new URLSearchParams({
      locationIndex: String(locationIndex),
      roomIndex: String(roomIndex),
      // API nhận số (0 = giờ, 1 = ngày), giao diện dùng chuỗi.
      type: loai === BookingType.HOUR ? '0' : '1',
      // Gửi GIỜ ĐỊA PHƯƠNG. `toISOString()` sẽ trả UTC và làm lệch mốc giờ,
      // khiến kiểm tra trùng lịch bỏ sót — xem `toLocalIsoString` trong utils/format.
      checkIn: toLocalIsoString(checkIn),
      checkOut: toLocalIsoString(checkOut),
    })

    const response = await apiClient.get<ApiResponse<Availability>>(
      `/rooms/availability?${thamSo.toString()}`,
    )
    return bocDuLieu(response.data)
  },
}
