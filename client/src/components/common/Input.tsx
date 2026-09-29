import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'

/**
 * Ô nhập có nhãn và thông báo lỗi.
 *
 * Dùng `forwardRef` vì React Hook Form gắn `ref` vào ô input thật để đọc giá trị
 * khi submit. Bỏ `forwardRef` thì `register('email')` báo lỗi và form không lấy
 * được dữ liệu — lỗi hiện ra rất khó đoán.
 *
 * `useId` sinh `id` duy nhất cho từng ô: nhờ vậy `<label htmlFor>` và
 * `aria-describedby` trỏ đúng, và hai ô trong cùng form không đụng `id`.
 */
interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  loi?: string | undefined
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, loi, id, className, ...phanConLai },
  ref,
) {
  const idMacDinh = useId()
  const idInput = id ?? idMacDinh
  const idLoi = loi ? `${idInput}-loi` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={idInput} className="text-sm font-medium text-gray-700">
        {label}
      </label>

      <input
        {...phanConLai}
        id={idInput}
        ref={ref}
        // Trạng thái lỗi phải thể hiện bằng thuộc tính, không chỉ bằng màu:
        // người dùng màn hình không nhìn thấy màu đỏ.
        aria-invalid={loi ? true : undefined}
        aria-describedby={idLoi}
        className={[
          'rounded-lg border px-3 py-2 text-sm outline-none transition-colors',
          'focus:ring-2 focus:ring-brand-100',
          loi
            ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
            : 'border-gray-300 focus:border-brand-500',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {loi && (
        <p id={idLoi} role="alert" className="text-sm text-red-600">
          {loi}
        </p>
      )}
    </div>
  )
})

export default Input
