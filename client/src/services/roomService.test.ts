import { beforeEach, describe, expect, it, vi } from 'vitest'

import { roomService } from './roomService'
import { RoomType } from '../types/location'
import { LOC_MAC_DINH, SortOption } from '../types/room'

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

describe('roomService.timKiem', () => {
  beforeEach(() => {
    // Không reset thì `mock.calls[0]` của test sau là cuộc gọi của test trước
    // (đúng lỗi đã gặp ở `ProtectedRoute.test.tsx`).
    mockGet.mockReset()
  })

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
      roomType: RoomType.DELUXE,
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
