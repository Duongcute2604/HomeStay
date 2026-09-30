import { useToastStore } from '../../store/toastStore'

export default function Toast(): JSX.Element {
  const toasts = useToastStore((state) => state.toasts)
  const xoaToast = useToastStore((state) => state.xoaToast)

  if (toasts.length === 0) return <></>

  return (
    <>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type === 'success' ? 'toast-success' : 'toast-error'}`}
          onClick={() => xoaToast(toast.id)}
        >
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      ))}
    </>
  )
}
