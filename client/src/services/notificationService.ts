import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type { NotificationList } from '../types/notification'

/**
 * Các lời gọi phần thông báo.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái (AGENTS.md 7.2).
 *
 * Không có lời gọi nào tới dịch vụ gửi email/SMS: hệ thống chỉ hiển thị thông báo
 * trong ứng dụng. Thêm API gửi tin ở đây thì phải thêm cả hạ tầng gửi thật — nằm
 * ngoài phạm vi đồ án.
 */
export const notificationService = {
  /** Thông báo mới nhất kèm số chưa đọc. */
  async layCuaToi(): Promise<NotificationList> {
    const response = await apiClient.get<ApiResponse<NotificationList>>('/notifications/my')
    return bocDuLieu(response.data)
  },

  /** Đánh dấu một thông báo đã đọc. Thông báo của người khác thì API trả 404. */
  async danhDauDaDoc(id: number): Promise<void> {
    await apiClient.patch<ApiResponse<object>>(`/notifications/${id}/read`)
  },

  /** Đánh dấu đã đọc tất cả thông báo của chính mình. */
  async danhDauDaDocTatCa(): Promise<number> {
    const response = await apiClient.patch<ApiResponse<number>>('/notifications/read-all')
    return bocDuLieu(response.data)
  },
}
