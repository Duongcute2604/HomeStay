import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MyBookingDetail from './MyBookingDetail'
import { bookingService } from '../services/bookingService'
import { BookingStatus } from '../types/booking'
import type { BookingDetail } from '../types/booking'

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

vi.mock('../services/bookingService', () => ({
  bookingService: { taoDon: vi.fn(), layCuaToi: vi.fn(), layChiTiet: vi.fn(), huyDon: vi.fn() },
}))

const layChiTietMock = vi.mocked(bookingService.layChiTiet)
const huyDonMock = vi.mocked(bookingService.huyDon)

const chiTietMau: BookingDetail = {
  code: 'HS-261005-4821',
  roomName: 'Phòng Hạnh Phúc',
  locationName: 'Hưng Yên Ven Biển',
  bookingType: 1,
  checkIn: '2026-10-05T14:00:00',
  checkOut: '2026-10-07T12:00:00',
  guestCount: 2,
  totalAmount: 1100000,
  status: 0,
  note: 'Đến muộn sau 22:00',
  cancelReason: null,
  createdAt: '2026-09-30T10:00:00',
  roomNumber: 'A101',
  capacity: 4,
  daDanhGia: false,
  danhGiaCuaToi: null,
  history: [
    {
      fromStatus: null,
      toStatus: BookingStatus.PENDING,
      changedByName: 'Trần Thị Mai',
      note: null,
      changedAt: '2026-09-30T10:00:00',
    },
  ],
}

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
          <Route path="/locations/:chiSoDiaDiem/rooms/:chiSoPhong" element={<div>Trang chi tiết phòng</div>} />
          <Route path="/bookings/:code" element={<MyBookingDetail />} />
          <Route path="/bookings" element={<p>Danh sách đơn</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layChiTietMock.mockReset()
  huyDonMock.mockReset()
})

describe('MyBookingDetail - hien thi', () => {
  it('HienThongTinDon_LichSu_GhiChu', async () => {
    layChiTietMock.mockResolvedValue(chiTietMau)

    dungTrangTai('/bookings/HS-261005-4821')

    expect(await screen.findByText('HS-261005-4821')).toBeInTheDocument()
    expect(screen.getByText(/Phòng Hạnh Phúc/)).toBeInTheDocument()
    // Hiện TỔNG TIỀN của đơn. Trước đây trang này hiện `pricePerHour`/`pricePerDay`
    // mà API chi tiết đơn không gửi, nên ra chữ "NaN" cạnh dấu ₫.
    expect(screen.getByText('Tổng tiền')).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
    expect(screen.getByText(/Phòng A101/)).toBeInTheDocument()
    // Không màn hình nào được hiện "NaN" — đây là chốt chặn hồi quy.
    expect(document.body.textContent).not.toContain('NaN')
    // "Tạo đơn" xuất hiện 1 lần trong lịch sử
    expect(screen.getAllByText(/Tạo đơn/)).toHaveLength(1)
    // "Chờ xác nhận": 1 badge + 1 trong lịch sử = 2
    expect(screen.getAllByText('Chờ xác nhận')).toHaveLength(2)
    // "bởi Trần Thị Mai" xuất hiện 1 lần
    expect(screen.getAllByText(/bởi Trần Thị Mai/)).toHaveLength(1)
    expect(screen.getByText(/Ghi chú: Đến muộn sau 22:00/)).toBeInTheDocument()
  })

  it('MaSai_HienKhongTimThay_CoLoiVe', async () => {
    layChiTietMock.mockRejectedValue(new Error('Không tìm thấy dữ liệu yêu cầu'))

    dungTrangTai('/bookings/HS-SAI-0000')

    expect(await screen.findByText('Không tìm thấy đơn')).toBeInTheDocument()
    expect(screen.getByText('Về danh sách đơn')).toBeInTheDocument()
  })
})

describe('MyBookingDetail - huy don', () => {
  it('DonPending_HienKhungHuy_HuyThanhCongDoiTrangThai', async () => {
    let goiLayChiTiet = 0
    layChiTietMock.mockImplementation(() => {
      goiLayChiTiet++
      if (goiLayChiTiet === 1) {
        return Promise.resolve(chiTietMau)
      }
      return Promise.resolve({ ...chiTietMau, status: BookingStatus.CANCELLED })
    })
    huyDonMock.mockResolvedValue({ ...chiTietMau, status: BookingStatus.CANCELLED })

    dungTrangTai('/bookings/HS-261005-4821')

    await screen.findByText('HS-261005-4821')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
    fireEvent.change(screen.getByPlaceholderText(/đổi kế hoạch/), {
      target: { value: 'Đổi kế hoạch công tác' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Chắc chắn hủy đơn' }))

    expect(huyDonMock).toHaveBeenCalledWith('HS-261005-4821', 'Đổi kế hoạch công tác')
    expect(await screen.findByText('Đã hủy')).toBeInTheDocument()
  })

  it('HuyThatBai_HienLoi_GiuFormDeThuLai', async () => {
    layChiTietMock.mockResolvedValue(chiTietMau)
    huyDonMock.mockRejectedValue(new Error('Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận'))

    dungTrangTai('/bookings/HS-261005-4821')

    await screen.findByText('HS-261005-4821')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
    fireEvent.click(screen.getByRole('button', { name: 'Chắc chắn hủy đơn' }))

    expect(
      await screen.findByText('Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chắc chắn hủy đơn' })).toBeInTheDocument()
  })

  it('DonHoanThanh_KhongHienKhungHuy', async () => {
    layChiTietMock.mockResolvedValue({ ...chiTietMau, status: BookingStatus.COMPLETED })

    dungTrangTai('/bookings/HS-261005-4821')

    await screen.findByText('HS-261005-4821')
    expect(screen.queryByRole('button', { name: 'Hủy đơn' })).not.toBeInTheDocument()
    expect(screen.queryByText('Hủy đơn này')).not.toBeInTheDocument()
  })
})
