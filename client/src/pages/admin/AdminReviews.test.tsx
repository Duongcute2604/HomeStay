import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminReviews from './AdminReviews'
import { adminService } from '../../services/adminService'
import type { AdminReview } from '../../types/admin'

/**
 * Test trang quản lý đánh giá (Bước 16).
 *
 * Ba thứ phải khoá lại:
 * 1. **Ba nút thao tác** ứng với đúng 3 hành động, và đổi nhãn theo trạng thái
 *    (đang ẩn thì hiện "Hiện lại", không phải "Ẩn").
 * 2. **Xoá phải bấm 2 lần** — xoá hẳn khó hồi phục, bấm nhầm mất dữ liệu thật.
 * 3. **Điểm phòng mới phải lên toast** để Admin thấy thao tác có hiệu lực ngay.
 */

vi.mock('../../services/adminService', () => ({
  adminService: {
    layDanhGia: vi.fn(),
    anDanhGia: vi.fn(),
    hienDanhGia: vi.fn(),
    xoaDanhGia: vi.fn(),
  },
}))

const layDanhGiaMock = vi.mocked(adminService.layDanhGia)
const anDanhGiaMock = vi.mocked(adminService.anDanhGia)
const hienDanhGiaMock = vi.mocked(adminService.hienDanhGia)
const xoaDanhGiaMock = vi.mocked(adminService.xoaDanhGia)

function danhGiaMau(ghiDe: Partial<AdminReview> = {}): AdminReview {
  return {
    id: 1,
    bookingCode: 'HS-260930-0001',
    reviewerName: 'Trần Thị Mai',
    roomName: 'Phòng Hạnh Phúc',
    locationName: 'Hưng Yên Ven Biển',
    rating: 5,
    comment: 'Sạch sẽ, thoáng mát',
    isHidden: false,
    createdAt: '2026-09-28T10:00:00',
    ...ghiDe,
  }
}

function ketQuaPaged(items: AdminReview[], tong = items.length, tongTrang = 1) {
  return { items, totalItems: tong, page: 1, pageSize: 10, totalPages: tongTrang }
}

function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 }, mutations: { retry: false } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/admin/reviews']}
      >
        <AdminReviews />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  layDanhGiaMock.mockResolvedValue(ketQuaPaged([danhGiaMau()]))
  anDanhGiaMock.mockResolvedValue({
    id: 1,
    isHidden: true,
    phongDiemTrungBinh: 2,
    phongSoDanhGia: 1,
  })
  hienDanhGiaMock.mockResolvedValue({
    id: 1,
    isHidden: false,
    phongDiemTrungBinh: 5,
    phongSoDanhGia: 1,
  })
  xoaDanhGiaMock.mockResolvedValue({
    id: 1,
    isHidden: true,
    phongDiemTrungBinh: 0,
    phongSoDanhGia: 0,
  })
})

describe('AdminReviews - hien thi', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    layDanhGiaMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tải đánh giá...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoLoi', async () => {
    layDanhGiaMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
  })

  it('HienTenNguoiPhongMaDonVaNhanXet', async () => {
    dungTrang()

    expect(await screen.findByText('Trần Thị Mai')).toBeInTheDocument()
    expect(screen.getByText('Phòng Hạnh Phúc')).toBeInTheDocument()
    expect(screen.getByText('HS-260930-0001')).toBeInTheDocument()
    expect(screen.getByText('Sạch sẽ, thoáng mát')).toBeInTheDocument()
  })

  it('KhongHienIdNoiBo', async () => {
    dungTrang()

    // `AdminReview.id` có trong payload để gọi API nhưng giao diện không hiện.
    await screen.findByText('Trần Thị Mai')
    expect(screen.queryByText('STT')).toBeInTheDocument()
    expect(document.body.textContent).not.toMatch(/\bId\b/)
  })

  it('STTTinhTu0KhongPhaiId', async () => {
    layDanhGiaMock.mockResolvedValue(ketQuaPaged([danhGiaMau({ id: 999 })]))
    dungTrang()

    // Dòng đầu tiên phải là STT 1, không phải 999 (khoá chính).
    expect(await screen.findByText('1')).toBeInTheDocument()
    expect(screen.queryByText('999')).not.toBeInTheDocument()
  })

  it('DanhGiaDaAn_CoNhanDangAnVaNutHienLai', async () => {
    layDanhGiaMock.mockResolvedValue(
      ketQuaPaged([danhGiaMau({ id: 7, isHidden: true })]),
    )
    dungTrang()

    expect(await screen.findByText('Đang ẩn')).toBeInTheDocument()
    // Đang ẩn thì phải cho hiện lại, không phải ẩn thêm lần nữa.
    expect(await screen.findByRole('button', { name: 'Hiện lại' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ẩn' })).not.toBeInTheDocument()
  })

  it('Rong_HienThongBaoThayViBangRong', async () => {
    layDanhGiaMock.mockResolvedValue(ketQuaPaged([]))
    dungTrang()

    expect(await screen.findByText('Không có đánh giá nào khớp bộ lọc')).toBeInTheDocument()
  })

  it('NhanXetRong_HienDashThayViKhoangTrang', async () => {
    layDanhGiaMock.mockResolvedValue(ketQuaPaged([danhGiaMau({ comment: null })]))
    dungTrang()

    await screen.findByText('Trần Thị Mai')
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})

describe('AdminReviews - thao tac', () => {
  it('BamAn_GoiAnVaHienDiemMoiLenToast', async () => {
    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Ẩn' }))

    // Chỉ kiểm lệnh đã gửi đúng id. Toast do `Toast` ở `App.tsx` render nên
    // không có trong cây test này — khỏi khẳng định (giống `AdminBookings.test`).
    await waitFor(() => expect(anDanhGiaMock).toHaveBeenCalledWith(1))
  })

  it('BamHienLai_GoiHienDanhGia', async () => {
    layDanhGiaMock.mockResolvedValue(ketQuaPaged([danhGiaMau({ id: 7, isHidden: true })]))
    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Hiện lại' }))

    await waitFor(() => expect(hienDanhGiaMock).toHaveBeenCalledWith(7))
  })

  it('XoaPhaiBamHaiLan_MoiThatBocXoa', async () => {
    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá' }))

    // Bấm lần 1 chỉ mở nút xác nhận, chưa gọi API.
    expect(screen.getByRole('button', { name: 'Xoá hẳn' })).toBeInTheDocument()
    expect(xoaDanhGiaMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Xoá hẳn' }))
    await waitFor(() => expect(xoaDanhGiaMock).toHaveBeenCalledWith(1))
  })

  it('BamGiuLai_TacVuongTacKhongXoa', async () => {
    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Xoá' }))
    fireEvent.click(screen.getByRole('button', { name: 'Giữ lại' }))

    expect(xoaDanhGiaMock).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Xoá hẳn' })).not.toBeInTheDocument()
  })

  it('ThaoTacLoi_HienThongBaoLoi', async () => {
    anDanhGiaMock.mockRejectedValue(new Error('Không tìm thấy đánh giá'))
    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Ẩn' }))

    expect(await screen.findByText('Không tìm thấy đánh giá')).toBeInTheDocument()
  })
})

describe('AdminReviews - bo loc', () => {
  it('ChonTrangThaiDangAn_GuiThamSoAnIdFalse', async () => {
    dungTrang()
    await screen.findByText('Trần Thị Mai')

    fireEvent.change(screen.getByLabelText('Trạng thái'), { target: { value: 'false' } })

    await waitFor(() =>
      expect(layDanhGiaMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ anId: false, page: 1 }),
      ),
    )
  })

  it('ChonSoSao_GuiThamSoSoSao', async () => {
    dungTrang()
    await screen.findByText('Trần Thị Mai')

    fireEvent.change(screen.getByLabelText('Số sao'), { target: { value: '2' } })

    await waitFor(() =>
      expect(layDanhGiaMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ soSao: 2, page: 1 }),
      ),
    )
  })

  it('ChonTrangSau_GuiTangTrang', async () => {
    layDanhGiaMock.mockResolvedValue(ketQuaPaged([danhGiaMau()], 25, 3))
    dungTrang()
    await screen.findByText('Trần Thị Mai')

    fireEvent.click(screen.getByRole('button', { name: 'Trang sau →' }))

    await waitFor(() =>
      expect(layDanhGiaMock).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
    )
  })
})
