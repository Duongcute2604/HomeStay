import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RoomDateFrame from './RoomDateFrame'
import { roomService } from '../services/roomService'

/**
 * Test cho khung chọn ngày thuê.
 *
 * Không gọi API thật — mock `roomService.kiemTraTrong`, giữ Query + tính toán
 * thật. Khung này Bước 10 dùng lại nên phải chắc từ bây giờ.
 */

vi.mock('../services/roomService', () => ({
  roomService: { timKiem: vi.fn(), kiemTraTrong: vi.fn() },
}))

const kiemTraTrongMock = vi.mocked(roomService.kiemTraTrong)

function dungKhung() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <RoomDateFrame giaTheoGio={90000} giaTheoNgay={550000} locationIndex={0} roomIndex={0} />
    </QueryClientProvider>,
  )
}

function chonNgayNhanTra(nhan: string, tra: string) {
  fireEvent.change(screen.getByLabelText('Giờ nhận phòng'), { target: { value: nhan } })
  fireEvent.change(screen.getByLabelText('Giờ trả phòng'), { target: { value: tra } })
}

beforeEach(() => {
  kiemTraTrongMock.mockReset()
  kiemTraTrongMock.mockResolvedValue({ isAvailable: true, reason: null })
})

describe('RoomDateFrame - chon ngay va tam tinh', () => {
  it('ChuaChon_HienHuongDan_KhongHienGia_KhongGoiApi', () => {
    dungKhung()

    expect(screen.getByText('Vui lòng chọn giờ nhận và giờ trả phòng')).toBeInTheDocument()
    expect(screen.queryByText(/Tạm tính/)).not.toBeInTheDocument()
    // Ngày chưa hợp lệ thì không hỏi API — gọi là thừa một request.
    expect(kiemTraTrongMock).not.toHaveBeenCalled()
  })

  it('ChonHopLe_HienTamTinhDungCongThuc', async () => {
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-07T12:00')

    // Mặc định theo ngày: 46 giờ → 2 ngày × 550.000.
    expect(await screen.findByText(/Tạm tính: 2 ngày/)).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
  })

  it('DoiSangTheoGio_TinhLaiTheoDonGiaGio', async () => {
    dungKhung()

    fireEvent.click(screen.getByRole('button', { name: 'Theo giờ' }))
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-05T17:00')

    // 3 giờ × 90.000.
    expect(await screen.findByText(/Tạm tính: 3 giờ/)).toBeInTheDocument()
    expect(screen.getByText('270.000 ₫')).toBeInTheDocument()
  })

  it('TraTruocNhan_BaoLoi_KhongHienGia_KhongGoiApi', () => {
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-05T12:00')

    expect(screen.getByText('Giờ trả phòng phải sau giờ nhận phòng')).toBeInTheDocument()
    expect(screen.queryByText(/Tạm tính/)).not.toBeInTheDocument()
    expect(kiemTraTrongMock).not.toHaveBeenCalled()
  })
})

describe('RoomDateFrame - kiem phong trong', () => {
  it('PhongConTrong_HienThongBaoXanh', async () => {
    kiemTraTrongMock.mockResolvedValue({ isAvailable: true, reason: null })
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-07T12:00')

    expect(await screen.findByText('Phòng còn trống trong khoảng đã chọn')).toBeInTheDocument()
  })

  it('PhongBan_HienLyDoCuaServer', async () => {
    kiemTraTrongMock.mockResolvedValue({
      isAvailable: false,
      reason: 'Phòng đã có người đặt trong khoảng thời gian này',
    })
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-07T12:00')

    expect(
      await screen.findByText('Phòng đã có người đặt trong khoảng thời gian này'),
    ).toBeInTheDocument()
  })

  it('GuiDungChiSoPhong_LoaiVaKhoangThoiGian', async () => {
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-07T12:00')

    await screen.findByText('Phòng còn trống trong khoảng đã chọn')
    expect(kiemTraTrongMock).toHaveBeenCalledWith(
      0,
      0,
      'day',
      new Date('2026-10-05T14:00'),
      new Date('2026-10-07T12:00'),
    )
  })

  it('ApiLoi_HienThongBaoLoi_KhongVoTrang', async () => {
    kiemTraTrongMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))
    dungKhung()
    chonNgayNhanTra('2026-10-05T14:00', '2026-10-07T12:00')

    // Giá tạm tính vẫn hiện (tính ở máy khách), chỉ phần kiểm trống báo lỗi.
    // Phải `findByText` vì promise bị từ chối cần một nhịp mới hiện lên —
    // dùng `getByText` ngay là đọc khi còn đang "Đang kiểm...".
    expect(await screen.findByText(/Tạm tính: 2 ngày/)).toBeInTheDocument()
    expect(
      await screen.findByText('Không kiểm được phòng trống. Hãy thử lại sau.'),
    ).toBeInTheDocument()
  })
})
