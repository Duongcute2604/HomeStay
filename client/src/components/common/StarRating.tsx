import { formatDiem } from '../../utils/review'

/**
 * Hiển thị số sao ở chế độ chỉ đọc.
 *
 * Vẽ bằng ký tự `★`/`☆` chứ không dùng icon hay ảnh: nhanh, không phụ thuộc
 * thư viện, và đọc được cả khi máy thiếu font. Nửa sao không vẽ — cấp chấm điểm
 * cũng vậy, người dùng muốn biết "mấy sao" chứ không phải "mấy phần mười sao".
 */
export default function StarRating({
  value,
  reviewCount,
  coNhan = false,
}: {
  /** Điểm trung bình 0–5. */
  value: number
  /** Số đánh giá. Bỏ trống thì không hiện đuôi "(n đánh giá)". */
  reviewCount?: number
  /** Hiện nhãn tiếng Việt bên dưới, dùng ở trang chi tiết phòng. */
  coNhan?: boolean
}): JSX.Element {
  const soSao = Math.round(value)

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-amber-500"
        aria-label={`${formatDiem(value)} trên 5 sao`}
        role="img"
      >
        {[1, 2, 3, 4, 5].map((sao) => (
          <span key={sao} aria-hidden="true">
            {sao <= soSao ? '★' : '☆'}
          </span>
        ))}
      </span>
      <span className="number-vn text-sm text-stone-700">{formatDiem(value)}</span>
      {reviewCount !== undefined && reviewCount > 0 && (
        <span className="text-sm text-stone-500">({reviewCount} đánh giá)</span>
      )}
      {coNhan && (
        <p className="w-full text-xs text-stone-500">
          Dựa trên {reviewCount ?? 0} đánh giá của khách đã trả phòng
        </p>
      )}
    </div>
  )
}
