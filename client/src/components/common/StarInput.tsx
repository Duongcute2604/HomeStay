import { useState } from 'react'

import { NHAN_SAO, SAO_CAO_NHAT, SAO_THAP_NHAT } from '../../utils/review'

/**
 * Ô chấm sao — dùng trong form đánh giá.
 *
 * Bấm được (nút thật) chứ không phải ký tự có `onClick`, để bàn phím và trình
 * đọc màn hình dùng được. Dùng `radio` ẩn là cách chuẩn: mỗi sao là một
 * `label` gắn với một radio, nên Tab tới và dùng phím mũi tên hoạt động đúng
 * như mọi nhóm radio khác.
 *
 * Không đặt `value` mặc định cho radio: nếu mặc định 5 sao thì khách bấm gửi
 * khi chưa chọn gì vẫn ra 5 sao — đánh giá không có ý kiến.
 */
export default function StarInput({
  value,
  onChange,
}: {
  /** Số sao đang chọn; 0 nghĩa là chưa chọn. */
  value: number
  onChange: (sao: number) => void
}): JSX.Element {
  const [dangHover, setDangHover] = useState(0)
  const hienThi = dangHover > 0 ? dangHover : value

  return (
    <div role="radiogroup" aria-label="Chấm số sao">
      <div
        className="flex items-center gap-1 text-3xl"
        onMouseLeave={() => setDangHover(0)}
      >
        {Array.from({ length: SAO_CAO_NHAT - SAO_THAP_NHAT + 1 }, (_, i) => i + SAO_THAP_NHAT).map(
          (sao) => (
            <label
              key={sao}
              className={`cursor-pointer select-none transition ${
                sao <= hienThi ? 'text-amber-500' : 'text-stone-300'
              }`}
              onMouseEnter={() => setDangHover(sao)}
            >
              <input
                type="radio"
                name="rating"
                value={sao}
                checked={value === sao}
                onChange={() => onChange(sao)}
                className="sr-only"
              />
              <span aria-hidden="true">{sao <= hienThi ? '★' : '☆'}</span>
            </label>
          ),
        )}
      </div>
      <p className="mt-1 text-sm text-stone-600">
        {hienThi > 0
          ? NHAN_SAO[hienThi]
          : 'Chưa chọn — hãy chấm số sao trước khi gửi'}
      </p>
    </div>
  )
}
