import { useEffect, useRef, type ReactNode } from 'react'

interface FadeInProps {
  /** Nội dung được bọc — khối sẽ "trồi lên" khi cuộn tới */
  children: ReactNode
  /** Trì hoãn (ms) trước khi hiện — dùng để các thẻ vào màn hình lần lượt */
  delay?: number
  /** Class Tailwind bổ sung cho thẻ bọc ngoài */
  className?: string
}

/**
 * Bọc một khối nội dung để nó hiện dần ("trồi lên") khi cuộn tới màn hình.
 *
 * Dùng chung class `.fade-in` / `.fade-in.visible` có sẵn trong index.css —
 * component chỉ lo thêm class `visible` bằng IntersectionObserver, phần chuyển
 * động hoàn toàn do CSS xử lý (không thêm thư viện hiệu ứng nào).
 *
 * Khi môi trường không có IntersectionObserver (jsdom trong unit test, trình
 * duyệt rất cũ) → hiện ngay lập tức, tuyệt đối không để nội dung bị ẩn mãi.
 */
export default function FadeIn({ children, delay = 0, className = '' }: FadeInProps): JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const the = ref.current
    if (the === null) {
      return
    }

    // typeof an toàn hơn `in window`: test mock bằng vi.stubGlobal vẫn bắt được
    if (typeof IntersectionObserver === 'undefined') {
      the.classList.add('visible')
      return
    }

    const observer = new IntersectionObserver(
      (cacMuc) => {
        for (const muc of cacMuc) {
          if (muc.isIntersecting) {
            the.classList.add('visible')
            observer.disconnect()
          }
        }
      },
      // Hiện khi khoảng 10% khối đã vào màn hình — sớm để người dùng không
      // phải chờ, đủ muộn để thấy rõ cú "trồi lên".
      { threshold: 0.1 },
    )
    observer.observe(the)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`fade-in ${className}`.trim()}
      style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  )
}
