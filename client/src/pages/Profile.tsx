import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types/auth'

/** Giới hạn độ dài khớp với `UpdateProfileRequest` bên server. */
const schemaHoSo = z.object({
  fullName: z
    .string()
    .min(1, 'Vui lòng nhập họ và tên')
    .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
  phoneNumber: z.string().max(15, 'Số điện thoại không được vượt quá 15 ký tự'),
  address: z.string().max(255, 'Địa chỉ không được vượt quá 255 ký tự'),
})

/** Mật khẩu mới 6–100 ký tự, khớp `ChangePasswordRequest` bên server. */
const schemaMatKhau = z
  .object({
    currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
    confirmNewPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu mới'),
  })
  .refine((duLieu) => duLieu.newPassword === duLieu.confirmNewPassword, {
    path: ['confirmNewPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })

type HoSoForm = z.infer<typeof schemaHoSo>
type MatKhauForm = z.infer<typeof schemaMatKhau>

/** Nhãn hiển thị cho quyền, dùng chung ở cả phần thông tin và phần kết quả. */
const NHAN_QUYEN: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Khách',
  [UserRole.ADMIN]: 'Quản trị viên',
}

export default function Profile(): JSX.Element {
  const { user, capNhatHoSo, doiMatKhau, dangXuLy } = useAuth()
  const navigate = useNavigate()
  const [thongBao, setThongBao] = useState<string | null>(null)

  const formHoSo = useForm<HoSoForm>({
    resolver: zodResolver(schemaHoSo),
    defaultValues: {
      fullName: user?.fullName ?? '',
      phoneNumber: user?.phoneNumber ?? '',
      address: user?.address ?? '',
    },
  })

  const formMatKhau = useForm<MatKhauForm>({
    resolver: zodResolver(schemaMatKhau),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  // Trang này nằm trong ProtectedRoute nên `user` luôn có. Kiểm vẫn để TypeScript
  // hiểu kiểu, và để trang hiển thị được thay vì trắng nếu ai đó bỏ sót route.
  if (!user) {
    return <p className="mt-8 text-sm text-gray-500">Chưa có thông tin tài khoản.</p>
  }

  const xuLyLuuHoSo = async (duLieu: HoSoForm): Promise<void> => {
    setThongBao(null)
    const loi = await capNhatHoSo({
      fullName: duLieu.fullName,
      phoneNumber: duLieu.phoneNumber || undefined,
      address: duLieu.address || undefined,
    })

    if (loi) {
      formHoSo.setError('root', { message: layThongBaoLoi(loi) })
      return
    }

    setThongBao('Đã cập nhật hồ sơ thành công.')
  }

  const xuLyDoiMatKhau = async (duLieu: MatKhauForm): Promise<void> => {
    setThongBao(null)
    const loi = await doiMatKhau(duLieu)

    if (loi) {
      formMatKhau.setError('root', { message: layThongBaoLoi(loi) })
      return
    }

    // `useAuth.doiMatKhau` đã xoá phiên cục bộ vì server vô hiệu hoá refresh
    // token cũ. Không chuyển trang thì người dùng thấy bản hồ sơ cũ với nút
    // "Đã lưu" như thể mọi thứ còn nguyên.
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto mt-4 flex max-w-3xl flex-col gap-6">
      <h1 className="text-xl font-bold text-gray-900">Hồ sơ của tôi</h1>

      {/* Email và quyền không sửa được ở đây: backend cố ý bỏ qua chúng trong
          UpdateProfileRequest. Hiện luôn để người dùng biết vì sao không sửa được. */}
      <section className="card p-5">
        <h2 className="font-semibold text-gray-800">Thông tin tài khoản</h2>

        <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          <dt className="text-gray-500">Email</dt>
          <dd className="text-left text-gray-900">{user.email}</dd>

          <dt className="text-gray-500">Quyền</dt>
          <dd className="text-left text-gray-900">{NHAN_QUYEN[user.role]}</dd>

          <dt className="text-gray-500">Ngày tạo tài khoản</dt>
          <dd className="text-left text-gray-900">
            {new Date(user.createdAt).toLocaleDateString('vi-VN')}
          </dd>
        </dl>

        <p className="mt-3 text-xs text-gray-500">
          Email và quyền không thể tự sửa tại đây — quyền do Admin quyết định.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-gray-800">Cập nhật thông tin</h2>

        <form
          className="mt-3 flex flex-col gap-4"
          onSubmit={formHoSo.handleSubmit(xuLyLuuHoSo)}
          noValidate
        >
          {thongBao && (
            <div
              role="status"
              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700"
            >
              {thongBao}
            </div>
          )}

          <FormMessage loi={formHoSo.formState.errors.root?.message} />

          <Input
            label="Họ và tên"
            autoComplete="name"
            loi={formHoSo.formState.errors.fullName?.message}
            {...formHoSo.register('fullName')}
          />

          <Input
            label="Số điện thoại"
            autoComplete="tel"
            loi={formHoSo.formState.errors.phoneNumber?.message}
            {...formHoSo.register('phoneNumber')}
          />

          <Input
            label="Địa chỉ"
            autoComplete="street-address"
            loi={formHoSo.formState.errors.address?.message}
            {...formHoSo.register('address')}
          />

          <Button type="submit" dangTai={dangXuLy} className="self-start">
            Lưu thay đổi
          </Button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-gray-800">Đổi mật khẩu</h2>
        <p className="mt-1 text-sm text-gray-500">
          Đổi mật khẩu xong bạn sẽ bị đăng xuất và phải đăng nhập lại.
        </p>

        <form
          className="mt-3 flex flex-col gap-4"
          onSubmit={formMatKhau.handleSubmit(xuLyDoiMatKhau)}
          noValidate
        >
          <FormMessage loi={formMatKhau.formState.errors.root?.message} />

          <Input
            label="Mật khẩu hiện tại"
            type="password"
            autoComplete="current-password"
            loi={formMatKhau.formState.errors.currentPassword?.message}
            {...formMatKhau.register('currentPassword')}
          />

          <Input
            label="Mật khẩu mới"
            type="password"
            autoComplete="new-password"
            loi={formMatKhau.formState.errors.newPassword?.message}
            {...formMatKhau.register('newPassword')}
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            autoComplete="new-password"
            loi={formMatKhau.formState.errors.confirmNewPassword?.message}
            {...formMatKhau.register('confirmNewPassword')}
          />

          <Button type="submit" dangTai={dangXuLy} className="self-start">
            Đổi mật khẩu
          </Button>
        </form>
      </section>
    </div>
  )
}
