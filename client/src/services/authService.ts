import { apiClient, bocDuLieu, kiemTraThanhCong } from '../api/client'
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
