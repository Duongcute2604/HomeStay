import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UserProfile } from '../types/auth'

/**
 * Nơi giữ dữ liệu phiên đăng nhập.
 *
 * Vì sao dùng Zustand chứ không phải TanStack Query: token và thông tin người
 * dùng là **dữ liệu phiên** — nó quyết định giao diện hiển thị gì và request
 * nào được gắn token, chứ không phải dữ liệu do server trả về theo từng màn
 * hình. AGENTS.md mục 7.2 đã chốt: server data → TanStack Query, dữ liệu
 * phiên/UI → Zustand.
 *
 * `persist` lưu xuống localStorage để F5 trang không làm mất phiên. Đây cũng
 * là nơi duy nhất đọc token khi khởi động lại trang — interceptor ở
 * `api/client.ts` đọc qua `useAuthStore.getState()` để không có hai nơi cùng
 * giữ token (xem `lessons.md` mục 20: hai nơi giữ cùng một dữ liệu là nguồn
 * gốc của hầu hết lỗi "đang ở A lại ra B").
 *
 * Store này CỐ TÌNH không import `api/client.ts` hay `services/authService.ts`.
 * Nếu import, interceptor sẽ nói mã của chính store → vòng lặp import, và
 * lỗi hiện ra rất khó hiểu. Việc gọi API để lại cho hook `useAuth` lo.
 */
interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserProfile | null

  /** Ghi cả 3 giá trị sau khi đăng ký / đăng nhập / làm mới phiên thành công. */
  datPhien: (accessToken: string, refreshToken: string, user: UserProfile) => void

  /** Cập nhật hồ sơ sau khi người dùng sửa thông tin. */
  datThongTinUser: (user: UserProfile) => void

  /** Xoá phiên: đăng xuất, hoặc refresh token hết hạn không gia hạn được. */
  xoaPhien: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,

      datPhien: (accessToken, refreshToken, user) => set({ accessToken, refreshToken, user }),

      datThongTinUser: (user) => set({ user }),

      xoaPhien: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: 'stayeasy.auth',
    },
  ),
)
