import { beforeEach, describe, expect, it, vi } from 'vitest'

import { roomService } from './roomService'
import { RoomType } from '../types/location'
import { LOC_MAC_DINH, SortOption } from '../types/room'
import { BookingType } from '../utils/pricing'

/**
 * Test cho tầng gọi API tìm kiếm phòng.
 *
 * Mock `apiClient` nhưng giữ `bocDuLieu` thật. Trọng tâm là cách dựng query
 * string: tham số null KHÔNG được gửi lên.
 */

const { mockGet } = vi.hoisted(() => ({
  mockGet: vi.fn(),
}))

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return {
    ...actual,
    apiClient: { get: mockGet },
  }
})

const ketQuaMau = {
  items: [],
  page: 1,
  pageSize: 6,
  totalItems: 0,
  totalPages: 0,
}

// Reset ở cấp file (ngoài mọi `describe`): `beforeEach` nằm trong một `describe`
// thì describe khác không được hưởng — đúng lỗi vừa mắc khi thêm nhóm test mới.
beforeEach(() => {
  // Không reset thì `mock.calls[0]` của test sau là cuộc gọi của test trước
  // (đúng lỗi đã gặp ở `ProtectedRoute.test.tsx`).
  mockGet.mockReset()
})

describe('roomService.timKiem', () => {

  it('KhongLoc_ChiGuiSortPagePageSize', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: ketQuaMau } })

    await roomService.timKiem(LOC_MAC_DINH)

    const url: string = mockGet.mock.calls[0][0]
    expect(url).toBe('/rooms/search?sort=newest&page=1&pageSize=6')
  })

  it('CoBoLoc_GuiDuThamSoCoGiaTri', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: ketQuaMau } })

    await roomService.timKiem({
      ...LOC_MAC_DINH,
      keyword: '  Hạnh Phúc  ',
      locationIndex: 0,
      roomType: RoomType.JAPANDI,
      minPrice: 500000,
      maxPrice: 1000000,
      capacity: 2,
      sort: SortOption.PRICE_ASC,
      page: 2,
    })

    const url: string = mockGet.mock.calls[0][0]
    const thamSo = new URLSearchParams(url.split('?')[1])
    // Từ khoá cắt khoảng trắng thừa trước khi gửi.
    expect(thamSo.get('keyword')).toBe('Hạnh Phúc')
    expect(thamSo.get('locationIndex')).toBe('0')
    expect(thamSo.get('roomType')).toBe('1')
    expect(thamSo.get('minPrice')).toBe('500000')
    expect(thamSo.get('maxPrice')).toBe('1000000')
    expect(thamSo.get('capacity')).toBe('2')
    expect(thamSo.get('sort')).toBe('priceAsc')
    expect(thamSo.get('page')).toBe('2')
  })

  it('KeywordToanKhoangTrang_CoiNhuKhongLoc', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: ketQuaMau } })

    await roomService.timKiem({ ...LOC_MAC_DINH, keyword: '   ' })

    const url: string = mockGet.mock.calls[0][0]
    expect(url).not.toContain('keyword')
  })

  it('ThanhCong_TraVeDungPhanTrang', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: ketQuaMau } })

    const ketQua = await roomService.timKiem(LOC_MAC_DINH)

    expect(ketQua.totalItems).toBe(0)
    expect(ketQua.totalPages).toBe(0)
  })

  it('ThatBai_NemLoiDungThongBao', async () => {
    mockGet.mockResolvedValue({
      data: { success: false, message: 'Giá thấp nhất không được lớn hơn giá cao nhất', data: null },
    })

    await expect(roomService.timKiem(LOC_MAC_DINH)).rejects.toThrow(
      'Giá thấp nhất không được lớn hơn giá cao nhất',
    )
  })
})

describe('roomService.kiemTraTrong', () => {
  const nhan = new Date('2026-10-05T14:00:00')
  const tra = new Date('2026-10-07T12:00:00')

  it('GuiDungThamSo_TypeChuyenThanhSo', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: { isAvailable: true, reason: null } } })

    await roomService.kiemTraTrong(0, 2, BookingType.DAY, nhan, tra)

    const url: string = mockGet.mock.calls[0][0]
    const thamSo = new URLSearchParams(url.split('?')[1])
    expect(thamSo.get('locationIndex')).toBe('0')
    expect(thamSo.get('roomIndex')).toBe('2')
    expect(thamSo.get('type')).toBe('1')
    expect(thamSo.get('checkIn')).toBe(nhan.toISOString())
    expect(thamSo.get('checkOut')).toBe(tra.toISOString())
  })

  it('TheoGio_TypeBang0', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: { isAvailable: true, reason: null } } })

    await roomService.kiemTraTrong(1, 0, BookingType.HOUR, nhan, tra)

    const url: string = mockGet.mock.calls[0][0]
    expect(new URLSearchParams(url.split('?')[1]).get('type')).toBe('0')
  })

  it('PhongBan_TraVeLyDo', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, message: 'OK', data: { isAvailable: false, reason: 'Phòng đã có người đặt trong khoảng thời gian này' } },
    })

    const ketQua = await roomService.kiemTraTrong(0, 0, BookingType.DAY, nhan, tra)

    expect(ketQua.isAvailable).toBe(false)
    expect(ketQua.reason).toBe('Phòng đã có người đặt trong khoảng thời gian này')
  })

  it('ThamSoSai_NemLoi', async () => {
    mockGet.mockResolvedValue({
      data: { success: false, message: 'Phải đặt trước ít nhất 2 giờ', data: null },
    })

    await expect(roomService.kiemTraTrong(0, 0, BookingType.DAY, nhan, tra)).rejects.toThrow(
      'Phải đặt trước ít nhất 2 giờ',
    )
  })
})
