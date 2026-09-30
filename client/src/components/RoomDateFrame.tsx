import { useState } from 'react'

import { formatVnd } from '../utils/format'
import { BookingType, kiemKhoangThoiGian, NHAN_CACH_THUE, tinhSoDonVi, uocTinhTien } from '../utils/pricing'

interface Props {
  /** Giá 1 giờ (VNĐ) của phòng đang xem. */
  giaTheoGio: number
  /** Giá 1 ngày (VNĐ) của phòng đang xem. */
  giaTheoNgay: number
}

/**
 * Khung chọn ngày thuê: loại (giờ/ngày) + giờ nhận/trả + giá tạm tính.
 *
 * Tách thành component riêng để **Bước 10 dùng lại** trong trang đặt phòng —
 * viết lại ở trang đặt thì hai nơi tính hai kiểu (DRY). Ở bước này khung chỉ
 * chọn và ước tính, CHƯA có nút đặt (nút thuộc về Bước 10, làm trước là UI chết).
 *
 * Quy tắc tối thiểu 3 giờ / đặt trước 2 giờ KHÔNG kiểm ở đây: chúng cần giờ
 * hiện tại của server, không tin giờ máy khách — backend Bước 10 sẽ chặn.
 */
export default function RoomDateFrame({ giaTheoGio, giaTheoNgay }: Props): JSX.Element {
  const [loai, setLoai] = useState<BookingType>(BookingType.DAY)
  const [gioNhan, setGioNhan] = useState('')
  const [gioTra, setGioTra] = useState('')

  const checkIn = gioNhan === '' ? null : new Date(gioNhan)
  const checkOut = gioTra === '' ? null : new Date(gioTra)
  const loi = kiemKhoangThoiGian(checkIn, checkOut)

  const donVi = loi === null && checkIn && checkOut ? tinhSoDonVi(loai, checkIn, checkOut) : 0
  const tamTinh =
    loi === null && checkIn && checkOut
      ? uocTinhTien(loai, giaTheoGio, giaTheoNgay, checkIn, checkOut)
      : 0

  return (
    <section className="card mt-6 p-4">
      <h2 className="font-semibold text-gray-900">Chọn ngày thuê</h2>

      <div className="mt-3 flex gap-2">
        {(Object.values(BookingType) as BookingType[]).map((giaTri) => (
          <button
            key={giaTri}
            type="button"
            onClick={() => setLoai(giaTri)}
            aria-pressed={loai === giaTri}
            className={
              loai === giaTri
                ? 'rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white'
                : 'rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600'
            }
          >
            {NHAN_CACH_THUE[giaTri]}
          </button>
        ))}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="khung-gioNhan">
            Giờ nhận phòng
          </label>
          <input
            id="khung-gioNhan"
            type="datetime-local"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={gioNhan}
            onChange={(e) => setGioNhan(e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="khung-gioTra">
            Giờ trả phòng
          </label>
          <input
            id="khung-gioTra"
            type="datetime-local"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            value={gioTra}
            onChange={(e) => setGioTra(e.target.value)}
          />
        </div>
      </div>

      {loi ? (
        <p className="mt-3 text-sm text-gray-500">{loi}</p>
      ) : (
        <p className="number-vn mt-3 text-right text-sm text-gray-700">
          Tạm tính: {donVi} {loai === BookingType.HOUR ? 'giờ' : 'ngày'} ×{' '}
          <span className="font-semibold text-brand-700">{formatVnd(tamTinh)}</span>
        </p>
      )}

      <p className="mt-2 text-left text-xs text-gray-400">
        Giá tạm tính để tham khảo — số tiền cuối cùng do hệ thống tính khi tạo đơn.
      </p>
    </section>
  )
}
