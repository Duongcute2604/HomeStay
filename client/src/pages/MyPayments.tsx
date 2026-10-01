import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import { paymentService } from '../services/paymentService'
import {
  MAU_TRANG_THAI_THANH_TOAN,
  NHAN_PHUONG_THUC,
  NHAN_TRANG_THAI_THANH_TOAN,
  PaymentStatus,
} from '../types/payment'
import { formatNgay, formatVnd } from '../utils/format'

/**
 * Trang "Thanh toán của tôi" — lịch sử các phiếu thu của chính khách đang đăng nhập.
 *
 * Chỉ hiển thị: khách xem, **không** tự đánh dấu "đã thu". Việc xác nhận thu tiền là
 * thao tác của quản trị viên, nên trên trang này chỉ có nút mở lại đơn để xem chi tiết.
 */
export default function MyPayments(): JSX.Element {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['payments', 'my'],
    queryFn: () => paymentService.layCuaToi(),
  })

  const danhSach = data ?? []
  const tongDaThu = danhSach
    .filter((x) => x.status === PaymentStatus.PAID)
    .reduce((tong, x) => tong + x.amount, 0)
  const conNo = danhSach.filter((x) => x.status === PaymentStatus.PENDING)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-800">Thanh toán của tôi</h1>
        <p className="mt-1 text-sm text-stone-500">
          Lịch sử các khoản đã thanh toán. Mỗi đơn hoàn thành sẽ có một phiếu thu, quản trị
          viên xác nhận sau khi nhận đủ tiền.
        </p>
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton mt-2 h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Thử lại
          </Button>
        </div>
      ) : danhSach.length === 0 ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="font-semibold text-stone-800">Chưa có khoản thanh toán nào</p>
          <p className="mt-1 text-sm text-stone-500">
            Phiếu thu được mở khi đơn của bạn chuyển sang trạng thái hoàn thành.
          </p>
          <Link to="/bookings" className="mt-3 inline-block text-sm text-amber-600 hover:text-amber-800">
            Xem đơn của tôi →
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2">
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">Tổng đã thanh toán</p>
              <p className="number-vn mt-1 text-right text-2xl font-bold text-green-700">
                {formatVnd(tongDaThu)}
              </p>
            </div>
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-stone-500">Còn phải thanh toán</p>
              <p className="number-vn mt-1 text-right text-2xl font-bold text-amber-700">
                {formatVnd(conNo.reduce((tong, x) => tong + x.amount, 0))}
              </p>
            </div>
          </div>

          <ul className="space-y-3">
            {danhSach.map((phieu) => (
              <li key={phieu.bookingCode} className="card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link
                      to={`/bookings/${phieu.bookingCode}`}
                      className="font-semibold text-amber-800 hover:underline"
                    >
                      {phieu.roomName}
                    </Link>
                    <p className="mt-0.5 text-sm text-stone-500">
                      {phieu.roomNumber} · {phieu.locationName}
                    </p>
                    <p className="mt-0.5 text-xs text-stone-400">Mã đơn: {phieu.bookingCode}</p>
                  </div>

                  <div className="text-right">
                    <p className="number-vn text-lg font-bold text-stone-800 text-right">
                      {formatVnd(phieu.amount)}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        MAU_TRANG_THAI_THANH_TOAN[phieu.status]
                      }`}
                    >
                      {NHAN_TRANG_THAI_THANH_TOAN[phieu.status]}
                    </span>
                  </div>
                </div>

                <dl className="mt-3 grid gap-x-6 gap-y-1 border-t border-stone-100 pt-3 text-sm sm:grid-cols-2">
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-500">Phương thức</dt>
                    <dd className="font-medium text-stone-700">{NHAN_PHUONG_THUC[phieu.method]}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-500">Ngày mở phiếu</dt>
                    <dd className="font-medium text-stone-700">{formatNgay(phieu.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-stone-500">Ngày đã thu</dt>
                    <dd className="font-medium text-stone-700">
                      {phieu.paidAt === null ? 'Chưa thanh toán' : formatNgay(phieu.paidAt)}
                    </dd>
                  </div>
                  {phieu.note !== null && (
                    <div className="flex justify-between gap-2">
                      <dt className="text-stone-500">Ghi chú</dt>
                      <dd className="font-medium text-stone-700">{phieu.note}</dd>
                    </div>
                  )}
                </dl>

                {phieu.status === PaymentStatus.FAILED && (
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    Giao dịch không thành công. Vui lòng chọn lại phương thức thanh toán trong
                    trang chi tiết đơn.
                  </p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}