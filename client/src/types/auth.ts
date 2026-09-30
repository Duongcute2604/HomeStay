/**
 * Kiểu dữ liệu phía giao diện cho phần tài khoản.
 *
 * Nguồn của mọi kiểu ở đây là `server/HomeStay/DTOs/AuthDtos.cs`. Khi sửa DTO
 * bên server phải sửa lại file này — nếu không, TypeScript vẫn xanh trong khi
 * dữ liệu thật sai. Vì vậy tên thuộc tính giữ nguyên dạng camelCase như JSON
 * trả về, và không dùng `any` ở bất kỳ chỗ nào (AGENTS.md mục 7.2).
 */

/**
 * Quyền của người dùng.
 *
 * Backend serialise enum thành SỐ, không phải chuỗi: `role: 0` / `role: 1`.
 * Đừng viết so sánh `role === 'ADMIN'` — sẽ luôn sai và TypeScript cũng không
 * bắt được vì kiểu là số.
 */
export const UserRole = {
  CUSTOMER: 0,
  ADMIN: 1,
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

/** Trạng thái tài khoản. Tài khoản LOCKED không đăng nhập được (trả 403). */
export const UserStatus = {
  ACTIVE: 0,
  LOCKED: 1,
} as const
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus]

/**
 * Cấu trúc chung của MỌI response từ API.
 *
 * Nhờ `InvalidModelStateResponseFactory` và `UseStatusCodePages` bên server,
 * cả thành công lẫn thất bại đều dùng đúng một cấu trúc này, nên giao diện chỉ
 * cần một chỗ đọc lỗi thay vì hai nhánh.
 *
 * `data` là `null` khi thất bại — đây là lý do không được viết
 * `response.data.user` mà không kiểm tra trước.
 */
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

/** Thông tin tài khoản trả về cho giao diện. */
export interface UserProfile {
  /**
   * Khoá nội bộ của CSDL. Quy tắc bất biến AGENTS.md mục 6.3: giao diện
   * TUYỆT ĐỐI không hiển thị, chỉ dùng nội bộ. Đơn đặt phòng sẽ hiển thị mã
   * dạng `HS-250930-4821` thay vì Id.
   */
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  address: string | null
  role: UserRole
  status: UserStatus
  createdAt: string
}

/** Kết quả đăng ký / đăng nhập / làm mới phiên. */
export interface AuthResult {
  accessToken: string
  refreshToken: string
  expiresInMinutes: number
  user: UserProfile
}

export interface RegisterPayload {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  phoneNumber?: string
  address?: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface UpdateProfilePayload {
  fullName: string
  phoneNumber?: string
  address?: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}
