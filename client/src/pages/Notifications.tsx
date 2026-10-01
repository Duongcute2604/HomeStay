import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import { KHOA_THONG_BAO, DongThongBao } from '../components/common/ChuongThongBao'
import { notificationService } from '../services/notificationService'
import { useToastStore } from '../store/toastStore'

/**
 * Trang danh sách thông báo của chính khách.
 *
 * Mỗi dòng là một lần hệ thống có gì đó thay đổi với đơn của khách: đơn được xác nhận,
 * đã nhận phòng, đã trả phòng, hoặc bị từ chối kèm lý do.
 *
 * Thông báo **chỉ hiển thị trong hệ thống**, không gửi email/SMS — nên trang này là
 * chỗ duy nhất đọc thông báo. Ghi rõ ở đầu trang để người dùng không đi tìm trong hộp
 * thư.
 */
export default function Notifications(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: KHOA_THONG_BAO,
    queryFn: () => notificationService.layCuaToi(),
  })

  const danhDauDaDoc = useMutation({
    mutationFn: (id: number) => notificationService.danhDauDaDoc(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: KHOA_THONG_BAO }),
    onError: (err) => themToast(layThongBaoLoi(err), 'error'),
  })

  const danhDauTatCa = useMutation({
    mutationFn: () => notificationService.danhDauDaDocTatCa(),
    onSuccess: (soMoi) => {
      themToast(
        soMoi === 0 ? 'Không có thông báo nào chưa đọc' : `Đã đánh dấu ${soMoi} thông báo là đã đọc`,
        'success',
      )
      void queryClient.invalidateQueries({ queryKey: KHOA_THONG_BAO })
    },
    onError: (err) => themToast(layThongBaoLoi(err), 'error'),
  })

  const danhSach = data?.items ?? []
  const chuaDoc = data?.soChuaDoc ?? 0

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Thông báo</h1>
          <p className="mt-1 text-sm text-stone-500">
            Mỗi lần hệ thống có thay đổi với đơn của bạn — được xác nhận, nhận phòng,
            trả phòng hoặc bị từ chối — sẽ có một thông báo ở đây.
          </p>
        </div>

        {chuaDoc > 0 && (
          <Button
            bienDang="outline"
            disabled={danhDauTatCa.isPending}
            onClick={() => danhDauTatCa.mutate()}
          >
            Đánh dấu đã đọc tất cả ({chuaDoc})
          </Button>
        )}
      </div>

      {isPending ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-4">
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton mt-2 h-3 w-full" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
          <Button className="mt-4" onClick={() => void refetch()}>
            Thử lại
          </Button>
        </div>
      ) : danhSach.length === 0 ? (
        <div className="card mx-auto mt-8 max-w-md p-6 text-center">
          <p className="font-semibold text-stone-800">Chưa có thông báo nào</p>
          <p className="mt-1 text-sm text-stone-500">
            Khi quản trị viên xác nhận đơn của bạn, bạn sẽ thấy thông báo ở đây.
          </p>
          <Link to="/bookings" className="mt-3 inline-block text-sm text-amber-600 hover:text-amber-800">
            Xem đơn của tôi →
          </Link>
        </div>
      ) : (
        <>
          {chuaDoc > 0 && (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Bạn có {chuaDoc} thông báo chưa đọc. Thông báo chưa đọc được in đậm.
            </p>
          )}

          <ul className="card divide-y divide-stone-100">
            {danhSach.map((thongBao) => (
              <li key={thongBao.id} className="p-4">
                <DongThongBao
                  tieuDe={thongBao.title}
                  noiDung={thongBao.content}
                  taLuc={thongBao.createdAt}
                  daDoc={thongBao.isRead}
                >
                  {!thongBao.isRead && (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-amber-700 hover:underline disabled:opacity-50"
                      disabled={danhDauDaDoc.isPending}
                      onClick={() => danhDauDaDoc.mutate(thongBao.id)}
                    >
                      Đánh dấu đã đọc
                    </button>
                  )}
                </DongThongBao>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-left text-xs text-stone-400">
            Hiển thị {danhSach.length} thông báo mới nhất. Thông báo chỉ có trong hệ
            thống, không gửi qua email hay tin nhắn.
          </p>
        </>
      )}
    </div>
  )
}
