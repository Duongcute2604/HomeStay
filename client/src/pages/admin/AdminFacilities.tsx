import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import { adminService } from '../../services/adminService'
import { useToastStore } from '../../store/toastStore'
import type { AdminLocation, FacilityPayload } from '../../types/admin'

/** Form rỗng cho cơ sở mới — không sửa thì nên trả về đúng object này. */
const FORM_RONG: FacilityPayload = {
  name: '',
  city: '',
  province: '',
  address: '',
  description: '',
  imageUrl: '',
  isActive: true,
}

/**
 * Trang quản lý cơ sở (Bước 12).
 *
 * Thêm / sửa dùng chung một form, chỉ khác ở chỗ bấm "Lưu" sẽ gọi `taoCoSo`
 * hay `suaCoSo`. Tách hai form riêng sẽ lặp lại 6 trường — lỗi dễ xảy ra là
 * sửa tên nhưng quên sửa cả tỉnh.
 *
 * Xoá phải bấm 2 lần mới thực sự xoá. Một cú bấm nhầm là mất cả cơ sở, mà
 * `window.confirm` thì chặn cả trang — dùng cùng cách với trang "Đơn của tôi".
 */
export default function AdminFacilities(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [dangMoForm, setDangMoForm] = useState(false)
  const [dangSua, setDangSua] = useState<AdminLocation | null>(null)
  const [form, setForm] = useState<FacilityPayload>(FORM_RONG)
  const [loiForm, setLoiForm] = useState<string | null>(null)
  const [dangXoa, setDangXoa] = useState<number | null>(null)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.layDanhSachCoSo(),
  })

  const luu = useMutation({
    mutationFn: (payload: { id: number | null; duLieu: FacilityPayload }) =>
      payload.id === null
        ? adminService.taoCoSo(payload.duLieu)
        : adminService.suaCoSo(payload.id, payload.duLieu),
    onSuccess: async (_, bien) => {
      themToast(bien.id === null ? 'Đã tạo cơ sở mới' : 'Đã cập nhật cơ sở', 'success')
      dongForm()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] })
    },
  })

  const xoa = useMutation({
    mutationFn: (id: number) => adminService.xoaCoSo(id),
    onSuccess: async () => {
      themToast('Đã xoá cơ sở', 'success')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'locations'] })
    },
  })

  function dongForm(): void {
    setDangMoForm(false)
    setDangSua(null)
    setForm(FORM_RONG)
    setLoiForm(null)
  }

  function moForm(coSo: AdminLocation | null): void {
    setDangMoForm(true)
    setDangSua(coSo)
    setLoiForm(null)
    setForm(
      coSo === null
        ? FORM_RONG
        : {
            name: coSo.name,
            city: coSo.city,
            province: coSo.province,
            address: coSo.address,
            description: coSo.description ?? '',
            imageUrl: coSo.imageUrl ?? '',
            isActive: coSo.isActive,
          },
    )
  }

  function kiemTra(): string | null {
    if (form.name.trim() === '') {
      return 'Vui lòng nhập tên cơ sở'
    }
    if (form.address.trim() === '') {
      return 'Vui lòng nhập địa chỉ'
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
    luu.mutate({ id: dangSua?.id ?? null, duLieu: form })
  }

  function xuLyXoa(coSo: AdminLocation): void {
    if (dangXoa !== coSo.id) {
      setDangXoa(coSo.id)
      return
    }

    setDangXoa(null)
    xoa.mutate(coSo.id)
  }

  if (isPending) {
    return <p className="text-center text-sm text-stone-500">Đang tải danh sách cơ sở...</p>
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
          <h1 className="text-2xl font-bold text-stone-800">Cơ sở</h1>
          <p className="text-sm text-stone-500">
            Tổng {danhSach.length} cơ sở · {danhSach.reduce((t, c) => t + c.totalRooms, 0)} phòng
          </p>
        </div>
        <Button onClick={() => moForm(null)}>Thêm cơ sở</Button>
      </header>

      {dangMoForm && (
        <form onSubmit={submit} className="card-phong mt-5 grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-stone-800 sm:col-span-2">
            {dangSua === null ? 'Thêm cơ sở' : `Sửa: ${dangSua.name}`}
          </h2>

          <label className="text-sm font-medium text-stone-700">
            Tên cơ sở
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Ảnh đại diện (đường dẫn trong thư mục public/images)
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.imageUrl ?? ''}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Quận / Huyện
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Tỉnh / Thành phố
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.province}
              onChange={(e) => setForm({ ...form, province: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700 sm:col-span-2">
            Địa chỉ
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700 sm:col-span-2">
            Mô tả
            <textarea
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Đang hoạt động (khách tìm thấy cơ sở này)
          </label>

          <FormMessage loi={loiForm ?? (luu.isError ? layThongBaoLoi(luu.error) : null)} />

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" dangTai={luu.isPending}>
              Lưu
            </Button>
            <Button type="button" bienDang="outline" onClick={dongForm}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      {danhSach.length === 0 ? (
        <p className="card mt-5 p-6 text-center text-sm text-stone-500">
          Chưa có cơ sở nào. Bấm "Thêm cơ sở" để bắt đầu.
        </p>
      ) : (
        <div className="card-phong mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-amber-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Tên cơ sở</th>
                <th className="px-4 py-3">Địa chỉ</th>
                <th className="px-4 py-3 text-right">Số phòng</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((coSo, chiSo) => (
                <tr key={coSo.id} className="border-t border-stone-100">
                  <td className="number-vn px-4 py-3 text-left">{chiSo + 1}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-800">{coSo.name}</p>
                    <p className="text-xs text-stone-500">
                      {coSo.city}, {coSo.province}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{coSo.address}</td>
                  <td className="number-vn px-4 py-3 text-right">{coSo.totalRooms}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        coSo.isActive
                          ? 'rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-700'
                          : 'rounded-full bg-stone-200 px-2 py-1 text-xs text-stone-600'
                      }
                    >
                      {coSo.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button bienDang="outline" onClick={() => moForm(coSo)}>
                        Sửa
                      </Button>
                      <button
                        type="button"
                        onClick={() => xuLyXoa(coSo)}
                        className={
                          dangXoa === coSo.id
                            ? 'rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700'
                            : 'rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-red-50 hover:text-red-600'
                        }
                      >
                        {dangXoa === coSo.id ? 'Chắc chắn xoá?' : 'Xoá'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {xoa.isError && (
        <p className="mt-3 text-sm text-red-600">{layThongBaoLoi(xoa.error)}</p>
      )}
    </section>
  )
}
