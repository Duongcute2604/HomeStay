import Button from '../common/Button'

/**
 * Ô thao tác của một dòng đánh giá trong trang quản trị (Bước 16).
 *
 * Tách riêng vì 1 dòng có **tối đa 3 trạng thái nút** (Ẩn / Xoá 2 bước / Giữ lại
 * + Xoá hẳn), nhồi vào bảng làm file vượt 300 dòng và khó đọc — phần duy nhất
 * của trang thay đổi theo trạng thái.
 *
 * **Xoá phải bấm 2 lần**: xoá hẳn không hoàn lại được, bấm nhầm là mất thật.
 */
export default function NutThaoTacDanhGia({
  isHidden,
  dangChay,
  canXoa,
  onMoXoa,
  onDoiHienThi,
  onXoa,
  onGiuLai,
}: {
  /** Đánh giá đang bị ẩn hay không — quyết định nhãn nút chính. */
  isHidden: boolean
  /** Đang gọi API — khoá hết nút để không bấm hai lần. */
  dangChay: boolean
  /** Đang mở bước xác nhận xoá hay không. */
  canXoa: boolean
  /** Bấm "Xoá" lần 1 → mở bước xác nhận. */
  onMoXoa: () => void
  /** Bấm "Ẩn" hoặc "Hiện lại". */
  onDoiHienThi: () => void
  /** Bấm "Xoá hẳn" — xác nhận lần 2. */
  onXoa: () => void
  /** Bấm "Giữ lại" — huỷ xoá. */
  onGiuLai: () => void
}): JSX.Element {
  if (canXoa) {
    return (
      <div className="flex justify-end gap-2">
        <Button bienDang="outline" onClick={onGiuLai} disabled={dangChay}>
          Giữ lại
        </Button>
        <button
          type="button"
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          onClick={onXoa}
          disabled={dangChay}
        >
          Xoá hẳn
        </button>
      </div>
    )
  }

  return (
    <div className="flex justify-end gap-2">
      <Button bienDang="outline" onClick={onDoiHienThi} disabled={dangChay}>
        {isHidden ? 'Hiện lại' : 'Ẩn'}
      </Button>
      <button
        type="button"
        className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 disabled:opacity-60"
        onClick={onMoXoa}
        disabled={dangChay}
      >
        Xoá
      </button>
    </div>
  )
}