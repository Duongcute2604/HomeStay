import { describe, expect, it } from 'vitest'

import {
  BookingType,
  gia3GioDau,
  kiemKhoangThoiGian,
  tinhSoDonVi,
  uocTinhTien,
} from './pricing'

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
  it('TheoGio_Dung3Gio_ThuTronGoiGiaCoSo', () => {
    // 3 giờ đầu trọn gói — trước ngày 16/10 test này kỳ vọng 270.000 (3 × 90.000).
    expect(
      uocTinhTien(
        BookingType.HOUR,
        90000,
        550000,
        new Date('2026-10-05T14:00:00'),
        new Date('2026-10-05T17:00:00'),
      ),
    ).toBe(90000)
  })

  it('TheoGioVuot3Gio_Cong50NganChoMoiGioVuot', () => {
    // 5 giờ = giá cơ sở 200.000 + 2 giờ vượt × 50.000 = 300.000.
    expect(
      uocTinhTien(
        BookingType.HOUR,
        200000,
        550000,
        new Date('2026-10-05T14:00:00'),
        new Date('2026-10-05T19:00:00'),
      ),
    ).toBe(300000)
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

describe('gia3GioDau', () => {
  it('PhongNho_40vuongTroXuong_Gia200Ngan', () => {
    expect(gia3GioDau(40)).toBe(200000)
    expect(gia3GioDau(35)).toBe(200000)
  })

  it('PhongLon_Vuot40_Gia300Ngan', () => {
    expect(gia3GioDau(41)).toBe(300000)
    expect(gia3GioDau(55.5)).toBe(300000)
  })

  it('Bien401_VanLaPhongLon_KhongLamTronVeNho', () => {
    expect(gia3GioDau(40.1)).toBe(300000)
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
