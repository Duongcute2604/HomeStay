import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type { Location } from '../types/location'

/**
 * Các lời gọi phần địa điểm.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái — đúng vai trò
 * của tầng service (AGENTS.md 7.2). Endpoint public, không cần đăng nhập.
 */
export const locationService = {
  /** Lấy danh sách địa điểm đang hoạt động kèm phòng tóm tắt. */
  async layDanhSach(): Promise<Location[]> {
    const response = await apiClient.get<ApiResponse<Location[]>>('/locations')
    return bocDuLieu(response.data)
  },
}
