import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

import { useAuthStore } from '../store/authStore'
import type { ApiResponse, AuthResult } from '../types/auth'

/**
 * Lớp gọi API duy nhất của giao diện.
 *
 * Mọi `authService` khác đều gọi qua `apiClient` này — không có nơi nào tự
 * `axios.get(...)` trần (AGENTS.md mục 7.2: service chỉ gọi API, trang chỉ
 * hiển thị, không tự gọi axios).
 *
 * `baseURL: '/api'` chứ không phải `http://localhost:5080/api`: nhờ proxy
 * `/api` trong `vite.config.ts`, khi đổi cổng server không phải sửa code
 * giao diện, và không cần cấu hình CORS cho môi trường phát triển.
 */
export const apiClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
})

// Gắn access token vào mọi request, đọc từ store để không có hai nơi cùng giữ token.
apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

/**
 * Đánh dấu request đã thử làm mới token một lần rồi.
 *
 * Không có cờ này thì: access token hết hạn → 401 → refresh thành công → thử
 * lại → vẫn 401 (vì lý do 401 không phải hết hạn) → lại refresh → mãi mãi.
 */
interface ConfigDaThuLai extends InternalAxiosRequestConfig {
  daThuLaiSauKhiLamMoiToken?: boolean
}

/**
 * Lời hứa đang chạy của lần làm mới token.
 *
 * Giữ ở biến ngoài hàm để gom nhiều request cùng lúc bị 401 vào MỘT lần gọi
 * refresh. Không có nó thì 5 request hỏng cùng lúc sẽ gọi refresh 5 lần; 4
 * lần sau nhận 401 vì token cũ đã bị thay — tự tạo ra vòng lặp.
 */
let dangLamMoiToken: Promise<boolean> | null = null

async function lamMoiToken(): Promise<boolean> {
  const { refreshToken, datPhien, xoaPhien } = useAuthStore.getState()

  if (!refreshToken) {
    // Cũng phải xoá phiên chứ không chỉ `return false`. Nếu giữ lại
    // `accessToken` đã hết hạn thì giao diện vẫn tưởng đang đăng nhập
    // (`daDangNhap` = true, ProtectedRoute vẫn cho qua) nhưng mọi request sau
    // đều 401 — người dùng bị kẹt ở một trang không dùng được mà không hiểu vì
    // sao. Xoá phiên thì họ được đưa về trang đăng nhập, thấy nguyên nhân.
    xoaPhien()
    return false
  }

  try {
    // Cố ý gọi `axios` thuần chứ không phải `apiClient`: request này không được
    // đi qua interceptor, nếu không 401 của chính nó lại kích hoạt refresh.
    const response = await axios.post<ApiResponse<AuthResult>>('/api/auth/refresh', { refreshToken })
    const duLieu = response.data.data

    if (!response.data.success || !duLieu) {
      xoaPhien()
      return false
    }

    datPhien(duLieu.accessToken, duLieu.refreshToken, duLieu.user)
    return true
  } catch {
    // Refresh token hết hạn hoặc đã bị vô hiệu hoá → buộc người dùng đăng nhập lại.
    xoaPhien()
    return false
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const config = error.config as ConfigDaThuLai | undefined
    const maLoi = error.response?.status

    // Chỉ xử lý 401. Các mã khác (400 / 403 / 404 / 409) đã mang sẵn thông báo
    // tiếng Việt trong body — để nguyên cho trang hiển thị, không đụng vào.
    if (maLoi !== 401 || !config || config.daThuLaiSauKhiLamMoiToken) {
      return Promise.reject(error)
    }

    dangLamMoiToken = dangLamMoiToken ?? lamMoiToken()
    const daLamMoiDuoc = await dangLamMoiToken
    dangLamMoiToken = null

    if (!daLamMoiDuoc) {
      return Promise.reject(error)
    }

    config.daThuLaiSauKhiLamMoiToken = true
    return apiClient(config)
  },
)

/**
 * Bóc thông báo tiếng Việt từ một lỗi bất kỳ, để mọi trang hiển thị giống nhau.
 *
 * Nhận `unknown` chứ không phải `any`: lỗi trả về từ `catch` có kiểu `unknown`
 * theo chuẩn TS, và ép kiểu bằng `any` ở đây sẽ làm mất toàn bộ kiểm tra kiểu ở
 * những chỗ gọi (AGENTS.md mục 7.2 cấm `any`).
 */
export function layThongBaoLoi(error: unknown): string {
  if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
    const thongBao = error.response?.data?.message

    if (thongBao) {
      return thongBao
    }

    // Không có `response` nghĩa là request không tới được server (tắt server,
    // hết mạng, hết 15 giây timeout) — đây là lỗi khác hẳn, phải nói rõ.
    if (!error.response) {
      return 'Không kết nối được máy chủ. Vui lòng kiểm tra mạng rồi thử lại.'
    }

    return `Yêu cầu thất bại (mã ${error.response.status}). Vui lòng thử lại.`
  }

  // Lỗi do chính tầng service ném ra (ví dụ response không đúng cấu trúc mong đợi).
  // Bỏ nhánh này thì mọi lỗi loại đó đều bị hiện thành câu chung chung, mất
  // nguyên nhân thật khi cần tìm lỗi.
  if (error instanceof Error) {
    return error.message
  }

  return 'Đã xảy ra lỗi. Vui lòng thử lại.'
}
