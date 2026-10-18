import { useEffect, useState } from 'react'

import Button from '../common/Button'
import type { AdminRoom } from '../../types/admin'
import { MAU_TRANG_THAI } from './RoomMap'
import {
  DS_TRANG_THAI_PHONG,
  NHAN_LOAI_PHONG,
  NHAN_TRANG_THAI_PHONG,
  RoomStatus,
} from '../../types/location'
import { formatVnd } from '../../utils/format'

interface Props {
  /** Phòng đang xem — luôn lấy lại từ danh sách mới nhất để trạng thái không cũ. */
  phong: AdminRoom
  /** Đổi trạng thái ngay từ popup (cùng API với ô trạng thái ở bảng). */
  onDoiTrangThai: (trangThai: RoomStatus) => void
  /** Mở form sửa phòng của chính phòng này. */
  onSua: () => void
  onDong: () => void
}

/**
 * Popup chi tiết phòng khi bấm ô trên Sơ đồ: ảnh (bấm thumbnail để đổi),
 * số liệu, thẻ tiện nghi và 5 nút đổi trạng thái nhanh.
 *
 * Đổi trạng thái là lý do chính của popup: thấy phòng vừa trả khách
 * (đang dọn dẹp) thì bấm "Còn trống" ngay, không phải tìm dòng trong bảng.
 */
export default function RoomMapModal({ phong, onDoiTrangThai, onSua, onDong }: Props): JSX.Element {
  const [chiSoAnh, setChiSoAnh] = useState(0)

  // Đổi sang phòng khác thì quay về ảnh đầu tiên — nếu không, chỉ số ảnh cũ
  // có thể vượt mảng ảnh phòng mới và vỡ ảnh.
  useEffect(() => {
    setChiSoAnh(0)
  }, [phong.id])

  const mau = MAU_TRANG_THAI[phong.status]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Chi tiết phòng ${phong.roomNumber}`}
      onClick={onDong}
    >
      {/* stopPropagation: bấm trong popup không được đóng popup. */}
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        {phong.images.length > 0 ? (
          <>
            <img
              src={phong.images[chiSoAnh]}
              alt={`Ảnh phòng ${phong.name}`}
              className="h-48 w-full object-cover"
            />
            {phong.images.length > 1 && (
              <div className="flex gap-2 px-4 pt-2">
                {phong.images.map((duongDan, i) => (
                  <button
                    key={duongDan}
                    type="button"
                    aria-label={`Xem ảnh ${i + 1}`}
                    onClick={() => setChiSoAnh(i)}
                    className={
                      i === chiSoAnh
                        ? 'rounded-lg ring-2 ring-amber-500'
                        : 'rounded-lg opacity-70 hover:opacity-100'
                    }
                  >
                    <img src={duongDan} alt="" className="h-12 w-16 rounded-lg object-cover" />
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-32 items-center justify-center bg-stone-100 text-sm text-stone-400">
            Phòng chưa có ảnh
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-stone-800">
                {phong.name} <span className="number-vn text-stone-500">· {phong.roomNumber}</span>
              </h2>
              <p className="text-xs text-stone-500">
                {phong.locationName} · {NHAN_LOAI_PHONG[phong.roomType]}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${mau.vien} ${mau.chu} ${mau.nen}`}
            >
              {NHAN_TRANG_THAI_PHONG[phong.status]}
            </span>
          </div>

          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
              <dt className="text-stone-500">Diện tích</dt>
              <dd className="number-vn font-medium">
                {phong.area} m²
              </dd>
            </div>
            <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
              <dt className="text-stone-500">Sức chứa</dt>
              <dd className="number-vn font-medium">{phong.capacity} khách</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
              <dt className="text-stone-500">Giá 3 giờ đầu</dt>
              <dd className="number-vn font-medium">{formatVnd(phong.pricePerHour)}</dd>
            </div>
            <div className="flex justify-between rounded-lg bg-stone-50 px-3 py-2">
              <dt className="text-stone-500">Giá 1 ngày</dt>
              <dd className="number-vn font-medium">{formatVnd(phong.pricePerDay)}</dd>
            </div>
          </dl>

          <p className="mt-4 text-xs font-medium text-stone-600">Tiện nghi</p>
          {phong.amenityNames.length > 0 ? (
            <ul className="mt-1 flex flex-wrap gap-2">
              {phong.amenityNames.map((ten) => (
                <li key={ten} className="rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-800">
                  ✓ {ten}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-stone-400">Chưa gán tiện nghi</p>
          )}

          <p className="mt-4 text-xs font-medium text-stone-600">Đổi trạng thái</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {DS_TRANG_THAI_PHONG.map((trangThai) => (
              <button
                key={trangThai}
                type="button"
                // trạng thái hiện tại được tô màu + đánh dấu để bấm nhầm ít xảy ra
                aria-pressed={phong.status === trangThai}
                onClick={() => onDoiTrangThai(trangThai)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                  phong.status === trangThai
                    ? `${MAU_TRANG_THAI[trangThai].nen} ${MAU_TRANG_THAI[trangThai].vien} ${MAU_TRANG_THAI[trangThai].chu} font-medium`
                    : 'border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {NHAN_TRANG_THAI_PHONG[trangThai]}
              </button>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <Button onClick={onSua} className="flex-1">
              Sửa phòng
            </Button>
            <Button bienDang="outline" onClick={onDong} className="flex-1">
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
