import StarRating from './common/StarRating'
import { formatDiem } from '../utils/format'

/** Một đánh giá nhận từ API chi tiết phòng. */
export interface RoomReview {
  reviewerName: string
  rating: number
  comment: string | null
  createdAt: string
}

/**
 * Danh sách đánh giá của phòng.
 *
 * Backend đã trả sẵn danh sách này từ Bước 8 nhưng **chưa màn hình nào hiện** —
 * chỉ có con số trung bình. Không có nó thì điểm trung bình là một con số không
 * kiểm chứng được: khách không đọc được khách khác nói gì.
 *
 * Chỉ hiện tên và nội dung, **không** hiện mã đơn: mã đơn là dữ liệu riêng của
 * người viết, không cần thiết để ai đó đánh giá chất lượng phòng.
 */
export default function ReviewList({ reviews }: { reviews: RoomReview[] }): JSX.Element {
  if (reviews.length === 0) {
    return (
      <p className="text-sm text-stone-500">
        Phòng này chưa có đánh giá nào. Hãy là người đầu tiên chia sẻ trải nghiệm
        sau khi đã ở và trả phòng.
      </p>
    )
  }

  const diemTrungBinh =
    reviews.reduce((tong, danhGia) => tong + danhGia.rating, 0) / reviews.length

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-stone-800">
          Đánh giá ({reviews.length})
        </h2>
        <StarRating value={diemTrungBinh} />
      </div>

      <ul className="mt-4 space-y-4">
        {reviews.map((danhGia, chiSo) => (
          <li key={`${danhGia.reviewerName}-${chiSo}`} className="border-t border-stone-100 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-medium text-stone-800">{danhGia.reviewerName}</p>
              <p className="text-xs text-stone-400">
                {new Date(danhGia.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="mt-1">
              <StarRating value={danhGia.rating} />
            </div>
            {danhGia.comment !== null && danhGia.comment.trim() !== '' && (
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{danhGia.comment}</p>
            )}
            {danhGia.comment === null && (
              <p className="mt-2 text-sm italic text-stone-400">Không có nhận xét</p>
            )}
          </li>
        ))}
      </ul>

      <p className="mt-4 text-xs text-stone-400">
        Điểm trung bình {formatDiem(diemTrungBinh)}/5 tính trên{' '}
        {reviews.length} đánh giá mới nhất. Đánh giá vi phạm đã bị quản trị viên ẩn.
      </p>
    </div>
  )
}
