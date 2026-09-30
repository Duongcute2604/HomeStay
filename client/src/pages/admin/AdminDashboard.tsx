import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { layThongBaoLoi } from '../../api/client'
import Button from '../../components/common/Button'
import { adminService } from '../../services/adminService'
import type { Dashboard, RoomStatusCount } from '../../types/admin'
import { NHAN_TRANG_THAI_PHONG, RoomStatus } from '../../types/location'
import { formatVnd } from '../../utils/format'

/**
 * Màu của từng trạng thái phòng.
 *
 * Khớp đúng bảng màu ở trang `/admin/rooms` và `/admin/bookings` để cùng một
 * trạng thái luôn mang một màu — đọc 3 trang không phải học lại bảng màu.
 */
const MAU_TRANG_THAI: Record<RoomStatus, string> = {
  [RoomStatus.AVAILABLE]: '#10b981',
  [RoomStatus.BOOKED]: '#0ea5e9',
  [RoomStatus.OCCUPIED]: '#6366f1',
  [RoomStatus.CLEANING]: '#f59e0b',
  [RoomStatus.MAINTENANCE]: '#a8a29e',
}

/** Rút gọn tiền cho trục Y: `1.200.000 ₫` → `1,2tr`. */
function rutGonTien(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}tr`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k`
  }
  return value.toLocaleString('vi-VN')
}

/** Một ô số liệu ở đầu trang. */
function TheSoLieu({
  nhan,
  giaTri,
  ghiChu,
}: {
  nhan: string
  giaTri: string
  ghiChu?: string
}): JSX.Element {
  return (
    <div className="card-phong p-4">
      <p className="text-sm text-stone-500">{nhan}</p>
      <p className="number-vn mt-1 text-2xl font-bold text-stone-800">{giaTri}</p>
      {ghiChu !== undefined && <p className="mt-1 text-xs text-stone-400">{ghiChu}</p>}
    </div>
  )
}

/**
 * Trang thống kê của Admin (Bước 15).
 *
 * Sáu nhóm số liệu: tổng quan · doanh thu theo tháng · số đơn theo tháng ·
 * tỷ lệ lấp đầy · trạng thái phòng · 5 phòng doanh thu cao nhất.
 *
 * Mỗi con số đều kèm một dòng chữ nhỏ nói rõ đang tính theo định nghĩa nào.
 * Lý do: "doanh thu tháng" có thể tính theo ngày đặt hoặc ngày trả phòng, hai
 * cách ra hai con số khác nhau. Người đọc báo cáả thấy mà không có chú thích sẽ
 * tưởng số liệu sai.
 */
export default function AdminDashboard(): JSX.Element {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminService.laySoLieu(),
  })

  if (isPending) {
    return <p className="text-center text-sm text-stone-500">Đang tải số liệu...</p>
  }

  if (isError) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm text-red-600">{layThongBaoLoi(error)}</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Thử lại
        </Button>
      </div>
    )
  }

  const soLieu: Dashboard = data as Dashboard
  const { tongQuan } = soLieu
  const tyLePhanTram = Math.round(soLieu.tyLeLapDay * 1000) / 10

  // Chỉ lấy trạng thái thật sự có phòng — trạng thái 0 phòng làm biểu đồ tròn
  // có mảng 0 độ rộng, chú giải rối mà không thêm thông tin gì.
  const trangThaiCoPhong: RoomStatusCount[] = soLieu.trangThaiPhong.filter((tt) => tt.soPhong > 0)

  return (
    <section>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Thống kê</h1>
          <p className="text-sm text-stone-500">
            Tỷ lệ lấp đầy tính từ {soLieu.tuNgay} đến {soLieu.denNgay}
          </p>
        </div>
        <Button bienDang="outline" onClick={() => refetch()}>
          Làm mới
        </Button>
      </header>

      {/* 6 con so: 4 o tren + ty le lap day + phong dang co khach */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <TheSoLieu
          nhan="Doanh thu tháng này"
          giaTri={formatVnd(tongQuan.doanhThuThangNay)}
          ghiChu="Chỉ tính đơn khách đã trả phòng"
        />
        <TheSoLieu
          nhan="Đơn đặt trong tháng"
          giaTri={String(tongQuan.donThangNay)}
          ghiChu={`Trên tổng ${tongQuan.tongDon} đơn`}
        />
        <TheSoLieu
          nhan="Tỷ lệ lấp đầy"
          giaTri={`${tyLePhanTram.toLocaleString('vi-VN')}%`}
          ghiChu={`${soLieu.demDaBan} / ${soLieu.demTongCong} đêm phòng`}
        />
        <TheSoLieu
          nhan="Phòng đang có khách"
          giaTri={String(tongQuan.phongDangCoKhach)}
          ghiChu={`Trên tổng ${tongQuan.tongPhong} phòng · ${tongQuan.tongKhach} khách`}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Doanh thu theo thang */}
        <div className="card-phong p-5">
          <h2 className="text-lg font-semibold text-stone-800">Doanh thu theo tháng</h2>
          <p className="text-xs text-stone-500">
            Tính theo tháng khách <b>trả phòng</b>. Đơn chỉ mới đặt chưa tính vì còn hủy được.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={soLieu.theoThang}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="nhan" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={rutGonTien}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip formatter={(value: number) => formatVnd(value)} />
                <Bar
                  dataKey="doanhThu"
                  name="Doanh thu"
                  fill="#d97706"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* So don theo thang */}
        <div className="card-phong p-5">
          <h2 className="text-lg font-semibold text-stone-800">Số đơn theo tháng</h2>
          <p className="text-xs text-stone-500">
            Tính theo tháng khách <b>đặt</b>, mọi trạng thái — kể cả đơn đã hủy.
          </p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={soLieu.theoThang}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                <XAxis dataKey="nhan" tick={{ fontSize: 12 }} />
                <YAxis
                  tick={{ fontSize: 12 }}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip />
                <Bar
                  dataKey="soDon"
                  name="Số đơn"
                  fill="#0ea5e9"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={false}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ty le trang thai phong */}
        <div className="card-phong p-5">
          <h2 className="text-lg font-semibold text-stone-800">Trạng thái phòng</h2>
          <p className="text-xs text-stone-500">Ảnh chụp trạng thái tại thời điểm xem trang.</p>

          {trangThaiCoPhong.length === 0 ? (
            <p className="mt-6 text-center text-sm text-stone-400">Hệ thống chưa có phòng nào</p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={trangThaiCoPhong.map((tt) => ({
                      name: NHAN_TRANG_THAI_PHONG[tt.trangThai],
                      value: tt.soPhong,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    isAnimationActive={false}
                  >
                    {trangThaiCoPhong.map((tt) => (
                      <Cell key={tt.trangThai} fill={MAU_TRANG_THAI[tt.trangThai]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value} phòng`, name]} />
                </PieChart>
              </ResponsiveContainer>

              {/* Legend tự vẽ, KHÔNG dùng `<Legend />` của recharts. Legend của
                  recharts chiếm chỗ trong khung vẽ nên tâm `PieChart` bị lệch,
                  đơn vòng tròn bị cắt mất nửa dưới — đã gặp và xác nhận bằng
                  đo `getBoundingClientRect` (pie 138x80 trong khung 440x256).
                  Vẽ tay 4 chấm màu bên dưới thì chắc chắn không ảnh hưởng hình học. */}
              <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {trangThaiCoPhong.map((tt) => (
                  <li
                    key={tt.trangThai}
                    className="flex items-center gap-1.5 text-xs text-stone-600"
                  >
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: MAU_TRANG_THAI[tt.trangThai] }}
                      aria-hidden="true"
                    />
                    {NHAN_TRANG_THAI_PHONG[tt.trangThai]}: {tt.soPhong}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Top phong */}
        <div className="card-phong p-5">
          <h2 className="text-lg font-semibold text-stone-800">5 phòng doanh thu cao nhất</h2>
          <p className="text-xs text-stone-500">Chỉ tính đơn đã hoàn thành.</p>

          {soLieu.topPhong.length === 0 ? (
            <p className="mt-6 text-center text-sm text-stone-400">
              Chưa có đơn hoàn thành nào để xếp hạng
            </p>
          ) : (
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={soLieu.topPhong}
                  layout="vertical"
                  margin={{ left: 8, right: 16 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={rutGonTien}
                  />
                  {/* `width` phải đủ cho tên phòng dài nhất ("Phòng Hoa Tử
                      Đài"). Hẹp hơn thì recharts tự xuống dòng ở chỗ trắng,
                      hai dòng chồng lên nhau trong băng cao ~40px và nhìn
                      ra như mất nhãn. */}
                  <YAxis
                    type="category"
                    dataKey="tenPhong"
                    tick={{ fontSize: 12 }}
                    interval={0}
                    width={140}
                  />
                  <Tooltip formatter={(value: number) => formatVnd(value)} />
                  <Bar
                  dataKey="doanhThu"
                  name="Doanh thu"
                  fill="#f59e0b"
                  radius={[0, 6, 6, 0]}
                  isAnimationActive={false}
                />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bang top phong: bieu do nhin tong quat, bang moi cho con so cu the */}
      {soLieu.topPhong.length > 0 && (
        <div className="card-phong mt-6 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-amber-50 text-left text-stone-600">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Phòng</th>
                <th className="px-4 py-3">Cơ sở</th>
                <th className="px-4 py-3 text-right">Số đơn</th>
                <th className="px-4 py-3 text-right">Doanh thu</th>
              </tr>
            </thead>
            <tbody>
              {soLieu.topPhong.map((phong, chiSo) => (
                <tr key={`${phong.tenCoSo}-${phong.tenPhong}`} className="border-t border-stone-100">
                  <td className="number-vn px-4 py-3 text-left">{chiSo + 1}</td>
                  <td className="px-4 py-3 text-stone-800">{phong.tenPhong}</td>
                  <td className="px-4 py-3 text-stone-600">{phong.tenCoSo}</td>
                  <td className="number-vn px-4 py-3 text-right">{phong.soDon}</td>
                  <td className="number-vn px-4 py-3 text-right">{formatVnd(phong.doanhThu)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-sm text-stone-500">
        Cần thao tác với đơn?{' '}
        <Link to="/admin/bookings" className="font-medium text-amber-700 hover:underline">
          Sang trang quản lý đơn
        </Link>
      </p>
    </section>
  )
}
