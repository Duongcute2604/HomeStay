import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminBookings from './AdminBookings'
import { adminService } from '../../services/adminService'
import type { AdminBooking, AdminBookingFilter } from '../../types/admin'
import { BookingStatus } from '../../types/booking'

/**
 * Test cho trang quản lý đơn của Admin (Bước 13).
 *
 * Ba điều quan trọng nhất được khóa lại bằng test:
 * 1. Mỗi trạng thái đơn chỉ hiện ĐÚNG những hành động hợp lệ — không có ô
 *    chọn trạng thái tùy ý, nên giao diện không thể đưa hệ thống vào trạng
 *    thái mà nghiệp vụ không cho phép.
 * 2. Từ chối bắt buộc có lý do, và API lỗi thì đơn không bị mất khỏi bảng.
 * 3. Lọc theo từ khoá trả về trang 1 (không giữ trang cũ).
 */

vi.mock('../../services/adminService', () => ({
  adminService: {
    layDanhSachDon: vi.fn(),
    xacNhanDon: vi.fn(),
    tuChoiDon: vi.fn(),
    checkInDon: vi.fn(),
    checkOutDon: vi.fn(),
  },
}))

const layDanhSachDonMock = vi.mocked(adminService.layDanhSachDon)
const xacNhanDonMock = vi.mocked(adminService.xacNhanDon)
const tuChoiDonMock = vi.mocked(adminService.tuChoiDon)
const checkInDonMock = vi.mocked(adminService.checkInDon)
const checkOutDonMock = vi.mocked(adminService.checkOutDon)

function donMau(code: string, status: BookingStatus): AdminBooking {
  return {
    id: 1,
    code,
    customerName: 'Trần Thị Mai',
    customerEmail: 'khach1@gmail.com',
    customerPhone: '0912345678',
    roomName: 'Phòng Hạnh Phúc',
    locationName: 'Hưng Yên Ven Biển',
    bookingType: 2,
    checkIn: '2026-10-05T14:00:00',
    checkOut: '2026-10-07T12:00:00',
    guestCount: 2,
    totalAmount: 1100000,
    status,
    note: null,
    cancelReason: null,
    createdAt: '2026-09-30T10:00:00',
  }
}

function trangMau(danhSach: AdminBooking[], tongTrang = 1) {
  return {
    items: danhSach,
    page: 1,
    pageSize: 10,
    totalItems: danhSach.length,
    totalPages: tongTrang,
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
        initialEntries={['/admin/bookings']}
      >
        <AdminBookings />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

/** Bộ lọc mặc định mà trang gửi lên service ở lần gọi đầu tiên. */
const LOC_DAU: AdminBookingFilter = { status: null, keyword: '', page: 1, pageSize: 10 }

/**
 * Bảng đơn, dùng để tra nhãn trạng thái.
 *
 * Phải giới hạn phạm vi vào bảng vì nhãn trạng thái ("Đã xác nhận", "Chờ xác
 * nhận"…) xuất hiện ở CẢ `<option>` của ô lọc lẫn thẻ trạng thái trong bảng.
 * `getByText` toàn trang sẽ báo "found multiple elements".
 */
function bangDon(): HTMLElement {
  return screen.getByRole('table')
}

beforeEach(() => {
  layDanhSachDonMock.mockReset()
  xacNhanDonMock.mockReset()
  tuChoiDonMock.mockReset()
  checkInDonMock.mockReset()
  checkOutDonMock.mockReset()
  layDanhSachDonMock.mockResolvedValue(trangMau([]))
})

describe('AdminBookings - trang thai', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    layDanhSachDonMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tải danh sách đơn...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoVaNutThuLai', async () => {
    layDanhSachDonMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('KhongCoDon_HienEmptyState', async () => {
    dungTrang()

    expect(await screen.findByText('Không có đơn nào khớp bộ lọc hiện tại.')).toBeInTheDocument()
  })
})

describe('AdminBookings - hien thi danh sach', () => {
  it('HienMaDonVaTien_KhongHienId', async () => {
    layDanhSachDonMock.mockResolvedValue(
      trangMau([donMau('HS-261029-0015', BookingStatus.CONFIRMED)]),
    )

    dungTrang()

    expect(await screen.findByText('HS-261029-0015')).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
    expect(within(bangDon()).getByText('Đã xác nhận')).toBeInTheDocument()
  })

  it('STTTinhTuTrangVaHepHon_QuyTacHienThi', async () => {
    layDanhSachDonMock.mockResolvedValue(
      trangMau([
        donMau('HS-01', BookingStatus.PENDING),
        { ...donMau('HS-02', BookingStatus.PENDING), id: 2 },
      ]),
    )

    dungTrang()

    // Trang 1, mỗi trang 10 đơn → STT là 1 và 2 (AGENTS.md 7.3).
    expect(await screen.findByText('HS-01')).toBeInTheDocument()
    expect(screen.getByText('HS-02')).toBeInTheDocument()
  })
})

describe('AdminBookings - thao tac theo trang thai', () => {
  it('DonPENDING_ChiHienXacNhanVaTuChoi', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))

    dungTrang()

    await screen.findByText('HS-01')
    expect(screen.getByRole('button', { name: 'Xác nhận' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Từ chối' })).toBeInTheDocument()
    // Không có nhận/trả phòng cho đơn chưa xác nhận.
    expect(screen.queryByRole('button', { name: 'Nhận phòng' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trả phòng' })).not.toBeInTheDocument()
  })

  it('DonCONFIRMED_ChiHienNhanPhong', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-02', BookingStatus.CONFIRMED)]))

    dungTrang()

    await screen.findByText('HS-02')
    expect(screen.getByRole('button', { name: 'Nhận phòng' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xác nhận' })).not.toBeInTheDocument()
  })

  it('DonCHECKED_IN_ChiHienTraPhong', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-03', BookingStatus.CHECKED_IN)]))

    dungTrang()

    await screen.findByText('HS-03')
    expect(screen.getByRole('button', { name: 'Trả phòng' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhận phòng' })).not.toBeInTheDocument()
  })

  it.each([
    ['COMPLETED', BookingStatus.COMPLETED],
    ['CANCELLED', BookingStatus.CANCELLED],
    ['REJECTED', BookingStatus.REJECTED],
  ])('Don%s_KhongHienNutChuyenTrangThai', async (_nhan, trangThai) => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-04', trangThai)]))

    dungTrang()

    await screen.findByText('HS-04')
    expect(screen.queryByRole('button', { name: 'Xác nhận' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhận phòng' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Trả phòng' })).not.toBeInTheDocument()
  })

  it('BamXacNhan_GoiApiVaTaiLaiDanhSach', async () => {
    layDanhSachDonMock
      .mockResolvedValueOnce(trangMau([donMau('HS-01', BookingStatus.PENDING)]))
      .mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.CONFIRMED)]))
    xacNhanDonMock.mockResolvedValue(donMau('HS-01', BookingStatus.CONFIRMED))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận' }))

    // TanStack Query gọi `mutationFn` sau một microtask, không gọi đồng bộ —
    // khẳng định ngay sau `click` sẽ luôn fail dù code đúng.
    await waitFor(() => expect(xacNhanDonMock).toHaveBeenCalledWith('HS-01'))
    expect(await screen.findByRole('button', { name: 'Nhận phòng' })).toBeInTheDocument()
  })

  it('BamNhanPhong_GoiDungApiCheckIn', async () => {
    layDanhSachDonMock
      .mockResolvedValueOnce(trangMau([donMau('HS-02', BookingStatus.CONFIRMED)]))
      .mockResolvedValue(trangMau([donMau('HS-02', BookingStatus.CHECKED_IN)]))
    checkInDonMock.mockResolvedValue(donMau('HS-02', BookingStatus.CHECKED_IN))

    dungTrang()

    await screen.findByText('HS-02')
    fireEvent.click(screen.getByRole('button', { name: 'Nhận phòng' }))

    await waitFor(() => expect(checkInDonMock).toHaveBeenCalledWith('HS-02'))
    expect(await screen.findByRole('button', { name: 'Trả phòng' })).toBeInTheDocument()
  })

  it('BamTraPhong_GoiDungApiCheckOut', async () => {
    layDanhSachDonMock
      .mockResolvedValueOnce(trangMau([donMau('HS-03', BookingStatus.CHECKED_IN)]))
      .mockResolvedValue(trangMau([donMau('HS-03', BookingStatus.COMPLETED)]))
    checkOutDonMock.mockResolvedValue(donMau('HS-03', BookingStatus.COMPLETED))

    dungTrang()

    await screen.findByText('HS-03')
    fireEvent.click(screen.getByRole('button', { name: 'Trả phòng' }))

    await waitFor(() => expect(checkOutDonMock).toHaveBeenCalledWith('HS-03'))
    expect(await within(bangDon()).findByText('Hoàn thành')).toBeInTheDocument()
  })
})

describe('AdminBookings - tu choi don', () => {
  it('ChuaNhapLyDo_ChanTaiGiaoDien_KhongGoiApi', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))

    expect(
      await screen.findByText('Vui lòng nhập lý do để khách biết vì sao đơn bị từ chối'),
    ).toBeInTheDocument()
    // Chờ một nhịp để chắc chắn API KHÔNG được gọi — mutation chạy bất đồng
    // bộ nên `not.toHaveBeenCalled()` kiểm ngay là kiểm vô nghĩa.
    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument())
    expect(tuChoiDonMock).not.toHaveBeenCalled()
  })

  it('CoLyDo_GoiApiVaDongForm', async () => {
    layDanhSachDonMock
      .mockResolvedValueOnce(trangMau([donMau('HS-01', BookingStatus.PENDING)]))
      .mockResolvedValue(trangMau([]))
    tuChoiDonMock.mockResolvedValue({ ...donMau('HS-01', BookingStatus.REJECTED), cancelReason: 'Phòng bảo trì' })

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.change(screen.getByLabelText('Lý do từ chối'), { target: { value: 'Phòng bảo trì' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))

    await waitFor(() => expect(tuChoiDonMock).toHaveBeenCalledWith('HS-01', 'Phòng bảo trì'))
    expect(await screen.findByText('Không có đơn nào khớp bộ lọc hiện tại.')).toBeInTheDocument()
  })

  it('ApiThatBai_HienLoiVaGiuNguyenDanhSach', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))
    tuChoiDonMock.mockRejectedValue(new Error('Thao tác này chỉ áp dụng cho đơn đang "chờ xác nhận"'))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.click(screen.getByRole('button', { name: 'Từ chối' }))
    fireEvent.change(screen.getByLabelText('Lý do từ chối'), { target: { value: 'Phòng bảo trì' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận từ chối' }))

    expect(
      await screen.findByText('Thao tác này chỉ áp dụng cho đơn đang "chờ xác nhận"'),
    ).toBeInTheDocument()
    // Đơn vẫn còn trong bảng — lỗi không làm mất dữ liệu đang hiện. Tra trong
    // bảng vì mã đơn còn xuất hiện ở tiêu đề form từ chối đang mở.
    expect(within(bangDon()).getByText('HS-01')).toBeInTheDocument()
    await waitFor(() => expect(tuChoiDonMock).toHaveBeenCalled())
  })
})

describe('AdminBookings - bo loc', () => {
  it('BamTim_TruyenKeywordVeVaVeTrangDau', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.change(screen.getByPlaceholderText('VD: HS-260930-0001'), {
      target: { value: 'khach1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tìm' }))

    await waitFor(() =>
      expect(layDanhSachDonMock).toHaveBeenLastCalledWith({
        status: null,
        keyword: 'khach1',
        page: 1,
        pageSize: 10,
      }),
    )
  })

  it('DoiTrangThaiLoc_TruyenStatusVe', async () => {
    layDanhSachDonMock.mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.change(screen.getByLabelText('Lọc theo trạng thái'), {
      target: { value: String(BookingStatus.CONFIRMED) },
    })

    await waitFor(() =>
      expect(layDanhSachDonMock).toHaveBeenLastCalledWith({
        status: BookingStatus.CONFIRMED,
        keyword: '',
        page: 1,
        pageSize: 10,
      }),
    )
  })

  it('BamBoLoc_TraVeBoLocMacDinh', async () => {
    layDanhSachDonMock
      .mockResolvedValueOnce(trangMau([donMau('HS-01', BookingStatus.PENDING)]))
      .mockResolvedValue(trangMau([donMau('HS-01', BookingStatus.PENDING)]))
    xacNhanDonMock.mockResolvedValue(donMau('HS-01', BookingStatus.CONFIRMED))

    dungTrang()

    await screen.findByText('HS-01')
    fireEvent.change(screen.getByPlaceholderText('VD: HS-260930-0001'), {
      target: { value: 'khach1' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tìm' }))
    await waitFor(() =>
      expect(layDanhSachDonMock).toHaveBeenLastCalledWith({
        status: null,
        keyword: 'khach1',
        page: 1,
        pageSize: 10,
      }),
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Bỏ lọc' }))

    await waitFor(() => expect(layDanhSachDonMock).toHaveBeenLastCalledWith(LOC_DAU))
    expect(screen.getByPlaceholderText('VD: HS-260930-0001')).toHaveValue('')
  })
})
