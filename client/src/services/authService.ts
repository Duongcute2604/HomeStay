import { apiClient } from '../api/client'
import type {
  ApiResponse,
  AuthResult,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
  UserProfile,
} from '../types/auth'

/**
 * Kiểm một response không mang dữ liệu (đăng xuất, đổi mật khẩu).
 *
 * Tách khỏi `bocDuLieu` là BẮT BUỘC chứ không phải cho sang: các endpoint này
 * trả `ApiResponse<object>.Success(...)` nên `data` là `null` **cả khi thành
 * công**. Nếu dùng chung `bocDuLieu`, `data === null` bị coi là lỗi và mọi
 * lần đăng xuất / đổi mật khẩu đều báo "Đã xảy ra lỗi" dù server đã làm đúng.
 */
function kiemTraThanhCong(response: ApiResponse<unknown>): void {
  if (!response.success) {
    throw new Error(response.message)
  }
}

/**
 * Bóc lớp `ApiResponse` để trang chỉ nhận đúng phần `data`.
 *
 * Response lỗi không đi qua đây vì interceptor đã ném lỗi, nhưng vẫn phải kiểm:
 * nếu bỏ, hàm trả về `null` rồi trang dùng tiếp sẽ báo một lỗi khó hiểu hơn
 * nhiều ("không đọc được thuộc tính của null") thay vì thông báo gốc.
 */
function bocDuLieu<T>(response: ApiResponse<T>): T {
  kiemTraThanhCong(response)

  if (response.data === null) {
    throw new Error('Máy chủ trả về dữ liệu rỗng. Vui lòng thử lại.')
  }

  return response.data
}

/**
 * Các lời gọi phần tài khoản.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái — đúng vai trò
 * của tầng service (AGENTS.md mục 7.2). Việc lưu token vào store do hook
 * `useAuth` đảm nhiệm, không phải ở đây.
 */
export const authService = {
  /** Đăng ký tài khoản khách. Backend tự chọn quyền CUSTOMER, không nhận `role`. */
  async dangKy(payload: RegisterPayload): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', payload)
    return bocDuLieu(response.data)
  },

  async dangNhap(payload: LoginPayload): Promise<AuthResult> {
    const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', payload)
    return bocDuLieu(response.data)
  },

  /** Đăng xuất: báo server xoá hash refresh token để token cũ không dùng lại được. */
  async dangXuat(): Promise<void> {
    const response = await apiClient.post<ApiResponse<unknown>>('/auth/logout')
    kiemTraThanhCong(response.data)
  },

  async layHoSo(): Promise<UserProfile> {
    const response = await apiClient.get<ApiResponse<UserProfile>>('/auth/me')
    return bocDuLieu(response.data)
  },

  /** Chỉ sửa tên / SĐT / địa chỉ. Backend cố ý bỏ qua email, quyền, trạng thái. */
  async capNhatHoSo(payload: UpdateProfilePayload): Promise<UserProfile> {
    const response = await apiClient.put<ApiResponse<UserProfile>>('/auth/profile', payload)
    return bocDuLieu(response.data)
  },

  /** Sau khi đổi mật khẩu, backend vô hiệu hoá phiên cũ — cần đăng nhập lại. */
  async doiMatKhau(payload: ChangePasswordPayload): Promise<void> {
    const response = await apiClient.put<ApiResponse<unknown>>('/auth/change-password', payload)
    kiemTraThanhCong(response.data)
  },
}
