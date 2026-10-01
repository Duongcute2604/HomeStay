import { describe, expect, it } from 'vitest'

import { formatDiem, formatNgay, formatVnd, toLocalIsoString } from './format'

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

describe('formatNgay', () => {
  it('ChuoiIso_HienNgayThangNamVaGioPhut', () => {
    // Múi giờ máy chạy test có thể khác nhau nên chỉ kiểm phần ngày —
    // phần giờ kiểm bằng regex định dạng.
    const ketQua = formatNgay('2026-09-29T07:00:00Z')

    expect(ketQua).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/)
  })

  it('ChuoiKhongPhaiNgay_TraVeNguyenVan_KhongVo', () => {
    expect(formatNgay('khong-phai-ngay')).toBe('khong-phai-ngay')
  })
})

/**
 * Test cho hàm gửi mốc giờ lên API.
 *
 * Đây là hàm đã sửa một lỗi nguy hiểm: `toISOString()` trả giờ UTC kèm `Z`, hệ
 * thống đọc như giờ địa phương ⇒ lệch 7 giờ ở múi giờ Việt Nam. Hậu quả là khách
 * đặt trùng khung giờ đã có người đặt vẫn được chấp nhận, trong khi màn hình hiển
 * thị đúng giờ nên không ai nhận ra.
 */
describe('toLocalIsoString', () => {
  it('GioDiaPhuong_GiuNguyenGioDaChon', () => {
    const d = new Date(2026, 9, 29, 14, 30)
    expect(toLocalIsoString(d)).toBe('2026-10-29T14:30:00')
  })

  it('KhongGanKyZ_DeServerDocDungNguyenGioDiaPhuong', () => {
    const d = new Date(2026, 9, 29, 14, 30)
    expect(toLocalIsoString(d)).not.toContain('Z')
    // `toISOString()` ra "2026-10-29T07:30:00.000Z" trên máy UTC+7 — đây chính
    // là thứ đã gây lỗi đặt trùng lịch.
    expect(toLocalIsoString(d)).not.toBe(d.toISOString())
  })

  it('ThieuSoMotChuSo_ChoDungDinhDangISO', () => {
    expect(toLocalIsoString(new Date(2026, 0, 5, 9, 5))).toBe('2026-01-05T09:05:00')
  })

  it('NuaDemMotGiVaNamKhongDau', () => {
    expect(toLocalIsoString(new Date(2026, 5, 15, 23, 59))).toBe('2026-06-15T23:59:00')
  })
})
