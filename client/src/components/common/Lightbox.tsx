import { useEffect } from 'react'

interface LightboxProps {
  src: string
  alt: string
  dong: () => void
}

/**
 * Lightbox — xem ảnh lớn toàn màn hình.
 *
 * Bấm ảnh → mở lightbox. Bấm ra ngoài hoặc phím Esc → đóng.
 */
export default function Lightbox({ src, alt, dong }: LightboxProps): JSX.Element {
  useEffect(() => {
    const xuLyPhim = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') dong()
    }
    window.addEventListener('keydown', xuLyPhim)
    return () => window.removeEventListener('keydown', xuLyPhim)
  }, [dong])

  return (
    <div className="lightbox" onClick={dong}>
      <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80">
        Bấm ra ngoài hoặc phím Esc để đóng
      </p>
    </div>
  )
}
