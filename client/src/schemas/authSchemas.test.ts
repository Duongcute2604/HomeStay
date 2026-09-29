import { describe, expect, it } from 'vitest'

import {
  GIOI_HAN,
  schemaDangKy,
  schemaDangNhap,
  schemaDoiMatKhau,
  schemaHoSo,
} from './authSchemas'

/**
 * Test cho các quy tắc kiểm dữ liệu ở giao diện.
 *
 * Đây là nhóm test rẻ nhất và bắt được nhiều nhất: không cần dựng component,
 * không cần network, chạy trong vài chục mili giây — nhưng lại là nơi chứa
 * toàn bộ quy tắc nghiệp vụ mà người dùng nhìn thấy trước khi server kịp trả lỗi.
 *
 * Quy ước đặt tên (AGENTS.md 5.3): `TenHam_TinhHuong_KetQuaMongDoi`.
 */

/** Dữ liệu đăng ký hợp lệ, dùng làm gốc rồi sửa từng trường cho từng ca. */
const dangKyHopLe = {
  fullName: 'Trần Thị Mai',
  email: 'khach1@gmail.com',
  password: '123456',
  confirmPassword: '123456',
  phoneNumber: '0901234567',
  address: 'Số 1, Phường Bến Nghé, Quận 1, TP.HCM',
}

describe('schemaDangNhap', () => {
  it('DuLieuHopLe_KhongBaoLoi', () => {
    const ketQua = schemaDangNhap.safeParse({ email: 'khach1@gmail.com', password: '123456' })

    expect(ketQua.success).toBe(true)
  })

  it('EmailRong_BaoLoi_VuiLongNhapEmail', () => {
    const ketQua = schemaDangNhap.safeParse({ email: '', password: '123456' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập email')
  })

  it('MatKhauRong_BaoLoi_VuiLongNhapMatKhau', () => {
    const ketQua = schemaDangNhap.safeParse({ email: 'khach1@gmail.com', password: '' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập mật khẩu')
  })

  it('EmailSaiDinhDang_KhongBaoLoi_DeServerTraLoi409', () => {
    // Cố ý: giao diện KHÔNG kiểm định dạng email, vì backend trả 409 cho cả
    // email sai định dạng lẫn email trùng. Nếu test này đổi từ xanh sang đỏ
    // thì nghĩa là ai đó đã thêm regex ở giao diện — hai tầng sẽ báo hai kiểu.
    const ketQua = schemaDangNhap.safeParse({ email: 'khong-phai-email', password: '123456' })

    expect(ketQua.success).toBe(true)
  })
})

describe('schemaDangKy', () => {
  it('DuLieuHopLe_KhongBaoLoi', () => {
    expect(schemaDangKy.safeParse(dangKyHopLe).success).toBe(true)
  })

  it('SoDienThoaiVaDiaChiDeTrong_VanHopLe_ViHaiTruongNayKhongBatBuoc', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, phoneNumber: '', address: '' })

    expect(ketQua.success).toBe(true)
  })

  it('MatKhau5KyTu_BaoLoi_PhaiCoItNhat6KyTu', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, password: '12345', confirmPassword: '12345' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe(
      `Mật khẩu phải có ít nhất ${GIOI_HAN.matKhauNhoNhat} ký tự`,
    )
  })

  it('MatKhau6KyTu_ChapNhan', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, password: '123456', confirmPassword: '123456' })

    expect(ketQua.success).toBe(true)
  })

  it('XacNhanKhongKhop_BaoLoi_GanDungOConfirmPassword', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, confirmPassword: '654321' })

    expect(ketQua.success).toBe(false)
    // Phải gắn vào ô xác nhận để hiện ngay dưới ô vừa gõ sai, không phải ở
    // đầu form. Đây là hành vi người dùng nhìn thấy, không chỉ là kiểu dữ liệu.
    expect(ketQua.error?.issues[0].path).toEqual(['confirmPassword'])
    expect(ketQua.error?.issues[0].message).toBe('Mật khẩu xác nhận không khớp')
  })

  it('HoTenRong_BaoLoi_VuiLongNhapHoVaTen', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, fullName: '' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập họ và tên')
  })

  it('HoTen101KyTu_BaoLoi_VuotQua100KyTu', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, fullName: 'a'.repeat(101) })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Họ và tên không được vượt quá 100 ký tự')
  })

  it('HoTen100KyTu_ChapNhan_ChuaaVuotGiớiHan', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, fullName: 'a'.repeat(100) })

    expect(ketQua.success).toBe(true)
  })

  it('Email151KyTu_BaoLoi_VuotQua150KyTu', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, email: `${'a'.repeat(147)}@gmail.com` })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Email không được vượt quá 150 ký tự')
  })

  it('SoDienThoai16KyTu_BaoLoi_VuotQua15KyTu', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, phoneNumber: '0123456789012345' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Số điện thoại không được vượt quá 15 ký tự')
  })

  it('DiaChi256KyTu_BaoLoi_VuotQua255KyTu', () => {
    const ketQua = schemaDangKy.safeParse({ ...dangKyHopLe, address: 'a'.repeat(256) })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Địa chỉ không được vượt quá 255 ký tự')
  })

  it('ThieuTruongEmail_BaoLoi', () => {
    const { email, ...thieuEmail } = dangKyHopLe

    expect(email).toBeDefined()
    expect(schemaDangKy.safeParse(thieuEmail).success).toBe(false)
  })
})

describe('schemaHoSo', () => {
  it('DuLieuHopLe_KhongBaoLoi', () => {
    const ketQua = schemaHoSo.safeParse({
      fullName: 'Trần Thị Mai',
      phoneNumber: '0901234567',
      address: 'Số 1, Phường Bến Nghé, Quận 1, TP.HCM',
    })

    expect(ketQua.success).toBe(true)
  })

  it('HoTenRong_BaoLoi', () => {
    const ketQua = schemaHoSo.safeParse({ fullName: '', phoneNumber: '', address: '' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập họ và tên')
  })

  it('KhongCoTruongEmail_ChapNhan_ViFormHocSoKhongSuaEmail', () => {
    // Trang hồ sơ cố ý KHÔNG có ô email: server bỏ qua thay đổi email và quyền.
    // Nếu sau này thêm nhầm ô email vào schema thì test này đỏ.
    const ketQua = schemaHoSo.safeParse({ fullName: 'Trần Thị Mai', phoneNumber: '', address: '' })

    expect(ketQua.success).toBe(true)
  })
})

describe('schemaDoiMatKhau', () => {
  const doiHopLe = {
    currentPassword: '123456',
    newPassword: 'abc123',
    confirmNewPassword: 'abc123',
  }

  it('DuLieuHopLe_KhongBaoLoi', () => {
    expect(schemaDoiMatKhau.safeParse(doiHopLe).success).toBe(true)
  })

  it('MatKhauHienTaiRong_BaoLoi', () => {
    const ketQua = schemaDoiMatKhau.safeParse({ ...doiHopLe, currentPassword: '' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập mật khẩu hiện tại')
  })

  it('MatKhauMoi5KyTu_BaoLoi_PhaiCoItNhat6KyTu', () => {
    const ketQua = schemaDoiMatKhau.safeParse({ ...doiHopLe, newPassword: 'abc12', confirmNewPassword: 'abc12' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Mật khẩu mới phải có ít nhất 6 ký tự')
  })

  it('XacNhanMoiKhongKhop_BaoLoi_GanDungOConfirmNewPassword', () => {
    const ketQua = schemaDoiMatKhau.safeParse({ ...doiHopLe, confirmNewPassword: 'xyz789' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].path).toEqual(['confirmNewPassword'])
    expect(ketQua.error?.issues[0].message).toBe('Mật khẩu xác nhận không khớp')
  })

  it('MatKhauMoi101KyTu_BaoLoi_VuotQua100KyTu', () => {
    const ketQua = schemaDoiMatKhau.safeParse({
      ...doiHopLe,
      newPassword: 'a'.repeat(101),
      confirmNewPassword: 'a'.repeat(101),
    })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Mật khẩu không được vượt quá 100 ký tự')
  })

  it('XacNhanMoiRong_BaoLoi_VuiLongNhapLaiMatKhauMoi', () => {
    const ketQua = schemaDoiMatKhau.safeParse({ ...doiHopLe, confirmNewPassword: '' })

    expect(ketQua.success).toBe(false)
    expect(ketQua.error?.issues[0].message).toBe('Vui lòng nhập lại mật khẩu mới')
  })
})
