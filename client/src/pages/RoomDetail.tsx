import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import Lightbox from '../components/common/Lightbox'
import type { LuaChonThue } from '../components/RoomDateFrame'
import ReviewList from '../components/ReviewList'
import RoomDateFrame from '../components/RoomDateFrame'
import { BookingType } from '../utils/pricing'
import { locationService } from '../services/locationService'
import { NHAN_LOAI_PHONG, NHAN_TRANG_THAI_PHONG, RoomStatus } from '../types/location'
import { formatDiem, formatVnd } from '../utils/format'

/**
 * Trang chi tiết một phòng.
 *
 * Điều hướng bằng cặp chỉ số (`/locations/0/rooms/2`) — cùng lý do như trang
 * chi tiết địa điểm: response không có `Id`. Dữ liệu lấy từ cache của query
 * `['locations']` nên không gọi API thêm; gõ thẳng URL thì query tự tải.
 *
 * Ảnh: bấm thumbnail đổi ảnh chính, bấm ảnh chính mở lớp phủ xem lớn.
 * Tự viết thay vì thêm thư viện gallery — mỗi phòng chỉ 2 ảnh (KISS).
 */
export default function RoomDetail(): JSX.Element {
  const { chiSoDiaDiem, chiSoPhong } = useParams<{ chiSoDiaDiem: string; chiSoPhong: string }>()
  const navigate = useNavigate()
  const [anhDangXem, setAnhDangXem] = useState(0)
  const [moAnhLon, setMoAnhLon] = useState(false)
  const [luaChon, setLuaChon] = useState<LuaChonThue>({
    loai: BookingType.DAY,
    checkIn: null,
    checkOut: null,
    hopLe: false,
    trong: null,
  })

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.layDanhSach(),
    staleTime: 5 * 60 * 1000,
  })

  if (isPending) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải thông tin phòng...</p>
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

  const diaDiemList = data ?? []
  const soDiaDiem = Number(chiSoDiaDiem)
  const soPhong = Number(chiSoPhong)
  const diaDiem =
    Number.isInteger(soDiaDiem) && soDiaDiem >= 0 && soDiaDiem < diaDiemList.length
      ? diaDiemList[soDiaDiem]
      : undefined
  const phong =
    diaDiem &&
    Number.isInteger(soPhong) &&
    soPhong >= 0 &&
    soPhong < diaDiem.rooms.length
      ? diaDiem.rooms[soPhong]
      : undefined

  if (!diaDiem || !phong) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Không tìm thấy phòng</p>
        <p className="mt-1 text-sm text-gray-500">
          Địa chỉ bạn gõ không đúng, hoặc phòng này đã ngừng cho thuê.
        </p>
        <Link to="/rooms" className="btn-primary mt-4 inline-block">
          Về trang tìm kiếm
        </Link>
      </div>
    )
  }

  const anhChinh = phong.images[anhDangXem] ?? phong.thumbnailUrl

  return (
    <div>
      <nav className="text-sm text-gray-500">
        <Link to="/locations" className="text-amber-700 hover:underline">
          Địa điểm
        </Link>
        {' / '}
        <Link to={`/locations/${soDiaDiem}`} className="text-amber-700 hover:underline">
          {diaDiem.name}
        </Link>
        {' / '}
        <span className="text-gray-700">{phong.name}</span>
      </nav>

      <div className="card mt-3 overflow-hidden">
        {anhChinh ? (
          <button
            type="button"
            className="block w-full cursor-zoom-in"
            onClick={() => setMoAnhLon(true)}
            aria-label={`Xem lớn ảnh ${phong.name}`}
          >
            <img src={anhChinh} alt={phong.name} className="h-64 w-full object-cover" />
          </button>
        ) : (
          <div className="flex h-64 w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
            Chưa có ảnh
          </div>
        )}

        {phong.images.length > 1 && (
          <div className="flex gap-2 p-3">
            {phong.images.map((anh, chiSo) => (
              <button
                key={chiSo}
                type="button"
                onClick={() => setAnhDangXem(chiSo)}
                aria-label={`Xem ảnh ${chiSo + 1}`}
                aria-pressed={chiSo === anhDangXem}
                className={
                  chiSo === anhDangXem
                    ? 'rounded-lg ring-2 ring-brand-500'
                    : 'rounded-lg opacity-70 hover:opacity-100'
                }
              >
                <img src={anh} alt="" className="h-16 w-24 rounded-lg object-cover" />
              </button>
            ))}
          </div>
        )}

        <div className="p-6 pt-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{phong.name}</h1>
            <span
              className={
                phong.status === RoomStatus.AVAILABLE
                  ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                  : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'
              }
            >
              {NHAN_TRANG_THAI_PHONG[phong.status]}
            </span>
          </div>

          <p className="mt-1 text-left text-sm text-gray-500">
            {NHAN_LOAI_PHONG[phong.roomType]} · Phòng {phong.roomNumber} · Tối đa{' '}
            {phong.capacity} khách · {diaDiem.name}
            {phong.ratingCount > 0 && (
              <> · ★ {formatDiem(phong.ratingAvg)} ({phong.ratingCount} đánh giá)</>
            )}
          </p>

          {phong.description && (
            <p className="mt-3 text-left text-sm text-gray-600">{phong.description}</p>
          )}

          <div className="mt-4 flex items-baseline justify-end gap-4">
            <span className="number-vn text-right text-gray-600">
              {formatVnd(phong.pricePerHour)}/giờ
            </span>
            <span className="number-vn text-right text-lg font-semibold text-amber-700">
              {formatVnd(phong.pricePerDay)}/ngày
            </span>
          </div>
        </div>
      </div>

      {phong.amenities.length > 0 && (
        <section className="card mt-4 p-4">
          <h2 className="font-semibold text-gray-900">Tiện nghi</h2>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600 sm:grid-cols-3">
            {phong.amenities.map((tienNghi) => (
              <li key={tienNghi} className="text-left">
                ✓ {tienNghi}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card mt-4 p-4">
        <ReviewList reviews={phong.reviews} />
      </section>

      <RoomDateFrame
        giaTheoGio={phong.pricePerHour}
        giaTheoNgay={phong.pricePerDay}
        locationIndex={soDiaDiem}
        roomIndex={soPhong}
        onThayDoi={setLuaChon}
      />

      {luaChon.hopLe && luaChon.trong === true && luaChon.checkIn && luaChon.checkOut && (
        <button
          type="button"
          className="btn-primary mt-4 w-full"
          onClick={() => {
            const thamSo = new URLSearchParams({
              loai: luaChon.loai,
              checkIn: luaChon.checkIn?.toISOString() ?? '',
              checkOut: luaChon.checkOut?.toISOString() ?? '',
            })
            navigate(`/booking/${soDiaDiem}/${soPhong}?${thamSo.toString()}`)
          }}
        >
          Tiếp tục đặt phòng
        </button>
      )}

      {moAnhLon && anhChinh && (
        <Lightbox src={anhChinh} alt={phong.name} dong={() => setMoAnhLon(false)} />
      )}
    </div>
  )
}
