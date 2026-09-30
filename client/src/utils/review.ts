/**
 * Nhãn tiếng Việt cho số sao, dùng chung để mọi màn hình hiển thị giống nhau.
 *
 * Riêng `formatDiem` thì lấy từ `utils/format` — đã có sẵn từ Bước 8, không viết
 * lần thứ hai (hai bản khác nhau một bên hiện "4,0" một bên "4" thì cột điểm
 * trông lung lay).
 */
export { formatDiem } from './format'

/** Nhãn tiếng Việt cho số sao. */
export const NHAN_SAO: Record<number, string> = {
  1: '1 sao — Rất tệ',
  2: '2 sao — Tệ',
  3: '3 sao — Bình thường',
  4: '4 sao — Tốt',
  5: '5 sao — Rất tốt',
}

/** Số sao thấp nhất, khớp `ReviewRules.MinRating` ở backend. */
export const SAO_THAP_NHAT = 1

/** Số sao cao nhất, khớp `ReviewRules.MaxRating` ở backend. */
export const SAO_CAO_NHAT = 5
