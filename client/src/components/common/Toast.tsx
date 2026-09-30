import { useToastStore } from '../../store/toastStore'

/**
 * Vùng hiện thông báo nổi (toast).
 *
 * <b>Vì sao có `role`:</b> toast là thứ xuất hiện *không phải do người dùng
 * bấm*, nên nếu không khai vai trò thì trình đọc màn hình im lặng — người mù
 * hoàn toàn không biết thao tác của mình đã thành công hay thất bại.
 * `alert` cho lỗi (đọc ngay, cắt ngang), `status` cho thành công (đọc sau).
 */
export default function Toast(): JSX.Element {
  const toasts = useToastStore((state) => state.toasts)
  const xoaToast = useToastStore((state) => state.xoaToast)

  if (toasts.length === 0) return <></>

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
          className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          onClick={() => xoaToast(toast.id)}
          title="Bấm để đóng"
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </>
  )
}