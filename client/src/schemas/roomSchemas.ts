import { z } from 'zod'

import { RoomType } from '../types/location'
import { SortOption } from '../types/room'

/**
 * Quy tắc kiểm form lọc phòng, gom ra khỏi component để test được
 * (cùng lý do như `schemas/authSchemas.ts`).
 *
 * Số từ ô nhập về là chuỗi nên dùng `z.coerce.number()` — ô trống thành `NaN`
 * thì chuyển thành `null` (không lọc) thay vì báo lỗi. Người dùng xoá số trong
 * ô không phải là lỗi, chỉ là "không giới hạn nữa".
 */

/**
 * Ô số không bắt buộc: để trống → null (không lọc), có số thì kiểm khoảng.
 *
 * Phải tiền xử lý chuỗi rỗng TRƯỚC khi ép kiểu: `z.coerce.number('')` cho ra
 * `0` chứ không phải `NaN` (vì `Number('') === 0`), nên không tiền xử lý thì
 * xoá số trong ô lại thành lọc "giá từ 0" — sai ý người dùng.
 */
const soKhongBatBuoc = (nhoNhat: number, lonNhat: number, thongBao: string) =>
  z.preprocess(
    (giaTri) => (giaTri === '' || giaTri === null || giaTri === undefined ? null : giaTri),
    z.coerce.number().min(nhoNhat, { message: thongBao }).max(lonNhat, { message: thongBao }).nullable(),
  )

export const schemaTimKiem = z
  .object({
    keyword: z.string().max(100, 'Từ khoá không được vượt quá 100 ký tự').default(''),
    locationIndex: z.coerce.number().int().min(0).nullable().default(null),
    roomType: z.coerce.number().int().nullable().default(null),
    minPrice: soKhongBatBuoc(0, 1000000000, 'Giá phải từ 0 đến 1.000.000.000'),
    maxPrice: soKhongBatBuoc(0, 1000000000, 'Giá phải từ 0 đến 1.000.000.000'),
    capacity: soKhongBatBuoc(1, 20, 'Số khách phải từ 1 đến 20'),
    sort: z.nativeEnum(SortOption).default(SortOption.NEWEST),
  })
  .refine((duLieu) => duLieu.minPrice === null || duLieu.maxPrice === null || duLieu.minPrice <= duLieu.maxPrice, {
    path: ['maxPrice'],
    message: 'Giá cao nhất phải lớn hơn hoặc bằng giá thấp nhất',
  })
  .refine(
    (duLieu) =>
      duLieu.roomType === null ||
      (Object.values(RoomType) as number[]).includes(duLieu.roomType),
    {
      path: ['roomType'],
      message: 'Loại phòng không hợp lệ',
    },
  )

export type TimKiemForm = z.infer<typeof schemaTimKiem>
