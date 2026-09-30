import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type { PagedResult, RoomSearchItem, SearchFilters } from '../types/room'

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
}
