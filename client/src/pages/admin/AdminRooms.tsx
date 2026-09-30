import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import { adminService } from '../../services/adminService'
import { useToastStore } from '../../store/toastStore'
import type { AdminRoom, Amenity, RoomPayload } from '../../types/admin'
import { NHAN_LOAI_PHONG, NHAN_TRANG_THAI_PHONG, RoomStatus, RoomType } from '../../types/location'
import { formatVnd } from '../../utils/format'

/** Form rỗng cho phòng mới. `locationId` sẽ được chọn ở ô đầu tiên. */
const FORM_RONG: RoomPayload = {
  locationId: 0,
  name: '',
  roomNumber: '',
  roomType: RoomType.COZY,
  capacity: 2,
  pricePerHour: 120000,
  pricePerDay: 850000,
  description: '',
  imageUrls: [],
  amenityIds: [],
}

const TRANG_THAI: RoomStatus[] = [
  RoomStatus.AVAILABLE,
  RoomStatus.BOOKED,
  RoomStatus.OCCUPIED,
  RoomStatus.CLEANING,
  RoomStatus.MAINTENANCE,
]

/**
 * Trang quản lý phòng (Bước 12).
 *
 * Ảnh phòng nhập bằng đường dẫn tới file trong `public/images`, không upload
 * lên máy chủ. Đồ án này không có bước lưu trữ tệp; nếu sau này cần upload thật
 * thì thay chỗ nhập này, còn phần còn lại của trang không phải sửa.
 */
export default function AdminRooms(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [dangMoForm, setDangMoForm] = useState(false)
  const [dangSua, setDangSua] = useState<AdminRoom | null>(null)
  const [form, setForm] = useState<RoomPayload>(FORM_RONG)
  const [loiForm, setLoiForm] = useState<string | null>(null)
  const [dangXoa, setDangXoa] = useState<number | null>(null)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'rooms'],
    queryFn: () => adminService.layDanhSachPhong(),
  })

  const { data: danhMucTienNgh } = useQuery({
    queryKey: ['admin', 'amenities'],
    queryFn: () => adminService.layDanhSachTienNgh(),
  })

  const { data: danhSachCoSo } = useQuery({
    queryKey: ['admin', 'locations'],
    queryFn: () => adminService.layDanhSachCoSo(),
  })

  const luu = useMutation({
    mutationFn: (payload: { id: number | null; duLieu: RoomPayload }) =>
      payload.id === null
        ? adminService.taoPhong(payload.duLieu)
        : adminService.suaPhong(payload.id, payload.duLieu),
    onSuccess: async (_, bien) => {
      themToast(bien.id === null ? 'Đã tạo phòng mới' : 'Đã cập nhật phòng', 'success')
      dongForm()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] })
    },
  })

  const doiTrangThai = useMutation({
    mutationFn: (bien: { id: number; status: RoomStatus }) =>
      adminService.doiTrangThaiPhong(bien.id, bien.status),
    onSuccess: async () => {
      themToast('Đã cập nhật trạng thái phòng', 'success')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] })
    },
  })

  const xoa = useMutation({
    mutationFn: (id: number) => adminService.xoaPhong(id),
    onSuccess: async () => {
      themToast('Đã xoá phòng', 'success')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'rooms'] })
    },
  })

  function dongForm(): void {
    setDangMoForm(false)
    setDangSua(null)
    setForm(FORM_RONG)
    setLoiForm(null)
  }

  function moForm(phong: AdminRoom | null): void {
    setDangMoForm(true)
    setDangSua(phong)
    setLoiForm(null)
    setForm(
      phong === null
        ? { ...FORM_RONG, locationId: danhSachCoSo?.[0]?.id ?? 0 }
        : {
            locationId: danhSachCoSo?.find((c) => c.name === phong.locationName)?.id ?? 0,
            name: phong.name,
            roomNumber: phong.roomNumber,
            roomType: phong.roomType,
            capacity: phong.capacity,
            pricePerHour: phong.pricePerHour,
            pricePerDay: phong.pricePerDay,
            description: phong.description ?? '',
            imageUrls: phong.images,
            amenityIds: phong.amenityIds,
          },
    )
  }

  function kiemTra(): string | null {
    if (form.locationId === 0) {
      return 'Vui lòng chọn cơ sở chứa phòng'
    }
    if (form.name.trim() === '') {
      return 'Vui lòng nhập tên phòng'
    }
    if (form.roomNumber.trim() === '') {
      return 'Vui lòng nhập số phòng'
    }
    if (form.capacity < 1) {
      return 'Số khách tối đa phải ít nhất là 1'
    }
    if (form.pricePerHour <= 0 || form.pricePerDay <= 0) {
      return 'Giá theo giờ và theo ngày phải lớn hơn 0'
    }
    if (form.imageUrls.length > 10) {
      return 'Mỗi phòng chỉ được có tối đa 10 ảnh'
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

  function xuLyXoa(phong: AdminRoom): void {
    if (dangXoa !== phong.id) {
      setDangXoa(phong.id)
      return
    }

    setDangXoa(null)
    xoa.mutate(phong.id)
  }

  if (isPending) {
    return <p className="text-center text-sm text-stone-500">Đang tải danh sách phòng...</p>
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
          <h1 className="text-2xl font-bold text-stone-800">Phòng</h1>
          <p className="text-sm text-stone-500">Tổng {danhSach.length} phòng trong hệ thống</p>
        </div>
        <Button onClick={() => moForm(null)}>Thêm phòng</Button>
      </header>

      {dangMoForm && (
        <form onSubmit={submit} className="card-phong mt-5 grid gap-4 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-stone-800 sm:col-span-2">
            {dangSua === null ? 'Thêm phòng' : `Sửa: ${dangSua.name}`}
          </h2>

          <label className="text-sm font-medium text-stone-700">
            Cơ sở
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.locationId}
              onChange={(e) => setForm({ ...form, locationId: Number(e.target.value) })}
            >
              <option value={0}>-- Chọn cơ sở --</option>
              {(danhSachCoSo ?? []).map((coSo) => (
                <option key={coSo.id} value={coSo.id}>
                  {coSo.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-stone-700">
            Concept
            <select
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.roomType}
              onChange={(e) => setForm({ ...form, roomType: Number(e.target.value) as RoomType })}
            >
              {Object.values(RoomType).map((loai) => (
                <option key={loai} value={loai}>
                  {NHAN_LOAI_PHONG[loai]}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-medium text-stone-700">
            Tên phòng
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Số phòng
            <input
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.roomNumber}
              onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Số khách tối đa
            <input
              type="number"
              min={1}
              max={20}
              className="number-vn mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Giá 1 giờ (VNĐ)
            <input
              type="number"
              min={0}
              className="number-vn mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.pricePerHour}
              onChange={(e) => setForm({ ...form, pricePerHour: Number(e.target.value) })}
            />
          </label>

          <label className="text-sm font-medium text-stone-700">
            Giá 1 ngày (VNĐ)
            <input
              type="number"
              min={0}
              className="number-vn mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.pricePerDay}
              onChange={(e) => setForm({ ...form, pricePerDay: Number(e.target.value) })}
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

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-stone-700">Ảnh phòng</p>
            <p className="text-xs text-stone-500">
              Mỗi dòng một đường dẫn trong thư mục <code>public/images</code>. Ảnh đầu
              tiên là ảnh chính.
            </p>
            <textarea
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              rows={3}
              value={form.imageUrls.join('\n')}
              onChange={(e) =>
                setForm({
                  ...form,
                  imageUrls: e.target.value
                    .split('\n')
                    .map((s) => s.trim())
                    .filter((s) => s !== ''),
                })
              }
            />
            {form.imageUrls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {form.imageUrls.map((duongDan, i) => (
                  <img
                    key={duongDan}
                    src={duongDan}
                    alt={i === 0 ? 'Ảnh chính' : `Ảnh phụ ${i}`}
                    className="h-16 w-24 rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <p className="text-sm font-medium text-stone-700">Tiện nghi trong phòng</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {(danhMucTienNgh ?? []).map((tienNgh: Amenity) => (
                <label key={tienNgh.id} className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.amenityIds.includes(tienNgh.id)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amenityIds: e.target.checked
                          ? [...form.amenityIds, tienNgh.id]
                          : form.amenityIds.filter((id) => id !== tienNgh.id),
                      })
                    }
                  />
                  {tienNgh.name}
                </label>
              ))}
            </div>
          </div>

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
          Chưa có phòng nào. Bấm "Thêm phòng" để bắt đầu.
        </p>
      ) : (
        <div className="card-phong mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-amber-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Phòng</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3 text-right">Khách</th>
                <th className="px-4 py-3 text-right">Giá giờ</th>
                <th className="px-4 py-3 text-right">Giá ngày</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((phong, chiSo) => (
                <tr key={phong.id} className="border-t border-stone-100">
                  <td className="number-vn px-4 py-3 text-left">{chiSo + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {phong.images[0] !== undefined && (
                        <img
                          src={phong.images[0]}
                          alt={phong.name}
                          className="h-10 w-16 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-stone-800">{phong.name}</p>
                        <p className="text-xs text-stone-500">
                          {phong.roomNumber} · {NHAN_LOAI_PHONG[phong.roomType]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{phong.locationName}</td>
                  <td className="number-vn px-4 py-3 text-right">{phong.capacity}</td>
                  <td className="number-vn px-4 py-3 text-right">{formatVnd(phong.pricePerHour)}</td>
                  <td className="number-vn px-4 py-3 text-right">{formatVnd(phong.pricePerDay)}</td>
                  <td className="px-4 py-3">
                    <select
                      className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
                      value={phong.status}
                      onChange={(e) =>
                        doiTrangThai.mutate({
                          id: phong.id,
                          status: Number(e.target.value) as RoomStatus,
                        })
                      }
                    >
                      {TRANG_THAI.map((tt) => (
                        <option key={tt} value={tt}>
                          {NHAN_TRANG_THAI_PHONG[tt]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Button bienDang="outline" onClick={() => moForm(phong)}>
                        Sửa
                      </Button>
                      <button
                        type="button"
                        onClick={() => xuLyXoa(phong)}
                        className={
                          dangXoa === phong.id
                            ? 'rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700'
                            : 'rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-red-50 hover:text-red-600'
                        }
                      >
                        {dangXoa === phong.id ? 'Chắc chắn xoá?' : 'Xoá'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(xoa.isError || doiTrangThai.isError) && (
        <p className="mt-3 text-sm text-red-600">
          {layThongBaoLoi(xoa.error ?? doiTrangThai.error)}
        </p>
      )}
    </section>
  )
}
