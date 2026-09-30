import { describe, expect, it } from 'vitest'

import { schemaDatPhong } from './bookingSchemas'

/**
 * Test cho quy tắc kiểm form đặt phòng.
 *
 * Cố ý KHÔNG có kiểm sức chứa tối đa ở đây: sức chứa phụ thuộc từng phòng mà
 * schema dựng một lần lúc mount (phòng chưa tải xong) thì `max` bị đóng băng
 * sai — kiểm lúc submit trong `Booking.tsx` mới đúng. Test cho nhánh đó nằm ở
 * `Booking.test.tsx` (ca vượt sức chứa).
 */
describe('schemaDatPhong', () => {
  it('DuLieuHopLe_KhongBaoLoi', () => {
    expect(schemaDatPhong.safeParse({ guestCount: 2, note: '' }).success).toBe(true)
  })

  it('SoKhach0_BaoLoi', () => {
    const ketQua = schemaDatPhong.safeParse({ guestCount: 0 })

    expect(ketQua.success).toBe(false)
    if (!ketQua.success) {
      expect(ketQua.error.issues[0].message).toBe('Số khách phải từ 1 trở lên')
    }
  })

  it('SoKhachLe_BaoLoi_PhaiLaSoNguyen', () => {
    const ketQua = schemaDatPhong.safeParse({ guestCount: 2.5 })

    expect(ketQua.success).toBe(false)
  })

  it('GhiChu501KyTu_BaoLoi', () => {
    const ketQua = schemaDatPhong.safeParse({ guestCount: 1, note: 'a'.repeat(501) })

    expect(ketQua.success).toBe(false)
    if (!ketQua.success) {
      expect(ketQua.error.issues[0].message).toBe('Ghi chú không được vượt quá 500 ký tự')
    }
  })

  it('KhongGhiChu_HopLe', () => {
    expect(schemaDatPhong.safeParse({ guestCount: 1 }).success).toBe(true)
  })
})
