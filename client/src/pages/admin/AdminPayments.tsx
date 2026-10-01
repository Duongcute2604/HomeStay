import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import { paymentService } from '../../services/paymentService'
import { useToastStore } from '../../store/toastStore'
import {
  MAU_TRANG_THAI_THANH_TOAN,
  NHAN_PHUONG_THUC,
  NHAN_TRANG_THAI_THANH_TOAN,
  PaymentMethod,
  PaymentStatus,
} from '../../types/payment'
import { formatNgay, formatVnd } from '../../utils/format'

/** Bộ lọc mặc định: xem tất cả, trang 1. */
const LOC_MAC_DINH = {
  trangThai: null as number | null,
  page: 1,
  pageSize: 10,
}

/** Ba lựa chọn của bộ lọc trạng thái thanh toán. */
const LOC_TRANG_THAI: Array<{ giaTri: number | null; nhan: string }> = [
  { giaTri: null, nhan: 'Tất cả' },
  { giaTri: PaymentStatus.PENDING, nhan: NHAN_TRANG_THAI_THANH_TOAN[PaymentStatus.PENDING] },
  { giaTri: PaymentStatus.PAID, nhan: NHAN_TRANG_THAI_THANH_TOAN[PaymentStatus.PAID] },
  { giaTri: PaymentStatus.FAILED, nhan: NHAN_TRANG_THAI_THANH_TOAN[PaymentStatus.FAILED] },
]

/**
 * Trang quản lý thanh toán của Admin (Bước 22).
 *
 * Ba hành động, mỗi hành động một cặp rõ ràng:
 * - **Đã thu tiền**: xác nhận đã nhận đủ tiền, ghi thời điểm thu. Đây là nguồn của
 *   doanh thu trên báo cáo thống kê.
 * - **Thất bại**: khách báo không chuyển được. Giữ bản ghi thay vì xoá để không mất dấu vết.
 *
 * Mỗi hành động ghi lại ngay thông báo rồi tự làm mới bảng — không bắt người dùng bấm
 * "Làm mới" mới thấy hiệu lực.
 */
export default function AdminPayments(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [loc, setLoc] = useState(LOC_MAC_DINH)
  const [dangMoThanhToan, setDangMoThanhToan] = useState<number | null>(null)
  const [methodChon, setMethodChon] = useState<PaymentMethod>(PaymentMethod.CASH)
  const [ghiChu, setGhiChu] = useState('')
  const [dangThatBai, setDangThatBai] = useState<number | null>(null)
  const [lyDoThatBai, setLyDoThatBai] = useState('')
  const [loi, setLoi] = useState<string | null>(null)

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['admin', 'payments', loc],
    queryFn: () => paymentService.adminLayDanhSach(loc.trangThai, loc.page, loc.pageSize),
  })

  const thaoTac = useMutation({
    mutationFn: (bien: { id: number; hanhDong: 'thu' | 'thatBai'; method?: PaymentMethod; ghiChu?: string }) => {
      if (bien.hanhDong === 'thu') {
        return paymentService.adminDanhDauDaThu(bien.id, {
          method: bien.method ?? PaymentMethod.CASH,
          note: bien.ghiChu,
        })
      }
      return paymentService.adminDanhDauThatBai(bien.id, bien.ghiChu)
    },
    onSuccess: (_ketQua, bien) => {
      themToast(
        bien.hanhDong === 'thu' ? 'Đã đánh dấu thu tiền' : 'Đã đánh dấu thất bại',
        'success',
      )
      setDangMoThanhToan(null)
      setDangThatBai(null)
      setGhiChu('')
      setLyDoThatBai('')
      setLoi(null)
      void queryClient.invalidateQueries({ queryKey: ['admin', 'payments'] })
      void queryClient.invalidateQueries({ queryKey: ['payments', 'my'] })
    },
    onError: (err) => {
      setLoi(layThongBaoLoi(err))
    },
  })

  const items = data?.items ?? []
  const tongDaThu = items
    .filter((x) => x.status === PaymentStatus.PAID)
    .reduce((tong, x) => tong + x.amount, 0)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Thanh toán</h1>
          <p className="mt-1 text-sm text-stone-500">
            Xác nhận đã thu tiền sau khi nhận đủ tiền. Doanh thu trên trang thống kê chỉ tính
            các phiếu đã đánh dấu đã thu.
          </p>
        </div>
        <p className="number-vn text-right text-lg font-bold text-green-700">
          {formatVnd(tongDaThu)}
          <span className="block text-xs font-normal text-stone-500">
            tổng đã thu trong trang này
          </span>
        </p>
      </div>

      <form
        className="mb-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-4"
        onSubmit={(e) => {
          e.preventDefault()
          setLoc((c) => ({ ...c, page: 1 }))
        }}
      >
        <label className="text-sm">
          <span className="text-stone-600">Trạng thái</span>
          <select
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={loc.trangThai === null ? '' : String(loc.trangThai)}
            onChange={(e) => {
              const giaTri = e.target.value
              setLoc((c) => ({
                ...c,
                trangThai: giaTri === '' ? null : Number(giaTri),
                page: 1,
              }))
            }}
          >
            {LOC_TRANG_THAI.map((x) => (
              <option key={x.giaTri === null ? 'all' : x.giaTri} value={x.giaTri === null ? '' : x.giaTri}>
                {x.nhan}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end sm:col-span-3">
          <Button type="submit" className="w-full">
            Lọc
          </Button>
        </div>
      </form>

      <FormMessage loi={loi} />

      {isPending ? (
        <div className="card p-6 text-center text-sm text-stone-500">Đang tải…</div>
      ) : isError ? (
        <div className="card p-6 text-center">
          <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
          <Button
            className="mt-4"
            onClick={() => setLoc((c) => ({ ...c }))}
          >
            Thử lại
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="font-semibold text-stone-800">Không có phiếu thu nào khớp bộ lọc</p>
          <p className="mt-1 text-sm text-stone-500">
            Chọn trạng thái khác hoặc giảm số trang.
          </p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2">STT</th>
                <th className="px-3 py-2">Mã đơn</th>
                <th className="px-3 py-2">Phòng</th>
                <th className="px-3 py-2">Cơ sở</th>
                <th className="px-3 py-2 text-right">Tiền</th>
                <th className="px-3 py-2">Phương thức</th>
                <th className="px-3 py-2">Trạng thái</th>
                <th className="px-3 py-2 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((phieu, chiSo) => {
                // STT liên tục qua các trang: trang 2 bắt đầu từ 11 (với 10 dòng/trang).
                const stt = (loc.page - 1) * loc.pageSize + chiSo + 1
                const dangMo = dangMoThanhToan === stt

                return (
                  <tr key={phieu.bookingCode} className="border-t border-stone-100">
                    <td className="px-3 py-2 text-stone-500">{stt}</td>
                    <td className="px-3 py-2 font-medium text-amber-800">{phieu.bookingCode}</td>
                    <td className="px-3 py-2">
                      {phieu.roomName}
                      <span className="block text-xs text-stone-400">{phieu.roomNumber}</span>
                    </td>
                    <td className="px-3 py-2 text-stone-600">{phieu.locationName}</td>
                    <td className="number-vn px-3 py-2 text-right font-medium">{formatVnd(phieu.amount)}</td>
                    <td className="px-3 py-2 text-stone-600">{NHAN_PHUONG_THUC[phieu.method]}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          MAU_TRANG_THAI_THANH_TOAN[phieu.status]
                        }`}
                      >
                        {NHAN_TRANG_THAI_THANH_TOAN[phieu.status]}
                      </span>
                      {phieu.paidAt !== null && (
                        <span className="mt-0.5 block text-xs text-stone-400">
                          {formatNgay(phieu.paidAt)}
                        </span>
                      )}
                      {phieu.note !== null && (
                        <span className="mt-0.5 block text-xs text-stone-500">{phieu.note}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {phieu.status === PaymentStatus.PENDING ? (
                        dangMo ? (
                          <div className="space-y-2 text-left">
                            <select
                              className="w-full rounded-lg border border-stone-300 px-2 py-1 text-xs"
                              value={methodChon}
                              onChange={(e) => setMethodChon(Number(e.target.value) as PaymentMethod)}
                              aria-label="Phương thức thực tế đã thu"
                            >
                              {Object.values(PaymentMethod).map((m) => (
                                <option key={m} value={m}>
                                  {NHAN_PHUONG_THUC[m]}
                                </option>
                              ))}
                            </select>
                            <input
                              className="w-full rounded-lg border border-stone-300 px-2 py-1 text-xs"
                              placeholder="Ghi chú (không bắt buộc)"
                              value={ghiChu}
                              onChange={(e) => setGhiChu(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className="btn-primary px-3 py-1 text-xs"
                                disabled={thaoTac.isPending}
                                onClick={() =>
                                  thaoTac.mutate({
                                    id: phieu.id,
                                    hanhDong: 'thu',
                                    method: methodChon,
                                    ghiChu,
                                  })
                                }
                              >
                                Xác nhận thu
                              </button>
                              <button
                                type="button"
                                className="btn-outline px-3 py-1 text-xs"
                                onClick={() => {
                                  setDangMoThanhToan(null)
                                  setGhiChu('')
                                }}
                              >
                                Huỷ
                              </button>
                            </div>
                            <button
                              type="button"
                              className="w-full px-3 py-1 text-xs text-red-600 hover:underline"
                              onClick={() => {
                                setDangMoThanhToan(null)
                                setDangThatBai(stt)
                                setLyDoThatBai('')
                              }}
                            >
                              Đánh dấu thất bại
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="btn-primary px-3 py-1.5 text-xs"
                            onClick={() => {
                              setDangMoThanhToan(stt)
                              setDangThatBai(null)
                              setMethodChon(PaymentMethod.CASH)
                              setGhiChu('')
                            }}
                          >
                            Đã thu tiền
                          </button>
                        )
                      ) : (
                        '—'
                      )}

                      {dangThatBai === stt && (
                        <div className="mt-2 space-y-2 text-left">
                          <input
                            className="w-full rounded-lg border border-stone-300 px-2 py-1 text-xs"
                            placeholder="Lý do thất bại"
                            value={lyDoThatBai}
                            onChange={(e) => setLyDoThatBai(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="px-3 py-1 text-xs text-red-700 hover:underline"
                              disabled={thaoTac.isPending}
                              onClick={() =>
                                thaoTac.mutate({
                                  id: phieu.id,
                                  hanhDong: 'thatBai',
                                  ghiChu: lyDoThatBai,
                                })
                              }
                            >
                              Xác nhận thất bại
                            </button>
                            <button
                              type="button"
                              className="btn-outline px-3 py-1 text-xs"
                              onClick={() => setDangThatBai(null)}
                            >
                              Huỷ
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {data !== undefined && data.totalPages > 1 && (
        <nav className="mt-4 flex items-center justify-center gap-3">
          <button
            type="button"
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
            disabled={loc.page === 1}
            onClick={() => setLoc((c) => ({ ...c, page: c.page - 1 }))}
          >
            Trang trước
          </button>
          <span className="text-sm text-stone-500">
            Trang {data.page}/{data.totalPages}
          </span>
          <button
            type="button"
            className="btn-outline px-4 py-2 text-sm disabled:opacity-40"
            disabled={loc.page >= data.totalPages}
            onClick={() => setLoc((c) => ({ ...c, page: c.page + 1 }))}
          >
            Trang sau
          </button>
        </nav>
      )}
    </div>
  )
}
