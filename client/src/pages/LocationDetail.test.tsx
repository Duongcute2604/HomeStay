import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LocationDetail from './LocationDetail'
import { locationService } from '../services/locationService'
import type { Location } from '../types/location'
import { RoomStatus, RoomType } from '../types/location'

/**
 * Test cho trang chi tiết địa điểm.
 *
 * Điểm khó nhất ở đây là điều hướng bằng CHỈ SỐ chứ không phải `Id` — test phải
 * chứng minh: chỉ số đúng thì hiện, chỉ số sai thì báo không tìm thấy (không
 * trắng màn), và gõ thẳng URL vẫn chạy.
 */

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

const layDanhSachMock = vi.mocked(locationService.layDanhSach)

const motDiaDiem: Location[] = [
  {
    name: 'Hưng Yên Ven Biển',
    city: 'Hưng Yên',
    province: 'Hưng Yên',
    address: 'Đường Lê Văn Lương, phường Hưng Yên',
    description: 'Cách biển 300 m.',
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
        thumbnailUrl: '/images/rooms/phong-tieu-chuan.svg',
        description: 'Phòng tiêu chuẩn thoáng mát.',
        images: ['/images/rooms/phong-tieu-chuan.svg', '/images/rooms/noi-that-chung.svg'],
        amenities: ['WiFi miễn phí', 'Máy lạnh'],
        reviews: [],
      },
      {
        name: 'Phòng Bảo Trì',
        roomNumber: 'P02',
        roomType: RoomType.DELUXE,
        capacity: 4,
        pricePerHour: 200000,
        pricePerDay: 1500000,
        ratingAvg: 0,
        ratingCount: 0,
        status: RoomStatus.MAINTENANCE,
        thumbnailUrl: null,
        description: null,
        images: [],
        amenities: [],
        reviews: [],
      },
    ],
  },
]

/** Dựng trang tại URL cho trước, với QueryClient mới (không dùng chung cache). */
function dungTrangTai(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route path="/locations/:chiSo" element={<LocationDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layDanhSachMock.mockReset()
})

describe('LocationDetail - chi so hop le', () => {
  it('ChiSo0_HienThongTinVaDanhSachPhong', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0')

    expect(await screen.findByText('Hưng Yên Ven Biển')).toBeInTheDocument()
    expect(screen.getByText('Đường Lê Văn Lương, phường Hưng Yên')).toBeInTheDocument()
    expect(screen.getByText('Phòng tại Hưng Yên Ven Biển (2)')).toBeInTheDocument()
    expect(screen.getByText('Phòng Tiêu Chuẩn')).toBeInTheDocument()
  })

  it('HienGiaGioVaGiaNgay_DinhDangVnd', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0')

    await screen.findByText('Phòng Tiêu Chuẩn')
    expect(screen.getByText('120.000 ₫/giờ')).toBeInTheDocument()
    expect(screen.getByText('900.000 ₫/ngày')).toBeInTheDocument()
  })

  it('HienNhanTrangThai_PhongBaoTriVanHien', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0')

    await screen.findByText('Phòng Tiêu Chuẩn')
    // Phòng trống và phòng bảo trì đều hiện, khác nhau ở nhãn.
    expect(screen.getByText('Còn trống')).toBeInTheDocument()
    expect(screen.getByText('Bảo trì')).toBeInTheDocument()
  })

  it('HienDanhGia_KhiCoDanhGia', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0')

    await screen.findByText('Phòng Tiêu Chuẩn')
    expect(screen.getByText(/★ 4,5 \(3 đánh giá\)/)).toBeInTheDocument()
  })
})

describe('LocationDetail - chi so KHONG hop le', () => {
  it.each(['/locations/99', '/locations/-1', '/locations/abc'])(
    'Url%s_BaoKhongTimThay_KhongTrangMan',
    async (url) => {
      layDanhSachMock.mockResolvedValue(motDiaDiem)

      dungTrangTai(url)

      expect(await screen.findByText('Không tìm thấy địa điểm')).toBeInTheDocument()
      expect(screen.getByText('Về danh sách địa điểm')).toBeInTheDocument()
      expect(screen.queryByText('Phòng Tiêu Chuẩn')).not.toBeInTheDocument()
    },
  )

  it('LoiTaiDuLieu_HienThongBaoVaNutThuLai', async () => {
    layDanhSachMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrangTai('/locations/0')

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
