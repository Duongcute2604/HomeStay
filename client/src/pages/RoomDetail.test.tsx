import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RoomDetail from './RoomDetail'
import { locationService } from '../services/locationService'
import { roomService } from '../services/roomService'
import { RoomStatus, RoomType } from '../types/location'
import type { Location } from '../types/location'

/**
 * Test cho trang chi tiết phòng.
 *
 * Mock tầng service, giữ Query + Router + khung chọn ngày thật (khung này Bước 10
 * dùng lại nên kiểm chung ở đây luôn một phần).
 */

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

// Khung chọn ngày gọi API kiểm trống — mock để không gọi mạng thật.
vi.mock('../services/roomService', () => ({
  roomService: { timKiem: vi.fn(), kiemTraTrong: vi.fn() },
}))

const layDanhSachMock = vi.mocked(locationService.layDanhSach)

const motDiaDiem: Location[] = [
  {
    name: 'Hưng Yên Ven Biển',
    city: 'Hưng Yên',
    province: 'Hưng Yên',
    address: 'Đường Lê Văn Lương',
    description: null,
    imageUrl: null,
    rooms: [
      {
        name: 'Phòng Hạnh Phúc',
        roomNumber: 'A101',
        roomType: RoomType.COZY,
        capacity: 2,
        pricePerHour: 90000,
        pricePerDay: 550000,
        ratingAvg: 4.5,
        ratingCount: 2,
        status: RoomStatus.AVAILABLE,
        thumbnailUrl: '/images/rooms/cozy/cozy-1.jpg',
        description: 'Phòng thoáng mát nhìn ra vườn.',
        images: ['/images/rooms/cozy/cozy-1.jpg', '/images/rooms/cozy/cozy-2.jpg'],
        amenities: ['WiFi miễn phí', 'Máy lạnh'],
        reviews: [
          {
            reviewerName: 'Trần Thị Mai',
            rating: 5,
            comment: 'Sạch sẽ, thoáng mát.',
            createdAt: '2026-09-20T08:00:00',
          },
          {
            reviewerName: 'Lê Hoàng Nam',
            rating: 4,
            comment: null,
            createdAt: '2026-09-18T08:00:00',
          },
        ],
      },
    ],
  },
]

function dungTrangTai(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }} initialEntries={[url]}>
        <Routes>
          <Route path="/locations/:chiSoDiaDiem/rooms/:chiSoPhong" element={<RoomDetail />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layDanhSachMock.mockReset()
  vi.mocked(roomService.kiemTraTrong).mockReset()
  vi.mocked(roomService.kiemTraTrong).mockResolvedValue({ isAvailable: true, reason: null })
})

describe('RoomDetail - hien thi', () => {
  it('HienTenMoTaGiaTienNghi', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    expect(await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })).toBeInTheDocument()
    expect(screen.getByText('Phòng thoáng mát nhìn ra vườn.')).toBeInTheDocument()
    expect(screen.getByText('550.000 ₫/ngày')).toBeInTheDocument()
    expect(screen.getByText(/WiFi miễn phí/)).toBeInTheDocument()
    expect(screen.getByText(/Máy lạnh/)).toBeInTheDocument()
  })

  it('HienDanhGia_KemTenSaoNhanXet', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })
    expect(screen.getByText('Đánh giá (2)')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị Mai')).toBeInTheDocument()
    expect(screen.getByText('Sạch sẽ, thoáng mát.')).toBeInTheDocument()
    // Sao do `StarRating` ve, moi sao mot `<span>` va co `aria-label` du de
    // trinh doc man hinh doc duoc. Khong khang dinh chuoi "★★★★★" vi 5 sao
    // giay nam o 5 phan tu rieng (kem sao rong cho danh gia duoi 5 sao).
    expect(screen.getByRole('img', { name: '5,0 trên 5 sao' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '4,0 trên 5 sao' })).toBeInTheDocument()
  })

  it('KhungChonNgay_TinhTamTinhDung', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })
    fireEvent.change(screen.getByLabelText('Giờ nhận phòng'), {
      target: { value: '2026-10-05T14:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ trả phòng'), {
      target: { value: '2026-10-07T12:00' },
    })

    // Mặc định theo ngày: 46 giờ → 2 ngày × 550.000.
    expect(screen.getByText(/Tạm tính: 2 ngày/)).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
  })
})

describe('RoomDetail - thu vien anh', () => {
  it('BamThumbnail_DoiAnhChinh', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })
    fireEvent.click(screen.getByRole('button', { name: 'Xem ảnh 2' }))

    const anhChinh = screen.getByRole('button', { name: /Xem lớn ảnh/ })
    expect(anhChinh.querySelector('img')).toHaveAttribute(
      'src',
      '/images/rooms/cozy/cozy-2.jpg',
    )
  })

  it('BamAnhChinh_MoLopPhu_BamDongThiDong', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })
    const anhChinh = screen.getByRole('button', { name: /Xem lớn ảnh/ })

    // Chưa bấm thì lightbox chưa có trong DOM.
    expect(document.querySelector('.lightbox')).toBeNull()

    fireEvent.click(anhChinh)
    expect(document.querySelector('.lightbox')).not.toBeNull()

    // Bấm ra ngoài ảnh (chính là lớp phủ của lightbox) thì đóng.
    fireEvent.click(document.querySelector('.lightbox') as HTMLElement)
    expect(document.querySelector('.lightbox')).toBeNull()
  })

  it('BamAnhChinh_MoLopPhu_BamEscThiDong', async () => {
    layDanhSachMock.mockResolvedValue(motDiaDiem)

    dungTrangTai('/locations/0/rooms/0')

    await screen.findByRole('heading', { name: 'Phòng Hạnh Phúc' })
    fireEvent.click(screen.getByRole('button', { name: /Xem lớn ảnh/ }))
    expect(document.querySelector('.lightbox')).not.toBeNull()

    // Phím Esc cũng đóng được — cách duy nhất khi không có chuột.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.querySelector('.lightbox')).toBeNull()
  })
})

describe('RoomDetail - chi so sai', () => {
  it.each(['/locations/0/rooms/99', '/locations/99/rooms/0', '/locations/abc/rooms/0'])(
    'Url%s_BaoKhongTimThay',
    async (url) => {
      layDanhSachMock.mockResolvedValue(motDiaDiem)

      dungTrangTai(url)

      expect(await screen.findByText('Không tìm thấy phòng')).toBeInTheDocument()
      expect(screen.getByText('Về trang tìm kiếm')).toBeInTheDocument()
    },
  )

  it('LoiTaiDuLieu_HienThongBaoVaNutThuLai', async () => {
    layDanhSachMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrangTai('/locations/0/rooms/0')

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})
