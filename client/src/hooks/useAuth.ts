import { useCallback, useState } from 'react'

import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'
import type {
  AuthResult,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload,
} from '../types/auth'
import { UserRole } from '../types/auth'

/**
 * Giao diện với phần tài khoản cho các trang cần dùng.
 *
 * Tách riêng khỏi `authStore` là có chủ ý: store chỉ giữ dữ liệu, hook này giữ
 * phần "đang xử lý" và gọi API. Nhờ vậy một component chỉ cần `useAuth()` là
 * xong, không phải tự gọi `authService` rồi tự `datPhien` — dễ quên bước thứ hai.
 */
export function useAuth() {
  const { accessToken, user, datPhien, datThongTinUser, xoaPhien } = useAuthStore()
  const [dangXuLy, setDangXuLy] = useState(false)

  /** Chạy một lệnh gọi API có bật/tắt cờ "đang xử lý", rồi trả về lỗi hoặc null. */
  const chay = useCallback(async <T,>(viec: () => Promise<T>): Promise<Error | null> => {
    setDangXuLy(true)
    try {
      await viec()
      return null
    } catch (error) {
      return error instanceof Error ? error : new Error('Đã xảy ra lỗi')
    } finally {
      setDangXuLy(false)
    }
  }, [])

  const luuPhien = useCallback(
    (ketQua: AuthResult) => {
      datPhien(ketQua.accessToken, ketQua.refreshToken, ketQua.user)
    },
    [datPhien],
  )

  const dangKy = useCallback(
    async (payload: RegisterPayload) => {
      const loi = await chay(async () => luuPhien(await authService.dangKy(payload)))
      return loi
    },
    [chay, luuPhien],
  )

  const dangNhap = useCallback(
    async (payload: LoginPayload) => {
      const loi = await chay(async () => luuPhien(await authService.dangNhap(payload)))
      return loi
    },
    [chay, luuPhien],
  )

  const dangXuat = useCallback(async () => {
    // Xoá phiên cục bộ dù gọi API có thành công hay không. Nếu chỉ xoá khi
    // server trả 200 thì khi token đã hết hạn người dùng bị kẹt ở trang đang
    // mở dù đã bấm đăng xuất.
    await chay(() => authService.dangXuat())
    xoaPhien()
  }, [chay, xoaPhien])

  const capNhatHoSo = useCallback(
    async (payload: UpdateProfilePayload) => {
      const loi = await chay(async () => datThongTinUser(await authService.capNhatHoSo(payload)))
      return loi
    },
    [chay, datThongTinUser],
  )

  /**
   * Đổi mật khẩu xong thì xoá phiên cục bộ.
   *
   * Đây không phải thừa: backend vô hiệu hoá refresh token cũ khi đổi mật khẩu
   * (kiểm thử tay ca 3.36 xác nhận), nên access token đang cầm trong tay sẽ hết
   * tác dụng sau 1 giờ. Giữ lại nó chỉ tạo cảm giác "vừa đổi mật khẩu xong thì
   * bị đẩy ra" không giải thích được.
   */
  const doiMatKhau = useCallback(
    async (payload: ChangePasswordPayload) => {
      const loi = await chay(() => authService.doiMatKhau(payload))

      if (!loi) {
        xoaPhien()
      }

      return loi
    },
    [chay, xoaPhien],
  )

  return {
    user,
    dangXuLy,
    daDangNhap: Boolean(accessToken),
    laAdmin: user?.role === UserRole.ADMIN,
    dangKy,
    dangNhap,
    dangXuat,
    capNhatHoSo,
    doiMatKhau,
  }
}
