import { Route, Routes } from 'react-router-dom'

import PageLayout from './components/common/PageLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import LocationDetail from './pages/LocationDetail'
import Locations from './pages/Locations'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import Profile from './pages/Profile'
import Register from './pages/Register'

/**
 * Bảng điều hướng.
 *
 * Mọi trang nằm trong `PageLayout` để dùng chung thanh điều hướng. Route cần
 * đăng nhập thì bọc thêm `ProtectedRoute`; những trang quản trị sẽ truyền thêm
 * `yeuCauQuyen={UserRole.ADMIN}` ở Bước 14.
 *
 * `*` cuối cùng bắt mọi đường dẫn còn lại vào 404 — thiếu nó thì gõ sai URL sẽ
 * ra trang trắng của React Router.
 */
export default function App(): JSX.Element {
  return (
    <PageLayout>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/locations" element={<Locations />} />
        <Route path="/locations/:chiSo" element={<LocationDetail />} />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </PageLayout>
  )
}
