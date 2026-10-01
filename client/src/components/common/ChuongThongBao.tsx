import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { notificationService } from '../../services/notificationService'
import { useAuth } from '../../hooks/useAuth'
import { useToastStore } from '../../store/toastStore'
import { formatNgay } from '../../utils/format'

/** Khoá truy vấn dùng chung để trang danh sách và icon chuông không tải 2 lần. */
export const KHOA_THONG_BAO = ['notifications', 'my']

/**
 * Icon chuông kèm con số thông báo chưa đọc.
 *
 * <b>Vì sao badge là con số chứ không phải dấu chấm:</b> người dùng cần biết có bao
 * nhiêu việc chờ, không chỉ là "có gì đó mới". Có nhiều việc thì hiện `99+` — con số
 * thật lớn hơn sẽ làm badge tràn ra ngoài nút.
 *
 * Bấm vào chuông là sang thẳng trang danh sách chứ không mở popup: popup che mất trang
 * đang xem và phải xử lý đóng, còn trang riêng thì đọc xong còn quay lại được.
 */
export default function ChuongThongBao(): JSX.Element {
  const { daDangNhap } = useAuth()
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const { data } = useQuery({
    queryKey: KHOA_THONG_BAO,
    queryFn: () => notificationService.layCuaToi(),
    // Chưa đăng nhập thì không có thông báo nào của mình — không gọi API thừa.
    enabled: daDangNhap,
    // Chuông là thứ mở rất thường xuyên; giữ dữ liệu 30 giây để đi qua các trang
    // không gọi lại server, nhưng vẫn đủ nhanh để thấy thông báo mới sau khi bấm
    // "Xác nhận" ở trang Admin.
    staleTime: 30_000,
  })

  const soChuaDoc = data?.soChuaDoc ?? 0
  const moiNhat = data?.items.filter((x) => !x.isRead)[0]

  const danhDauDaDoc = useMutation({
    mutationFn: (id: number) => notificationService.danhDauDaDoc(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: KHOA_THONG_BAO })
    },
    onError: () => {
      themToast('Không đánh dấu được thông báo', 'error')
    },
  })

  if (!daDangNhap) {
    return <></>
  }

  return (
    <Link
      to="/notifications"
      // Bấm chuông là sang trang danh sách. Vẫn đánh dấu thông báo mới nhất là đã
      // đọc ngay lập tức để badge không nhảy về số cũ sau khi đã mở xem — nếu chờ
      // bấm nút trong trang thì người dùng đọc xong lại thấy badge vẫn đỏ.
      onClick={() => {
        if (moiNhat !== undefined) {
          danhDauDaDoc.mutate(moiNhat.id)
        }
      }}
      title={
        soChuaDoc === 0
          ? 'Không có thông báo mới'
          : `${soChuaDoc} thông báo chưa đọc · Mới nhất: ${moiNhat?.title ?? ''}`
      }
      className="relative rounded-lg p-2 text-gray-600 hover:bg-amber-50"
    >
      <span aria-hidden="true" className="text-xl leading-none">
        🔔
      </span>
      <span className="sr-only">Thông báo</span>

      {soChuaDoc > 0 && (
        <span className="number-vn absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {soChuaDoc > 99 ? '99+' : soChuaDoc}
        </span>
      )}
    </Link>
  )
}

/**
 * Dòng thời gian của một thông báo — dùng chung cho trang danh sách và các nơi khác.
 *
 * Tách riêng vì cách hiển thị (chấm tròn, ngày, chữ đậm khi chưa đọc) phải giống nhau ở
 * mọi nơi, khác nhau một chỗ thì người dùng tưởng là hai loại thông báo khác nhau.
 */
export function DongThongBao({
  tieuDe,
  noiDung,
  taLuc,
  daDoc,
  children,
}: {
  tieuDe: string
  noiDung: string | null
  taLuc: string
  daDoc: boolean
  children?: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex gap-3">
      <span
        aria-hidden="true"
        className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${daDoc ? 'bg-stone-200' : 'bg-amber-500'}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${daDoc ? 'text-stone-600' : 'font-semibold text-stone-800'}`}>
          {tieuDe}
        </p>
        {noiDung !== null && <p className="mt-0.5 text-left text-sm text-stone-500">{noiDung}</p>}
        <p className="mt-0.5 text-left text-xs text-stone-400">{formatNgay(taLuc)}</p>
        {children}
      </div>
    </div>
  )
}
