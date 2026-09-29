import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'

/**
 * Quy tắc kiểm tra ở giao diện.
 *
 * Ghi rõ "phải báo lỗi ở đây" chứ không phải chờ server trả lỗi, vì server chỉ
 * kiểm khi bấm nút — người dùng phải điền hết form mới biết mật khẩu quá ngắn.
 *
 * Email cố tình CHỈ kiểm rỗng, không kiểm định dạng: backend dùng `EmailValidator`
 * và trả **409** cho cả email sai định dạng lẫn email trùng (quyết định đã
 * chốt ở Bước 5). Nếu ở đây bắt sai định dạng thì thông báo và mã lỗi sẽ
 * lệch với server — giao diện và API nói hai kiểu.
 */
const schema = z.object({
  email: z.string().min(1, 'Vui lòng nhập email'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

// Kiểu form suy ra thẳng từ schema, không khai tay 2 lần (AGENTS.md mục 7.2).
type LoginForm = z.infer<typeof schema>

export default function Login(): JSX.Element {
  const { dangNhap, dangXuLy, daDangNhap } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  })

  // Đã đăng nhập rồi thì không cần ở lại trang đăng nhập.
  if (daDangNhap) {
    return <Navigate to="/" replace />
  }

  const xuLyPhatSubmit = async (duLieu: LoginForm): Promise<void> => {
    const loi = await dangNhap(duLieu)

    if (loi) {
      // Lỗi trả về không thuộc ô nào cụ thể (sai mật khẩu, email không tồn tại,
      // tài khoản bị khoá) nên bỏ vào `root` và hiện ở đầu form.
      setError('root', { message: layThongBaoLoi(loi) })
      return
    }

    // Quay lại trang người dùng định vào trước khi bị chặn, nếu có.
    const dich = location.state as { from?: string } | null
    navigate(dich?.from ?? '/', { replace: true })
  }

  return (
    <div className="card mx-auto mt-8 max-w-md p-6">
      <h1 className="text-xl font-bold text-gray-900">Đăng nhập</h1>
      <p className="mt-1 text-sm text-gray-500">Đăng nhập để đặt phòng và quản lý đơn của bạn.</p>

      <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit(xuLyPhatSubmit)} noValidate>
        <FormMessage loi={errors.root?.message} />

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
          autoComplete="current-password"
          loi={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" dangTai={dangXuLy} className="mt-1 w-full">
          Đăng nhập
        </Button>
      </form>

      <p className="mt-4 text-sm text-gray-600">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-medium text-brand-700 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
