import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import ProtectedRoute from './ProtectedRoute'
import { useAuthStore } from '../store/authStore'
import { UserRole, UserStatus } from '../types/auth'
import type { UserProfile } from '../types/auth'

/**
 * Test cho lớp chặn trang.
 *
 * Đây là lớp bảo vệ thứ hai bên cạnh `[Authorize]` của API. Nếu thiếu nó thì
 * khách gõ thẳng URL vẫn thấy khung trang rồi vài giây sau mới nhận 401 — tức
 * giao diện đã hiển thị thứ không nên hiển thị. AGENTS.md 6.6 yêu cầu kiểm tra
 * phân quyền ở CẢ hai nơi.
 *
 * Không mock `useAuth` mà điều khiển thẳng `useAuthStore`, vì `useAuth` chỉ đọc
 * store ra. Mock nó sẽ khiến test xanh dù store sai — đúng loại bản giả che mất
 * lỗi đã gặp ở backend (`lessons.md` mục 20).
 */

/** Nội dung trang được bảo vệ, dùng làm dấu hiệu "đã vào được trang". */
const NOI_DUNG_BI_BAO_VE = 'Nội dung chỉ hiện khi được vào'

const userKhach: UserProfile = {
  id: 2,
  fullName: 'Trần Thị Mai',
  email: 'khach1@gmail.com',
  phoneNumber: null,
  address: null,
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  createdAt: '2026-09-29T00:00:00Z',
}

const userAdmin: UserProfile = { ...userKhach, id: 1, fullName: 'Nguyễn Minh Quân', role: UserRole.ADMIN }

/** Dựng app nhỏ đúng như `App.tsx`: có trang đích và trang đăng nhập để nhảy tới. */
function dungApp(yeuCauQuyen?: UserRole) {
  return render(
    // Hai cờ `future` y hệt `main.tsx`: không có chúng thì React Router 6 in cảnh
    // báo vào console mỗi lần test, gây nhiễu khi đọc kết quả.
    <MemoryRouter
      initialEntries={['/trang-bao-ve']}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route
          path="/trang-bao-ve"
          element={
            <ProtectedRoute yeuCauQuyen={yeuCauQuyen}>
              <p>{NOI_DUNG_BI_BAO_VE}</p>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<p>Trang đăng nhập</p>} />
        <Route path="/" element={<p>Trang chủ</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  // Mỗi ca bắt đầu từ trạng thái "chưa đăng nhập" — nếu không, ca trước còn sót
  // phiên thì ca sau xanh vì lý do sai.
  useAuthStore.getState().xoaPhien()
})

describe('ProtectedRoute - khi CHUA dang nhap', () => {
  it('KhongDangNhap_ChuyenHuongVeTrangDangNhap_KhongHienNoiDung', () => {
    dungApp()

    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument()
    expect(screen.queryByText(NOI_DUNG_BI_BAO_VE)).not.toBeInTheDocument()
  })

  it('KhongDangNhap_QuyenADMIN_CungChuyenHuongVeDangNhap', () => {
    // Chưa đăng nhập thì phải bị chặn ở bước "chưa đăng nhập", không phải bước
    // "sai quyền" — cả hai đều chuyển hướng nhưng đúng thứ tự thì lỗi sau dễ hiểu hơn.
    dungApp(UserRole.ADMIN)

    expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument()
  })
})

describe('ProtectedRoute - khi DA dang nhap', () => {
  beforeEach(() => {
    useAuthStore.getState().datPhien('token', 'refresh', userKhach)
  })

  it('Khach_VaoTrangKhongYeuCauQuyen_ChoQua', () => {
    dungApp()

    expect(screen.getByText(NOI_DUNG_BI_BAO_VE)).toBeInTheDocument()
  })

  it('Khach_VaoTrangYeuCauADMIN_ChuyenHuongVeTrangChu', () => {
    dungApp(UserRole.ADMIN)

    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.queryByText(NOI_DUNG_BI_BAO_VE)).not.toBeInTheDocument()
  })
})

describe('ProtectedRoute - khi la Admin', () => {
  it('Admin_VaoTrangYeuCauADMIN_ChoQua', () => {
    useAuthStore.getState().datPhien('token', 'refresh', userAdmin)

    dungApp(UserRole.ADMIN)

    expect(screen.getByText(NOI_DUNG_BI_BAO_VE)).toBeInTheDocument()
  })

  it('Admin_VaoTrangKhongYeuCauQuyen_ChoQua', () => {
    useAuthStore.getState().datPhien('token', 'refresh', userAdmin)

    dungApp()

    expect(screen.getByText(NOI_DUNG_BI_BAO_VE)).toBeInTheDocument()
  })
})
