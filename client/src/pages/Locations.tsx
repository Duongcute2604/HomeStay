import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FadeIn from '../components/common/FadeIn'
import { locationService } from '../services/locationService'
import { formatVnd } from '../utils/format'

/**
 * Trang danh sách địa điểm.
 *
 * Dữ liệu do server trả về theo từng màn hình nên dùng TanStack Query
 * (AGENTS.md 7.2). Query key `['locations']` dùng chung với trang chi tiết —
 * vào chi tiết không phải gọi API lần nữa.
 *
 * Mọi danh sách phải xử lý đủ 3 trạng thái: Loading / Error / Empty.
 */
export default function Locations(): JSX.Element {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.layDanhSach(),
    // Danh sách địa điểm ít khi đổi — giữ 5 phút để qua lại giữa list và
    // chi tiết không gọi API thừa.
    staleTime: 5 * 60 * 1000,
  })

  if (isPending) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải danh sách địa điểm...</p>
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

  if (diaDiemList.length === 0) {
    return <p className="mt-8 text-center text-sm text-gray-500">Hiện chưa có địa điểm nào.</p>
  }

  return (
    <div>
      <div className="anim-fade-up">
        <h1 className="text-xl font-bold text-gray-900">Địa điểm homestay</h1>
        <p className="mt-1 text-sm text-gray-500">
          {diaDiemList.length} địa điểm · STT tính từ 1 theo thứ tự danh sách
        </p>
        <span
          aria-hidden="true"
          className="mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
        />
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {diaDiemList.map((diaDiem, chiSo) => {
          const giaThapNhat =
            diaDiem.rooms.length > 0
              ? Math.min(...diaDiem.rooms.map((phong) => phong.pricePerDay))
              : null

          return (
            <FadeIn key={chiSo} delay={chiSo * 100}>
              {/* card-phong: hover tự nâng thẻ + zoom ảnh (dùng chung với trang phòng) */}
              <Link
                to={`/locations/${chiSo}`}
                className="card card-phong group block h-full overflow-hidden"
              >
                {diaDiem.imageUrl ? (
                  <img
                    src={diaDiem.imageUrl}
                    alt={diaDiem.name}
                    className="card-phong-img h-40 w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-40 w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-sm text-gray-400">
                    Chưa có ảnh
                  </div>
                )}

                <div className="p-4">
                  <p className="text-xs text-gray-400">
                    {chiSo + 1}. {diaDiem.province}
                  </p>
                  <h2 className="mt-1 font-semibold text-gray-900">{diaDiem.name}</h2>
                  <p className="mt-1 text-left text-sm text-gray-500">{diaDiem.address}</p>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{diaDiem.rooms.length} phòng</span>
                    {giaThapNhat !== null && (
                      <span className="number-vn text-right font-semibold text-amber-700">
                        Từ {formatVnd(giaThapNhat)}/ngày
                      </span>
                    )}
                  </div>

                  {/* Gợi ý bấm vào — hiện dần khi hover, không chiếm chỗ khi chưa hover */}
                  <span
                    aria-hidden="true"
                    className="mt-3 block text-xs font-medium text-amber-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  >
                    Xem chi tiết →
                  </span>
                </div>
              </Link>
            </FadeIn>
          )
        })}
      </div>
    </div>
  )
}
