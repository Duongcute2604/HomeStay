import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import { locationService } from '../services/locationService'
import { NHAN_LOAI_PHONG, NHAN_TRANG_THAI_PHONG, RoomStatus } from '../types/location'
import { formatDiem, formatVnd } from '../utils/format'

/**
 * Trang chi tiết một địa điểm.
 *
 * Điều hướng bằng CHỈ SỐ trong danh sách (`/locations/0`), không phải bằng `Id` —
 * response không có `Id` (AGENTS.md 6.3). Dữ liệu lấy từ cache của query
 * `['locations']` nên vào từ trang danh sách thì không gọi API thêm; gõ thẳng
 * URL thì query tự tải rồi chọn theo chỉ số.
 *
 * Chỉ số sai (không phải số, âm, vượt quá danh sách) → báo không tìm thấy,
 * không để trang trắng.
 */
export default function LocationDetail(): JSX.Element {
  const { chiSo } = useParams<{ chiSo: string }>()

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.layDanhSach(),
    staleTime: 5 * 60 * 1000,
  })

  if (isPending) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải thông tin địa điểm...</p>
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
  const soChiSo = Number(chiSo)
  const diaDiem =
    Number.isInteger(soChiSo) && soChiSo >= 0 && soChiSo < diaDiemList.length
      ? diaDiemList[soChiSo]
      : undefined

  if (!diaDiem) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Không tìm thấy địa điểm</p>
        <p className="mt-1 text-sm text-gray-500">
          Địa chỉ bạn gõ không đúng, hoặc địa điểm này đã ngừng hoạt động.
        </p>
        <Link to="/locations" className="btn-primary mt-4 inline-block">
          Về danh sách địa điểm
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/locations" className="text-sm text-brand-700 hover:underline">
        ← Danh sách địa điểm
      </Link>

      <div className="card mt-3 overflow-hidden">
        {diaDiem.imageUrl && (
          <img src={diaDiem.imageUrl} alt={diaDiem.name} className="h-56 w-full object-cover" />
        )}

        <div className="p-6">
          <p className="text-left text-sm text-gray-500">
            {diaDiem.city} · {diaDiem.province}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{diaDiem.name}</h1>
          <p className="mt-2 text-left text-sm text-gray-600">{diaDiem.address}</p>
          {diaDiem.description && (
            <p className="mt-2 text-left text-sm text-gray-600">{diaDiem.description}</p>
          )}
        </div>
      </div>

      <h2 className="mt-6 text-lg font-semibold text-gray-900">
        Phòng tại {diaDiem.name} ({diaDiem.rooms.length})
      </h2>

      {diaDiem.rooms.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">Địa điểm này hiện chưa có phòng nào.</p>
      ) : (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {diaDiem.rooms.map((phong, chiSoPhong) => (
            <Link
              key={chiSoPhong}
              to={`/locations/${soChiSo}/rooms/${chiSoPhong}`}
              className="card overflow-hidden transition hover:shadow-md"
            >
              {phong.thumbnailUrl ? (
                <img
                  src={phong.thumbnailUrl}
                  alt={phong.name}
                  className="h-36 w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-36 w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                  Chưa có ảnh
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{phong.name}</h3>
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
                  {phong.capacity} khách
                  {phong.ratingCount > 0 && (
                    <> · ★ {formatDiem(phong.ratingAvg)} ({phong.ratingCount} đánh giá)</>
                  )}
                </p>

                <div className="mt-3 flex items-baseline justify-end gap-4 text-sm">
                  <span className="number-vn text-right text-gray-600">
                    {formatVnd(phong.pricePerHour)}/giờ
                  </span>
                  <span className="number-vn text-right font-semibold text-brand-700">
                    {formatVnd(phong.pricePerDay)}/ngày
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
