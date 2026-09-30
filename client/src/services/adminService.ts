import { apiClient, bocDuLieu, kiemTraThanhCong } from '../api/client'
import type { ApiResponse } from '../types/auth'
import type {
  AdminBooking,
  AdminBookingFilter,
  AdminLocation,
  AdminRoom,
  Amenity,
  Customer,
  CustomerPayload,
  FacilityPayload,
  RoomPayload,
} from '../types/admin'
import type { RoomStatus } from '../types/location'
import type { PagedResult } from '../types/room'

/**
 * Các lời gọi phần quản trị (Bước 12).
 *
 * Tách riêng `adminService` chứ không nhét vào `roomService`/`locationService`:
 * hai bên khác hẳn về mặt quyền (public vs chỉ ADMIN) và về mã lỗi (form quản
 * trị cần bắt 400/404/409 để báo đúng chỗ), gộp chung sẽ khó đọc hơn là tách.
 *
 * Tất cả endpoint đều dưới `/admin` — backend chặn bằng `[Authorize(Roles = "ADMIN")]`.
 */
export const adminService = {
  // ----- Cơ sở -----

  /** Lấy toàn bộ cơ sở, gồm cả cơ sở đang tạm ngừng hoạt động. */
  async layDanhSachCoSo(): Promise<AdminLocation[]> {
    const response = await apiClient.get<ApiResponse<AdminLocation[]>>('/admin/locations')
    return bocDuLieu(response.data)
  },

  async taoCoSo(payload: FacilityPayload): Promise<AdminLocation> {
    const response = await apiClient.post<ApiResponse<AdminLocation>>('/admin/locations', payload)
    return bocDuLieu(response.data)
  },

  async suaCoSo(id: number, payload: FacilityPayload): Promise<AdminLocation> {
    const response = await apiClient.put<ApiResponse<AdminLocation>>(`/admin/locations/${id}`, payload)
    return bocDuLieu(response.data)
  },

  /**
   * Xoá cơ sở. Cơ sở còn phòng sẽ bị server từ chối với mã 400 — thông báo đó
   * báo lên toast, không phải im lặng cho form tự xử.
   */
  async xoaCoSo(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<unknown>>(`/admin/locations/${id}`)
    kiemTraThanhCong(response.data)
  },

  // ----- Phòng -----

  async layDanhSachPhong(): Promise<AdminRoom[]> {
    const response = await apiClient.get<ApiResponse<AdminRoom[]>>('/admin/rooms')
    return bocDuLieu(response.data)
  },

  /** Danh mục tiện nghi để dựng checkbox ở form phòng. */
  async layDanhSachTienNgh(): Promise<Amenity[]> {
    const response = await apiClient.get<ApiResponse<Amenity[]>>('/admin/rooms/amenities')
    return bocDuLieu(response.data)
  },

  async taoPhong(payload: RoomPayload): Promise<AdminRoom> {
    const response = await apiClient.post<ApiResponse<AdminRoom>>('/admin/rooms', payload)
    return bocDuLieu(response.data)
  },

  async suaPhong(id: number, payload: RoomPayload): Promise<AdminRoom> {
    const response = await apiClient.put<ApiResponse<AdminRoom>>(`/admin/rooms/${id}`, payload)
    return bocDuLieu(response.data)
  },

  async doiTrangThaiPhong(id: number, status: RoomStatus): Promise<AdminRoom> {
    const response = await apiClient.patch<ApiResponse<AdminRoom>>(`/admin/rooms/${id}/status`, { status })
    return bocDuLieu(response.data)
  },

  async xoaPhong(id: number): Promise<void> {
    const response = await apiClient.delete<ApiResponse<unknown>>(`/admin/rooms/${id}`)
    kiemTraThanhCong(response.data)
  },

  // ----- Khách hàng -----

  async layDanhSachKhach(): Promise<Customer[]> {
    const response = await apiClient.get<ApiResponse<Customer[]>>('/admin/customers')
    return bocDuLieu(response.data)
  },

  async taoKhach(payload: CustomerPayload): Promise<Customer> {
    const response = await apiClient.post<ApiResponse<Customer>>('/admin/customers', payload)
    return bocDuLieu(response.data)
  },

  /** Khoá hoặc mở khoá tài khoản. Không xoá để giữ lịch sử đơn của khách. */
  async doiTrangThaiKhach(id: number, isLocked: boolean): Promise<Customer> {
    const response = await apiClient.patch<ApiResponse<Customer>>(`/admin/customers/${id}/status`, {
      isLocked,
    })
    return bocDuLieu(response.data)
  },

  // ----- Vòng đời đơn -----

  /**
   * Danh sách đơn có lọc theo trạng thái và từ khoá (mã đơn / tên / email khách).
   *
   * Chỉ gửi tham số có giá trị: `status=null` gửi lên sẽ thành chuỗi rỗng và
   * server đọc sai — cùng lý do với `roomService.timKiem`.
   */
  async layDanhSachDon(filter: AdminBookingFilter): Promise<PagedResult<AdminBooking>> {
    const thamSo = new URLSearchParams()

    if (filter.status !== null) {
      thamSo.set('status', String(filter.status))
    }
    if (filter.keyword.trim() !== '') {
      thamSo.set('keyword', filter.keyword.trim())
    }
    thamSo.set('page', String(filter.page))
    thamSo.set('pageSize', String(filter.pageSize))

    const response = await apiClient.get<ApiResponse<PagedResult<AdminBooking>>>(
      `/admin/bookings?${thamSo.toString()}`,
    )
    return bocDuLieu(response.data)
  },

  /** Xác nhận đơn: `PENDING → CONFIRMED`, phòng chuyển sang đã được đặt. */
  async xacNhanDon(code: string): Promise<AdminBooking> {
    const response = await apiClient.patch<ApiResponse<AdminBooking>>(
      `/admin/bookings/${code}/confirm`,
    )
    return bocDuLieu(response.data)
  },

  /**
   * Từ chối đơn kèm lý do. Bắt buộc có lý do — server trả 400 nếu để trống.
   */
  async tuChoiDon(code: string, reason: string): Promise<AdminBooking> {
    const response = await apiClient.patch<ApiResponse<AdminBooking>>(
      `/admin/bookings/${code}/reject`,
      { reason },
    )
    return bocDuLieu(response.data)
  },

  /** Cho khách nhận phòng: `CONFIRMED → CHECKED_IN`. */
  async checkInDon(code: string): Promise<AdminBooking> {
    const response = await apiClient.patch<ApiResponse<AdminBooking>>(
      `/admin/bookings/${code}/check-in`,
    )
    return bocDuLieu(response.data)
  },

  /**
   * Khách trả phòng: `CHECKED_IN → COMPLETED`. Phòng chuyển sang đang dọn dẹp,
   * chưa nhận đơn mới được ngay.
   */
  async checkOutDon(code: string): Promise<AdminBooking> {
    const response = await apiClient.patch<ApiResponse<AdminBooking>>(
      `/admin/bookings/${code}/check-out`,
    )
    return bocDuLieu(response.data)
  },
}
