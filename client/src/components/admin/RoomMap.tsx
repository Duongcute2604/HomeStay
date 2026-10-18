import { useMemo } from 'react'

import type { AdminRoom } from '../../types/admin'
import {
  DS_TRANG_THAI_PHONG,
  NHAN_TRANG_THAI_PHONG,
  RoomStatus,
} from '../../types/location'

/**
 * Bảng màu cho 5 trạng thái phòng — mỗi trạng thái một màu như sơ đồ khách sạn:
 * xanh lá = còn trống, xanh dương = đã đặt, cam = đang ở, tím = dọn dẹp,
 * đỏ = bảo trì. Dùng chung cho ô phòng (Sơ đồ) và popup chi tiết.
 */
export const MAU_TRANG_THAI: Record<RoomStatus, { vien: string; chu: string; nen: string }> = {
  [RoomStatus.AVAILABLE]: {
    vien: 'border-emerald-500',
    chu: 'text-emerald-700',
    nen: 'bg-emerald-50',
  },
  [RoomStatus.BOOKED]: {
    vien: 'border-blue-500',
    chu: 'text-blue-700',
    nen: 'bg-blue-50',
  },
  [RoomStatus.OCCUPIED]: {
    vien: 'border-amber-500',
    chu: 'text-amber-700',
    nen: 'bg-amber-50',
  },
  [RoomStatus.CLEANING]: {
    vien: 'border-violet-500',
    chu: 'text-violet-700',
    nen: 'bg-violet-50',
  },
  [RoomStatus.MAINTENANCE]: {
    vien: 'border-red-500',
    chu: 'text-red-700',
    nen: 'bg-red-50',
  },
}

interface Props {
  /** Toàn bộ phòng của trang quản trị (đã tải xong). */
  danhSach: AdminRoom[]
  /** Bấm một ô phòng — trang cha mở popup chi tiết. */
  onChonPhong: (phong: AdminRoom) => void
}

/**
 * Sơ đồ phòng trực quan: phòng xếp theo từng cơ sở, mỗi ô một màu theo
 * trạng thái. Mục tiêu là quét nhanh "phòng nào đang ở / trống / dọn dẹp"
 * thay vì đọc từng dòng bảng — cảm hứng từ sơ đồ phòng phần mềm khách sạn.
 */
export default function RoomMap({ danhSach, onChonPhong }: Props): JSX.Element {
  // Gộp phòng theo cơ sở, giữ đúng thứ tự cơ sở xuất hiện trong danh sách.
  const nhomTheoCoSo = useMemo(() => {
    const nhom = new Map<string, AdminRoom[]>()

    for (const phong of danhSach) {
      const ds = nhom.get(phong.locationName) ?? []
      ds.push(phong)
      nhom.set(phong.locationName, ds)
    }

    return [...nhom.entries()]
  }, [danhSach])

  return (
    <div className="mt-5 space-y-4">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-stone-200 bg-white px-4 py-3">
        {DS_TRANG_THAI_PHONG.map((trangThai) => (
          <li key={trangThai} className="flex items-center gap-2 text-xs text-stone-600">
            <span
              className={`h-3 w-3 rounded border ${MAU_TRANG_THAI[trangThai].nen} ${MAU_TRANG_THAI[trangThai].vien}`}
              aria-hidden="true"
            />
            {NHAN_TRANG_THAI_PHONG[trangThai]}
            <span className="number-vn text-stone-400">
              ({danhSach.filter((phong) => phong.status === trangThai).length})
            </span>
          </li>
        ))}
      </ul>

      {nhomTheoCoSo.map(([tenCoSo, phongList]) => (
        <section key={tenCoSo} className="rounded-xl border border-stone-200 bg-white p-4">
          <h2 className="text-sm font-bold text-stone-800">📍 {tenCoSo}</h2>
          <p className="mb-3 text-xs text-stone-500">
            <span className="number-vn">{phongList.length}</span> phòng
          </p>

          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {phongList.map((phong) => {
              const mau = MAU_TRANG_THAI[phong.status]

              return (
                <button
                  key={phong.id}
                  type="button"
                  // attribute giúp test (và CSS về sau) đọc được trạng thái
                  // thay vì đoán qua class tailwind.
                  data-trang-thai={phong.status}
                  aria-label={`Phòng ${phong.roomNumber} — ${NHAN_TRANG_THAI_PHONG[phong.status]}`}
                  onClick={() => onChonPhong(phong)}
                  className={`rounded-xl border-2 bg-white px-2 py-3 text-center transition hover:scale-105 ${mau.vien} ${mau.chu}`}
                >
                  <svg
                    viewBox="0 0 20 14"
                    className="mx-auto mb-1 h-4 w-6"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M1 12V4M1 8h18v4M19 12v-2M5 8V6h6v2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <circle cx="7.5" cy="6.5" r="1.5" fill="currentColor" />
                  </svg>
                  <span className="number-vn block text-sm font-bold">{phong.roomNumber}</span>
                  <span className="block truncate text-[10px] text-stone-500">{phong.name}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
