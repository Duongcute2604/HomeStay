import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import Button from './Button'

/**
 * Khung chung của mọi trang: thanh điều hướng + vùng nội dung.
 *
 * Tách riêng khỏi từng trang vì thanh điều hướng là thứ **không đổi** giữa các
 * trang — viết lại ở mỗi trang nghĩa là sửa 4 chỗ mỗi khi đổi menu (DRY).
 */
export default function PageLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, daDangNhap, dangXuat } = useAuth()
  const navigate = useNavigate()

  const xuLyDangXuat = async (): Promise<void> => {
    await dangXuat()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="border-b border-amber-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src="/images/logo.jpg" alt="StayEasy" className="h-9 w-9 rounded-lg object-cover" />
            <div>
              <span className="text-lg font-bold text-amber-700">StayEasy</span>
              <p className="text-xs text-amber-500 -mt-0.5">Homestay</p>
            </div>
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link to="/" className="text-gray-600 hover:text-brand-700">
              Trang chủ
            </Link>
            <Link to="/locations" className="text-gray-600 hover:text-brand-700">
              Địa điểm
            </Link>
            <Link to="/rooms" className="text-gray-600 hover:text-brand-700">
              Tìm phòng
            </Link>

            {daDangNhap ? (
              <>
                <Link to="/bookings" className="text-gray-600 hover:text-brand-700">
                  Đơn của tôi
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-brand-700">
                  Hồ sơ
                </Link>
                <span className="hidden text-gray-500 sm:inline">{user?.fullName}</span>
                <Button bienDang="outline" onClick={xuLyDangXuat}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-brand-700">
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white hover:bg-brand-600"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-amber-100 py-4 text-center text-xs text-amber-600">
        © 2026 StayEasy — Hệ thống đặt phòng &amp; quản lý homestay
      </footer>
    </div>
  )
}
