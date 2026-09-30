import { beforeEach, describe, expect, it, vi } from 'vitest'

import { bookingService } from './bookingService'
import { BookingType } from '../utils/pricing'

/**
 * Test cho tầng gọi API đặt phòng.
 *
 * Mock `apiClient` nhưng giữ `bocDuLieu` thật. Trọng tâm: ánh xạ kiểu chuỗi
 * sang số của API, và ghi chú rỗng thì không gửi.
 */

const { mockPost, mockGet } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
}))

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return {
    ...actual,
    apiClient: { post: mockPost, get: mockGet },
  }
})

const donMau = {
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
}

beforeEach(() => {
  mockPost.mockReset()
  mockGet.mockReset()
})

describe('bookingService.taoDon', () => {
  it('GuiDungThamSo_TypeChuyenThanhSo_NoteRongKhongGui', async () => {
    mockPost.mockResolvedValue({ data: { success: true, message: 'OK', data: donMau } })

    await bookingService.taoDon({
      locationIndex: 0,
      roomIndex: 0,
      type: BookingType.DAY,
      checkIn: '2026-10-05T14:00:00',
      checkOut: '2026-10-07T12:00:00',
      guestCount: 2,
      note: '   ',
    })

    expect(mockPost).toHaveBeenCalledWith('/bookings', {
      locationIndex: 0,
      roomIndex: 0,
      type: 1,
      checkIn: '2026-10-05T14:00:00',
      checkOut: '2026-10-07T12:00:00',
      guestCount: 2,
      // Ghi chú toàn khoảng trắng thì bỏ — gửi chuỗi rỗng backend sẽ lưu rỗng.
      note: undefined,
    })
  })

  it('TheoGio_TypeBang0', async () => {
    mockPost.mockResolvedValue({ data: { success: true, message: 'OK', data: donMau } })

    await bookingService.taoDon({
      locationIndex: 1,
      roomIndex: 0,
      type: BookingType.HOUR,
      checkIn: '2026-10-05T14:00:00',
      checkOut: '2026-10-05T17:00:00',
      guestCount: 2,
    })

    expect(mockPost.mock.calls[0][1].type).toBe(0)
  })

  it('ThanhCong_TraVeMaDon', async () => {
    mockPost.mockResolvedValue({ data: { success: true, message: 'OK', data: donMau } })

    const ketQua = await bookingService.taoDon({
      locationIndex: 0,
      roomIndex: 0,
      type: BookingType.DAY,
      checkIn: '2026-10-05T14:00:00',
      checkOut: '2026-10-07T12:00:00',
      guestCount: 2,
    })

    expect(ketQua.code).toBe('HS-261005-4821')
    expect(ketQua.totalAmount).toBe(1100000)
  })

  it('TrungLich_NemLoi409', async () => {
    mockPost.mockResolvedValue({
      data: { success: false, message: 'Phòng đã có người đặt trong khoảng thời gian này', data: null },
    })

    await expect(
      bookingService.taoDon({
        locationIndex: 0,
        roomIndex: 0,
        type: BookingType.DAY,
        checkIn: '2026-10-05T14:00:00',
        checkOut: '2026-10-07T12:00:00',
        guestCount: 2,
      }),
    ).rejects.toThrow('Phòng đã có người đặt trong khoảng thời gian này')
  })
})

describe('bookingService - don cua toi', () => {
  it('layCuaToi_GoiDungDuongDan_PhanTrang', async () => {
    const trangMau = { items: [], page: 1, pageSize: 20, totalItems: 0, totalPages: 0 }
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: trangMau } })

    const ketQua = await bookingService.layCuaToi(2, 10)

    expect(mockGet).toHaveBeenCalledWith('/bookings/my?page=2&pageSize=10')
    expect(ketQua.page).toBe(1)
  })

  it('layChiTiet_MaHoaUrl_TraVeChiTiet', async () => {
    const chiTietMau = { code: 'HS-261005-4821', history: [] }
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: chiTietMau } })

    const ketQua = await bookingService.layChiTiet('HS-261005-4821')

    expect(mockGet).toHaveBeenCalledWith('/bookings/HS-261005-4821')
    expect(ketQua.code).toBe('HS-261005-4821')
  })

  it('huyDon_CoLyDo_GuiLyDoDaTrim', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, message: 'OK', data: { code: 'HS-261005-4821', status: 4 } },
    })

    await bookingService.huyDon('HS-261005-4821', '  Đổi kế hoạch  ')

    expect(mockPost).toHaveBeenCalledWith('/bookings/HS-261005-4821/cancel', {
      reason: 'Đổi kế hoạch',
    })
  })

  it('huyDon_KhongLyDo_GuiObjectRong', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, message: 'OK', data: { code: 'HS-261005-4821', status: 4 } },
    })

    await bookingService.huyDon('HS-261005-4821')

    // Gửi `{}` chứ không gửi `{ reason: undefined }` — backend cho phép thiếu.
    expect(mockPost).toHaveBeenCalledWith('/bookings/HS-261005-4821/cancel', {})
  })

  it('huyDon_ThatBai_NemLoi', async () => {
    mockPost.mockResolvedValue({
      data: { success: false, message: 'Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận', data: null },
    })

    await expect(bookingService.huyDon('HS-261005-4821')).rejects.toThrow(
      'Chỉ được hủy đơn đang chờ xác nhận hoặc đã xác nhận',
    )
  })
})
