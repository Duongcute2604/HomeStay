import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useParams, useSearchParams } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import Button from '../components/common/Button'
import FormMessage from '../components/common/FormMessage'
import Input from '../components/common/Input'
import { schemaDatPhong, type DatPhongForm } from '../schemas/bookingSchemas'
import { bookingService } from '../services/bookingService'
import { locationService } from '../services/locationService'
import { roomService } from '../services/roomService'
import type { BookingResult } from '../types/booking'
import { NHAN_LOAI_PHONG } from '../types/location'
import { formatNgay, formatVnd } from '../utils/format'
import { BookingType, NHAN_CACH_THUE, tinhSoDonVi, uocTinhTien } from '../utils/pricing'

/**
 * Trang đặt phòng — phải đăng nhập (bọc `ProtectedRoute` ở `App.tsx`).
 *
 * Nhận phòng + khoảng ngày từ URL: `/booking/0/2?loai=day&checkIn=...&checkOut=...`
 * (query param để F5 không mất, khác router state). Trang tự kiểm trống lại —
 * người dùng có thể gõ thẳng URL mà không qua khung chọn ngày.
 *
 * Luồng: xác nhận thông tin → nhập số khách/ghi chú → tạo đơn → hiện mã `Code`.
 * Chưa link "Đơn của tôi" — trang đó thuộc Bước 11, link chết bị cấm.
 */
export default function Booking(): JSX.Element {
  const { chiSoDiaDiem, chiSoPhong } = useParams<{ chiSoDiaDiem: string; chiSoPhong: string }>()
  const [thamSo] = useSearchParams()
  const [donDaTao, setDonDaTao] = useState<BookingResult | null>(null)

  const loai = thamSo.get('loai') === BookingType.HOUR ? BookingType.HOUR : BookingType.DAY
  const checkIn = useMemo(() => {
    const giaTri = thamSo.get('checkIn')
    return giaTri ? new Date(giaTri) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const checkOut = useMemo(() => {
    const giaTri = thamSo.get('checkOut')
    return giaTri ? new Date(giaTri) : null
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const ngayHopLe =
    checkIn !== null &&
    checkOut !== null &&
    !Number.isNaN(checkIn.getTime()) &&
    !Number.isNaN(checkOut.getTime()) &&
    checkOut > checkIn

  const { data: diaDiemList = [], isPending: dangTai, isError: loiDiaDiem } = useQuery({
    queryKey: ['locations'],
    queryFn: () => locationService.layDanhSach(),
    staleTime: 5 * 60 * 1000,
  })

  const soDiaDiem = Number(chiSoDiaDiem)
  const soPhong = Number(chiSoPhong)
  const phong =
    Number.isInteger(soDiaDiem) && Number.isInteger(soPhong)
      ? diaDiemList[soDiaDiem]?.rooms[soPhong]
      : undefined

  // Kiểm trống lại trên trang này — khung ở trang chi tiết đã kiểm, nhưng URL
  // có thể gõ thẳng, và phòng có thể vừa bị người khác đặt xen vào.
  const { data: tinhTrang } = useQuery({
    queryKey: ['rooms', 'availability', soDiaDiem, soPhong, loai, thamSo.get('checkIn'), thamSo.get('checkOut')],
    queryFn: () =>
      roomService.kiemTraTrong(soDiaDiem, soPhong, loai, checkIn as Date, checkOut as Date),
    enabled: ngayHopLe && phong !== undefined,
    staleTime: 30 * 1000,
  })

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DatPhongForm>({
    resolver: zodResolver(schemaDatPhong),
    defaultValues: { guestCount: 1, note: '' },
  })

  if (dangTai) {
    return <p className="mt-8 text-center text-sm text-gray-500">Đang tải thông tin đặt phòng...</p>
  }

  // Lỗi API phải tách khỏi "không tìm thấy phòng". Trước đây cả hai rơi vào cùng
  // một nhánh: server hỏng thì `diaDiemList` rỗng, phòng cũng undefined, và người
  // dùng bị báo "Đường dẫn trỏ sai phòng" — họ tưởng mình gõ sai trong khi hệ
  // thống đang lỗi. Nói đúng nguyên nhân mới giúp họ biết chờ hay thử lại.
  if (loiDiaDiem) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Không tải được danh sách phòng</p>
        <p className="mt-1 text-sm text-gray-500">
          Hệ thống đang không phản hồi. Vui lòng thử lại sau ít phút.
        </p>
        <button type="button" onClick={() => window.location.reload()} className="btn-primary mt-4">
          Thử lại
        </button>
      </div>
    )
  }

  if (!phong || !ngayHopLe || !checkIn || !checkOut) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-gray-900">Không đặt được phòng này</p>
        <p className="mt-1 text-sm text-gray-500">
          Đường dẫn thiếu ngày thuê hoặc trỏ sai phòng. Hãy chọn lại từ trang chi tiết.
        </p>
        <Link to="/rooms" className="btn-primary mt-4 inline-block">
          Về trang tìm kiếm
        </Link>
      </div>
    )
  }

  if (donDaTao) {
    return (
      <div className="card mx-auto mt-8 max-w-md p-6 text-center">
        <p className="text-lg font-semibold text-green-700">Đặt phòng thành công</p>
        <p className="mt-2 text-sm text-gray-600">Mã đơn của bạn:</p>
        <p className="number-vn mt-1 text-2xl font-bold tracking-wider text-gray-900">
          {donDaTao.code}
        </p>
        <p className="mt-2 text-left text-sm text-gray-600">
          {donDaTao.roomName} · {donDaTao.locationName}
          <br />
          {NHAN_CACH_THUE[loai]} · {formatNgay(donDaTao.checkIn)} → {formatNgay(donDaTao.checkOut)}
          <br />
          {donDaTao.guestCount} khách · Tổng tiền:{' '}
          <span className="number-vn font-semibold text-amber-700">
            {formatVnd(donDaTao.totalAmount)}
          </span>
        </p>
        <p className="mt-2 text-sm text-amber-600">
          Đơn đang chờ quản trị viên xác nhận. Hãy giữ lại mã đơn để tra cứu.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link to={`/bookings/${donDaTao.code}`} className="btn-primary">
            Xem đơn của tôi
          </Link>
          <Link to="/" className="btn-outline">
            Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  const donVi = tinhSoDonVi(loai, checkIn, checkOut)
  const tamTinh = uocTinhTien(loai, phong.pricePerHour, phong.pricePerDay, checkIn, checkOut)
  const duocDat = tinhTrang?.isAvailable === true

  const xuLyDatPhong = async (duLieu: DatPhongForm): Promise<void> => {
    // Sức chứa kiểm ở đây chứ không trong schema: schema dựng lúc mount (phòng
    // chưa tải xong) thì `max` bị đóng băng sai — nhập đúng vẫn báo lỗi.
    // Lúc submit thì phòng chắc chắn đã có nên số liệu đúng.
    if (duLieu.guestCount > phong.capacity) {
      setError('guestCount', { message: `Phòng chỉ chứa tối đa ${phong.capacity} khách` })
      return
    }

    try {
      const don = await bookingService.taoDon({
        locationIndex: soDiaDiem,
        roomIndex: soPhong,
        type: loai,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        guestCount: duLieu.guestCount,
        note: duLieu.note || undefined,
      })
      setDonDaTao(don)
      window.scrollTo({ top: 0 })
    } catch (error) {
      // Trùng lịch phút chót (người khác đặt xen vào sau lần kiểm) hiện ở đây.
      setError('root', { message: layThongBaoLoi(error) })
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-xl font-bold text-gray-900">Xác nhận đặt phòng</h1>

      <div className="card mt-4 p-4">
        <p className="font-semibold text-gray-900">{phong.name}</p>
        <p className="mt-1 text-left text-sm text-gray-500">
          {NHAN_LOAI_PHONG[phong.roomType]} · Phòng {phong.roomNumber} · {diaDiemList[soDiaDiem].name}
        </p>
        <p className="mt-2 text-left text-sm text-gray-700">
          {NHAN_CACH_THUE[loai]} · {formatNgay(checkIn.toISOString())} →{' '}
          {formatNgay(checkOut.toISOString())}
        </p>
        <p className="number-vn mt-1 text-right text-sm text-gray-700">
          Tạm tính: {donVi} {loai === BookingType.HOUR ? 'giờ' : 'ngày'} ×{' '}
          <span className="font-semibold text-amber-700">{formatVnd(tamTinh)}</span>
        </p>
        {tinhTrang && (
          <p
            className={
              tinhTrang.isAvailable
                ? 'mt-1 text-right text-sm font-medium text-green-700'
                : 'mt-1 text-right text-sm font-medium text-red-600'
            }
          >
            {tinhTrang.isAvailable
              ? 'Phòng còn trống trong khoảng đã chọn'
              : (tinhTrang.reason ?? 'Phòng đã có người đặt trong khoảng đã chọn')}
          </p>
        )}
      </div>

      <form className="card mt-4 flex flex-col gap-4 p-4" onSubmit={handleSubmit(xuLyDatPhong)} noValidate>
        <FormMessage loi={errors.root?.message} />

        <Input
          label={`Số khách (tối đa ${phong.capacity})`}
          type="number"
          min={1}
          max={phong.capacity}
          {...register('guestCount')}
          loi={errors.guestCount?.message}
        />

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="dat-ghiChu">
            Ghi chú (không bắt buộc)
          </label>
          <textarea
            id="dat-ghiChu"
            rows={3}
            placeholder="Ví dụ: đến muộn sau 22:00, cần thêm nôi em bé..."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            {...register('note')}
          />
          {errors.note && <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>}
        </div>

        <Button type="submit" dangTai={isSubmitting} disabled={!duocDat} className="w-full">
          Xác nhận đặt phòng
        </Button>

        {!duocDat && tinhTrang && (
          <p className="text-center text-sm text-gray-500">
            Phòng đã có người đặt — nút xác nhận mở lại khi phòng còn trống.
          </p>
        )}
      </form>
    </div>
  )
}
