/**
 * Kiểu dữ liệu phía giao diện cho phần địa điểm.
 *
 * Nguồn là `server/StayEasy/DTOs/LocationDtos.cs`. Quy tắc bất biến AGENTS.md 6.3:
 * danh sách KHÔNG có `Id` — giao diện điều hướng chi tiết bằng chỉ số trong danh
 * sách, STT = chỉ số + 1. Không dùng `any` ở bất kỳ chỗ nào.
 */

/**
 * Loại phòng. Backend serialize enum thành SỐ — đừng so sánh chuỗi.
 */
export const RoomType = {
  STANDARD: 0,
  DELUXE: 1,
  FAMILY: 2,
  SUITE: 3,
} as const
export type RoomType = (typeof RoomType)[keyof typeof RoomType]

/** Nhãn tiếng Việt cho loại phòng, dùng chung mọi màn hình. */
export const NHAN_LOAI_PHONG: Record<RoomType, string> = {
  [RoomType.STANDARD]: 'Tiêu chuẩn',
  [RoomType.DELUXE]: 'Cao cấp',
  [RoomType.FAMILY]: 'Gia đình',
  [RoomType.SUITE]: 'Hạng nhà',
}

/**
 * Trạng thái phòng. Backend serialize enum thành SỐ.
 */
export const RoomStatus = {
  AVAILABLE: 0,
  BOOKED: 1,
  OCCUPIED: 2,
  CLEANING: 3,
  MAINTENANCE: 4,
} as const
export type RoomStatus = (typeof RoomStatus)[keyof typeof RoomStatus]

/** Nhãn tiếng Việt cho trạng thái phòng. */
export const NHAN_TRANG_THAI_PHONG: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: 'Còn trống',
  [RoomStatus.BOOKED]: 'Đã được đặt',
  [RoomStatus.OCCUPIED]: 'Đang có khách',
  [RoomStatus.CLEANING]: 'Đang dọn dẹp',
  [RoomStatus.MAINTENANCE]: 'Bảo trì',
}

/** Tóm tắt một phòng trong trang chi tiết địa điểm. Không có `Id`. */
export interface RoomSummary {
  name: string
  roomNumber: string
  roomType: RoomType
  capacity: number
  pricePerHour: number
  pricePerDay: number
  ratingAvg: number
  ratingCount: number
  status: RoomStatus
  thumbnailUrl: string | null
}

/** Một địa điểm trong danh sách. Không có `Id`. */
export interface Location {
  name: string
  city: string
  province: string
  address: string
  description: string | null
  imageUrl: string | null
  rooms: RoomSummary[]
}
