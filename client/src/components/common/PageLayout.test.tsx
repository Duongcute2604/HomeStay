import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PageLayout from './PageLayout'
import { useAuth } from '../../hooks/useAuth'

/**
 * Test thanh điều hướng (Bước 17 — kịch bản 1, màn hình 375px).
 *
 * Vì sao cần test: ở 375px, 5 mục menu cùng nút "Đăng ký" không vừa một hàng —
 * chữ bị xuống dòng thành "Trang/chủ" và cả thanh tràn ngang. Đã sửa bằng nút
 * 3 gạch. Test khoá lại: có **hai** bản menu (rộng và thu gọn) khai từ **một**
 * danh sách, nên thêm mục menu mới không thể quên sửa cả hai bên.
 */
vi.mock('../../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Icon chuông trên header gọi API thông báo, nên chặn ra khỏi test thanh điều hướng —
// test này kiểm menu, không kiểm thông báo.
vi.mock('../../services/notificationService', () => ({
  notificationService: {
    layCuaToi: vi.fn().mockResolvedValue({ items: [], soChuaDoc: 0 }),
    danhDauDaDoc: vi.fn(),
    danhDauDaDocTatCa: vi.fn(),
  },
}))

const useAuthMock = vi.mocked(useAuth)

function dungLayout() {
  // `PageLayout` chứa icon chuông dùng TanStack Query nên cần `QueryClientProvider`
  // y như ứng dụng thật (xem `App.tsx`). Thiếu nó thì render ném lỗi ngay.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/']}
      >
        <PageLayout>
          <p>Nội dung trang</p>
        </PageLayout>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  useAuthMock.mockReturnValue({
    user: null,
    daDangNhap: false,
    dangXuat: vi.fn(),
  } as unknown as ReturnType<typeof useAuth>)
})

/**
 * Lưu ý khi đọc test: jsdom không có CSS của Tailwind, nên bản menu rộng và bản
 * menu thu gọn **cùng tồn tại** trong DOM (ngoài đời, `hidden sm:flex` ẩn một
 * bên). Vì vậy các truy vấn dùng `getAllByRole` và đếm số phần tử — đó mới
 * phản ánh đúng hành vi: mở menu thu gọn là có **thêm** một bản, không phải thay thế.
 */
describe('PageLayout - thanh dieu huong', () => {
  it('ChuaMoMenu_ChiCoBanMenuRong', () => {
    dungLayout()

    // Nút ☰ luôn có mặt; cái biến mất là bản menu thu gọn.
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Đăng ký' })).toHaveLength(1)
  })

  it('BamNutBaGach_HienMenuThuGonVaDoiTenNut', () => {
    dungLayout()

    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))

    expect(screen.getByRole('button', { name: 'Đóng menu' })).toBeInTheDocument()
  })

  it('BamNutBaGach_ThemBanMenuThuGon', () => {
    dungLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))

    expect(screen.getAllByRole('link', { name: 'Địa điểm' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Tìm phòng' })).toHaveLength(2)
  })

  it('BamNutDongLai_DongMenu', () => {
    dungLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))

    fireEvent.click(screen.getByRole('button', { name: 'Đóng menu' }))

    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Địa điểm' })).toHaveLength(1)
  })

  it('DaDangNhap_MenuThuGonCoThemDonVaHoSo', () => {
    useAuthMock.mockReturnValue({
      user: { fullName: 'Trần Thị Mai', email: 'khach1@gmail.com', role: 0 },
      daDangNhap: true,
      dangXuat: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>)

    dungLayout()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))

    expect(screen.getAllByRole('link', { name: 'Đơn của tôi' })).toHaveLength(2)
    expect(screen.getAllByRole('link', { name: 'Hồ sơ' })).toHaveLength(2)
    // Đã đăng nhập thì không có mục "Đăng nhập"/"Đăng ký" ở bản nào.
    expect(screen.queryByRole('link', { name: 'Đăng ký' })).not.toBeInTheDocument()
  })

  it('LogoCoTenBiAnTrenManHinhNho', () => {
    dungLayout()

    // Ở 375px chữ "HomeStay" bị ẩn (`hidden sm:block`) vì chính nó làm tràn
    // ngang. jsdom không áp CSS nên phải kiểm **lớp**, không kiểm mất chữ.
    expect(screen.getByAltText('HomeStay')).toBeInTheDocument()
    expect(screen.getByText('Homestay').parentElement).toHaveClass('hidden', 'sm:block')
  })

  it('LuonHienNoiDungTrangCon', () => {
    dungLayout()

    expect(screen.getByText('Nội dung trang')).toBeInTheDocument()
  })
})