import { beforeEach, describe, expect, it, vi } from 'vitest'

import { authService } from './authService'

/**
 * Test cho tầng gọi API của phần tài khoản.
 *
 * Trọng tâm là **ranh giới giữa endpoint có dữ liệu và endpoint không có dữ liệu** —
 * đúng chỗ đã sinh ra lỗi thật ở Bước 5: bấm "Đổi mật khẩu" / "Đăng xuất" báo
 * "Đã xảy ra lỗi" dù server đã cập nhật `PasswordHash` thành công. Nguyên nhân là
 * `logout` và `change-password` trả `ApiResponse<object>.Success(...)` nên `data`
 * là `null` **cả khi thành công**, còn hàm bóc dữ liệu coi `data === null` là lỗi.
 *
 * Các test dưới đây được viết để **đỏ nếu ai đó gộp hai hàm trở lại**. Chúng không
 * kiểm tra axios hay network — chỉ kiểm tra cách diễn giải response, vì đó mới là
 * chỗ dễ sai.
 */

/*
 * `vi.mock` được Vitest nâng lên ĐẦU file, nên không được tham chiếu biến khai
 * báo ở cấp module — sẽ báo "Cannot access ... before initialization".
 * `vi.hoisted` tạo các biến này sẵn ở phần được nâng lên, giải quyết đúng chỗ.
 */
const { mockPost, mockGet, mockPut } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}))

// Thay `apiClient` để không có gọi mạng nào thật sự xảy ra, nhưng giữ NGUYÊN
// `bocDuLieu` và `kiemTraThanhCong` thật: mock hai hàm đó thì test chỉ kiểm bản
// giả, đúng loại che lỗi đã gặp ở backend (`lessons.md` mục 20).
vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return {
    ...actual,
    apiClient: {
      post: mockPost,
      get: mockGet,
      put: mockPut,
    },
  }
})

/** Kết quả đăng nhập hợp lệ, dùng làm mẫu cho các ca thành công. */
const ketQuaDangNhap = {
  accessToken: 'access-token-moi',
  refreshToken: 'refresh-token-moi',
  expiresInMinutes: 60,
  user: {
    id: 2,
    fullName: 'Trần Thị Mai',
    email: 'khach1@gmail.com',
    phoneNumber: null,
    address: null,
    role: 0,
    status: 0,
    createdAt: '2026-09-29T00:00:00Z',
  },
}

beforeEach(() => {
  mockPost.mockReset()
  mockGet.mockReset()
  mockPut.mockReset()
})

describe('authService - endpoint co du lieu', () => {
  it('dangNhap_ThanhCong_TraVeDungDuLieuTrongApiResponse', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, message: 'Đăng nhập thành công.', data: ketQuaDangNhap },
    })

    const ketQua = await authService.dangNhap({
      email: 'khach1@gmail.com',
      password: '123456',
    })

    expect(ketQua).toEqual(ketQuaDangNhap)
    expect(mockPost).toHaveBeenCalledWith('/auth/login', {
      email: 'khach1@gmail.com',
      password: '123456',
    })
  })

  it('dangKy_ThanhCong_TraVeDuLieu', async () => {
    mockPost.mockResolvedValue({
      data: { success: true, message: 'Đăng ký thành công.', data: ketQuaDangNhap },
    })

    const ketQua = await authService.dangKy({
      fullName: 'Trần Thị Mai',
      email: 'khach1@gmail.com',
      password: '123456',
      confirmPassword: '123456',
    })

    expect(ketQua.accessToken).toBe('access-token-moi')
  })

  it('layHoSo_ThanhCong_TraVeDungThongTin', async () => {
    mockGet.mockResolvedValue({
      data: { success: true, message: 'OK', data: ketQuaDangNhap.user },
    })

    const ketQua = await authService.layHoSo()

    expect(ketQua.email).toBe('khach1@gmail.com')
    expect(mockGet).toHaveBeenCalledWith('/auth/me')
  })

  it('capNhatHoSo_ThanhCong_TraVeDungThongTinMoi', async () => {
    const userMoi = { ...ketQuaDangNhap.user, fullName: 'Trần Thị Mai Lan' }
    mockPut.mockResolvedValue({ data: { success: true, message: 'OK', data: userMoi } })

    const ketQua = await authService.capNhatHoSo({ fullName: 'Trần Thị Mai Lan' })

    expect(ketQua.fullName).toBe('Trần Thị Mai Lan')
  })
})

describe('authService - endpoint co du lieu nhung that bai', () => {
  it('dangNhap_EmailTrung_ThrowDungThongBaoServer', async () => {
    const thongBao = 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác'
    mockPost.mockResolvedValue({ data: { success: false, message: thongBao, data: null } })

    await expect(
      authService.dangNhap({ email: 'khach1@gmail.com', password: '123456' }),
    ).rejects.toThrow(thongBao)
  })

  it('dangNhap_DataRong_DuSuccess_ThrowBaoKhongRocDuLieu', async () => {
    // Server báo thành công nhưng không gửi kèm dữ liệu — client không được
    // trả về `null` cho trang dùng, vì trang sẽ lỗi kiểu khó hiểu hơn nhiều.
    mockPost.mockResolvedValue({ data: { success: true, message: 'OK', data: null } })

    await expect(
      authService.dangNhap({ email: 'khach1@gmail.com', password: '123456' }),
    ).rejects.toThrow('Máy chủ trả về dữ liệu rỗng')
  })
})

describe('authService - endpoint KHONG co du lieu', () => {
  it('dangXuat_ThanhCong_DataNull_KhongNemLoi', async () => {
    // ĐÂY LÀ CA BẮT LỖI THẬT CỦA BƯỚC 5.
    // `POST /auth/logout` trả `ApiResponse<object>.Success(...)` — không gán
    // `data`, nên `data` là `null` **cả khi thành công**. Nếu hàm này dùng chung
    // với hàm bóc dữ liệu thì `data === null` bị coi là lỗi và người dùng
    // thấy "Đã xảy ra lỗi" dù server đã làm đúng.
    mockPost.mockResolvedValue({ data: { success: true, message: 'Đã đăng xuất.', data: null } })

    await expect(authService.dangXuat()).resolves.toBeUndefined()
  })

  it('doiMatKhau_ThanhCong_DataNull_KhongNemLoi', async () => {
    // Cùng lý do với ca trên: `PUT /auth/change-password` cũng trả `data: null`.
    mockPut.mockResolvedValue({
      data: { success: true, message: 'Đổi mật khẩu thành công.', data: null },
    })

    await expect(
      authService.doiMatKhau({
        currentPassword: '123456',
        newPassword: 'abc123',
        confirmNewPassword: 'abc123',
      }),
    ).resolves.toBeUndefined()
  })

  it('dangXuat_ThatBai_VanNemLoi_DeBietRangNguoiDungKhongThoat', async () => {
    // Ngược lại: khi server báo lỗi thì phải ném. Nếu nuốt luôn thì người dùng
    // tưởng đã đăng xuất xong trong khi refresh token vẫn còn hiệu lực.
    mockPost.mockResolvedValue({
      data: { success: false, message: 'Token không hợp lệ.', data: null },
    })

    await expect(authService.dangXuat()).rejects.toThrow('Token không hợp lệ.')
  })

  it('doiMatKhau_MatKhauCuSai_ThrowDungThongBao', async () => {
    mockPut.mockResolvedValue({
      data: { success: false, message: 'Mật khẩu hiện tại không đúng', data: null },
    })

    await expect(
      authService.doiMatKhau({
        currentPassword: 'sai-mat-khau',
        newPassword: 'abc123',
        confirmNewPassword: 'abc123',
      }),
    ).rejects.toThrow('Mật khẩu hiện tại không đúng')
  })
})
