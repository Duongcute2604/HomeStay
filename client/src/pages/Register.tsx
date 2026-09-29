import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'
import { useAuthStore } from '../store/authStore'

/**
 * Quy tắc kiểm ở giao diện cho form đăng ký.
 *
 * Cố ý chỉ kiểm "bắt buộc nhập" và "độ dài tối đa" — đúng những thứ backend
 * đã chốt trong `AuthDtos.cs`:
 *
 * - `FullName` tối đa 100 ký tự · `Email` tối đa 150 · `Password` 6–100 ký tự
 * - `PhoneNumber` tối đa 15 · `Address` tối đa 255
 *
 * Không kiểm định dạng email ở đây: backend dùng `EmailValidator` và trả 409
 * cho cả email sai định dạng lẫn email trùng. Thêm regex phía giao diện sẽ khiến
 * hai tầng báo hai kiểu lỗi khác nhau cho cùng một thao tác.
 */
const schema = z
  .object({
    fullName: z
      .string()
      .min(1, 'Vui lòng nhập họ và tên')
      .max(100, 'Họ và tên không được vượt quá 100 ký tự'),
    email: z
      .string()
      .min(1, 'Vui lòng nhập email')
      .max(150, 'Email không được vượt quá 150 ký tự'),
    password: z
      .string()
      .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
      .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng nhập lại mật khẩu'),
    phoneNumber: z.string().max(15, 'Số điện thoại không được vượt quá 15 ký tự'),
    address: z.string().max(255, 'Địa chỉ không được vượt quá 255 ký tự'),
  })
  .refine((duLieu) => duLieu.password === duLieu.confirmPassword, {
    // Gắn lỗi vào `confirmPassword` chứ không phải `root` để nó hiện ngay
    // dưới ô xác nhận — người dùng nhìn thấy chỗ vừa gõ sai.
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp',
  })

type RegisterForm = z.infer<typeof schema>

export default function Register(): JSX.Element {
  const { dangKy, dangXuLy, daDangNhap } = useAuth()
  const navigate = useNavigate()

  // Ghi đè giá trị mặc định bằng dữ liệu đang có sẵn trong store, để quay lại
  // trang này sau khi đăng nhập thì không phải gõ lại từ đầu.
  const userHienTai = useAuthStore((state) => state.user)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: userHienTai?.fullName ?? '',
      email: userHienTai?.email ?? '',
      password: '',
      confirmPassword: '',
      phoneNumber: userHienTai?.phoneNumber ?? '',
      address: userHienTai?.address ?? '',
    },
  })

  if (daDangNhap) {
    return <Navigate to="/" replace />
  }

  const xuLyPhatSubmit = async (duLieu: RegisterForm): Promise<void> => {
    const loi = await dangKy({
      fullName: duLieu.fullName,
      email: duLieu.email,
      password: duLieu.password,
      confirmPassword: duLieu.confirmPassword,
      // Ô trống thì gửi `undefined` chứ không gửi chuỗi rỗng: chuỗi rỗng sẽ
      // bị backend tính là "đã nhập" và lưu vào CSDL thành giá trị rỗng.
      phoneNumber: duLieu.phoneNumber || undefined,
      address: duLieu.address || undefined,
    })

    if (loi) {
      setError('root', { message: layThongBaoLoi(loi) })
      return
    }

    navigate('/', { replace: true })
  }

  return (
    <div className="card mx-auto mt-8 max-w-md p-6">
      <h1 className="text-xl font-bold text-gray-900">Đăng ký tài khoản</h1>
      <p className="mt-1 text-sm text-gray-500">
        Tài khoản mặc định là khách. Quyền quản trị do Admin cấp, không tự chọn được.
      </p>

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit(xuLyPhatSubmit)} noValidate>
        <FormMessage loi={errors.root?.message} />

        <Input
          label="Họ và tên"
          autoComplete="name"
          loi={errors.fullName?.message}
          {...register('fullName')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          loi={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          loi={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          loi={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Input
          label="Số điện thoại (không bắt buộc)"
          autoComplete="tel"
          loi={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />

        <Input
          label="Địa chỉ (không bắt buộc)"
          autoComplete="street-address"
          loi={errors.address?.message}
          {...register('address')}
        />

        <Button type="submit" dangTai={dangXuLy} className="mt-1 w-full">
          Đăng ký
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Đã có tài khoản?{' '}
        <Link to="/login" className="font-medium text-brand-700 hover:underline">
          Đăng nhập
        </Link>
      </p>
    </div>
  )
}
