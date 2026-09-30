/**
 * Kiểu dữ liệu phía giao diện cho trang quản trị (Bước 12).
 *
 * Nguồn là `server/StayEasy/DTOs/AdminDtos.cs`.
 *
 * Khác với kiểu phía khách, các kiểu ở đây CÓ `id`. Lý do: trang quản trị
 * cần gọi `PUT /api/admin/rooms/{id}` — không có khoá thì không sửa được.
 * Quy tắc "không hiển thị Id" của AGENTS.md 6.3 vẫn giữ: `id` chỉ nằm trong
 * payload, không bao giờ render ra màn hình (STT tự tính, đơn hiện bằng mã).
 */

import type { BookingStatus } from './booking'
import type { RoomStatus, RoomType } from './location'

/** Một cơ sở trong trang quản trị. */
export interface AdminLocation {
  id: number
  name: string
  city: string
  province: string
  address: string
  description: string | null
  imageUrl: string | null
  isActive: boolean
  totalRooms: number
}

/** Dữ liệu form tạo / sửa cơ sở. */
export interface FacilityPayload {
  name: string
  city: string
  province: string
  address: string
  description?: string
  imageUrl?: string
  isActive: boolean
}

/** Một phòng trong trang quản trị. */
export interface AdminRoom {
  id: number
  locationName: string
  name: string
  roomNumber: string
  roomType: RoomType
  capacity: number
  pricePerHour: number
  pricePerDay: number
  description: string | null
  status: RoomStatus
  images: string[]
  amenityIds: number[]
  amenityNames: string[]
}

/** Dữ liệu form tạo / sửa phòng. */
export interface RoomPayload {
  locationId: number
  name: string
  roomNumber: string
  roomType: RoomType
  capacity: number
  pricePerHour: number
  pricePerDay: number
  description?: string
  imageUrls: string[]
  amenityIds: number[]
}

/** Một khách hàng trong trang quản trị. */
export interface Customer {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  isLocked: boolean
  createdAt: string
  totalBookings: number
}

/**
 * Một đơn trong trang quản trị (Bước 13).
 *
 * Nguồn là `server/StayEasy/DTOs/AdminBookingDtos.cs`. `status` là SỐ — dùng
 * `NHAN_TRANG_THAI_DON` từ `types/booking` để hiện nhãn tiếng Việt, đừng so
 * sánh chuỗi.
 */
export interface AdminBooking {
  id: number
  /** Mã đơn `HS-YYMMDD-XXXX` — thứ Admin và khách đều dùng để tra cứu. */
  code: string
  customerName: string
  customerEmail: string
  customerPhone: string | null
  roomName: string
  locationName: string
  bookingType: number
  checkIn: string
  checkOut: string
  guestCount: number
  totalAmount: number
  status: BookingStatus
  note: string | null
  cancelReason: string | null
  createdAt: string
}

/** Bộ lọc danh sách đơn ở trang quản trị. `null` ở `status` = không lọc. */
export interface AdminBookingFilter {
  status: BookingStatus | null
  keyword: string
  page: number
  pageSize: number
}

/** Dữ liệu form tạo khách hàng (Admin nhập tay). */
export interface CustomerPayload {
  fullName: string
  email: string
  phoneNumber?: string
  password: string
}

/** Một tiện nghi trong danh mục, dùng cho checkbox ở form phòng. */
export interface Amenity {
  id: number
  name: string
  icon: string | null
}

/**
 * So lieu tong quan o dau trang thong ke (Buoc 15).
 *
 * Nguon la `server/StayEasy/DTOs/DashboardDtos.cs`. Ba dinh nghia quan trong
 * da chot o backend va phai giu nguyen khi hien thi:
 * - `doanhThuThangNay` chi gom don `COMPLETED` (da tra phong).
 * - `donThangNay` dem moi trang thai, theo thang TAO don.
 * - `tyLeLapDay` chi tinh don khach da thuc su o.
 */
export interface DashboardOverview {
  tongDon: number
  donThangNay: number
  doanhThuThangNay: number
  tongPhong: number
  tongKhach: number
  phongDangCoKhach: number
}

/** Mot cot cua bieu do theo thang. */
export interface MonthlyStat {
  /** Khoa `yyyy-MM` de dung lam khoa React. */
  thang: string
  /** Nhan rut gon `T9` cho truc ngang. */
  nhan: string
  doanhThu: number
  soDon: number
}

/** Mot phong trong bang xep hang doanh thu. */
export interface TopRoom {
  tenPhong: string
  tenCoSo: string
  soDon: number
  doanhThu: number
}

/** So phong theo tung trang thai - dung ve bieu do tron. */
export interface RoomStatusCount {
  trangThai: RoomStatus
  soPhong: number
}

/** Toan bo so lieu tra ve trong 1 lan goi. */
export interface Dashboard {
  tuNgay: string
  denNgay: string
  tongQuan: DashboardOverview
  theoThang: MonthlyStat[]
  /** 0..1 - giao dien nhan 100 de hien %. */
  tyLeLapDay: number
  demDaBan: number
  demTongCong: number
  trangThaiPhong: RoomStatusCount[]
  topPhong: TopRoom[]
}

/**
 * Một dòng đánh giá trong trang quản trị (Bước 16).
 *
 * `id` có trong payload để gọi API, nhưng giao diện **không** hiển thị —
 * hiện tên người viết và mã đơn thay thế (AGENTS.md 6.3).
 */
export interface AdminReview {
  id: number
  bookingCode: string
  reviewerName: string
  roomName: string
  locationName: string
  rating: number
  comment: string | null
  isHidden: boolean
  createdAt: string
}

/**
 * Kết quả ẩn/hiện/xoá một đánh giá.
 *
 * Kèm luôn điểm phòng sau khi tính lại để bảng Admin hiển thị đúng ngay,
 * không phải bấm "Làm mới" mới thấy — số điểm bị ảo khiến Admin tưởng thao tác
 * chưa có hiệu lực.
 */
export interface ReviewVisibilityResult {
  id: number
  isHidden: boolean
  phongDiemTrungBinh: number
  phongSoDanhGia: number
}
