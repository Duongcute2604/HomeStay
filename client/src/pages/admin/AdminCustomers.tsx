import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import { adminService } from '../../services/adminService'
import { useToastStore } from '../../store/toastStore'
import type { CustomerPayload } from '../../types/admin'
import { formatNgay } from '../../utils/format'

const FORM_RONG: CustomerPayload = {
  fullName: '',
  email: '',
  phoneNumber: '',
  password: '',
}

/**
 * Trang quản lý khách hàng (Bước 12).
 *
 * Gộp "đơn" vào trang này (theo yêu cầu): Admin nhìn một danh sách khách, mỗi
 * dòng có số đơn đã đặt, tài khoản khoá/mở khoá ngay tại chỗ — không rời sang
 * trang thứ hai chỉ để tìm một người.
 *
 * KHÔNG có nút xoá khách: xoá làm mất luôn lịch sử đơn. Vi phạm thì chỉ khoá
 * tài khoản, giữ nguyên dữ liệu giao dịch.
 */
export default function AdminCustomers(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [dangMoForm, setDangMoForm] = useState(false)
  const [form, setForm] = useState<CustomerPayload>(FORM_RONG)
  const [loiForm, setLoiForm] = useState<string | null>(null)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => adminService.layDanhSachKhach(),
  })

  const tao = useMutation({
    mutationFn: (payload: CustomerPayload) => adminService.taoKhach(payload),
    onSuccess: async () => {
      themToast('Đã tạo tài khoản khách hàng', 'success')
      dongForm()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
  })

  const doiTrangThai = useMutation({
    mutationFn: (bien: { id: number; isLocked: boolean }) =>
      adminService.doiTrangThaiKhach(bien.id, bien.isLocked),
    onSuccess: async (_, bien) => {
      themToast(bien.isLocked ? 'Đã khoá tài khoản' : 'Đã mở khoá tài khoản', 'success')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] })
    },
  })

  function dongForm(): void {
    setDangMoForm(false)
    setForm(FORM_RONG)
    setLoiForm(null)
  }

  function kiemTra(): string | null {
    if (form.fullName.trim() === '') {
      return 'Vui lòng nhập họ và tên'
    }
    if (!form.email.includes('@')) {
      return 'Email không hợp lệ, ví dụ: ten@gmail.com'
    }
    if (form.password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự'
    }
    return null
  }

  function submit(event: React.FormEvent): void {
    event.preventDefault()
    const loi = kiemTra()

    if (loi !== null) {
      setLoiForm(loi)
      return
    }

    setLoiForm(null)
    tao.mutate(form)
  }

  if (isPending) {
    return <p className="text-center text-sm text-stone-500">Đang tải danh sách khách hàng...</p>
  }

  if (isError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    )
  }

  const danhSach = data ?? []

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Khách hàng</h1>
          <p className="text-sm text-stone-500">
            {danhSach.length} tài khoản · {danhSach.filter((k) => k.isLocked).length} đang bị khoá
          </p>
        </div>
        <Button onClick={() => setDangMoForm(true)}>Thêm khách hàng</Button>
      </header>

      {dangMoForm && (
        <form onSubmit={submit} className="card-phong mt-5 grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-stone-800 sm:col-span-2">
            Thêm tài khoản khách hàng
          </h2>
          <p className="text-xs text-stone-500 sm:col-span-2">
            Dùng khi khách gọi điện đặt trước. Nhớ báo lại mật khẩu để khách tự đổi
            sau lần đăng nhập đầu tiên.
          </p>

          <label className="text-sm font-medium text-stone-700">
            Họ và tên
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Email
            <input
              type="email"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Số điện thoại
            <input
              className="number-vn mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.phoneNumber ?? ''}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Mật khẩu tạm
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>

          <FormMessage loi={loiForm ?? (tao.isError ? layThongBaoLoi(tao.error) : null)} />

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" dangTai={tao.isPending}>
              Tạo tài khoản
            </Button>
            <Button type="button" bienDang="outline" onClick={dongForm}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      {danhSach.length === 0 ? (
        <p className="card mt-5 p-6 text-center text-sm text-stone-500">
          Chưa có tài khoản khách hàng nào.
        </p>
      ) : (
        <div className="card-phong mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-amber-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Số điện thoại</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
                <th className="px-4 py-3">Ngày đăng ký</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((khach, chiSo) => (
                <tr key={khach.id} className="border-t border-stone-100">
                  <td className="number-vn px-4 py-3 text-left">{chiSo + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{khach.fullName}</p>
                    <p className="text-xs text-stone-500">{khach.email}</p>
                  </td>
                  <td className="number-vn px-4 py-3 text-stone-600">
                    {khach.phoneNumber ?? '—'}
                  </td>
                  <td className="number-vn px-4 py-3 text-right">{khach.totalBookings}</td>
                  <td className="px-4 py-3 text-stone-600">{formatNgay(khach.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        khach.isLocked
                          ? 'rounded-full bg-red-100 px-2 py-1 text-xs text-red-700'
                          : 'rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700'
                      }
                    >
                      {khach.isLocked ? 'Đã khoá' : 'Đang hoạt động'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      bienDang="outline"
                      onClick={() =>
                        doiTrangThai.mutate({ id: khach.id, isLocked: !khach.isLocked })
                      }
                    >
                      {khach.isLocked ? 'Mở khoá' : 'Khoá'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {doiTrangThai.isError && (
        <p className="mt-3 text-sm text-red-600">{layThongBaoLoi(doiTrangThai.error)}</p>
      )}
    </section>
  )
}
