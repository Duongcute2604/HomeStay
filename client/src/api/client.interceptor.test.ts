import axios from 'axios'
// Các kiểu dùng ở dưới phải import riêng: `axios` là default export (một giá trị)
// nên không dùng được làm namespace cho kiểu.
import type { AxiosAdapter, AxiosError, AxiosResponse } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'
import { UserRole, UserStatus } from '../types/auth'
import type { UserProfile } from '../types/auth'

/**
 * Test cho hai interceptor của `apiClient` — tầng xử lý 401.
 *
 * Vì sao phần này đáng test nhất trong toàn bộ giao diện:
 *
 * 1. Ca kiểm thử tay **H2** (token hết hạn giữa chừng thì tự làm mới) đã phải
 *    hoãn vì công cụ kiểm thử trình duyệt không cho ép access token hết hạn.
 *    Ở đây thì làm được, và làm nhanh hơn nhiều lần.
 * 2. Đây là chỗ **duy nhất** trong giao diện có logic nhánh phức tạp và trạng
 *    thái dùng chung: nhiều request hỏng cùng lúc phải gom về MỘT lần gọi refresh.
 * 3. Sửa sai ở đây không hỏng build, không hỏng lint — chỉ hỏng lúc chạy thật.
 *
 * Cách chặn mạng: gán `apiClient.defaults.adapter` bằng adapter giả. Nhờ vậy test
 * chạy qua **đúng** interceptor thật, thay vì gọi tay hàm xử lý lỗi — cách gọi
 * tay sẽ bỏ sót chính lỗi "không gắn cờ đã thử lại" mà test muốn kiểm.
 */

const userKhach: UserProfile = {
  id: 2,
  fullName: 'Trần Thị Mai',
  email: 'khach1@gmail.com',
  phoneNumber: null,
  address: null,
  role: UserRole.CUSTOMER,
  status: UserStatus.ACTIVE,
  createdAt: '2026-09-29T00:00:00Z',
}

/** Kết quả làm mới token hợp lệ. */
const phienMoi = {
  accessToken: 'access-token-moi',
  refreshToken: 'refresh-token-moi',
  expiresInMinutes: 60,
  user: userKhach,
}

/** Adapter gốc, phải trả lại sau mỗi test để không rò sang test khác. */
const adapterGoc = apiClient.defaults.adapter

/** Kiểu `config` mà axios truyền vào cho adapter. */
type ConfigCuaAdapter = Parameters<AxiosAdapter>[0]

/** Dựng một response thành công giả, đủ các trường axios bắt buộc. */
function responseThanhCong(config: ConfigCuaAdapter, duLieu: unknown): AxiosResponse {
  return { status: 200, data: duLieu, statusText: 'OK', headers: {}, config }
}

/** Dựng một lỗi giống hệt thứ axios ném ra khi server trả về mã lỗi. */
function loiTuMayChu(config: ConfigCuaAdapter, status: number, duLieu: unknown): AxiosError {
  return new axios.AxiosError('Yêu cầu thất bại', 'ERR_BAD_REQUEST', config, undefined, {
    status,
    statusText: '',
    headers: {},
    config,
    data: duLieu,
  })
}

/**
 * Adapter trả lần lượt theo `ketQua`; hết mảng thì lặp lại phần tử cuối.
 *
 * @param ketQua danh sách `{ status, duLieu }` theo thứ tự request đến.
 */
function adapterTheoThuTu(ketQua: Array<{ status: number; duLieu: unknown }>): AxiosAdapter {
  let lan = 0
  return async (config) => {
    const buoc = ketQua[Math.min(lan, ketQua.length - 1)]
    lan += 1

    if (buoc.status >= 200 && buoc.status < 300) {
      return responseThanhCong(config, buoc.duLieu)
    }

    throw loiTuMayChu(config, buoc.status, buoc.duLieu)
  }
}

/** Adapter luôn trả 401 với body rỗng — tức "token hết hạn". */
const adapterLuon401 = (): AxiosAdapter => adapterTheoThuTu([{ status: 401, duLieu: null }])

/** Nội dung thành công mà các adapter trả về: giao diện chỉ cần `success`. */
const THANH_CONG = { success: true, message: 'OK', data: null }

beforeEach(() => {
  useAuthStore.getState().xoaPhien()
  vi.restoreAllMocks()
})

afterEach(() => {
  apiClient.defaults.adapter = adapterGoc
})

describe('interceptor request - gan access token', () => {
  it('ChuaDangNhap_KhongGanHeaderAuthorization', async () => {
    let authorization: unknown = 'chua-kiem-tra'
    apiClient.defaults.adapter = async (config) => {
      authorization = config.headers.Authorization
      return responseThanhCong(config, THANH_CONG)
    }

    await apiClient.get('/auth/me')

    expect(authorization).toBeUndefined()
  })

  it('DaDangNhap_GanHeaderDinhDangBearer', async () => {
    useAuthStore.getState().datPhien('token-cu', 'refresh-cu', userKhach)
    let authorization: unknown
    apiClient.defaults.adapter = async (config) => {
      authorization = config.headers.Authorization
      return responseThanhCong(config, THANH_CONG)
    }

    await apiClient.get('/auth/me')

    expect(authorization).toBe('Bearer token-cu')
  })
})

describe('interceptor response - ma loi khac 401 thi de nguyen', () => {
  it.each([400, 403, 404, 409, 500])('MaLoi%s_KhongLamMoiToken_RejectNguyenLoi', async (maLoi) => {
    useAuthStore.getState().datPhien('token-cu', 'refresh-cu', userKhach)
    const spyRefresh = vi.spyOn(axios, 'post')

    apiClient.defaults.adapter = adapterTheoThuTu([
      { status: maLoi, duLieu: { success: false, message: 'Thông báo gốc', data: null } },
    ])

    // 400/403/404/409 đã mang sẵn thông báo tiếng Việt trong body. Nếu
    // interceptor đụng vào thì người dùng mất thông báo gốc.
    //
    // Lưu ý: thông báo tiếng Việt nằm ở `error.response.data.message`, KHÔNG
    // phải ở `error.message`. Nên phải bắt lỗi ra rồi tự kiểm — dùng
    // `rejects.toThrow('Thông báo gốc')` sẽ luôn đỏ dù code đúng.
    const loi = await apiClient.get('/auth/me').catch((e: unknown) => e)

    expect(loi).toBeInstanceOf(axios.AxiosError)
    expect((loi as AxiosError).response?.status).toBe(maLoi)
    expect((loi as AxiosError<{ message: string }>).response?.data.message).toBe(
      'Thông báo gốc',
    )
    expect(spyRefresh).not.toHaveBeenCalled()
  })
})

describe('interceptor response - 401 thi lam moi token roi thu lai', () => {
  it('RefreshThanhCong_ThuLaiRequestVoiTokenMoi', async () => {
    useAuthStore.getState().datPhien('token-het-han', 'refresh-hon', userKhach)
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, message: 'OK', data: phienMoi } })

    // Lần đầu 401, lần thử lại 200 — ghi lại header từng lần để so sánh.
    const authorizationTheoThuTu: unknown[] = []
    let lan = 0
    apiClient.defaults.adapter = async (config) => {
      lan += 1
      authorizationTheoThuTu.push(config.headers.Authorization)

      if (lan === 1) {
        throw loiTuMayChu(config, 401, null)
      }

      return responseThanhCong(config, THANH_CONG)
    }

    await apiClient.get('/auth/me')

    // Lần 1 dùng token cũ, lần thử lại phải dùng token MỚI — nếu vẫn là token
    // cũ thì sẽ 401 tiếp và không bao giờ thoát khỏi vòng lặp.
    expect(authorizationTheoThuTu).toEqual(['Bearer token-het-han', 'Bearer access-token-moi'])
    expect(useAuthStore.getState().accessToken).toBe('access-token-moi')
  })

  it('NhieuRequest401CungLuc_ChiGoiDongMotLanRefresh', async () => {
    useAuthStore.getState().datPhien('token-het-han', 'refresh-hon', userKhach)
    const spyRefresh = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, message: 'OK', data: phienMoi },
    })

    // Chỉ token CŨ mới bị 401; token mới thì thành công.
    apiClient.defaults.adapter = async (config) => {
      if (config.headers.Authorization === 'Bearer token-het-han') {
        throw loiTuMayChu(config, 401, null)
      }

      return responseThanhCong(config, THANH_CONG)
    }

    // Ba request hỏng cùng lúc. Nếu gọi refresh ba lần thì hai lần sau nhận 401
    // vì token cũ đã bị thay — tự tạo vòng lặp.
    await Promise.all([apiClient.get('/api/1'), apiClient.get('/api/2'), apiClient.get('/api/3')])

    expect(spyRefresh).toHaveBeenCalledTimes(1)
  })
})

describe('interceptor response - 401 ma khong lam moi duoc', () => {
  it('KhongCoRefreshToken_KhongGoiApi_RejectVaXoaPhien', async () => {
    // Có access token nhưng refresh token đã mất (ví dụ bị xoá tay trong
    // DevTools). Phải xoá phiên, không phải giữ lại trạng thái nửa vời — vì
    // `daDangNhap` lấy từ `accessToken`, giữ lại thì ProtectedRoute vẫn cho
    // qua trong khi mọi request đều 401.
    useAuthStore.getState().datPhien('token-het-han', null as never, userKhach)
    const spyRefresh = vi.spyOn(axios, 'post')
    apiClient.defaults.adapter = adapterLuon401()

    await expect(apiClient.get('/auth/me')).rejects.toThrow()
    expect(spyRefresh).not.toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('RefreshTokenHetHan_XoaPhien_DeNguoiDungDangNhapLai', async () => {
    useAuthStore.getState().datPhien('token-het-han', 'refresh-hon', userKhach)
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Request failed with status code 401'))
    apiClient.defaults.adapter = adapterLuon401()

    await expect(apiClient.get('/auth/me')).rejects.toThrow()

    // Xoá cả ba: giữ lại access token đã hết hạn thì giao diện vẫn tưởng đang
    // đăng nhập rồi mọi request lại 401.
    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('RefreshTraSuccessNhungDataRong_CoXoaPhien', async () => {
    // Server trả 200 nhưng không cấp token mới. Coi như thất bại, nếu không
    // phiên sẽ ở trạng thái "đã làm mới" mà thực ra vẫn dùng token chết.
    useAuthStore.getState().datPhien('token-het-han', 'refresh-hon', userKhach)
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { success: true, message: 'OK', data: null } })
    apiClient.defaults.adapter = adapterLuon401()

    await expect(apiClient.get('/auth/me')).rejects.toThrow()
    expect(useAuthStore.getState().accessToken).toBeNull()
  })

  it('ThuLaiRoiVan401_KhongLamMoiTokenLanNua', async () => {
    // Cờ "đã thử lại" chống vòng lặp. Không có nó thì: 401 → refresh → thử lại
    // → 401 → refresh → thử lại... mãi mãi, mỗi vòng lại gọi server một lần.
    useAuthStore.getState().datPhien('token-het-han', 'refresh-hon', userKhach)
    const spyRefresh = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { success: true, message: 'OK', data: phienMoi },
    })

    let soLan = 0
    apiClient.defaults.adapter = async (config) => {
      soLan += 1
      // Luôn trả 401, kể cả khi đã dùng token mới.
      throw loiTuMayChu(config, 401, null)
    }

    await expect(apiClient.get('/auth/me')).rejects.toThrow()

    // Đúng 2 lần gọi server: 1 lần hỏng + 1 lần thử lại. Lần thứ 3 là vòng lặp.
    expect(soLan).toBe(2)
    expect(spyRefresh).toHaveBeenCalledTimes(1)
  })
})
