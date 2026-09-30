import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import { bookingService } from '../services/bookingService'
import { BookingStatus, NHAN_TRANG_THAI_DON } from '../types/booking'
import { formatNgay, formatVnd } from '../utils/format'

/** Giá trị của lựa chọn "Tất cả trạng thái" — rỗng, khác với số 0 (PENDING). */
const TRANG_THAI_TAT_CA = ''

/**
 * Các lựa chọn trong ô lọc.
 *
 * Nhãn lấy từ `NHAN_TRANG_THAI_DON` để chỉ phải sửa chữ ở **một** chỗ: cùng tên
 * trạng thái đang hiện trên thẻ đơn và trong ô lọc, không thể lệch nhau.
 */
const LOC_TRANG_THAI: { giaTri: string; nhan: string }[] = [
  { giaTri: TRANG_THAI_TAT_CA, nhan: 'Tất cả trạng thái' },
  { giaTri: String(BookingStatus.PENDING), nhan: NHAN_TRANG_THAI_DON[BookingStatus.PENDING] },
  { giaTri: String(BookingStatus.CONFIRMED), nhan: NHAN_TRANG_THAI_DON[BookingStatus.CONFIRMED] },
  { giaTri: String(BookingStatus.CHECKED_IN), nhan: NHAN_TRANG_THAI_DON[BookingStatus.CHECKED_IN] },
  { giaTri: String(BookingStatus.COMPLETED), nhan: NHAN_TRANG_THAI_DON[BookingStatus.COMPLETED] },
  { giaTri: String(BookingStatus.CANCELLED), nhan: NHAN_TRANG_THAI_DON[BookingStatus.CANCELLED] },
  { giaTri: String(BookingStatus.REJECTED), nhan: NHAN_TRANG_THAI_DON[BookingStatus.REJECTED] },
]

/**
 * Đổi giá trị của ô lọc sang số trạng thái, `undefined` nghĩa là không lọc.
 *
 * Phải so với hằng `TRANG_THAI_TAT_CA` chứ không dùng `!chon` — vì
 * `Number('0')` là 0 và trong cách kiểm tra falsy, 0 sẽ bị coi là "không chọn",
 * làm mất trạng thái Chờ xác nhận (giá trị 0).
 */
function doiSoTrangThai(chon: string): number | undefined {
  return chon === TRANG_THAI_TAT_CA ? undefined : Number(chon)
}

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
  const [trangThaiChon, setTrangThaiChon] = useState<string>(TRANG_THAI_TAT_CA)

  // `trangThaiChon` nằm trong `queryKey` để đổi bộ lọc là lấy dữ liệu mới.
  // Nếu không có nó, TanStack Query trả đúng cache của bộ lọc cũ và người dùng
  // thấy danh sách không đổi dù đã bấm chọn — lỗi rất khó phát hiện bằng mắt.
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['bookings', 'my', trangThaiChon],
    queryFn: () => bookingService.layCuaToi(1, 20, doiSoTrangThai(trangThaiChon)),
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
      // Tải lại danh sách để trạng thái mới hiện ngay. `invalidateQueries` theo
      // tiền tố nên nó xoá cache của **mọi** bộ lọc, không riêng bộ lọc đang xem —
      // cần thiết vì hủy đơn có thể làm đơn biến mất khỏi bộ lọc hiện tại.
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
  const dangLoc = trangThaiChon !== TRANG_THAI_TAT_CA

  /**
   * Tiêu đề + ô lọc phải hiện **luôn**, kể cả khi danh sách rỗng.
   *
   * Lý do: đặt nó sau `return` của nhánh rỗng thì lúc người dùng lọc mà không ra
   * đơn nào, ô lọc sẽ biến mất theo. Họ bị kẹt trên màn hình không đổi được bộ
   * lọc, chỉ còn cách bấm nút bên trong thẻ rỗng. Đây là loại lỗi mà chạy thử
   * tay vẫn thấy bình thường vì lúc đó luôn có dữ liệu để xem.
   */
  const tieuDe = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Đơn của tôi</h1>
        <p className="mt-1 text-sm text-gray-500">{data?.totalItems} đơn</p>
      </div>

      <div className="w-full sm:w-56">
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="loc-trangThai">
          Lọc theo trạng thái
        </label>
        <select
          id="loc-trangThai"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={trangThaiChon}
          onChange={(e) => setTrangThaiChon(e.target.value)}
        >
          {LOC_TRANG_THAI.map((muc) => (
            <option key={muc.giaTri} value={muc.giaTri}>
              {muc.nhan}
            </option>
          ))}
        </select>
      </div>
    </div>
  )

  if (danhSach.length === 0) {
    return (
      <div>
        {tieuDe}
        <div className="card mx-auto mt-6 max-w-md p-6 text-center">
          <p className="font-semibold text-gray-900">
            {dangLoc ? 'Không có đơn nào ở trạng thái này' : 'Bạn chưa có đơn nào'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {dangLoc
              ? 'Thử chọn trạng thái khác, hoặc xem tất cả đơn của bạn.'
              : 'Tìm phòng ưng ý rồi đặt đơn đầu tiên nhé.'}
          </p>
          {dangLoc ? (
            <Button className="mt-4" onClick={() => setTrangThaiChon(TRANG_THAI_TAT_CA)}>
              Xem tất cả đơn
            </Button>
          ) : (
            <Link to="/rooms" className="btn-primary mt-4 inline-block">
              Tìm phòng ngay
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {tieuDe}

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
