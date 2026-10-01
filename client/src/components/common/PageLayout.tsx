import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'
import Button from './Button'
import ChuongThongBao from './ChuongThongBao'

/** Menu dùng chung cho cả bản rộng và bản thu gọn — khai 1 lần để không lệch. */
interface MucMenu {
  to: string
  nhan: string
}

const MENU_KHACH: MucMenu[] = [
  { to: '/', nhan: 'Trang chủ' },
  { to: '/locations', nhan: 'Địa điểm' },
  { to: '/rooms', nhan: 'Tìm phòng' },
]

const MENU_DANG_NHAP: MucMenu[] = [
  { to: '/bookings', nhan: 'Đơn của tôi' },
  { to: '/payments', nhan: 'Thanh toán' },
  { to: '/notifications', nhan: 'Thông báo' },
  { to: '/profile', nhan: 'Hồ sơ' },
]

/**
 * Khung chung của mọi trang: thanh điều hướng + vùng nội dung.
 *
 * Tách riêng khỏi từng trang vì thanh điều hướng là thứ **không đổi** giữa các
 * trang — viết lại ở mỗi trang nghĩa là sửa 4 chỗ mỗi khi đổi menu (DRY).
 *
 * <b>Vì sao có nút 3 gạch:</b> ở 375px, 5 mục menu cùng nút "Đăng ký" không
 * vừa một hàng — chữ bị xuống dòng thành "Trang/chủ" và cả thanh tràn ngang.
 * Nên dưới `sm` thu gọn thành nút 3 gạch, bấm ra là menu dọc.
 */
export default function PageLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const { user, daDangNhap, dangXuat } = useAuth()
  const navigate = useNavigate()
  const [menuMo, setMenuMo] = useState(false)

  const xuLyDangXuat = async (): Promise<void> => {
    await dangXuat()
    navigate('/login', { replace: true })
  }

  const dongMenu = (): void => setMenuMo(false)

  const veMenu = (giaoDien: 'ro' | 'dong'): JSX.Element => {
    const lopGoc = [
      'whitespace-nowrap',
      giaoDien === 'ro'
        ? 'text-gray-600 hover:text-brand-700'
        : 'rounded-lg px-3 py-2 text-gray-700 hover:bg-amber-50',
    ].join(' ')

    return (
      <>
        {MENU_KHACH.map((muc) => (
          <Link key={muc.to} to={muc.to} className={lopGoc} onClick={dongMenu}>
            {muc.nhan}
          </Link>
        ))}

        {daDangNhap ? (
          <>
            {MENU_DANG_NHAP.map((muc) => (
              <Link key={muc.to} to={muc.to} className={lopGoc} onClick={dongMenu}>
                {muc.nhan}
              </Link>
            ))}
            {giaoDien === 'ro' && (
              <>
                <ChuongThongBao />
                <span className="hidden text-gray-500 lg:inline">{user?.fullName}</span>
                <Button bienDang="outline" onClick={() => void xuLyDangXuat()}>
                  Đăng xuất
                </Button>
              </>
            )}
            {giaoDien === 'dong' && (
              <div className="mt-1 flex items-center justify-between border-t border-amber-100 pt-2">
                <ChuongThongBao />
                <span className="text-gray-500">{user?.fullName}</span>
                <Button bienDang="outline" onClick={() => void xuLyDangXuat()}>
                  Đăng xuất
                </Button>
              </div>
            )}
          </>
        ) : (
          <>
            <Link to="/login" className={lopGoc} onClick={dongMenu}>
              Đăng nhập
            </Link>
            <Link
              to="/register"
              onClick={dongMenu}
              className={
                giaoDien === 'ro'
                  ? 'whitespace-nowrap rounded-lg bg-brand-500 px-3 py-1.5 font-medium text-white hover:bg-brand-600'
                  : 'whitespace-nowrap rounded-lg bg-brand-500 px-3 py-2 text-center font-medium text-white hover:bg-brand-600'
              }
            >
              Đăng ký
            </Link>
          </>
        )}
      </>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-50 border-b border-amber-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2" onClick={dongMenu}>
              <img src="/images/logo.svg" alt="HomeStay" className="h-9 w-9" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold text-amber-700">HomeStay</span>
                <p className="-mt-0.5 text-xs text-amber-500">Homestay</p>
              </div>
            </Link>

            <button
              type="button"
              aria-expanded={menuMo}
              aria-label={menuMo ? 'Đóng menu' : 'Mở menu'}
              onClick={() => setMenuMo((mo) => !mo)}
              className="rounded-lg border border-amber-200 p-2 text-gray-600 sm:hidden"
            >
              {menuMo ? '✕' : '☰'}
            </button>

            {/* Bản rộng: nằm cùng hàng với logo */}
            <nav className="hidden items-center gap-4 text-sm sm:flex">{veMenu('ro')}</nav>
          </div>

          {/* Bản thu gọn: xuống dòng dưới logo, xếp dọc */}
          {menuMo && (
            <nav className="mt-3 flex flex-col gap-1 border-t border-amber-100 pt-3 text-sm sm:hidden">
              {veMenu('dong')}
            </nav>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>

      <footer className="border-t border-amber-100 py-4 text-center text-xs text-amber-600">
        © 2026 HomeStay — Hệ thống đặt phòng &amp; quản lý homestay
      </footer>
    </div>
  )
}