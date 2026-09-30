import { Navigate, Outlet, Route, Routes } from 'react-router-dom'

import AdminLayout from './components/admin/AdminLayout'
import PageLayout from './components/common/PageLayout'
import Toast from './components/common/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminFacilities from './pages/admin/AdminFacilities'
import AdminRooms from './pages/admin/AdminRooms'
import Home from './pages/Home'
import LocationDetail from './pages/LocationDetail'
import Locations from './pages/Locations'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Booking from './pages/Booking'
import MyBookingDetail from './pages/MyBookingDetail'
import MyBookings from './pages/MyBookings'
import Profile from './pages/Profile'
import Register from './pages/Register'
import RoomDetail from './pages/RoomDetail'
import Rooms from './pages/Rooms'
import { UserRole } from './types/auth'

/**
 * Bảng điều hướng.
 *
 * Hai nhánh rời nhau, mỗi nhánh một khung riêng:
 * - Phía khách dùng `PageLayout` (thanh điều hướng + chân trang).
 * - Phía quản trị dùng `AdminLayout` (menu công cụ). Cố tình KHÔNG dùng chung
 *   `PageLayout` — trang quản trị là bảng dữ liệu, lẫn menu khách vào giữa
 *   bảng làm rối mắt.
 *
 * `Toast` đặt ngoài cùng một chỗ để thông báo hiện được ở cả hai nhánh.
 *
 * Route `*` ở nhánh khách bắt mọi đường dẫn lạ vào 404 — thiếu nó thì gõ sai
 * URL sẽ ra trang trắng của React Router.
 */
export default function App(): JSX.Element {
  return (
    <>
      <Toast />
      <Routes>
        <Route element={<KhungAdmin />}>
          <Route path="admin" element={<ChuyenHuongAdmin />} />
          <Route path="admin/facilities" element={<AdminFacilities />} />
          <Route path="admin/rooms" element={<AdminRooms />} />
          <Route path="admin/customers" element={<AdminCustomers />} />
        </Route>

        <Route element={<KhungKhach />}>
          <Route path="/" element={<Home />} />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/:chiSo" element={<LocationDetail />} />
          <Route path="/locations/:chiSoDiaDiem/rooms/:chiSoPhong" element={<RoomDetail />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route
            path="/booking/:chiSoDiaDiem/:chiSoPhong"
            element={
              <ProtectedRoute>
                <Booking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:code"
            element={
              <ProtectedRoute>
                <MyBookingDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}

/** Route cha của nhánh quản trị: chặn quyền rồi mới cho vào menu công cụ. */
function KhungAdmin(): JSX.Element {
  return (
    <ProtectedRoute yeuCauQuyen={UserRole.ADMIN}>
      <AdminLayout />
    </ProtectedRoute>
  )
}

/** Route cha của nhánh khách. `/admin` không khớp trang con nào nên chuyển hướng. */
function KhungKhach(): JSX.Element {
  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  )
}

/** Gõ tay `/admin` thì đưa thẳng sang trang quản lý cơ sở. */
export function ChuyenHuongAdmin(): JSX.Element {
  return <Navigate to="/admin/facilities" replace />
}
