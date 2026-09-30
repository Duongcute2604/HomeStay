import { useState } from 'react'

import Button from './common/Button'
import StarInput from './common/StarInput'
import StarRating from './common/StarRating'
import { formatNgay } from '../utils/format'
import { SAO_CAO_NHAT, SAO_THAP_NHAT } from '../utils/review'

/** Đánh giá của chính người đang xem, lấy từ chi tiết đơn. */
export interface ReviewCuaToi {
  rating: number
  comment: string | null
  createdAt: string
}

/**
 * Form đánh giá phòng, hiện ở trang chi tiết đơn khi đơn đã trả phòng.
 *
 * <b>Chỉ hiện khi đủ 3 điều kiện:</b> đơn `COMPLETED`, chưa có đánh giá, và
 * người xem đã đăng nhập. Ba điều kiện này backend cũng chặn lại — ở đây chỉ để
 * khách khỏi phải bấm rồi mới nhận lỗi 409.
 *
 * <b>Vì sao không cho sửa đánh giá đã gửi:</b> ai đó chấm 1 sao rồi sửa lại 5 sao
 * thì điểm phòng bị đầu đọc. Sửa vi phạm là việc của quản trị viên, có lưu vết.
 */
export default function ReviewForm({
  daDanhGia,
  danhGiaCuaToi,
  dangGui,
  loi,
  onSubmit,
}: {
  /** Đơn này đã có đánh giá chưa. */
  daDanhGia: boolean
  /** Nội dung đánh giá đã gửi, hiển thị lại cho khách đọc. */
  danhGiaCuaToi: ReviewCuaToi | null
  /** Đang gọi API — khoá nút để không gửi hai lần. */
  dangGui: boolean
  /** Thông báo lỗi từ server, null khi không có. */
  loi: string | null
  /** Gửi đánh giá lên trên. */
  onSubmit: (sao: number, nhanXet: string) => void
}): JSX.Element {
  const [sao, setSao] = useState(0)
  const [nhanXet, setNhanXet] = useState('')

  if (daDanhGia && danhGiaCuaToi !== null) {
    return (
      <section className="card mt-4 p-4">
        <h2 className="font-semibold text-stone-800">Đánh giá của bạn</h2>
        <div className="mt-2 flex items-center gap-2">
          <StarRating value={danhGiaCuaToi.rating} />
          <span className="text-xs text-stone-400">
            · {formatNgay(danhGiaCuaToi.createdAt)}
          </span>
        </div>
        {danhGiaCuaToi.comment !== null && (
          <p className="mt-2 text-sm text-stone-600">{danhGiaCuaToi.comment}</p>
        )}
        <p className="mt-3 text-xs text-stone-400">
          Mỗi đơn chỉ được đánh giá một lần. Cần sửa hoặc gỡ nhận xét? Liên hệ
          quản trị viên.
        </p>
      </section>
    )
  }

  return (
    <section className="card mt-4 p-4">
      <h2 className="font-semibold text-stone-800">Đánh giá phòng</h2>
      <p className="mt-1 text-sm text-stone-500">
        Cảm ơn bạn đã trả phòng. Ý kiến của bạn giúp khách khác chọn đúng hơn.
      </p>

      <div className="mt-3">
        <StarInput value={sao} onChange={setSao} />
      </div>

      <label className="mt-4 block text-sm font-medium text-stone-700" htmlFor="nhan-xet">
        Nhận xét <span className="font-normal text-stone-400">(không bắt buộc)</span>
      </label>
      <textarea
        id="nhan-xet"
        rows={4}
        maxLength={1000}
        value={nhanXet}
        onChange={(e) => setNhanXet(e.target.value)}
        placeholder="Ví dụ: phòng sạch, thoáng, nhân viên nhiệt tình..."
        className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-800 focus:border-amber-500 focus:outline-none"
      />
      <p className="mt-1 text-right text-xs text-stone-400">
        {nhanXet.length}/1000 ký tự
      </p>

      {loi !== null && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loi}</p>
      )}

      <div className="mt-3 flex justify-end">
        <Button
          bienDang="primary"
          disabled={dangGui || sao < SAO_THAP_NHAT || sao > SAO_CAO_NHAT}
          onClick={() => onSubmit(sao, nhanXet)}
        >
          {dangGui ? 'Đang gửi...' : 'Gửi đánh giá'}
        </Button>
      </div>
      {sao === 0 && !dangGui && (
        <p className="mt-2 text-right text-xs text-stone-400">Hãy chấm số sao trước khi gửi</p>
      )}
    </section>
  )
}
