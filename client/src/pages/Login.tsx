import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { useAuth } from '../hooks/useAuth'
import { schemaDangNhap } from '../schemas/authSchemas'
import type { DangNhapForm } from '../schemas/authSchemas'

/**
 * Quy tắc kiểm tra ở giao diện nằm ở `schemas/authSchemas.ts` — lý do tách
 * (test được, không lặp giữa 3 màn hình) ghi ngay đầu file đó.
 *
 * Ở đây CHỈ kiểm "bắt buộc nhập", còn lại để server trả lỗi: server chỉ kiểm khi
 * bấm nút, nên nếu bắt quá nhiều ở giao diện thì giao diện và API sẽ nói hai
 * kiểu cho cùng một thao tác. Email cố tình không kiểm định dạng vì backend
 * trả **409** cho cả email sai định dạng lẫn email trùng.
 */

export default function Login(): JSX.Element {
  const { dangNhap, dangXuLy, daDangNhap } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<DangNhapForm>({
    resolver: zodResolver(schemaDangNhap),
    defaultValues: { email: '', password: '' },
  })

  // Đã đăng nhập rồi thì không cần ở lại trang đăng nhập.
  if (daDangNhap) {
    return <Navigate to="/" replace />
  }

  const xuLyPhatSubmit = async (duLieu: DangNhapForm): Promise<void> => {
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
        <Link to="/register" className="font-medium text-amber-700 hover:underline">
          Đăng ký ngay
        </Link>
      </p>
    </div>
  )
}
