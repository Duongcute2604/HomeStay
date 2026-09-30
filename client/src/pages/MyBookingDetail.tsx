import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import ReviewForm from '../components/ReviewForm'
import { bookingService } from '../services/bookingService'
import { BookingStatus, NHAN_LOAI_THUE, NHAN_TRANG_THAI_DON } from '../types/booking'
import { formatNgay, formatVnd } from '../utils/format'

/**
 * Trang chi tiết một đơn của chính mình — tra cứu bằng `Code` trên URL.
 *
 * Gồm thông tin đơn, dòng thời gian lịch sử trạng thái, và form hủy (kèm ô lý
 * do không bắt buộc) khi đơn còn được hủy. Đơn người khác hoặc mã sai → 404
 * của API hiện thành trang "không tìm thấy".
 */
export default function MyBookingDetail(): JSX.Element {
  const { code = '' } = useParams<{ code: string }>()
  const queryClient = useQueryClient()
  const [lyDo, setLyDo] = useState('')
  const [xacNhanHuy, setXacNhanHuy] = useState(false)
  const [loiHuy, setLoiHuy] = useState<string | null>(null)
  const [dangGuiDanhGia, setDangGuiDanhGia] = useState(false)
  const [loiDanhGia, setLoiDanhGia] = useState<string | null>(null)

  const { data: don, isPending, isError, error } = useQuery({
    queryKey: ['bookings', 'detail', code],
    queryFn: () => bookingService.layChiTiet(code),
    retry: false,
  })

  if (isPending) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải chi tiết đơn...</p>
  }

  if (isError || !don) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Không tìm thấy đơn</p>
        <p className="mt-1 text-sm text-gray-500">
          {isError ? layThongBaoLoi(error) : 'Mã đơn không đúng.'}
        </p>
        <Link to="/bookings" className="btn-primary mt-4 inline-block">
          Về danh sách đơn
        </Link>
      </div>
    )
  }

  const duocHuy = don.status === BookingStatus.PENDING || don.status === BookingStatus.CONFIRMED

  // Chỉ đơn đã trả phòng mới có mục đánh giá. Backend chặn lại 3 điều kiện này;
  // ở đây kiểm để không hiện nút mà bấm xong mới nhận 409.
  const duocDanhGia = don.status === BookingStatus.COMPLETED

  const xuLyDanhGia = async (sao: number, nhanXet: string): Promise<void> => {
    setDangGuiDanhGia(true)
    setLoiDanhGia(null)

    try {
      await bookingService.danhGia(don.code, { rating: sao, comment: nhanXet })
      // Tải lại chi tiết đơn để `daDanhGia` chuyển thành true và form đổi sang
      // dòng "Đánh giá của bạn", thay vì tự cập nhật state ở nhiều chỗ.
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', code] })
    } catch (error) {
      setLoiDanhGia(layThongBaoLoi(error))
    } finally {
      setDangGuiDanhGia(false)
    }
  }

  const xuLyHuy = async (): Promise<void> => {
    try {
      await bookingService.huyDon(don.code, lyDo)
      setXacNhanHuy(false)
      setLoiHuy(null)
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'detail', code] })
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] })
    } catch (error) {
      setLoiHuy(layThongBaoLoi(error))
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/bookings" className="text-sm text-amber-700 hover:underline">
        ← Đơn của tôi
      </Link>

      <div className="card mt-3 p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="number-vn text-xl font-bold tracking-wider text-gray-900">{don.code}</p>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
            {NHAN_TRANG_THAI_DON[don.status]}
          </span>
        </div>

        <p className="mt-2 text-left text-sm text-gray-600">
          {don.roomName} · {don.locationName}
        </p>
        <p className="mt-2 text-left text-sm text-gray-600">
          {formatNgay(don.checkIn)} → {formatNgay(don.checkOut)}
        </p>
        <p className="mt-2 text-left text-sm text-gray-600">
          {NHAN_LOAI_THUE[don.bookingType]} · Phòng {don.roomNumber} · Tối đa {don.capacity} khách
        </p>

        <div className="mt-3 flex items-baseline justify-end gap-2">
          <span className="text-sm text-gray-600">Tổng tiền</span>
          <span className="number-vn text-right text-lg font-semibold text-amber-700">
            {formatVnd(don.totalAmount)}
          </span>
        </div>
      </div>

      <section className="card mt-4 p-4">
        <h2 className="font-semibold text-gray-900">Lịch sử trạng thái</h2>
        <ol className="mt-2 flex flex-col gap-2">
          {don.history.map((danhGia, chiSo) => (
            <li key={chiSo} className="flex gap-3 text-sm">
              <span className="number-vn w-28 shrink-0 text-right text-xs text-gray-400">
                {formatNgay(danhGia.changedAt)}
              </span>
              <div className="text-left">
                <p className="text-left text-sm text-gray-900">
                  {danhGia.fromStatus === null
                    ? 'Tạo đơn'
                    : NHAN_TRANG_THAI_DON[danhGia.fromStatus]}
                  {' '}
                  → <span className="font-medium">{NHAN_TRANG_THAI_DON[danhGia.toStatus]}</span>
                </p>
                <p className="text-xs text-gray-500">bởi {danhGia.changedByName}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {don.note && <p className="mt-2 text-left text-sm text-gray-500">Ghi chú: {don.note}</p>}
      {don.cancelReason && (
        <p className="mt-1 text-left text-sm text-red-600">Lý do hủy: {don.cancelReason}</p>
      )}

      {duocDanhGia && (
        <ReviewForm
          daDanhGia={don.daDanhGia === true}
          danhGiaCuaToi={don.danhGiaCuaToi ?? null}
          dangGui={dangGuiDanhGia}
          loi={loiDanhGia}
          onSubmit={(sao, nhanXet) => void xuLyDanhGia(sao, nhanXet)}
        />
      )}

      {duocHuy && (
        <section className="card mt-4 p-4">
          <h2 className="font-semibold text-gray-900">Hủy đơn này</h2>
          {loiHuy && (
            <div className="mt-2">
              <FormMessage loi={loiHuy} />
            </div>
          )}

          {xacNhanHuy ? (
            <>
              <label
                className="mb-1 mt-3 block text-sm font-medium text-gray-700"
                htmlFor="huy-lyDo"
              >
                Lý do hủy (không bắt buộc)
              </label>
              <textarea
                id="huy-lyDo"
                rows={2}
                placeholder="Ví dụ: đổi kế hoạch công tác..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={lyDo}
                onChange={(e) => setLyDo(e.target.value)}
              />
              <div className="mt-3 flex gap-2">
                <Button bienDang="outline" onClick={() => setXacNhanHuy(false)}>
                  Giữ lại
                </Button>
                <button
                  type="button"
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  onClick={() => xuLyHuy()}
                >
                  Chắc chắn hủy đơn
                </button>
              </div>
            </>
          ) : (
            <Button bienDang="outline" className="mt-3" onClick={() => setXacNhanHuy(true)}>
              Hủy đơn
            </Button>
          )}
        </section>
      )}
    </div>
  )
}