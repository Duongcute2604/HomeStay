import { NavLink, Outlet } from 'react-router-dom'

import { useAuth } from '../../hooks/useAuth'

/**
 * Khung chung cho toàn bộ trang quản trị: thanh menu bên trái + vùng nội dung.
 *
 * Cố tình KHÔNG dùng `PageLayout` của phía khách. Trang quản trị là công cụ
 * làm việc (nhiều bảng dữ liệu, thao tác liên tục) khác hẳn trang giới thiệu
 * dịch vụ — dùng chung khung sẽ kéo theo menu khách và quầng quảng cáo vào
 * giữa bảng tính, làm rối mắt.
 */

/**
 * Menu quản trị. Thứ tự theo luồng vận hành hằng ngày: vào đơn trước (việc
 * phải làm), rồi mới tới danh mục (việc chuẩn bị).
 */
const MENU = [
  // `hetTrang` bắt buộc với mục gốc `/admin`: không có nó thì đang ở
  // `/admin/rooms` mà mục "Thống kê" vẫn sáng — hai mục sáng cùng lúc.
  { to: '/admin', nhan: 'Thống kê', hetTrang: true },
  { to: '/admin/bookings', nhan: 'Đơn đặt phòng', hetTrang: false },
  { to: '/admin/facilities', nhan: 'Cơ sở', hetTrang: false },
  { to: '/admin/rooms', nhan: 'Phòng', hetTrang: false },
  { to: '/admin/customers', nhan: 'Khách hàng', hetTrang: false },
] as const

export default function AdminLayout(): JSX.Element {
  const { user, dangXuat } = useAuth()

  return (
    <div className="min-h-screen bg-amber-50/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 lg:flex-row">
        <aside className="shrink-0 lg:w-60">
          <div className="card-phong p-4">
            <p className="text-sm text-stone-500">Đang quản lý</p>
            <p className="text-base font-semibold text-stone-800">{user?.fullName}</p>

            <nav className="mt-4 flex flex-col gap-1">
              {MENU.map((muc) => (
                <NavLink
                  key={muc.to}
                  to={muc.to}
                  end={muc.hetTrang}
                  className={({ isActive }) =>
                    [
                      'rounded-lg px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-stone-700 hover:bg-amber-100',
                    ].join(' ')
                  }
                >
                  {muc.nhan}
                </NavLink>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => void dangXuat()}
              className="mt-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-700 transition hover:bg-stone-50"
            >
              Đăng xuất
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
