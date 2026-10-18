import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { layThongBaoLoi } from '../api/client'
import FadeIn from '../components/common/FadeIn'
import { roomService } from '../services/roomService'
import { RoomStatus } from '../types/location'
import { formatDiem, formatVnd } from '../utils/format'
import { LOC_MAC_DINH, SortOption } from '../types/room'

/**
 * 3 trải nghiệm đặc trưng — nội dung cố định của trang chủ (không do API trả
 * về) nên khai báo một lần rồi map, tránh lặp 3 đoạn JSX gần giống nhau (DRY).
 */
const CAC_TRAI_NGHIEU = [
  { icon: '🔒', ten: 'Cozy', moTa: 'Riêng tư — Không gian chỉ của bạn' },
  { icon: '☕', ten: 'Japandi', moTa: 'Thoải mái — Tự do theo cách của bạn' },
  { icon: '🌿', ten: 'Signature', moTa: 'Dễ chịu — Núp hẻm, yên tĩnh' },
] as const

/** Quy định ở — nội dung cố định, map một lần thay vì lặp 3 đoạn JSX. */
const CAC_DIEU_CAN_BIET = [
  {
    icon: '⏰',
    ten: 'Đúng giờ',
    moTa: 'Check-out đúng giờ. Trễ từ 10 phút, phí phát sinh 100.000 – 150.000 ₫.',
  },
  {
    icon: '🤫',
    ten: 'Giờ nghỉ ngơi',
    moTa: 'Sau 22:00, giữ âm lượng nhẹ nhàng để mọi người cùng nghỉ ngơi.',
  },
  {
    icon: '🌿',
    ten: 'Giữ gìn không gian',
    moTa: 'Không hút thuốc trong phòng. Nấu ăn xong rửa sạch chén bát.',
  },
] as const


/**
 * Trang chủ — phong cách ấm áp, nhẹ nhàng.
 *
 * Gồm:
 * - Hero với background + tagline + địa chỉ
 * - Thanh tìm kiếm nhanh
 * - 3 loại phòng (Cozy, Japandi, Signature)
 * - Lưới 3 phòng nổi bật (lấy từ API, có đủ 3 trạng thái tải/lỗi/rỗng)
 * - Quy định ở
 * - Footer liên hệ
 */
export default function Home(): JSX.Element {
  /*
   * 3 phòng mới nhất cho lưới 'Phòng nổi bật'.
   *
   * pageSize: 3 và sort: newest là đủ — trang chủ không cần bộ lọc đầy đủ
   * như trang /rooms, chỉ cần một lưới giới thiệu ngắn.
   */
  const {
    data: ketQuaPhong,
    isPending: isPendingPhong,
    isError: isLoiPhong,
    error: loiPhong,
    refetch: taiLaiPhong,
  } = useQuery({
    queryKey: ['rooms', 'noi-bat'],
    queryFn: () =>
      roomService.timKiem({
        ...LOC_MAC_DINH,
        sort: SortOption.NEWEST,
        pageSize: 3,
      }),
  })

  const phongNoiBat = ketQuaPhong?.items ?? []

  return (
    <div>
      {/*
       * Hero: nền zoom chậm (ken burns) nằm ở lớp riêng để overlay và nội dung
       * không bị kéo theo transform; overlay gradient tối để chữ trắng luôn
       * đủ tương phản dù ảnh sáng hay tối.
       */}
      <section className="relative overflow-hidden py-20">
        <div
          aria-hidden="true"
          className="anim-kenburns absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url(/images/rooms/superior-1-bedroom-suite/superior-1-bedroom-suite-1.jpg)',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/45 to-black/60"
        />
        <div className="relative mx-auto max-w-6xl px-4 text-center text-white">
          <div
            className="anim-fade-up inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 ring-1 ring-white/30"
          >
            <span>📍</span>
            <span className="text-sm">Hưng Yên · Đà Lạt · Hội An</span>
          </div>
          <h2
            className="anim-fade-up text-4xl md:text-5xl font-bold mb-4 drop-shadow-sm"
            style={{ animationDelay: '120ms' }}
          >
            Góc nhỏ, nơi bạn thuộc về
          </h2>
          <p
            className="anim-fade-up text-lg mb-8 max-w-2xl mx-auto text-white/90"
            style={{ animationDelay: '240ms' }}
          >
            Hệ thống đặt phòng &amp; quản lý homestay theo giờ hoặc theo ngày.
            Riêng tư · Thoải mái · Dễ chịu
          </p>

          {/* Search Bar */}
          <div
            className="anim-fade-up bg-white rounded-2xl shadow-2xl p-4 max-w-4xl mx-auto ring-1 ring-amber-100"
            style={{ animationDelay: '360ms' }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Chi nhánh</label>
                {/* text-gray-900: option của <select> lấy màu chữ từ phần tử — thiếu nó,
                    dropdown hiện chữ trắng trên nền trắng (đã gặp khi kiểm thử tay) */}
                <select className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50">
                  <option>Tất cả chi nhánh</option>
                  <option>Cơ sở 1 Linh Đàm</option>
                  <option>Cơ sở 2 Đà Lạt</option>
                  <option>Cơ sở 3 Hội An</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Nhận phòng</label>
                <input type="datetime-local" className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Trả phòng</label>
                <input type="datetime-local" className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50" />
              </div>
              <div className="flex items-end">
                <Link
                  to="/rooms"
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-center px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  Tìm phòng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Loại phòng */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn className="text-center">
          <h3 className="text-2xl font-bold text-amber-900">3 Trải nghiệm khác biệt</h3>
          <span
            aria-hidden="true"
            className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
          />
        </FadeIn>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {CAC_TRAI_NGHIEU.map((traiNghiem, chiSo) => (
            <FadeIn key={traiNghiem.ten} delay={chiSo * 100}>
              <div className="group h-full rounded-xl p-6 border border-amber-100 bg-gradient-to-br from-amber-50 to-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <span className="text-3xl mb-4 block transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125">
                  {traiNghiem.icon}
                </span>
                <h4 className="font-bold text-amber-900 mb-2">{traiNghiem.ten}</h4>
                <p className="text-sm text-amber-700">{traiNghiem.moTa}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/*
       * Lưới phòng nổi bật — lấy 3 phòng mới nhất từ API thật.
       *
       * Trước đây khối này viết cứng 3 thẻ phòng. Sai ở chỗ: tên phòng, giá và
       * cả nút "Còn trống" nằm trong mã nguồn, nên sửa giá trong CSDL thì trang
       * chủ vẫn hiện giá cũ — và nếu ai đó xoá phòng trong CSDL thì trang chủ vẫn
       * còn. Dữ liệu hiển thị phải lấy từ một nguồn duy nhất là API.
       *
       * Cũng xử lý đủ 3 trạng thái như mọi danh sách khác (AGENTS.md 7.2): đang
       * tải, lỗi, không có dữ liệu.
       */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <FadeIn className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-amber-900">Phòng nổi bật</h3>
            <span
              aria-hidden="true"
              className="mt-2 block h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            />
          </div>
          <Link to="/rooms" className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors">
            Xem tất cả →
          </Link>
        </FadeIn>

        {isPendingPhong ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden">
                <div className="skeleton h-48 w-full" />
                <div className="p-4 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                  <div className="skeleton h-6 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : isLoiPhong ? (
          <div className="bg-white rounded-xl border border-amber-100 p-6 text-center">
            <p className="text-sm text-red-600">{layThongBaoLoi(loiPhong)}</p>
            <button
              type="button"
              onClick={() => void taiLaiPhong()}
              className="mt-4 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg"
            >
              Thử lại
            </button>
          </div>
        ) : phongNoiBat.length === 0 ? (
          <div className="bg-white rounded-xl border border-amber-100 p-6 text-center">
            <p className="font-semibold text-amber-900">Chưa có phòng nào để hiển thị</p>
            <Link to="/rooms" className="mt-2 inline-block text-sm text-amber-600 hover:text-amber-800">
              Xem tất cả phòng →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {phongNoiBat.map((phong, chiSo) => (
              <FadeIn key={phong.roomNumber} delay={chiSo * 100} className="h-full">
                {/* card-phong: hover tự nâng thẻ + zoom ảnh (index.css, dùng chung với /rooms) */}
                <div className="card card-phong h-full overflow-hidden border-amber-100">
                  <div className="h-48 bg-amber-100 relative overflow-hidden">
                    {phong.thumbnailUrl ? (
                      <img
                        src={phong.thumbnailUrl}
                        alt={phong.name}
                        className="card-phong-img w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100 text-sm text-amber-400">
                        Chưa có ảnh
                      </div>
                    )}
                    {phong.status === RoomStatus.AVAILABLE && (
                      <span className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium shadow-sm">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        Còn trống
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="font-bold text-amber-900">{phong.name}</h4>
                    <p className="text-sm text-amber-600 mt-1">
                      {phong.locationName} · {phong.roomNumber} · {phong.capacity} người
                    </p>
                    {phong.ratingCount > 0 && (
                      <p className="text-xs text-amber-500 mt-1">
                        ★ {formatDiem(phong.ratingAvg)} · {phong.ratingCount} đánh giá
                      </p>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-lg font-bold text-amber-600 number-vn text-right">
                        {formatVnd(phong.pricePerHour)}/3 giờ
                      </p>
                      <Link
                        to={`/locations/${phong.locationIndex}/rooms/${phong.roomIndex}`}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium shadow-sm hover:shadow-md transition-all"
                      >
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        )}
      </section>

      {/* Quy định */}
      <section className="bg-white/60 border-t border-amber-100 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <FadeIn className="text-center">
            <h3 className="text-2xl font-bold text-amber-900">Những điều cần biết</h3>
            <span
              aria-hidden="true"
              className="mx-auto mt-3 block h-1 w-16 rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
            />
          </FadeIn>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CAC_DIEU_CAN_BIET.map((dieu, chiSo) => (
              <FadeIn key={dieu.ten} delay={chiSo * 100}>
                <div className="group h-full rounded-xl p-5 border border-amber-100 bg-white transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                  <span className="text-2xl mb-3 block transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-125">
                    {dieu.icon}
                  </span>
                  <h4 className="font-bold text-amber-900 mb-2">{dieu.ten}</h4>
                  <p className="text-sm text-amber-700">{dieu.moTa}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/logo.svg" alt="HomeStay" className="h-10 w-10" />
                <div>
                  <h4 className="text-lg font-bold text-white">HomeStay</h4>
                  <p className="text-xs text-amber-300">Homestay</p>
                </div>
              </div>
              <p className="text-sm text-amber-200">
                Hệ thống đặt phòng &amp; quản lý homestay theo giờ hoặc theo ngày.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Thông tin liên hệ</h4>
              <div className="space-y-2 text-sm text-amber-200">
                <p>📧 Email: homestay@gmail.com</p>
                <p>📞 Điện thoại: 0901 234 567</p>
                <p>📍 Cơ sở 1: Đường Lê Văn Lương, phường Hưng Yên, Hưng Yên</p>
                <p>📍 Cơ sở 2: Đường Đặng Thùy Trâm, phường 3, Đà Lạt</p>
                <p>📍 Cơ sở 3: Phố cổ, Hội An, Quảng Nam</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Kết nối với chúng tôi</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md">
                  <span className="text-sm">FB</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md">
                  <span className="text-sm">IG</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md">
                  <span className="text-sm">TT</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-all hover:scale-110 hover:shadow-md">
                  <span className="text-sm">ZL</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-amber-800 pt-6 text-center text-sm text-amber-300">
            <p>© 2026 HomeStay — Hệ thống đặt phòng &amp; quản lý homestay</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
