import { describe, expect, it } from 'vitest'

import { schemaTimKiem } from './roomSchemas'
import { RoomType } from '../types/location'
import { SortOption } from '../types/room'

/**
 * Test cho quy tắc kiểm form lọc phòng.
 *
 * Form lọc khác form đăng ký ở một điểm: ô số ĐỂ TRỐNG là hợp lệ (nghĩa là
 * "không giới hạn"). Test phải chứng minh rỗng → null chứ không báo lỗi.
 */
describe('schemaTimKiem', () => {
  it('DeTrongTatCa_HopLe_VoiGiaTriMacDinh', () => {
    const ketQua = schemaTimKiem.safeParse({})

    expect(ketQua.success).toBe(true)
    if (ketQua.success) {
      expect(ketQua.data.keyword).toBe('')
      expect(ketQua.data.sort).toBe(SortOption.NEWEST)
      expect(ketQua.data.minPrice).toBeNull()
    }
  })

  it('OTrong_ChuyenThanhNull_KhongBaoLoi', () => {
    const ketQua = schemaTimKiem.safeParse({ minPrice: '', maxPrice: '', capacity: '' })

    expect(ketQua.success).toBe(true)
    if (ketQua.success) {
      expect(ketQua.data.minPrice).toBeNull()
      expect(ketQua.data.maxPrice).toBeNull()
      expect(ketQua.data.capacity).toBeNull()
    }
  })

  it('ChuoiSo_EpThanhSo', () => {
    const ketQua = schemaTimKiem.safeParse({ minPrice: '500000', capacity: '4' })

    expect(ketQua.success).toBe(true)
    if (ketQua.success) {
      expect(ketQua.data.minPrice).toBe(500000)
      expect(ketQua.data.capacity).toBe(4)
    }
  })

  it('MinPriceLonHonMaxPrice_BaoLoi_GanDungOMaxPrice', () => {
    const ketQua = schemaTimKiem.safeParse({ minPrice: 1000000, maxPrice: 500000 })

    expect(ketQua.success).toBe(false)
    if (!ketQua.success) {
      expect(ketQua.error.issues[0].path).toEqual(['maxPrice'])
      expect(ketQua.error.issues[0].message).toBe(
        'Giá cao nhất phải lớn hơn hoặc bằng giá thấp nhất',
      )
    }
  })

  it('MinPriceBangMaxPrice_HopLe', () => {
    const ketQua = schemaTimKiem.safeParse({ minPrice: 500000, maxPrice: 500000 })

    expect(ketQua.success).toBe(true)
  })

  it('RoomTypeNgoaiKhoang_BaoLoi', () => {
    const ketQua = schemaTimKiem.safeParse({ roomType: 99 })

    expect(ketQua.success).toBe(false)
  })

  it('RoomTypeHopLe_ChapNhan', () => {
    const ketQua = schemaTimKiem.safeParse({ roomType: RoomType.JAPANDI })

    expect(ketQua.success).toBe(true)
  })

  it('SortKhongHopLe_BaoLoi', () => {
    const ketQua = schemaTimKiem.safeParse({ sort: 'cach sap xep khong co' })

    expect(ketQua.success).toBe(false)
  })

  it('Keyword101KyTu_BaoLoi', () => {
    const ketQua = schemaTimKiem.safeParse({ keyword: 'a'.repeat(101) })

    expect(ketQua.success).toBe(false)
    if (!ketQua.success) {
      expect(ketQua.error.issues[0].message).toBe('Từ khoá không được vượt quá 100 ký tự')
    }
  })

  it('Capacity0_BaoLoi_PhaiTu1TroLen', () => {
    const ketQua = schemaTimKiem.safeParse({ capacity: 0 })

    expect(ketQua.success).toBe(false)
  })
})
