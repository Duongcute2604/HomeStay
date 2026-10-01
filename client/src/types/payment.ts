/**
 * Kiểu dữ liệu phía giao diện cho thanh toán.
 *
 * Nguồn: `server/HomeStay/DTOs/PaymentDtos.cs`. Giá trị `method` và `status` là **số**
 * (khớp enum phía API trả về), giao diện tự ánh tên hiển thị bằng `NHAN_PHUONG_THUC` /
 * `NHAN_TRANG_THAI_THANH_TOAN`.
 */

/** Phương thức thanh toán — khớp `PaymentMethod` phía API. */
export const PaymentMethod = {
  CASH: 0,
  MOMO: 1,
  BANK_TRANSFER: 2,
} as const
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

/** Nhãn tiếng Việt của từng phương thức. */
export const NHAN_PHUONG_THUC: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Tiền mặt',
  [PaymentMethod.MOMO]: 'Ví MoMo',
  [PaymentMethod.BANK_TRANSFER]: 'Chuyển khoản ngân hàng',
}

/**
 * Mô tả phương thức, hiển thị kèm nút "Thanh toán".
 *
 * Cố ý nói rõ "ghi nhận" chứ không nói "thanh toán qua MoMo": hệ thống chỉ **ghi nhận**
 * khách chọn cách nào, không nối API cổng thanh toán. Viết sai ở đây thì giảng viên hỏi
 * "cho tôi xem màn hình thanh toán" mà không có màn hình nào để mở.
 */
export const MO_TA_PHUONG_THUC: Record<PaymentMethod, string> = {
  [PaymentMethod.CASH]: 'Trả tiền mặt khi nhận phòng, nhân viên xác nhận đã thu.',
  [PaymentMethod.MOMO]: 'Chuyển khoản qua ví MoMo. Hệ thống ghi nhận lựa chọn của bạn.',
  [PaymentMethod.BANK_TRANSFER]:
    'Chuyển khoản qua tài khoản ngân hàng. Hệ thống ghi nhận lựa chọn của bạn.',
}

/** Trạng thái thanh toán — khớp `PaymentStatus` phía API. */
export const PaymentStatus = {
  PENDING: 0,
  PAID: 1,
  FAILED: 2,
} as const
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

/** Nhãn tiếng Việt của từng trạng thái. */
export const NHAN_TRANG_THAI_THANH_TOAN: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'Chờ thanh toán',
  [PaymentStatus.PAID]: 'Đã thanh toán',
  [PaymentStatus.FAILED]: 'Thanh toán thất bại',
}

/** Lớp màu của nhãn trạng thái, dùng chung với phần trạng thái đơn. */
export const MAU_TRANG_THAI_THANH_TOAN: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: 'bg-amber-100 text-amber-700',
  [PaymentStatus.PAID]: 'bg-green-100 text-green-700',
  [PaymentStatus.FAILED]: 'bg-red-100 text-red-700',
}

/** Một phiếu thu trả về từ API. */
export interface Payment {
  /** Khoá phiếu thu dùng cho thao tác Admin; **không** hiển thị ra giao diện. */
  id: number
  bookingCode: string
  roomName: string
  roomNumber: string
  locationName: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  /** Thời điểm đã thu tiền; `null` khi chưa thu. */
  paidAt: string | null
  note: string | null
  createdAt: string
}

/** Thân yêu cầu khi khách chọn phương thức thanh toán. */
export interface ChoosePaymentMethodPayload {
  method: PaymentMethod
}

/** Thân yêu cầu khi quản trị viên xác nhận đã thu tiền. */
export interface ConfirmPaymentPayload {
  method: PaymentMethod
  note?: string
}