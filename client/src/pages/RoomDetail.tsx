import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import RoomDateFrame from '../components/RoomDateFrame'
import { locationService } from '../services/locationService'
import { NHAN_LOAI_PHONG, NHAN_TRANG_THAI_PHONG, RoomStatus } from '../types/location'
import { formatDiem, formatNgay, formatVnd } from '../utils/format'

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
  const [anhDangXem, setAnhDangXem] = useState(0)
  const [moAnhLon, setMoAnhLon] = useState(false)

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
        <Link to="/locations" className="text-brand-700 hover:underline">
          Địa điểm
        </Link>
        {' / '}
        <Link to={`/locations/${soDiaDiem}`} className="text-brand-700 hover:underline">
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
            <span className="number-vn text-right text-lg font-semibold text-brand-700">
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
        <h2 className="font-semibold text-gray-900">
          Đánh giá ({phong.reviews.length})
        </h2>
        {phong.reviews.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Phòng này chưa có đánh giá nào.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-3">
            {phong.reviews.map((danhGia, chiSo) => (
              <li key={chiSo} className="border-b border-gray-100 pb-3 last:border-0">
                <p className="text-left text-sm">
                  <span className="font-semibold text-gray-900">{danhGia.reviewerName}</span>
                  <span className="ml-2 text-amber-500">{'★'.repeat(danhGia.rating)}</span>
                  <span className="ml-2 text-xs text-gray-400">{formatNgay(danhGia.createdAt)}</span>
                </p>
                {danhGia.comment && (
                  <p className="mt-1 text-left text-sm text-gray-600">{danhGia.comment}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <RoomDateFrame giaTheoGio={phong.pricePerHour} giaTheoNgay={phong.pricePerDay} />

      {moAnhLon && anhChinh && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setMoAnhLon(false)}
          role="dialog"
          aria-label="Xem ảnh lớn"
        >
          <img src={anhChinh} alt={phong.name} className="max-h-full max-w-full rounded-lg" />
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white px-3 py-1 text-sm font-medium"
            onClick={() => setMoAnhLon(false)}
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  )
}
