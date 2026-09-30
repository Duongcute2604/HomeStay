import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import { adminService } from '../../services/adminService'
import { useToastStore } from '../../store/toastStore'
import type { AdminBooking, AdminBookingFilter } from '../../types/admin'
// `BookingStatus` khai báo dạng const + type cùng tên nên một import này dùng
// được cho cả giá trị lẫn kiểu.
import { BookingStatus, NHAN_TRANG_THAI_DON } from '../../types/booking'
import { formatNgay, formatVnd } from '../../utils/format'

/** Bộ lọc mặc định: xem tất cả, trang 1. */
const LOC_MAC_DINH: AdminBookingFilter = {
  status: null,
  keyword: '',
  page: 1,
  pageSize: 10,
}

/** Danh sách trạng thái cho ô chọn lọc. */
const TRANG_THAI_LOC: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.CHECKED_IN,
  BookingStatus.COMPLETED,
  BookingStatus.CANCELLED,
  BookingStatus.REJECTED,
]

/**
 * Màu thẻ trạng thái — cùng bộ màu với `MyBookings` để nhìn 2 màn hình
 * không bị cảm giác khác hệ thống.
 */
function lopTheoTrangThai(trangThai: BookingStatus): string {
  switch (trangThai) {
    case BookingStatus.PENDING:
      return 'bg-amber-100 text-amber-800'
    case BookingStatus.CONFIRMED:
      return 'bg-sky-100 text-sky-800'
    case BookingStatus.CHECKED_IN:
      return 'bg-indigo-100 text-indigo-800'
    case BookingStatus.COMPLETED:
      return 'bg-emerald-100 text-emerald-800'
    case BookingStatus.REJECTED:
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-stone-200 text-stone-700'
  }
}

/**
 * Trang quản lý đơn đặt phòng (Bước 13).
 *
 * Đây là nơi Admin điều khiển vòng đời phòng: khách đặt → xác nhận (hoặc từ
 * chối kèm lý do) → nhận phòng → trả phòng. Mỗi bước là một nút riêng, KHÔNG
 * phải ô chọn trạng thái tùy ý — vì nhảy cóc trạng thái (vd nhận phòng khi đơn
 * còn chờ xác nhận) sẽ làm mất dấu vết phê duyệt, và server cũng chặn 409.
 *
 * Vì sao không dùng ô chọn trạng thái như trang "Phòng": ô chọn cho phép chọn
 * bất kỳ trạng thái nào, tức là giao diện tự cho phép làm việc mà nghiệp vụ
 * không cho. Hiện đúng những hành động hợp lệ là an toàn hơn.
 */
export default function AdminBookings(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [loc, setLoc] = useState<AdminBookingFilter>(LOC_MAC_DINH)
  const [tuKhoaNhap, setTuKhoaNhap] = useState('')
  const [donDangTuChoi, setDonDangTuChoi] = useState<AdminBooking | null>(null)
  const [lyDo, setLyDo] = useState('')
  const [loi, setLoi] = useState<string | null>(null)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'bookings', loc],
    queryFn: () => adminService.layDanhSachDon(loc),
  })

  const chuyenTrangThai = useMutation({
    mutationFn: (bien: { code: string; hanhDong: 'xacNhan' | 'checkIn' | 'checkOut' }) => {
      if (bien.hanhDong === 'xacNhan') {
        return adminService.xacNhanDon(bien.code)
      }
      if (bien.hanhDong === 'checkIn') {
        return adminService.checkInDon(bien.code)
      }
      return adminService.checkOutDon(bien.code)
    },
    onSuccess: async (_, bien) => {
      const nhan: Record<string, string> = {
        xacNhan: 'Đã xác nhận đơn',
        checkIn: 'Đã cho khách nhận phòng',
        checkOut: 'Đã trả phòng, phòng đang vệ sinh',
      }
      themToast(nhan[bien.hanhDong], 'success')
      await queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    },
    onError: (err) => {
      setLoi(layThongBaoLoi(err))
    },
  })

  const tuChoi = useMutation({
    mutationFn: (bien: { code: string; lyDo: string }) => adminService.tuChoiDon(bien.code, bien.lyDo),
    onSuccess: async () => {
      themToast('Đã từ chối đơn và gửi lý do cho khách', 'success')
      dongFormTuChoi()
      await queryClient.invalidateQueries({ queryKey: ['admin', 'bookings'] })
    },
    onError: (err) => {
      setLoi(layThongBaoLoi(err))
    },
  })

  function dongFormTuChoi(): void {
    setDonDangTuChoi(null)
    setLyDo('')
    setLoi(null)
  }

  function moFormTuChoi(don: AdminBooking): void {
    setDonDangTuChoi(don)
    setLyDo('')
    setLoi(null)
  }

  function doiLoc(locMoi: Partial<AdminBookingFilter>): void {
    // Đổi bộ lọc phải về trang 1 — giữ nguyên trang 2 khi lọc mới sẽ ra
    // trang trống dù còn dữ liệu.
    setLoc({ ...loc, ...locMoi, page: 1 })
  }

  function xuLyTuChoi(event: React.FormEvent): void {
    event.preventDefault()

    if (donDangTuChoi === null) {
      return
    }

    if (lyDo.trim() === '') {
      setLoi('Vui lòng nhập lý do để khách biết vì sao đơn bị từ chối')
      return
    }

    tuChoi.mutate({ code: donDangTuChoi.code, lyDo: lyDo.trim() })
  }

  if (isPending) {
    return <p className="text-center text-sm text-stone-500">Đang tải danh sách đơn...</p>
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

  const danhSach = data?.items ?? []
  const tongTrang = data?.totalPages ?? 0

  return (
    <section>
      <header>
        <h1 className="text-2xl font-bold text-stone-800">Đơn đặt phòng</h1>
        <p className="text-sm text-stone-500">{data?.totalItems ?? 0} đơn trong hệ thống</p>
      </header>

      {/* Bộ lọc: trạng thái + từ khoá. Không lọc cũng dùng được — đây là mặc
          định để Admin không bắt buộc phải chọn gì mới xem được danh sách. */}
      <div className="card-phong mt-5 flex flex-wrap items-end gap-3 p-4">
        <label className="text-sm font-medium text-stone-700">
          Trạng thái
          <select
            aria-label="Lọc theo trạng thái"
            className="mt-1 block rounded-lg border border-stone-300 px-3 py-2"
            value={loc.status ?? ''}
            onChange={(e) =>
              doiLoc({
                status: e.target.value === '' ? null : Number(e.target.value) as BookingStatus,
              })
            }
          >
            <option value="">Tất cả</option>
            {TRANG_THAI_LOC.map((tt) => (
              <option key={tt} value={tt}>
                {NHAN_TRANG_THAI_DON[tt]}
              </option>
            ))}
          </select>
        </label>

        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            doiLoc({ keyword: tuKhoaNhap })
          }}
        >
          <label className="text-sm font-medium text-stone-700">
            Tìm theo mã đơn / tên / email
            <input
              className="mt-1 block w-64 rounded-lg border border-stone-300 px-3 py-2"
              value={tuKhoaNhap}
              onChange={(e) => setTuKhoaNhap(e.target.value)}
              placeholder="VD: HS-260930-0001"
            />
          </label>
          <Button type="submit" bienDang="outline">
            Tìm
          </Button>
          {loc.keyword !== '' && (
            <Button
              type="button"
              bienDang="outline"
              onClick={() => {
                setTuKhoaNhap('')
                doiLoc({ keyword: '' })
              }}
            >
              Bỏ lọc
            </Button>
          )}
        </form>
      </div>

      {loi !== null && (
        <div className="mt-3">
          <FormMessage loi={loi} />
        </div>
      )}

      {donDangTuChoi !== null && (
        <form onSubmit={xuLyTuChoi} className="card-phong mt-4 border-l-4 border-l-red-400 p-4">
          <p className="text-sm font-medium text-stone-700">
            Từ chối đơn <span className="number-vn">{donDangTuChoi.code}</span> — nhập lý do
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Khách sẽ thấy lý do này trong trang "Đơn của tôi". Nên ghi rõ cụ thể (ví dụ "phòng
            đang bảo trì") thay vì "không đồng ý".
          </p>
          <textarea
            className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2"
            rows={2}
            aria-label="Lý do từ chối"
            value={lyDo}
            onChange={(e) => setLyDo(e.target.value)}
          />
          <div className="mt-2 flex gap-2">
            <Button type="submit" dangTai={tuChoi.isPending}>
              Xác nhận từ chối
            </Button>
            <Button type="button" bienDang="outline" onClick={dongFormTuChoi}>
              Huỷ
            </Button>
          </div>
        </form>
      )}

      {danhSach.length === 0 ? (
        <p className="card mt-5 p-6 text-center text-sm text-stone-500">
          Không có đơn nào khớp bộ lọc hiện tại.
        </p>
      ) : (
        <div className="card-phong mt-5 overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="bg-amber-50 text-left text-stone-600">
              <tr>
                <th className="w-12 px-3 py-3">STT</th>
                <th className="whitespace-nowrap px-3 py-3">Mã đơn</th>
                <th className="px-3 py-3">Người đặt</th>
                <th className="px-3 py-3">Phòng</th>
                <th className="whitespace-nowrap px-3 py-3">Nhận → trả</th>
                <th className="whitespace-nowrap px-3 py-3 text-right">Tiền</th>
                <th className="px-3 py-3">Trạng thái</th>
                <th className="whitespace-nowrap px-3 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((don, chiSo) => (
                <tr key={don.code} className="border-t border-stone-100 align-top">
                  <td className="number-vn px-3 py-3 text-left">
                    {(loc.page - 1) * loc.pageSize + chiSo + 1}
                  </td>
                  <td className="number-vn whitespace-nowrap px-3 py-3 font-medium text-amber-700">
                    {don.code}
                  </td>
                  <td className="px-3 py-3">
                    <p className="whitespace-nowrap text-stone-800">{don.customerName}</p>
                    <p className="number-vn whitespace-nowrap text-xs text-stone-500">
                      {don.customerPhone ?? '—'}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-stone-600">
                    <p className="whitespace-nowrap">{don.roomName}</p>
                    {/* Số khách gộp vào cột phòng để bảng bớt cột: bảng quá rộng
                        thì cột "Thao tác" bị đẩy ra ngoài màn hình, mà đó lại là
                        cột quan trọng nhất. */}
                    <p className="number-vn whitespace-nowrap text-xs text-stone-500">
                      {don.locationName} · {don.guestCount} khách
                    </p>
                  </td>
                  <td className="number-vn whitespace-nowrap px-3 py-3 text-xs text-stone-600">
                    <p>{formatNgay(don.checkIn)}</p>
                    <p className="text-stone-400">→ {formatNgay(don.checkOut)}</p>
                  </td>
                  <td className="number-vn whitespace-nowrap px-3 py-3 text-right font-medium">
                    {formatVnd(don.totalAmount)}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${lopTheoTrangThai(don.status)}`}
                    >
                      {NHAN_TRANG_THAI_DON[don.status]}
                    </span>
                    {don.status === BookingStatus.REJECTED && don.cancelReason !== null && (
                      <p className="mt-1 max-w-[180px] text-xs text-stone-500">
                        {don.cancelReason}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      {don.status === BookingStatus.PENDING && (
                        <>
                          <Button
                            bienDang="outline"
                            onClick={() =>
                              chuyenTrangThai.mutate({ code: don.code, hanhDong: 'xacNhan' })
                            }
                          >
                            Xác nhận
                          </Button>
                          <button
                            type="button"
                            onClick={() => moFormTuChoi(don)}
                            className="whitespace-nowrap rounded-lg px-2 py-1 text-xs text-stone-500 hover:bg-red-50 hover:text-red-600"
                          >
                            Từ chối
                          </button>
                        </>
                      )}

                      {don.status === BookingStatus.CONFIRMED && (
                        <Button
                          bienDang="outline"
                          onClick={() =>
                            chuyenTrangThai.mutate({ code: don.code, hanhDong: 'checkIn' })
                          }
                        >
                          Nhận phòng
                        </Button>
                      )}

                      {don.status === BookingStatus.CHECKED_IN && (
                        <Button
                          bienDang="outline"
                          onClick={() =>
                            chuyenTrangThai.mutate({ code: don.code, hanhDong: 'checkOut' })
                          }
                        >
                          Trả phòng
                        </Button>
                      )}

                      {(don.status === BookingStatus.COMPLETED
                        || don.status === BookingStatus.CANCELLED
                        || don.status === BookingStatus.REJECTED) && (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tongTrang > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-2" aria-label="Phân trang đơn">
          <Button
            bienDang="outline"
            disabled={loc.page <= 1}
            onClick={() => setLoc({ ...loc, page: loc.page - 1 })}
          >
            Trang trước
          </Button>
          <span className="number-vn text-sm text-stone-600">
            Trang {loc.page} / {tongTrang}
          </span>
          <Button
            bienDang="outline"
            disabled={loc.page >= tongTrang}
            onClick={() => setLoc({ ...loc, page: loc.page + 1 })}
          >
            Trang sau
          </Button>
        </nav>
      )}
    </section>
  )
}
