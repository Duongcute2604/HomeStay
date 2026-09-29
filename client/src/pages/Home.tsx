import { Link } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'

/**
 * Trang chủ — mốc 1 của dự án.
 *
 * Hiện chỉ là trang giới thiệu: tìm kiếm phòng thuộc Bước 7, nên ở bước này
 * chưa có danh sách. Giữ phần giới thiệu thay vì để trang trắng để mỗi bước sau
 * chỉ việc thay nội dung giữa khung sẵn có.
 */
export default function Home(): JSX.Element {
  const { user, daDangNhap, laAdmin } = useAuth()

  return (
    <div className="card mx-auto mt-8 max-w-2xl p-8 text-center">
      <h1 className="text-2xl font-bold text-brand-700">StayEasy</h1>
      <p className="mt-2 text-gray-600">
        Hệ thống đặt phòng &amp; quản lý homestay theo giờ hoặc theo ngày.
      </p>

      {daDangNhap ? (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-gray-700">
            Xin chào <span className="font-semibold">{user?.fullName}</span>
            {laAdmin && <span className="text-brand-700"> (Quản trị viên)</span>}
          </p>

          <Link to="/profile" className="btn-outline">
            Xem hồ sơ
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm text-gray-600">Đăng nhập để bắt đầu đặt phòng.</p>

          <div className="flex gap-3">
            <Link to="/login" className="btn-outline">
              Đăng nhập
            </Link>
            <Link to="/register" className="btn-primary">
              Đăng ký
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
