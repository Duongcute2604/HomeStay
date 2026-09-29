import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
// `UserRole` được khai báo dạng const + type cùng tên, nên import này dùng được cho cả hai.
import { UserRole } from '../types/auth'

interface Props {
  children: ReactNode
  /**
   * Quyền tối thiểu cần có để vào trang. Bỏ trống nghĩa là chỉ cần đăng nhập.
   * Trang quản trị sẽ truyền `UserRole.ADMIN` (Bước 14).
   */
  yeuCauQuyen?: UserRole
}

/**
 * Chặn trang khi người dùng chưa đăng nhập hoặc thiếu quyền.
 *
 * Cần cả hai: phía API đã chặn bằng `[Authorize]`, nhưng nếu giao diện không
 * chặn thì khách gõ thẳng URL vẫn thấy khung trang rỗng rồi mới nhận 401 vài
 * giây sau — lỗi ở tầng giao diện (AGENTS.md mục 6.6 yêu cầu kiểm tra ở cả hai).
 */
export default function ProtectedRoute({ children, yeuCauQuyen }: Props): JSX.Element {
  const { daDangNhap, laAdmin } = useAuth()
  const location = useLocation()

  if (!daDangNhap) {
    // `state.from` giữ lại trang người dùng định vào, để sau khi đăng nhập xong
    // quay lại đúng chỗ thay vì luôn rơi về trang chủ.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (yeuCauQuyen === UserRole.ADMIN && !laAdmin) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
