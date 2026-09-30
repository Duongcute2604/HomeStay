import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MyBookings from './MyBookings'
import { bookingService } from '../services/bookingService'
import { BookingStatus } from '../types/booking'
import type { MyBooking } from '../types/booking'

/**
 * Test cho trang "Đơn của tôi".
 *
 * Mock tầng service. Trọng tâm: hủy đơn 2 bước bấm, nút hủy chỉ hiện với đơn
 * còn được hủy, và danh sách hiện `Code` chứ không hiện `Id`.
 */

vi.mock('../services/bookingService', () => ({
  bookingService: { taoDon: vi.fn(), layCuaToi: vi.fn(), layChiTiet: vi.fn(), huyDon: vi.fn() },
}))

const layCuaToiMock = vi.mocked(bookingService.layCuaToi)
const huyDonMock = vi.mocked(bookingService.huyDon)

function donMau(code: string, status: BookingStatus): MyBooking {
  return {
    code,
    roomName: 'Phòng Hạnh Phúc',
    locationName: 'Hưng Yên Ven Biển',
    bookingType: 1,
    checkIn: '2026-10-05T14:00:00',
    checkOut: '2026-10-07T12:00:00',
    guestCount: 2,
    totalAmount: 1100000,
    status,
    createdAt: '2026-09-30T10:00:00',
  }
}

function trangMau(danhSach: MyBooking[]) {
  return { items: danhSach, page: 1, pageSize: 20, totalItems: danhSach.length, totalPages: 1 }
}

function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/bookings']}
      >
        <Routes>
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/bookings/:code" element={<p>Trang chi tiết {':code'}</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layCuaToiMock.mockReset()
  huyDonMock.mockReset()
})

describe('MyBookings - trang thai', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    layCuaToiMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tải danh sách đơn...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoVaNutThuLai', async () => {
    layCuaToiMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('KhongCoDon_HienEmptyState_CoLoiDi', async () => {
    layCuaToiMock.mockResolvedValue(trangMau([]))

    dungTrang()

    expect(await screen.findByText('Bạn chưa có đơn nào')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Tìm phòng ngay' })).toBeInTheDocument()
  })
})

describe('MyBookings - danh sach va huy', () => {
  it('HienMaDon_KhongHienId', async () => {
    layCuaToiMock.mockResolvedValue(trangMau([donMau('HS-261005-4821', BookingStatus.PENDING)]))

    dungTrang()

    expect(await screen.findByText('HS-261005-4821')).toBeInTheDocument()
    expect(screen.getByText('Chờ xác nhận')).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
  })

  it('DonPending_HienNutHuy_DonHoanThanh_KhongHien', async () => {
    layCuaToiMock.mockResolvedValue(
      trangMau([
        donMau('HS-261005-4821', BookingStatus.PENDING),
        donMau('HS-261005-4822', BookingStatus.COMPLETED),
      ]),
    )

    dungTrang()

    await screen.findByText('HS-261005-4821')
    // Chỉ 1 nút hủy cho đơn PENDING — đơn COMPLETED không có.
    expect(screen.getAllByRole('button', { name: 'Hủy đơn' })).toHaveLength(1)
  })

  it('HuyDon_2BuocBam_ThanhCongTaiLaiDanhSach', async () => {
    layCuaToiMock
      .mockResolvedValueOnce(trangMau([donMau('HS-261005-4821', BookingStatus.PENDING)]))
      .mockResolvedValueOnce(trangMau([]))
    huyDonMock.mockResolvedValue({ code: 'HS-261005-4821', status: BookingStatus.CANCELLED } as unknown as import('../types/booking').BookingDetail)

    dungTrang()

    await screen.findByText('HS-261005-4821')
    // Bước 1: bấm "Hủy đơn" → nút chuyển sang chờ xác nhận, CHƯA gọi API.
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
    expect(huyDonMock).not.toHaveBeenCalled()
    // Bước 2: bấm "Chắc chắn hủy" → gọi API rồi tải lại, danh sách trống.
    fireEvent.click(screen.getByRole('button', { name: 'Chắc chắn hủy' }))

    expect(await screen.findByText('Bạn chưa có đơn nào')).toBeInTheDocument()
    expect(huyDonMock).toHaveBeenCalledWith('HS-261005-4821')
  })

  it('HuyDon_ThatBai_HienLoi_KhongMatDanhSach', async () => {
    layCuaToiMock.mockResolvedValue(trangMau([donMau('HS-261005-4821', BookingStatus.PENDING)]))
    huyDonMock.mockRejectedValue(new Error('Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận'))

    dungTrang()

    await screen.findByText('HS-261005-4821')
    fireEvent.click(screen.getByRole('button', { name: 'Hủy đơn' }))
    fireEvent.click(screen.getByRole('button', { name: 'Chắc chắn hủy' }))

    expect(
      await screen.findByText('Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận'),
    ).toBeInTheDocument()
    // Danh sách vẫn còn — lỗi không làm mất dữ liệu đang hiện.
    expect(screen.getByText('HS-261005-4821')).toBeInTheDocument()
  })
})
