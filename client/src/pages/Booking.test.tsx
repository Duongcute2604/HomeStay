import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Booking from './Booking'
import { bookingService } from '../services/bookingService'
import { locationService } from '../services/locationService'
import { roomService } from '../services/roomService'
import { useAuthStore } from '../store/authStore'
import { RoomStatus, RoomType } from '../types/location'

/**
 * Test cho trang đặt phòng.
 *
 * Mock cả ba service. Trọng tâm: tạo đơn thành công hiện `Code` (không `Id`),
 * trùng phút chót hiện lỗi, quá sức chứa chặn ở form, thiếu ngày thì báo sớm.
 */

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

vi.mock('../services/roomService', () => ({
  roomService: { timKiem: vi.fn(), kiemTraTrong: vi.fn() },
}))

vi.mock('../services/bookingService', () => ({
  bookingService: { taoDon: vi.fn() },
}))

const layDanhSachMock = vi.mocked(locationService.layDanhSach)
const kiemTraTrongMock = vi.mocked(roomService.kiemTraTrong)
const taoDonMock = vi.mocked(bookingService.taoDon)

const phongMau = {
  name: 'Phòng Hạnh Phúc',
  roomNumber: 'A101',
  roomType: RoomType.COZY,
  capacity: 2,
  pricePerHour: 90000,
  pricePerDay: 550000,
  ratingAvg: 4.5,
  ratingCount: 1,
  status: RoomStatus.AVAILABLE,
  thumbnailUrl: null,
  description: null,
  images: [],
  amenities: [],
  reviews: [],
}

const diaDiemMau = [
  {
    name: 'Hưng Yên Ven Biển',
    city: 'Hưng Yên',
    province: 'Hưng Yên',
    address: 'Đường Lê Văn Lương',
    description: null,
    imageUrl: null,
    rooms: [phongMau],
  },
]

const URL_HOP_LE = '/booking/0/0?loai=day&checkIn=2026-10-05T14:00:00.000Z&checkOut=2026-10-07T12:00:00.000Z'

function dungTrangTai(url: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={[url]}
      >
        <Routes>
          <Route path="/booking/:chiSoDiaDiem/:chiSoPhong" element={<Booking />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layDanhSachMock.mockReset()
  kiemTraTrongMock.mockReset()
  taoDonMock.mockReset()
  layDanhSachMock.mockResolvedValue(diaDiemMau)
  kiemTraTrongMock.mockResolvedValue({ isAvailable: true, reason: null })
  // Trang đặt không đọc phiên đăng nhập (quyền do ProtectedRoute giữ ở App),
  // nhưng store phải sạch để không rò sang test khác.
  useAuthStore.getState().xoaPhien()
})

describe('Booking - hien thi', () => {
  it('HienTomTatPhongNgayTien', async () => {
    dungTrangTai(URL_HOP_LE)

    // Nut submit chi mo khi kiem trong xong — bam truoc la bam vao nut khoa.
    await screen.findByRole('heading', { name: 'Xác nhận đặt phòng' })
    await screen.findByText('Phòng còn trống trong khoảng đã chọn')
    expect(screen.getByText('Phòng Hạnh Phúc')).toBeInTheDocument()
    expect(screen.getByText(/Tạm tính: 2 ngày/)).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
  })

  it('ThieuNgayTrenUrl_BaoKhongDatDuoc', async () => {
    dungTrangTai('/booking/0/0')

    expect(await screen.findByText('Không đặt được phòng này')).toBeInTheDocument()
    expect(screen.getByText('Về trang tìm kiếm')).toBeInTheDocument()
    expect(kiemTraTrongMock).not.toHaveBeenCalled()
  })

  it('ChiSoSai_BaoKhongDatDuoc', async () => {
    dungTrangTai('/booking/0/99?loai=day&checkIn=2026-10-05T14:00:00.000Z&checkOut=2026-10-07T12:00:00.000Z')

    expect(await screen.findByText('Không đặt được phòng này')).toBeInTheDocument()
  })
})

describe('Booking - tao don', () => {
  it('ThanhCong_HienMaDon_KhongHienId', async () => {
    taoDonMock.mockResolvedValue({
      code: 'HS-261005-4821',
      roomName: 'Phòng Hạnh Phúc',
      locationName: 'Hưng Yên Ven Biển',
      bookingType: 1,
      checkIn: '2026-10-05T14:00:00',
      checkOut: '2026-10-07T12:00:00',
      guestCount: 2,
      totalAmount: 1100000,
      status: 0,
      note: null,
      createdAt: '2026-09-30T10:00:00',
    })
    dungTrangTai(URL_HOP_LE)

    await screen.findByRole('heading', { name: 'Xác nhận đặt phòng' })
    // Nut submit chi mo khi kiem trong xong — bam truoc la bam vao nut khoa.
    await screen.findByText('Phòng còn trống trong khoảng đã chọn')
    fireEvent.change(screen.getByLabelText(/Số khách/), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đặt phòng' }))

    expect(await screen.findByText('Đặt phòng thành công')).toBeInTheDocument()
    expect(screen.getByText('HS-261005-4821')).toBeInTheDocument()
    // Mã đơn để tra cứu thay Id — trang không được chứa Id nội bộ.
    expect(screen.queryByText(/^\d+$/)).not.toBeInTheDocument()
    expect(taoDonMock).toHaveBeenCalledWith(
      expect.objectContaining({ locationIndex: 0, roomIndex: 0, guestCount: 2 }),
    )
  })

  it('TrungPhutChot_HienLoiRoot_KhongChuyenTrang', async () => {
    taoDonMock.mockRejectedValue(new Error('Phòng đã có người đặt trong khoảng thời gian này'))
    dungTrangTai(URL_HOP_LE)

    await screen.findByRole('heading', { name: 'Xác nhận đặt phòng' })
    // Nut submit chi mo khi kiem trong xong — bam truoc la bam vao nut khoa.
    await screen.findByText('Phòng còn trống trong khoảng đã chọn')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đặt phòng' }))

    expect(
      await screen.findByText('Phòng đã có người đặt trong khoảng thời gian này'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Đặt phòng thành công')).not.toBeInTheDocument()
  })

  it('VuotSucChua_BaoLoiTaiForm_KhongGoiApi', async () => {
    dungTrangTai(URL_HOP_LE)

    await screen.findByRole('heading', { name: 'Xác nhận đặt phòng' })
    // Nut submit chi mo khi kiem trong xong — bam truoc la bam vao nut khoa.
    await screen.findByText('Phòng còn trống trong khoảng đã chọn')
    fireEvent.change(screen.getByLabelText(/Số khách/), { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận đặt phòng' }))

    expect(await screen.findByText('Phòng chỉ chứa tối đa 2 khách')).toBeInTheDocument()
    expect(taoDonMock).not.toHaveBeenCalled()
  })

  it('PhongBan_NutXacNhanBiKhoa', async () => {
    kiemTraTrongMock.mockResolvedValue({
      isAvailable: false,
      reason: 'Phòng đã có người đặt trong khoảng thời gian này',
    })
    dungTrangTai(URL_HOP_LE)

    await screen.findByRole('heading', { name: 'Xác nhận đặt phòng' })
    // Đợi kiểm trống xong (kết quả là BẬN) rồi mới khẳng định nút bị khoá.
    await screen.findByText('Phòng đã có người đặt trong khoảng thời gian này')
    expect(screen.getByRole('button', { name: 'Xác nhận đặt phòng' })).toBeDisabled()
    expect(taoDonMock).not.toHaveBeenCalled()
  })
})
