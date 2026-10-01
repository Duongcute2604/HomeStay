/**
 * Kiểu dữ liệu phía giao diện cho thông báo.
 *
 * Nguồn: `server/HomeStay/DTOs/NotificationDtos.cs`.
 *
 * <b>Ranh giới đã chốt:</b> thông báo chỉ hiển thị trong hệ thống, không gửi email/SMS.
 * Nói "đã có thông báo qua email" thì sai — giảng viên hỏi "cho tôi xem email gửi đâu"
 * mà không có dịch vụ nào để mở.
 */

/** Một dòng thông báo. */
export interface Notification {
  /** Khoá thông báo dùng cho thao tác đánh dấu đã đọc; **không** hiển thị ra giao diện. */
  id: number
  title: string
  content: string | null
  /** Chưa đọc thì chữ đậm và có dấu chấm xanh. */
  isRead: boolean
  createdAt: string
}

/**
 * Danh sách thông báo kèm số chưa đọc.
 *
 * Gộp chung một lần gọi vì header cần cả hai: tách thành hai endpoint thì mỗi lần mở
 * trang gọi 2 lần và dễ lệch số liệu giữa hai lần gọi.
 */
export interface NotificationList {
  items: Notification[]
  /** Số chưa đọc — đưa lên badge trên icon chuông. */
  soChuaDoc: number
}
