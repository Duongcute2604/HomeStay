import { apiClient, bocDuLieu } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type {
  ChoosePaymentMethodPayload,
  ConfirmPaymentPayload,
  Payment,
} from '../types/payment'
import type { PagedResult } from '../types/room'

/**
 * Các lời gọi phần thanh toán.
 *
 * File này chỉ gọi API, không chứa JSX và không giữ trạng thái (AGENTS.md 7.2).
 *
 * <b>Ranh giới đã chốt:</b> không có lời gọi mạng nào tới cổng thanh toán. Hệ thống chỉ
 * <b>ghi nhận</b> phương thức khách chọn; việc xác nhận đã thu tiền là thao tác của quản
 * trị viên.
 */
export const paymentService = {
  /** Lịch sử thanh toán của chính khách, mới nhất trước. */
  async layCuaToi(): Promise<Payment[]> {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments/my')
    return bocDuLieu(response.data)
  },

  /**
   * Phiếu thu của một đơn, hoặc `null` khi đơn chưa có phiếu.
   *
   * Trả `null` (không phải lỗi) vì đơn chưa hoàn thành thì chưa có phiếu — đây là tình
   * huống bình thường, không phải lỗi.
   */
  async layTheoDon(maDon: string): Promise<Payment | null> {
    const response = await apiClient.get<ApiResponse<Payment | null>>(
      `/payments/booking/${encodeURIComponent(maDon)}`,
    )
    return bocDuLieu(response.data)
  },

  /**
   * Khách chọn phương thức thanh toán cho đơn của mình.
   *
   * Gọi lần đầu sẽ mở phiếu thu; gọi lần sau đổi phương thức. Phiếu đã thu tiền rồi
   * thì API trả `409`.
   */
  async chonPhuongThuc(maDon: string, payload: ChoosePaymentMethodPayload): Promise<Payment> {
    const response = await apiClient.post<ApiResponse<Payment>>(
      `/payments/booking/${encodeURIComponent(maDon)}`,
      { method: payload.method },
    )
    return bocDuLieu(response.data)
  },

  /** Quản trị viên lấy danh sách phiếu thu phân trang, mới nhất trước. */
  async adminLayDanhSach(trangThai: number | null, page: number, pageSize: number): Promise<PagedResult<Payment>> {
    const thamSo = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
    if (trangThai !== null) {
      thamSo.set('status', String(trangThai))
    }

    const response = await apiClient.get<ApiResponse<PagedResult<Payment>>>(
      `/admin/payments?${thamSo.toString()}`,
    )
    return bocDuLieu(response.data)
  },

  /** Quản trị viên xác nhận đã thu tiền. */
  async adminDanhDauDaThu(id: number, payload: ConfirmPaymentPayload): Promise<Payment> {
    const response = await apiClient.patch<ApiResponse<Payment>>(`/admin/payments/${id}/paid`, {
      method: payload.method,
      note: payload.note?.trim() || undefined,
    })
    return bocDuLieu(response.data)
  },

  /** Quản trị viên đánh dấu thanh toán thất bại, kèm lý do hiển thị cho khách. */
  async adminDanhDauThatBai(id: number, lyDo: string | undefined): Promise<Payment> {
    const thamSo = new URLSearchParams()
    if (lyDo !== undefined && lyDo.trim() !== '') {
      thamSo.set('lyDo', lyDo.trim())
    }

    const duongDan = `/admin/payments/${id}/failed${
      thamSo.toString() === '' ? '' : `?${thamSo.toString()}`
    }`
    const response = await apiClient.patch<ApiResponse<Payment>>(duongDan)
    return bocDuLieu(response.data)
  },
}