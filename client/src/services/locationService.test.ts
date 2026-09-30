import { describe, expect, it, vi } from 'vitest'

import { locationService } from './locationService'
import type { Location } from '../types/location'
import { RoomStatus, RoomType } from '../types/location'

/**
 * Test cho tầng gọi API phần địa điểm.
 *
 * Mock `apiClient` (không gọi mạng thật) nhưng giữ `bocDuLieu` thật — cùng lý do
 * như `authService.test.ts`: mock hàm bóc thì test chỉ kiểm bản giả.
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

const diaDiemMau: Location = {
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
    },
  ],
}

describe('locationService.layDanhSach', () => {
  it('ThanhCong_TraVeDungDanhSach_GoiDungDuongDan', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, message: 'OK', data: [diaDiemMau] },
    })

    const ketQua = await locationService.layDanhSach()

    expect(mockGet).toHaveBeenCalledWith('/locations')
    expect(ketQua).toHaveLength(1)
    expect(ketQua[0].name).toBe('Hưng Yên Ven Biển')
    expect(ketQua[0].rooms).toHaveLength(1)
  })

  it('DanhSachRong_TraVeMangRong', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: [] } })

    const ketQua = await locationService.layDanhSach()

    expect(ketQua).toEqual([])
  })

  it('DataNull_NemLoi_KhongTraNullChoTrang', async () => {
    mockGet.mockResolvedValue({ data: { success: true, message: 'OK', data: null } })

    await expect(locationService.layDanhSach()).rejects.toThrow('Máy chủ trả về dữ liệu rỗng')
  })

  it('ThatBai_NemLoiDungThongBao', async () => {
    mockGet.mockResolvedValue({ data: { success: false, message: 'Lỗi máy chủ', data: null } })

    await expect(locationService.layDanhSach()).rejects.toThrow('Lỗi máy chủ')
  })
})
