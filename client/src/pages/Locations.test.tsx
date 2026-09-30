import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Locations from './Locations'
import { locationService } from '../services/locationService'
import type { Location } from '../types/location'
import { RoomStatus, RoomType } from '../types/location'

/**
 * Test cho trang danh sách địa điểm.
 *
 * Mock tầng service (không gọi mạng), nhưng giữ TanStack Query + Router thật để
 * kiểm đúng 3 trạng thái bắt buộc: Loading / Error / Empty (AGENTS.md 7.2).
 */

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

const layDanhSachMock = vi.mocked(locationService.layDanhSach)

const haiDiaDiem: Location[] = [
  {
    name: 'Hưng Yên Ven Biển',
    city: 'Hưng Yên',
    province: 'Hưng Yên',
    address: 'Đường Lê Văn Lương',
    description: null,
    imageUrl: '/images/locations/hung-yen.svg',
    rooms: [
      {
        name: 'Phòng Tiêu Chuẩn',
        roomNumber: 'P01',
        roomType: RoomType.STANDARD,
        capacity: 2,
        pricePerHour: 120000,
        pricePerDay: 900000,
        ratingAvg: 4.5,
        ratingCount: 3,
        status: RoomStatus.AVAILABLE,
        thumbnailUrl: null,
      },
      {
        name: 'Phòng Cao Cấp',
        roomNumber: 'P02',
        roomType: RoomType.DELUXE,
        capacity: 4,
        pricePerHour: 200000,
        pricePerDay: 1500000,
        ratingAvg: 0,
        ratingCount: 0,
        status: RoomStatus.AVAILABLE,
        thumbnailUrl: null,
      },
    ],
  },
  {
    name: 'Đà Lạt Đồi Thông',
    city: 'Đà Lạt',
    province: 'Lâm Đồng',
    address: 'Đường Đặng Thùy Trâm',
    description: null,
    imageUrl: null,
    rooms: [],
  },
]

/** Dựng trang với QueryClient mới cho mỗi test — không dùng chung cache. */
function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Locations />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layDanhSachMock.mockReset()
})

describe('Locations - trang thai', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    layDanhSachMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tải danh sách địa điểm...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoVaNutThuLai', async () => {
    layDanhSachMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('DanhSachRong_HienThongBaoTrong', async () => {
    layDanhSachMock.mockResolvedValue([])

    dungTrang()

    expect(await screen.findByText('Hiện chưa có địa điểm nào.')).toBeInTheDocument()
  })
})

describe('Locations - danh sach', () => {
  it('HienDuDiaDiem_VoiSttBatDauTu1', async () => {
    layDanhSachMock.mockResolvedValue(haiDiaDiem)

    dungTrang()

    expect(await screen.findByText('Hưng Yên Ven Biển')).toBeInTheDocument()
    expect(screen.getByText('Đà Lạt Đồi Thông')).toBeInTheDocument()
    // STT = chỉ số + 1, không hiện Id.
    expect(screen.getByText('1. Hưng Yên')).toBeInTheDocument()
    expect(screen.getByText('2. Lâm Đồng')).toBeInTheDocument()
  })

  it('HienSoPhongVaGiaThapNhat_DinhDangVnd', async () => {
    layDanhSachMock.mockResolvedValue(haiDiaDiem)

    dungTrang()

    await screen.findByText('Hưng Yên Ven Biển')
    expect(screen.getByText('2 phòng')).toBeInTheDocument()
    // Giá thấp nhất trong 2 phòng (900.000, không phải 1.500.000).
    expect(screen.getByText('Từ 900.000 ₫/ngày')).toBeInTheDocument()
  })

  it('DiaDiemKhongPhong_KhongHienGia_ChiDiaDiemCoPhongMoiHien', async () => {
    layDanhSachMock.mockResolvedValue(haiDiaDiem)

    dungTrang()

    await screen.findByText('Đà Lạt Đồi Thông')
    expect(screen.getByText('0 phòng')).toBeInTheDocument()
    // Chỉ 1 địa điểm có phòng nên chỉ có đúng 1 dòng giá trên toàn trang —
    // thẻ Đà Lạt (0 phòng) không được hiện giá.
    expect(screen.getAllByText(/Từ .*\/ngày/)).toHaveLength(1)
  })

  it('LinkChiTiet_DungChiSo_KhongDungId', async () => {
    layDanhSachMock.mockResolvedValue(haiDiaDiem)

    dungTrang()

    await screen.findByText('Hưng Yên Ven Biển')
    const cacLink = screen.getAllByRole('link')
    const linkDiaDiem = cacLink.filter((link) => link.getAttribute('href')?.startsWith('/locations/'))
    expect(linkDiaDiem.map((link) => link.getAttribute('href'))).toEqual([
      '/locations/0',
      '/locations/1',
    ])
  })
})
