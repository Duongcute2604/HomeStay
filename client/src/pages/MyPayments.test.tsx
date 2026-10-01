import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import MyPayments from './MyPayments'
import { paymentService } from '../services/paymentService'
import { PaymentMethod, PaymentStatus } from '../types/payment'
import type { Payment } from '../types/payment'

/**
 * Test cho trang "Thanh toán của tôi".
 *
 * Trọng tâm ba điều dễ sai nhất:
 * 1. Tiền hiển thị đúng định dạng VND và **căn phải** (AGENTS.md 7.3).
 * 2. Tách "tổng đã thanh toán" và "còn phải thanh toán" — chỉ phiếu `PAID` mới vào tổng đã thu.
 * 3. Đủ ba trạng thái: đang tải, lỗi, không có dữ liệu.
 */

vi.mock('../services/paymentService', () => ({
  paymentService: {
    layCuaToi: vi.fn(),
    layTheoDon: vi.fn(),
    chonPhuongThuc: vi.fn(),
  },
}))

const layCuaToiMock = vi.mocked(paymentService.layCuaToi)

function phieuMau(uaPhuong: Partial<Payment> = {}): Payment {
  return {
    id: 1,
    bookingCode: 'HS-260602-0001',
    roomName: 'Phòng Hạnh Phúc',
    roomNumber: 'A101',
    locationName: 'Hưng Yên Ven Biển',
    amount: 1100000,
    method: PaymentMethod.CASH,
    status: PaymentStatus.PAID,
    paidAt: '2026-06-05T12:00:00',
    note: null,
    createdAt: '2026-06-02T14:00:00',
    ...uaPhuong,
  }
}

function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/payments']}
      >
        <Routes>
          <Route path="/payments" element={<MyPayments />} />
          <Route path="/bookings" element={<p>Trang đơn của tôi</p>} />
          <Route path="/bookings/:code" element={<p>Trang chi tiết {':code'}</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layCuaToiMock.mockReset()
})

describe('MyPayments - hien thi', () => {
  it('HienThiDanhSach_TienDinhDangVND_CanPhai', async () => {
    layCuaToiMock.mockResolvedValue([phieuMau()])

    dungTrang()

    // Dấu chấm phân cách nghìn là quy tắc bắt buộc: `1100000` hiện sai sẽ thành
    // "1100000 ₫" và người dùng đọc nhầm thành 110 nghìn.
    //
    // Con số này hiện ở hai chỗ: thẻ tổng và dòng trong danh sách — nên dùng
    // `getAllByText` rồi kiểm tra đúng phần tử cần xem.
    await screen.findByText('Đã thanh toán')
    const cacPhanTu = screen.getAllByText('1.100.000 ₫')
    expect(cacPhanTu.length).toBeGreaterThan(0)
    // Dòng trong danh sách: tiền căn phải + dùng class `.number-vn` (AGENTS.md 7.3).
    const dongTrongDanhSach = cacPhanTu.find((x) => x.className.includes('text-stone-800'))
    expect(dongTrongDanhSach).toHaveClass('number-vn', 'text-right')
  })

  it('ChiHienMaDonKhongHienKhoaPhieu', async () => {
    layCuaToiMock.mockResolvedValue([phieuMau()])

    dungTrang()

    expect(await screen.findByText(/HS-260602-0001/)).toBeInTheDocument()
    // Khoá phiếu thu là thứ **không** được lộ ra giao diện (AGENTS.md 6.3).
    expect(screen.queryByText(/^\s*Id:\s*1\s*$/)).not.toBeInTheDocument()
  })

  it('TachTongDaThuVaConNo_TheoTrangThai', async () => {
    layCuaToiMock.mockResolvedValue([
      phieuMau({ id: 1, amount: 1100000, status: PaymentStatus.PAID }),
      phieuMau({ id: 2, bookingCode: 'HS-260611-0002', amount: 550000, status: PaymentStatus.PENDING, paidAt: null }),
    ])

    dungTrang()

    await screen.findByText('Chờ thanh toán')

    // Thẻ "Tổng đã thanh toán" chỉ cộng phiếu `PAID` (1.100.000), không cộng phiếu
    // `PENDING` (550.000) — nếu cộng cả hai thì thành 1.650.000 và thổi phóng doanh thu.
    const tongDaThu = screen.getByText('Tổng đã thanh toán').nextElementSibling
    expect(tongDaThu).toHaveTextContent('1.100.000 ₫')

    // Thẻ "Còn phải thanh toán" chỉ cộng phiếu `PENDING`.
    const conNo = screen.getByText('Còn phải thanh toán').nextElementSibling
    expect(conNo).toHaveTextContent('550.000 ₫')
  })
})

describe('MyPayments - trang thai', () => {
  it('ChuaTai_HienKhungXương', async () => {
    // Promise chưa bao giờ resolve ⇒ trạng thái "đang tải" kéo dài.
    layCuaToiMock.mockReturnValue(new Promise(() => {}))

    const { container } = dungTrang()

    await waitFor(() => {
      expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    })
    // Chưa có dữ liệu thì không được vẽ ra danh sách rỗng.
    expect(screen.queryByText('Chưa có khoản thanh toán nào')).not.toBeInTheDocument()
  })

  it('LoiApi_HienThongBaoVaNutThuLai', async () => {
    layCuaToiMock.mockRejectedValue(new Error('Khong ket noi duoc may chu'))

    dungTrang()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    })
  })

  it('KhongCoDuLieu_HienHuongDan', async () => {
    layCuaToiMock.mockResolvedValue([])

    dungTrang()

    expect(await screen.findByText('Chưa có khoản thanh toán nào')).toBeInTheDocument()
    expect(screen.getByText('Xem đơn của tôi →')).toBeInTheDocument()
  })
})

describe('MyPayments - trang thai thanh toan', () => {
  it('PhieuThatBai_HienHuongDanChonLai', async () => {
    layCuaToiMock.mockResolvedValue([
      phieuMau({ status: PaymentStatus.FAILED, paidAt: null, note: 'Khách chuyển sai số tiền' }),
    ])

    dungTrang()

    expect(await screen.findByText(/Giao dịch không thành công/)).toBeInTheDocument()
    expect(screen.getByText('Khách chuyển sai số tiền')).toBeInTheDocument()
    expect(screen.getByText('Thanh toán thất bại')).toBeInTheDocument()
  })

  it('PhieuDaThu_HienNgayThanhToan', async () => {
    layCuaToiMock.mockResolvedValue([phieuMau({ paidAt: '2026-06-05T12:00:00' })])

    dungTrang()

    expect(await screen.findByText('Đã thanh toán')).toBeInTheDocument()
    // Ngày đã thu phải hiện, không phải "Chưa thanh toán".
    expect(screen.queryByText('Chưa thanh toán')).not.toBeInTheDocument()
  })
})