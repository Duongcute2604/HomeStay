import type { RoomSummary, RoomType } from './location'

/**
 * Kiểu dữ liệu phía giao diện cho phần tìm kiếm phòng.
 *
 * Nguồn là `server/StayEasy/DTOs/RoomDtos.cs`. `RoomType`/`RoomStatus` dùng lại
 * từ `types/location.ts` để không có hai nguồn sự thật cho cùng một enum.
 * Không có `Id` ở bất kỳ chỗ nào (AGENTS.md 6.3).
 */

/** Cách sắp xếp — giá trị tiếng Anh ở API, nhãn tiếng Việt ở giao diện. */
export const SortOption = {
  NEWEST: 'newest',
  PRICE_ASC: 'priceAsc',
  PRICE_DESC: 'priceDesc',
  RATING_DESC: 'ratingDesc',
} as const
export type SortOption = (typeof SortOption)[keyof typeof SortOption]

/** Nhãn tiếng Việt cho cách sắp xếp. */
export const NHAN_SAP_XEP: Record<SortOption, string> = {
  [SortOption.NEWEST]: 'Mới nhất',
  [SortOption.PRICE_ASC]: 'Giá tăng dần',
  [SortOption.PRICE_DESC]: 'Giá giảm dần',
  [SortOption.RATING_DESC]: 'Đánh giá cao nhất',
}

/** Bộ lọc đang áp dụng — cũng là query key của TanStack Query. */
export interface SearchFilters {
  keyword: string
  locationIndex: number | null
  roomType: RoomType | null
  minPrice: number | null
  maxPrice: number | null
  capacity: number | null
  sort: SortOption
  page: number
  pageSize: number
}

/** Giá trị lọc mặc định khi mới mở trang. */
export const LOC_MAC_DINH: SearchFilters = {
  keyword: '',
  locationIndex: null,
  roomType: null,
  minPrice: null,
  maxPrice: null,
  capacity: null,
  sort: SortOption.NEWEST,
  page: 1,
  pageSize: 6,
}

/** Một phòng trong kết quả — thêm tên địa điểm so với `RoomSummary`. */
export interface RoomSearchItem extends RoomSummary {
  locationName: string
}

/** Kết quả phân trang từ API. */
export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}
