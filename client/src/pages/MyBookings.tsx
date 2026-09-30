import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import { bookingService } from '../services/bookingService'
import { BookingStatus, NHAN_TRANG_THAI_DON } from '../types/booking'
import { formatNgay, formatVnd } from '../utils/format'

/**
 * Trang "Đơn của tôi" — danh sách đơn của chính người đang đăng nhập.
 *
 * Hủy đơn cần 2 bước bấm ("Hủy đơn" → "Chắc chắn hủy?") thay vì `window.confirm`:
 * hộp thoại của trình duyệt chặn toàn trang và không theo phong cách chung.
 * Lý do hủy không bắt buộc nên không cần ô nhập — ai muốn ghi lý do thì sang
 * trang chi tiết (ở đó có ô nhập).
 */
export default function MyBookings(): JSX.Element {
  const queryClient = useQueryClient()
  const [dangHuy, setDangHuy] = useState<string | null>(null)
  const [loiHuy, setLoiHuy] = useState<string | null>(null)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'my'],
    queryFn: () => bookingService.layCuaToi(1, 20),
  })

  const xuLyHuy = async (code: string): Promise<void> => {
    if (dangHuy !== code) {
      // Bước 1: chuyển nút sang trạng thái chờ xác nhận.
      setDangHuy(code)
      setLoiHuy(null)
      return
    }

    try {
      await bookingService.huyDon(code)
      setDangHuy(null)
      setLoiHuy(null)
      // Tải lại danh sách để trạng thái mới hiện ngay.
      await queryClient.invalidateQueries({ queryKey: ['bookings', 'my'] })
    } catch (error) {
      setLoiHuy(layThongBaoLoi(error))
    }
  }

  if (isPending) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải danh sách đơn...</p>
  }

  if (isError) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    )
  }

  const danhSach = data?.items ?? []

  if (danhSach.length === 0) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="font-semibold text-gray-900">Bạn chưa có đơn nào</p>
        <p className="mt-1 text-sm text-gray-500">Tìm phòng ưng ý rồi đặt đơn đầu tiên nhé.</p>
        <Link to="/rooms" className="btn-primary mt-4 inline-block">
          Tìm phòng ngay
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Đơn của tôi</h1>
      <p className="mt-1 text-sm text-gray-500">{data?.totalItems} đơn</p>

      {loiHuy && (
        <div className="mt-3">
          <FormMessage loi={loiHuy} />
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {danhSach.map((don) => {
          const duocHuy =
            don.status === BookingStatus.PENDING || don.status === BookingStatus.CONFIRMED

          return (
            <div key={don.code} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Link
                    to={`/bookings/${don.code}`}
                    className="number-vn font-semibold text-amber-700 hover:underline"
                  >
                    {don.code}
                  </Link>
                  <p className="mt-1 text-left text-sm text-gray-600">
                    {don.roomName} · {don.locationName}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {NHAN_TRANG_THAI_DON[don.status]}
                </span>
              </div>

              <p className="mt-2 text-left text-sm text-gray-500">
                {formatNgay(don.checkIn)} → {formatNgay(don.checkOut)} · {don.guestCount} khách
              </p>

              <div className="mt-2 flex items-center justify-between">
                <span className="number-vn text-right font-semibold text-gray-900">
                  {formatVnd(don.totalAmount)}
                </span>

                {duocHuy &&
                  (dangHuy === don.code ? (
                    <div className="flex gap-2">
                      <Button bienDang="outline" onClick={() => setDangHuy(null)}>
                        Giữ lại
                      </Button>
                      <button
                        type="button"
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
                        onClick={() => xuLyHuy(don.code)}
                      >
                        Chắc chắn hủy
                      </button>
                    </div>
                  ) : (
                    <Button bienDang="outline" onClick={() => xuLyHuy(don.code)}>
                      Hủy đơn
                    </Button>
                  ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
