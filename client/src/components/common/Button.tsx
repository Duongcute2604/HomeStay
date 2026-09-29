import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Nút dùng chung.
 *
 * Gộp cả 2 kiểu nút (đầy và phụ) vào một component để chỗ nào cũng cho ra
 * cùng một kiểu bấm — tránh mỗi trang tự chế một lớp `rounded-lg bg-...` khác
 * nhau (DRY, AGENTS.md mục 3.2).
 */
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  bienDang?: 'primary' | 'outline'
  dangTai?: boolean
  children: ReactNode
}

export default function Button({
  bienDang = 'primary',
  dangTai = false,
  disabled,
  className,
  children,
  type = 'button',
  ...phanConLai
}: Props): JSX.Element {
  const lopNen = bienDang === 'primary' ? 'btn-primary' : 'btn-outline'

  return (
    <button
      // Mặc định là "button": nút trong <form> mặc định type="submit", gây tình
      // huống bấm nút "Hủy" lại vô tình submit form.
      type={type}
      disabled={disabled || dangTai}
      className={[lopNen, className].filter(Boolean).join(' ')}
      {...phanConLai}
    >
      {dangTai ? 'Đang xử lý…' : children}
    </button>
  )
}
