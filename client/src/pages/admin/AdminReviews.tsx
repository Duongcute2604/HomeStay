import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import FormMessage from '../../components/common/FormMessage'
import StarRating from '../../components/common/StarRating'
import NutThaoTacDanhGia from '../../components/admin/NutThaoTacDanhGia'
import { adminService } from '../../services/adminService'
import { useToastStore } from '../../store/toastStore'
import { formatNgay } from '../../utils/format'

/** Bộ lọc mặc định: xem tất cả, trang 1. */
const LOC_MAC_DINH = {
  anId: undefined as boolean | undefined,
  soSao: undefined as number | undefined,
  page: 1,
  pageSize: 10,
}

/** Ba lựa chọn của ô lọc trạng thái hiển thị. */
const LOC_TRANG_THAI: Array<{ giaTri: boolean | undefined; nhan: string }> = [
  { giaTri: undefined, nhan: 'Tất cả' },
  { giaTri: false, nhan: 'Đang hiển thị' },
  { giaTri: true, nhan: 'Đang bị ẩn' },
]

/**
 * Trang quản lý đánh giá của Admin (Bước 16).
 *
 * Ba hành động, mỗi hành động một cột rõ ràng:
 * - **Ẩn**: đánh giá vi phạm → gỡ khỏi trang phòng nhưng **giữ bản ghi** để còn
 *   đối chiếu khi có khiếu nại.
 * - **Hiện lại**: đánh giá bị ẩn oan → trả về trang phòng.
 * - **Xoá**: đánh giá rác → xoá hẳn, phòng này lại đánh giá được từ đầu.
 *
 * Mọi hành động đều tính lại điểm phòng ở server, và server trả về điểm mới nên
 * bảng cập nhật ngay — không cần bấm "Làm mới" mới thấy đã có hiệu lực.
 */
export default function AdminReviews(): JSX.Element {
  const queryClient = useQueryClient()
  const themToast = useToastStore((s) => s.themToast)

  const [loc, setLoc] = useState(LOC_MAC_DINH)
  const [canXoa, setCanXoa] = useState<number | null>(null)
  const [loi, setLoi] = useState<string | null>(null)

  const { data, isPending, isError, error } = useQuery({
    queryKey: ['admin', 'reviews', loc],
    queryFn: () => adminService.layDanhGia(loc),
  })

  const thaoTac = useMutation({
    mutationFn: (bien: { id: number; hanhDong: 'an' | 'hien' | 'xoa' }) => {
      if (bien.hanhDong === 'an') {
        return adminService.anDanhGia(bien.id)
      }
      if (bien.hanhDong === 'hien') {
        return adminService.hienDanhGia(bien.id)
      }
      return adminService.xoaDanhGia(bien.id)
    },
    onSuccess: async (ketQua, bien) => {
      const nhan: Record<string, string> = {
        an: 'Đã ẩn đánh giá khỏi trang phòng',
        hien: 'Đã hiện lại đánh giá',
        xoa: 'Đã xoá đánh giá',
      }
      // Kèm luôn điểm phòng mới: Admin thấy ngay thao tác đã có hiệu lực trên
      // điểm chứ không phải chờ bấm "Làm mới".
      themToast(
        `${nhan[bien.hanhDong]} · Điểm phòng còn ${ketQua.phongDiemTrungBinh}/5 (${ketQua.phongSoDanhGia} đánh giá)`,
        'success',
      )
      setCanXoa(null)
      setLoi(null)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
    },
    onError: (err) => {
      setLoi(layThongBaoLoi(err))
    },
  })

  const tongTrang = data?.totalPages ?? 0

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Đánh giá</h1>
          <p className="text-sm text-stone-500">
            Ẩn đánh giá vi phạm nhưng giữ lại bản ghi · Xoá khi là đánh giá rác
          </p>
        </div>
      </header>

      <div className="card-phong mt-4 flex flex-wrap items-end gap-3 p-4">
        <div>
          <label className="block text-xs font-medium text-stone-600" htmlFor="loc-hien-thi">
            Trạng thái
          </label>
          <select
            id="loc-hien-thi"
            className="mt-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            value={loc.anId === undefined ? '' : String(loc.anId)}
            onChange={(e) =>
              setLoc({
                ...loc,
                anId: e.target.value === '' ? undefined : e.target.value === 'true',
                page: 1,
              })
            }
          >
            {LOC_TRANG_THAI.map((muc) => (
              <option key={muc.nhan} value={muc.giaTri === undefined ? '' : String(muc.giaTri)}>
                {muc.nhan}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600" htmlFor="loc-sao">
            Số sao
          </label>
          <select
            id="loc-sao"
            className="mt-1 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            value={loc.soSao === undefined ? '' : String(loc.soSao)}
            onChange={(e) =>
              setLoc({
                ...loc,
                soSao: e.target.value === '' ? undefined : Number(e.target.value),
                page: 1,
              })
            }
          >
            <option value="">Tất cả</option>
            {[1, 2, 3, 4, 5].map((sao) => (
              <option key={sao} value={sao}>
                {sao} sao
              </option>
            ))}
          </select>
        </div>

        <Button bienDang="outline" onClick={() => setLoc(LOC_MAC_DINH)}>
          Xoá lọc
        </Button>
      </div>

      {loi !== null && (
        <div className="mt-3">
          <FormMessage loi={loi} />
        </div>
      )}

      {isPending && <p className="mt-6 text-center text-sm text-stone-500">Đang tải đánh giá...</p>}

      {isError && (
        <p className="mt-6 text-center text-sm text-red-600">{layThongBaoLoi(error)}</p>
      )}

      {isPending === false && isError === false && data !== undefined && (
        <>
          {data.items.length === 0 ? (
            <p className="mt-6 text-center text-sm text-stone-400">
              Không có đánh giá nào khớp bộ lọc
            </p>
          ) : (
            <div className="card-phong mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-amber-50 text-left text-stone-600">
                  <tr>
                    <th className="px-3 py-3">STT</th>
                    <th className="px-3 py-3">Người viết</th>
                    <th className="px-3 py-3">Phòng</th>
                    <th className="px-3 py-3">Mã đơn</th>
                    <th className="px-3 py-3 text-left">Sao</th>
                    <th className="px-3 py-3">Nhận xét</th>
                    <th className="px-3 py-3">Ngày</th>
                    <th className="px-3 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((danhGia, chiSo) => (
                    <tr
                      key={danhGia.id}
                      className={
                        danhGia.isHidden ? 'border-t border-stone-100 bg-stone-50' : 'border-t border-stone-100'
                      }
                    >
                      <td className="number-vn px-3 py-3 text-left">
                        {(loc.page - 1) * loc.pageSize + chiSo + 1}
                      </td>
                      <td className="px-3 py-3 text-stone-800">
                        {danhGia.reviewerName}
                        {danhGia.isHidden && (
                          <span className="ml-2 rounded-full bg-stone-200 px-2 py-0.5 text-xs text-stone-600">
                            Đang ẩn
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        {danhGia.roomName}
                        <span className="block text-xs text-stone-400">{danhGia.locationName}</span>
                      </td>
                      <td className="number-vn px-3 py-3 text-stone-600">{danhGia.bookingCode}</td>
                      <td className="px-3 py-3 text-left">
                        <StarRating value={danhGia.rating} />
                      </td>
                      <td className="px-3 py-3 text-stone-600">
                        {danhGia.comment === null || danhGia.comment.trim() === '' ? (
                          <span className="italic text-stone-400">—</span>
                        ) : (
                          danhGia.comment
                        )}
                      </td>
                      <td className="number-vn px-3 py-3 text-stone-500">
                        {formatNgay(danhGia.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        <NutThaoTacDanhGia
                          isHidden={danhGia.isHidden}
                          dangChay={thaoTac.isPending}
                          canXoa={canXoa === danhGia.id}
                          onMoXoa={() => setCanXoa(danhGia.id)}
                          onDoiHienThi={() =>
                            thaoTac.mutate({
                              id: danhGia.id,
                              hanhDong: danhGia.isHidden ? 'hien' : 'an',
                            })
                          }
                          onXoa={() => thaoTac.mutate({ id: danhGia.id, hanhDong: 'xoa' })}
                          onGiuLai={() => setCanXoa(null)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between text-sm text-stone-600">
            <p className="number-vn">
              Tổng {data.totalItems} đánh giá
            </p>
            {tongTrang > 1 && (
              <div className="flex gap-2">
                <Button
                  bienDang="outline"
                  disabled={loc.page <= 1}
                  onClick={() => setLoc({ ...loc, page: loc.page - 1 })}
                >
                  ← Trang trước
                </Button>
                <span className="number-vn self-center">
                  {loc.page} / {tongTrang}
                </span>
                <Button
                  bienDang="outline"
                  disabled={loc.page >= tongTrang}
                  onClick={() => setLoc({ ...loc, page: loc.page + 1 })}
                >
                  Trang sau →
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}
