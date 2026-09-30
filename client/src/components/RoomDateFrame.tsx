import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { roomService } from '../services/roomService'
import { formatVnd } from '../utils/format'
import { BookingType, kiemKhoangThoiGian, NHAN_CACH_THUE, tinhSoDonVi, uocTinhTien } from '../utils/pricing'

/** Lựa chọn hiện tại của khung — phát ra ngoài để trang cha dùng (nút tiếp tục). */
export interface LuaChonThue {
  loai: BookingType
  checkIn: Date | null
  checkOut: Date | null
  /** Ngày hợp lệ (trả sau nhận). */
  hopLe: boolean
  /** Phòng trống theo API. Null khi chưa kiểm (ngày sai hoặc đang tải/lỗi). */
  trong: boolean | null
}

interface Props {
  /** Giá 1 giờ (VNĐ) của phòng đang xem. */
  giaTheoGio: number
  /** Giá 1 ngày (VNĐ) của phòng đang xem. */
  giaTheoNgay: number
  /** Chỉ số địa điểm — để hỏi API phòng nào (response không có `Id`). */
  locationIndex: number
  /** Chỉ số phòng trong địa điểm đó. */
  roomIndex: number
  /**
   * Nhận lựa chọn mỗi khi thay đổi. Trang chi tiết dùng để bật/tắt nút
   * "Tiếp tục đặt phòng" — khung không tự có nút vì nút thuộc về trang.
   */
  onThayDoi?: (luaChon: LuaChonThue) => void
}

/**
 * Khung chọn ngày thuê: loại (giờ/ngày) + giờ nhận/trả + giá tạm tính +
 * trạng thái trống/bận trực tiếp từ API.
 *
 * Tách thành component riêng để **Bước 10 dùng lại** trong trang đặt phòng —
 * viết lại ở trang đặt thì hai nơi tính hai kiểu (DRY). Ở bước này khung chỉ
 * chọn, ước tính và kiểm trống; CHƯA có nút đặt (nút thuộc về Bước 10).
 *
 * Quy tắc tối thiểu 3 giờ / đặt trước 2 giờ do BACKEND kiểm (cần giờ server,
 * không tin giờ máy khách) — khung chỉ hiện thông báo backend trả về.
 */
export default function RoomDateFrame({
  giaTheoGio,
  giaTheoNgay,
  locationIndex,
  roomIndex,
  onThayDoi,
}: Props): JSX.Element {
  const [loai, setLoai] = useState<BookingType>(BookingType.DAY)
  const [gioNhan, setGioNhan] = useState('')
  const [gioTra, setGioTra] = useState('')

  const checkIn = gioNhan === '' ? null : new Date(gioNhan)
  const checkOut = gioTra === '' ? null : new Date(gioTra)
  const loi = kiemKhoangThoiGian(checkIn, checkOut)

  const ngayHopLe = loi === null && checkIn !== null && checkOut !== null

  // Chỉ hỏi API khi ngày đã hợp lệ — ngày sai thì backend cũng chỉ báo lỗi
  // hình thức, gọi là thừa một request.
  const {
    data: tinhTrang,
    isPending: dangKiem,
    isError: loiKiem,
  } = useQuery({
    queryKey: ['rooms', 'availability', locationIndex, roomIndex, loai, gioNhan, gioTra],
    queryFn: () => roomService.kiemTraTrong(locationIndex, roomIndex, loai, checkIn as Date, checkOut as Date),
    enabled: ngayHopLe,
    // Kết quả trống/bận thay đổi theo thời gian (người khác có thể đặt xen vào)
    // nên không giữ lâu — qua lại là kiểm lại.
    staleTime: 30 * 1000,
  })

  // Báo lựa chọn ra ngoài mỗi khi đổi. Gọi trong `useEffect` chứ không gọi
  // trong lúc render (side-effect trong render bị React cấm và gọi nhiều lần).
  //
  // Hai chốt chặn vòng lặp:
  // 1. Phụ thuộc theo chuỗi gốc `gioNhan/gioTra` — `checkIn/checkOut` là object
  //    mới mỗi lần render, phụ thuộc theo chúng là vòng lặp vô hạn.
  // 2. Chỉ gọi khi giá trị THẬT SỰ đổi (so bằng ref) — cha truyền callback inline
  //    thì `onThayDoi` đổi identity mỗi render, gọi vô điều kiện sẽ setState cha
  //    → render lại → gọi tiếp, mãi mãi.
  const daBao = useRef<string>('')
  useEffect(() => {
    if (!onThayDoi) {
      return
    }

    const trong = !ngayHopLe || dangKiem || loiKiem || !tinhTrang ? null : tinhTrang.isAvailable
    const khoa = `${loai}|${gioNhan}|${gioTra}|${trong}`;

    if (khoa === daBao.current) {
      return
    }

    daBao.current = khoa
    onThayDoi({ loai, checkIn, checkOut, hopLe: ngayHopLe, trong })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loai, gioNhan, gioTra, dangKiem, loiKiem, tinhTrang])

  const donVi = ngayHopLe && checkIn && checkOut ? tinhSoDonVi(loai, checkIn, checkOut) : 0
  const tamTinh =
    ngayHopLe && checkIn && checkOut
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
        <>
          <p className="number-vn mt-3 text-right text-sm text-gray-700">
            Tạm tính: {donVi} {loai === BookingType.HOUR ? 'giờ' : 'ngày'} ×{' '}
            <span className="font-semibold text-brand-700">{formatVnd(tamTinh)}</span>
          </p>

          {dangKiem ? (
            <p className="mt-2 text-right text-sm text-gray-500">Đang kiểm phòng trống...</p>
          ) : loiKiem ? (
            <p className="mt-2 text-right text-sm text-red-600">
              Không kiểm được phòng trống. Hãy thử lại sau.
            </p>
          ) : (
            tinhTrang && (
              <p
                className={
                  tinhTrang.isAvailable
                    ? 'mt-2 text-right text-sm font-medium text-green-700'
                    : 'mt-2 text-right text-sm font-medium text-red-600'
                }
              >
                {tinhTrang.isAvailable
                  ? 'Phòng còn trống trong khoảng đã chọn'
                  : (tinhTrang.reason ?? 'Phòng đã có người đặt trong khoảng đã chọn')}
              </p>
            )
          )}
        </>
      )}

      <p className="mt-2 text-left text-xs text-gray-400">
        Giá tạm tính để tham khảo — số tiền cuối cùng do hệ thống tính khi tạo đơn.
      </p>
    </section>
  )
}
