import { z } from 'zod'

/**
 * Toàn bộ quy tắc kiểm dữ liệu của phần tài khoản, gom ra khỏi component.
 *
 * Vì sao tách riêng (ba lý do, đều là nguyên lý đã chốt trong AGENTS.md):
 *
 * 1. **Test được.** Nằm trong `Login.tsx` thì không có cách nào kiểm mà không
 *    phải dựng cả trang, trong khi đây là hàm thuần — kiểm trực tiếp được
 *    (AGENTS.md 5.2: logic phải nằm trong hàm thuần mới test được).
 * 2. **Không lặp.** Quy tắc "họ tên tối đa 100 ký tự" xuất hiện ở cả trang đăng
 *    ký lẫn trang hồ sơ; "mật khẩu 6–100 ký tự" xuất hiện ở cả đăng ký lẫn đổi
 *    mật khẩu. Sửa một chỗ là phải sửa cả hai, và sửa sót chỗ nào thì hai màn
 *    hình báo hai kiểu (DRY).
 * 3. **Một chỗ đối chiếu với server.** Mọi số ở đây lấy từ `AuthDtos.cs`; đọc
 *    một file là biết giao diện đang cho phép bao nhiêu ký tự, không phải mở
 *    3 file trang.
 *
 * Điểm cố ý KHÔNG làm: kiểm định dạng email. Backend dùng `EmailValidator` và
 * trả **409** cho cả email sai định dạng lẫn email trùng (quyết định đã chốt ở
 * Bước 5). Thêm regex ở đây sẽ khiến hai tầng báo hai kiểu lỗi khác nhau cho
 * cùng một thao tác — người dùng thấy thông báo của giao diện rồi lại thấy
 * thông báo khác của server.
 */

/** Giới hạn độ dài, khớp với DTO bên server (`server/StayEasy/DTOs/AuthDtos.cs`). */
export const GIOI_HAN = {
  hoTen: 100,
  email: 150,
  matKhauNhoNhat: 6,
  matKhauLonNhat: 100,
  soDienThoai: 15,
  diaChi: 255,
} as const

/**
 * Ô họ tên — dùng chung cho đăng ký và cập nhật hồ sơ.
 *
 * Dùng hàm sinh thay vì hằng schema dùng chung: Zod object là **mutable**, dùng
 * chung một object cho hai nơi thì chỗ này sửa `.min()` là chỗ kia đổi theo.
 */
const truongHoTen = () =>
  z
    .string()
    .min(1, 'Vui lòng nhập họ và tên')
    .max(GIOI_HAN.hoTen, `Họ và tên không được vượt quá ${GIOI_HAN.hoTen} ký tự`)

const truongSoDienThoai = () =>
  z.string().max(GIOI_HAN.soDienThoai, `Số điện thoại không được vượt quá ${GIOI_HAN.soDienThoai} ký tự`)

const truongDiaChi = () =>
  z.string().max(GIOI_HAN.diaChi, `Địa chỉ không được vượt quá ${GIOI_HAN.diaChi} ký tự`)

const truongMatKhau = (nhanLoi: string) =>
  z
    .string()
    .min(GIOI_HAN.matKhauNhoNhat, nhanLoi)
    .max(GIOI_HAN.matKhauLonNhat, `Mật khẩu không được vượt quá ${GIOI_HAN.matKhauLonNhat} ký tự`)

/**
 * Thông báo khi mật khẩu xác nhận không khớp.
 *
 * Gắn lỗi vào ô xác nhận chứ không phải vào `root`, để nó hiện ngay dưới ô
 * vừa gõ sai thay vì lỗi nằm ở đầu form.
 */
const thongBaoXacNhanKhongKhop = {
  path: ['confirmPassword'],
  message: 'Mật khẩu xác nhận không khớp',
}

const thongBaoXacNhanMoiKhongKhop = {
  path: ['confirmNewPassword'],
  message: 'Mật khẩu xác nhận không khớp',
}

/** Form đăng nhập: chỉ kiểm bắt buộc nhập, còn lại để server trả lỗi. */
export const schemaDangNhap = z.object({
  email: z.string().min(1, 'Vui lòng nhập email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

/** Form đăng ký: có đủ quy tắc độ dài và kiểm mật khẩu xác nhận. */
export const schemaDangKy = z
  .object({
    fullName: truongHoTen(),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .max(GIOI_HAN.email, `Email không được vượt quá ${GIOI_HAN.email} ký tự`),
    password: truongMatKhau(`Mật khẩu phải có ít nhất ${GIOI_HAN.matKhauNhoNhat} ký tự`),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    phoneNumber: truongSoDienThoai(),
    address: truongDiaChi(),
  })
  .refine((duLieu) => duLieu.password === duLieu.confirmPassword, thongBaoXacNhanKhongKhop)

/** Form cập nhật hồ sơ. Không có ô email/quyền vì server cố ý bỏ qua hai trường đó. */
export const schemaHoSo = z.object({
  fullName: truongHoTen(),
  phoneNumber: truongSoDienThoai(),
  address: truongDiaChi(),
})

/** Form đổi mật khẩu. */
export const schemaDoiMatKhau = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: truongMatKhau(
      `Mật khẩu mới phải có ít nhất ${GIOI_HAN.matKhauNhoNhat} ký tự`,
    ),
    confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine(
    (duLieu) => duLieu.newPassword === duLieu.confirmNewPassword,
    thongBaoXacNhanMoiKhongKhop,
  )

// Kiểu form suy ra thẳng từ schema, không khai tay hai lần (AGENTS.md mục 7.2).
export type DangNhapForm = z.infer<typeof schemaDangNhap>
export type DangKyForm = z.infer<typeof schemaDangKy>
export type HoSoForm = z.infer<typeof schemaHoSo>
export type DoiMatKhauForm = z.infer<typeof schemaDoiMatKhau>
