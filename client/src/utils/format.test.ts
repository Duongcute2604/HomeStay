import { describe, expect, it } from 'vitest'

import { formatDiem, formatVnd } from './format'

/**
 * Test cho các hàm định dạng hiển thị.
 *
 * Nhỏ nhưng đáng test: giá tiền hiện SAI (ví dụ `500000 ₫` thiếu dấu chấm) thì
 * người dùng đọc nhầm 500 nghìn thành 500 — lỗi hiển thị giá là lỗi nghiêm trọng
 * với trang đặt phòng. Test chạy trong mili giây, không cần DOM.
 */
describe('formatVnd', () => {
  it('SoTron_ThemDauChamPhanCachNghin_VaKyHieuD', () => {
    expect(formatVnd(500000)).toBe('500.000 ₫')
  })

  it('SoHangTrieu_DuBaNhom', () => {
    expect(formatVnd(1500000)).toBe('1.500.000 ₫')
  })

  it('SoDuoiMotNghin_KhongThemDauCham', () => {
    expect(formatVnd(900)).toBe('900 ₫')
  })

  it('So0_TraVe0D', () => {
    expect(formatVnd(0)).toBe('0 ₫')
  })

  it('GiaThatTrongDuLieuMau_DinhDangDung', () => {
    // Giá thật trong seed: 120.000đ/giờ, 900.000đ/ngày.
    expect(formatVnd(120000)).toBe('120.000 ₫')
    expect(formatVnd(900000)).toBe('900.000 ₫')
  })
})

describe('formatDiem', () => {
  it('DiemLe_MotChuSoThapPhan_DauPhay', () => {
    expect(formatDiem(4.5)).toBe('4,5')
  })

  it('DiemChan_VanHienMotChuSo', () => {
    // `4` và `4,0` giá trị bằng nhau nhưng nhìn khác nhau — luôn hiện 1 chữ số
    // để các phòng so sánh được trên cùng một cột.
    expect(formatDiem(4)).toBe('4,0')
  })

  it('Diem0_HienKhongPhayKhong', () => {
    expect(formatDiem(0)).toBe('0,0')
  })
})
