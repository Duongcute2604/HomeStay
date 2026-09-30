import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { schemaTimKiem, type TimKiemForm } from '../schemas/roomSchemas'
import { locationService } from '../services/locationService'
import { roomService } from '../services/roomService'
import { NHAN_LOAI_PHONG, NHAN_TRANG_THAI_PHONG, RoomStatus, RoomType } from '../types/location'
import { LOC_MAC_DINH, NHAN_SAP_XEP, SortOption, type SearchFilters } from '../types/room'
import { formatDiem, formatVnd } from '../utils/format'

/**
 * Trang tìm kiếm và lọc phòng.
 *
 * Hai trạng thái riêng biệt:
 * - `form` (nháp): những gì người dùng đang gõ, chưa gửi.
 * - `boLoc` (đã áp dụng): những gì query đang dùng để gọi API.
 * Không có nút "Tìm kiếm" thì mỗi phím gõ là một lần gọi API — tốn và chập chờn.
 *
 * Trang hiện tại (`page`) nằm ngoài form: bấm chuyển trang không cần submit lại.
 */
export default function Rooms(): JSX.Element {
  const [boLoc, setBoLoc] = useState<SearchFilters>(LOC_MAC_DINH)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TimKiemForm>({
    resolver: zodResolver(schemaTimKiem),
    defaultValues: {
      keyword: '',
      locationIndex: null,
      roomType: null,
      minPrice: null,
      maxPrice: null,
      capacity: null,
      sort: SortOption.NEWEST,
    },
  })

  // Danh sách địa điểm cho ô chọn — dùng chung cache với trang `/locations`.
  const { data: diaDiemList = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.layDanhSach(),
    staleTime: 5 * 60 * 1000,
  })

  const {
    data: ketQua,
    isPending,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rooms', 'search', boLoc],
    queryFn: () => roomService.timKiem(boLoc),
  })

  const xuLyTimKiem = (duLieu: TimKiemForm): void => {
    setBoLoc({
      keyword: duLieu.keyword ?? '',
      locationIndex: duLieu.locationIndex,
      roomType: duLieu.roomType as SearchFilters['roomType'],
      minPrice: duLieu.minPrice,
      maxPrice: duLieu.maxPrice,
      capacity: duLieu.capacity,
      sort: duLieu.sort,
      page: 1,
      pageSize: boLoc.pageSize,
    })
  }

  const xuLyDoiTrang = (trang: number): void => {
    setBoLoc((cu) => ({ ...cu, page: trang }))
    window.scrollTo({ top: 0 })
  }

  const items = ketQua?.items ?? []
  const tongSoTrang = ketQua?.totalPages ?? 0
  const trangHienTai = ketQua?.page ?? 1
  const kichThuocTrang = ketQua?.pageSize ?? LOC_MAC_DINH.pageSize

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900">Tìm phòng</h1>

      <form
        className="card mt-4 grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3"
        onSubmit={handleSubmit(xuLyTimKiem)}
        noValidate
      >
        <FormMessage loi={errors.root?.message} />

        <Input label="Từ khoá (tên phòng)" placeholder="Ví dụ: Hạnh Phúc" {...register('keyword')} loi={errors.keyword?.message} />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="loc-diaDiem">
            Địa điểm
          </label>
          <select
            id="loc-diaDiem"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('locationIndex', {
              setValueAs: (giaTri: string) => (giaTri === '' ? null : Number(giaTri)),
            })}
          >
            <option value="">Tất cả địa điểm</option>
            {diaDiemList.map((diaDiem, chiSo) => (
              <option key={chiSo} value={chiSo}>
                {chiSo + 1}. {diaDiem.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="loc-loaiPhong">
            Loại phòng
          </label>
          <select
            id="loc-loaiPhong"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('roomType', {
              setValueAs: (giaTri: string) => (giaTri === '' ? null : Number(giaTri)),
            })}
          >
            <option value="">Tất cả loại phòng</option>
            {(Object.values(RoomType) as number[])
              .filter((giaTri) => typeof giaTri === 'number')
              .map((giaTri) => (
                <option key={giaTri} value={giaTri}>
                  {NHAN_LOAI_PHONG[giaTri as RoomType]}
                </option>
              ))}
          </select>
          {errors.roomType && <p className="mt-1 text-sm text-red-600">{errors.roomType.message}</p>}
        </div>

        <Input
          label="Giá ngày thấp nhất (₫)"
          type="number"
          min={0}
          placeholder="Ví dụ: 500000"
          {...register('minPrice')}
          loi={errors.minPrice?.message}
        />

        <Input
          label="Giá ngày cao nhất (₫)"
          type="number"
          min={0}
          placeholder="Ví dụ: 1000000"
          {...register('maxPrice')}
          loi={errors.maxPrice?.message}
        />

        <Input
          label="Số khách"
          type="number"
          min={1}
          placeholder="Ví dụ: 2"
          {...register('capacity')}
          loi={errors.capacity?.message}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="loc-sapXep">
            Sắp xếp
          </label>
          <select
            id="loc-sapXep"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('sort')}
            onChange={(e) => {
              // Đổi sắp xếp thì áp dụng ngay, không cần bấm "Tìm kiếm".
              setValue('sort', e.target.value as SortOption)
              void handleSubmit(xuLyTimKiem)()
            }}
          >
            {(Object.values(SortOption) as SortOption[]).map((giaTri) => (
              <option key={giaTri} value={giaTri}>
                {NHAN_SAP_XEP[giaTri]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end sm:col-span-2 lg:col-span-1">
          <Button type="submit" className="w-full">
            Tìm kiếm
          </Button>
        </div>
      </form>

      <div className="mt-5">
        {isPending ? (
          <p className="mt-8 text-center text-sm text-gray-500">Đang tìm phòng...</p>
        ) : isError ? (
          <div className="card mx-auto mt-8 max-w-md p-6 text-center">
            <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
            <Button className="mt-4" onClick={() => refetch()}>
              Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="card mx-auto mt-8 max-w-md p-6 text-center">
            <p className="font-semibold text-gray-900">Không tìm thấy phòng nào</p>
            <p className="mt-1 text-sm text-gray-500">
              Thử nới rộng khoảng giá, giảm số khách hoặc bỏ bớt điều kiện lọc.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500">
              Tìm thấy {ketQua?.totalItems} phòng
              {tongSoTrang > 1 && ` · Trang ${trangHienTai}/${tongSoTrang}`}
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {items.map((phong, chiSo) => {
                // STT liên tục qua các trang: trang 2 bắt đầu từ 7 (với 6 phòng/trang).
                const stt = (trangHienTai - 1) * kichThuocTrang + chiSo + 1

                return (
                  <div key={`${trangHienTai}-${chiSo}`} className="card overflow-hidden">
                    {phong.thumbnailUrl ? (
                      <img
                        src={phong.thumbnailUrl}
                        alt={phong.name}
                        className="h-36 w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-36 w-full items-center justify-center bg-gray-100 text-sm text-gray-400">
                        Chưa có ảnh
                      </div>
                    )}

                    <div className="p-4">
                      <p className="text-xs text-gray-400">
                        {stt}. {phong.locationName}
                      </p>
                      <div className="mt-1 flex items-start justify-between gap-2">
                        <h2 className="font-semibold text-gray-900">{phong.name}</h2>
                        <span
                          className={
                            phong.status === RoomStatus.AVAILABLE
                              ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700'
                              : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500'
                          }
                        >
                          {NHAN_TRANG_THAI_PHONG[phong.status]}
                        </span>
                      </div>

                      <p className="mt-1 text-left text-sm text-gray-500">
                        {NHAN_LOAI_PHONG[phong.roomType]} · Phòng {phong.roomNumber} · Tối đa{' '}
                        {phong.capacity} khách
                        {phong.ratingCount > 0 && (
                          <> · ★ {formatDiem(phong.ratingAvg)} ({phong.ratingCount} đánh giá)</>
                        )}
                      </p>

                      <div className="mt-3 flex items-baseline justify-end gap-4 text-sm">
                        <span className="number-vn text-right text-gray-600">
                          {formatVnd(phong.pricePerHour)}/giờ
                        </span>
                        <span className="number-vn text-right font-semibold text-brand-700">
                          {formatVnd(phong.pricePerDay)}/ngày
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {tongSoTrang > 1 && (
              <div className="mt-5 flex items-center justify-center gap-3">
                <Button
                  bienDang="outline"
                  disabled={trangHienTai <= 1}
                  onClick={() => xuLyDoiTrang(trangHienTai - 1)}
                >
                  ← Trang trước
                </Button>
                <span className="text-sm text-gray-600">
                  Trang {trangHienTai}/{tongSoTrang}
                </span>
                <Button
                  bienDang="outline"
                  disabled={trangHienTai >= tongSoTrang}
                  onClick={() => xuLyDoiTrang(trangHienTai + 1)}
                >
                  Trang sau →
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
