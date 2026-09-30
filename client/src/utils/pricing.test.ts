import { describe, expect, it } from 'vitest'

import { BookingType, kiemKhoangThoiGian, tinhSoDonVi, uocTinhTien } from './pricing'

/**
 * Test cho công thức ước tính tiền ở giao diện.
 *
 * BẮT BUỘC khớp `BookingCalculator` bên backend: hai nơi tính khác nhau thì
 * người dùng thấy một giá, lúc đặt lại thành giá khác — mất niềm tin ngay.
 * Nếu backend đổi công thức thì test này phải đổi theo (ghi rõ trong comment).
 */
describe('tinhSoDonVi', () => {
  it('TheoGio_TronGio_DungSoGio', () => {
    expect(
      tinhSoDonVi(BookingType.HOUR, new Date('2026-10-05T14:00:00'), new Date('2026-10-05T17:00:00')),
    ).toBe(3)
  })

  it('TheoGio_LePhut_LamTronLen', () => {
    // 2 giờ 10 phút → 3 giờ.
    expect(
      tinhSoDonVi(BookingType.HOUR, new Date('2026-10-05T14:00:00'), new Date('2026-10-05T16:10:00')),
    ).toBe(3)
  })

  it('TheoNgay_19Gio_VanTinh1Ngay', () => {
    // Nhận 14:00 hôm nay, trả 09:00 mai — ở dở ngày vẫn trả trọn ngày.
    expect(
      tinhSoDonVi(BookingType.DAY, new Date('2026-10-05T14:00:00'), new Date('2026-10-06T09:00:00')),
    ).toBe(1)
  })

  it('TheoNgay_25Gio_Tinh2Ngay', () => {
    expect(
      tinhSoDonVi(BookingType.DAY, new Date('2026-10-05T14:00:00'), new Date('2026-10-06T15:00:00')),
    ).toBe(2)
  })
})

describe('uocTinhTien', () => {
  it('TheoGio_NhanDungDonGiaGio', () => {
    expect(
      uocTinhTien(
        BookingType.HOUR,
        90000,
        550000,
        new Date('2026-10-05T14:00:00'),
        new Date('2026-10-05T17:00:00'),
      ),
    ).toBe(270000)
  })

  it('TheoNgay_NhanDungDonGiaNgay', () => {
    expect(
      uocTinhTien(
        BookingType.DAY,
        90000,
        550000,
        new Date('2026-10-05T14:00:00'),
        new Date('2026-10-07T12:00:00'),
      ),
    ).toBe(1100000)
  })
})

describe('kiemKhoangThoiGian', () => {
  it('ChuaChonDu_TraLoiBaoChon', () => {
    expect(kiemKhoangThoiGian(null, new Date())).toBe('Vui lòng chọn giờ nhận và giờ trả phòng')
    expect(kiemKhoangThoiGian(new Date(), null)).toBe('Vui lòng chọn giờ nhận và giờ trả phòng')
  })

  it('TraTruocHoacBangNhan_TraLoiBaoThuTu', () => {
    const nhan = new Date('2026-10-05T14:00:00')
    expect(kiemKhoangThoiGian(nhan, new Date('2026-10-05T12:00:00'))).toBe(
      'Giờ trả phòng phải sau giờ nhận phòng',
    )
    expect(kiemKhoangThoiGian(nhan, nhan)).toBe('Giờ trả phòng phải sau giờ nhận phòng')
  })

  it('HopLe_TraVeNull', () => {
    expect(
      kiemKhoangThoiGian(new Date('2026-10-05T14:00:00'), new Date('2026-10-05T16:00:00')),
    ).toBeNull()
  })
})
