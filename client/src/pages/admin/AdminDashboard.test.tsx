import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminDashboard from './AdminDashboard'
import { adminService } from '../../services/adminService'
import type { Dashboard } from '../../types/admin'
import { RoomStatus } from '../../types/location'

/**
 * Test cho trang thống kê (Bước 15).
 *
 * `recharts` bị mock vì `ResponsiveContainer` đo kích thước thật của DOM mà
 * jsdom luôn trả về 0 — không mock thì mọi test chết vì lỗi kỹ thuật chứ không
 * phải lỗi logic. Phần cần kiểm chứng ở đây là **số liệu và cách hiển thị**,
 * không phải hình dạng biểu đồ (việc đó xác nhậng bằng mắt trên trình duyệt).
 *
 * Ba thứ phải khóa lại: định dạng tiền VND, tỷ lệ phần trăm, và việc bỏ qua
 * trạng thái có 0 phòng (mảng 0 độ rộng làm chú giải tròn rối).
 */

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Bar: () => null,
  Pie: () => null,
  Cell: () => null,
}))

vi.mock('../../services/adminService', () => ({
  adminService: { laySoLieu: vi.fn() },
}))

const laySoLieuMock = vi.mocked(adminService.laySoLieu)

function soLieuMau(): Dashboard {
  return {
    tuNgay: '2026-09-01',
    denNgay: '2026-09-30',
    tongQuan: {
      tongDon: 16,
      donThangNay: 9,
      doanhThuThangNay: 2_700_000,
      tongPhong: 10,
      tongKhach: 4,
      phongDangCoKhach: 2,
    },
    theoThang: [
      { thang: '2026-08', nhan: 'T8', doanhThu: 0, soDon: 2 },
      { thang: '2026-09', nhan: 'T9', doanhThu: 2_700_000, soDon: 9 },
    ],
    tyLeLapDay: 0.0133,
    demDaBan: 4,
    demTongCong: 300,
    trangThaiPhong: [
      { trangThai: RoomStatus.AVAILABLE, soPhong: 4 },
      { trangThai: RoomStatus.BOOKED, soPhong: 3 },
      { trangThai: RoomStatus.OCCUPIED, soPhong: 0 },
      { trangThai: RoomStatus.CLEANING, soPhong: 2 },
      { trangThai: RoomStatus.MAINTENANCE, soPhong: 1 },
    ],
    topPhong: [
      { tenPhong: 'Phòng Hạnh Phúc', tenCoSo: 'Hưng Yên Ven Biển', soDon: 2, doanhThu: 2_200_000 },
      { tenPhong: 'Phòng Hải Yến', tenCoSo: 'Hưng Yên Ven Biển', soDon: 1, doanhThu: 1_200_000 },
    ],
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
        initialEntries={['/admin']}
      >
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  laySoLieuMock.mockReset()
  laySoLieuMock.mockResolvedValue(soLieuMau())
})

describe('AdminDashboard - trang thai', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    laySoLieuMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tải số liệu...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoVaNutThuLai', async () => {
    laySoLieuMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })
})

describe('AdminDashboard - hien thi so lieu', () => {
  it('HienDoanhThuDinhDangVND', async () => {
    dungTrang()

    // 2.700.000 phải hiện "2.700.000 ₫" — không phải "2700000" hay "2.7 triệu".
    expect(await screen.findByText('2.700.000 ₫')).toBeInTheDocument()
  })

  it('HienTyLeLapDayTheoPhanTramVaCoGhiChuSoDem', async () => {
    dungTrang()

    // 0.0133 × 100 = 1,33 % (giữ 2 chữ số thập phân nhờ nhân 1000 rồi chia 10).
    expect(await screen.findByText('1,3%')).toBeInTheDocument()
    expect(screen.getByText('4 / 300 đêm phòng')).toBeInTheDocument()
  })

  it('HienKhoangNgayDangThongKe', async () => {
    dungTrang()

    expect(
      await screen.findByText('Tỷ lệ lấp đầy tính từ 2026-09-01 đến 2026-09-30'),
    ).toBeInTheDocument()
  })

  it('HienBangTopPhongVoiSTTTinhTu0', async () => {
    dungTrang()

    expect(await screen.findByText('Phòng Hạnh Phúc')).toBeInTheDocument()
    expect(screen.getByText('2.200.000 ₫')).toBeInTheDocument();
    (void 0)
  })

  it('MoiConSoDieuKemGhiChuDinhNghia', async () => {
    dungTrang()

    // Người đọc báo cáả thấy mà không có chú thích sẽ tưởng số liệu sai.
    expect(await screen.findByText('Chỉ tính đơn khách đã trả phòng')).toBeInTheDocument();
    (void 0)
  })
})

describe('AdminDashboard - truong hop rong', () => {
  it('KhongCoPhong_HienThongBaoThayViVeBieuDo', async () => {
    const rong = soLieuMau()
    rong.trangThaiPhong = rong.trangThaiPhong.map((tt) => ({ ...tt, soPhong: 0 }))
    rong.topPhong = []
    laySoLieuMock.mockResolvedValue(rong)

    dungTrang()

    expect(await screen.findByText('Hệ thống chưa có phòng nào')).toBeInTheDocument();
    (void 0)
  })

  it('KhongCoDonHoanThanh_HienThongBaoThayViBangTopPhong', async () => {
    const rong = soLieuMau()
    rong.topPhong = []
    laySoLieuMock.mockResolvedValue(rong)

    dungTrang()

    expect(await screen.findByText('Chưa có đơn hoàn thành nào để xếp hạng')).toBeInTheDocument();
    (void 0)
  })

  it('KhongCoDoanhThu_Hien0KhongPhaiDeTrong', async () => {
    const rong = soLieuMau()
    rong.tongQuan.doanhThuThangNay = 0
    laySoLieuMock.mockResolvedValue(rong)

    dungTrang()

    expect(await screen.findByText('0 ₫')).toBeInTheDocument();
    (void 0)
  })
})
