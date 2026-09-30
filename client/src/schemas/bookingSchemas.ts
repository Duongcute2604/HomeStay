import { z } from 'zod'

/**
 * Quy tắc kiểm form đặt phòng.
 *
 * Cố ý KHÔNG kiểm sức chứa tối đa trong schema: sức chứa thay đổi theo từng
 * phòng, mà schema dựng một lần lúc mount (khi phòng còn chưa tải xong) thì
 * `max` bị đóng băng ở giá trị sai — đã từng khiến nhập 2 khách cũng báo lỗi.
 * Sức chứa kiểm lúc submit trong `Booking.tsx`, khi phòng chắc chắn đã có.
 */
export const schemaDatPhong = z.object({
  guestCount: z.coerce
    .number({ invalid_type_error: 'Vui lòng nhập số khách' })
    .int('Số khách phải là số nguyên')
    .min(1, 'Số khách phải từ 1 trở lên'),
  note: z
    .string()
    .max(500, 'Ghi chú không được vượt quá 500 ký tự')
    .optional()
    .default(''),
})

export type DatPhongForm = z.infer<typeof schemaDatPhong>
