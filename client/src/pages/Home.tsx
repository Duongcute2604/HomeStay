import { Link } from 'react-router-dom'

/**
 * Trang chủ — phong cách ấm áp, nhẹ nhàng.
 *
 * Gồm:
 * - Hero với background + tagline + địa chỉ
 * - Thanh tìm kiếm nhanh
 * - 3 loại phòng (Cozy, Japandi, Signature)
 * - Lưới phòng nổi bật
 * - Quy định ở
 * - Footer liên hệ
 */
export default function Home(): JSX.Element {
  return (
    <div>
      {/* Hero với background */}
      <section
        className="relative py-20 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(/images/rooms/cozy/cozy-1.jpg)',
        }}
      >
        <div className="mx-auto max-w-6xl px-4 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
            <span>📍</span>
            <span className="text-sm">111/2 Phạm Văn Bạch, Phường Tân Sơn, Tp. HCM</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Góc nhỏ, nơi bạn thuộc về
          </h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto text-white/90">
            Hệ thống đặt phòng &amp; quản lý homestay theo giờ hoặc theo ngày.
            Riêng tư · Thoải mái · Dễ chịu
          </p>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Chi nhánh</label>
                <select className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50">
                  <option>Tất cả chi nhánh</option>
                  <option>Cơ sở 1 Linh Đàm</option>
                  <option>Cơ sở 2 Đà Lạt</option>
                  <option>Cơ sở 3 Hội An</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Nhận phòng</label>
                <input type="datetime-local" className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50" />
              </div>
              <div>
                <label className="block text-xs font-medium text-amber-600 mb-1">Trả phòng</label>
                <input type="datetime-local" className="w-full border border-amber-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition bg-amber-50/50" />
              </div>
              <div className="flex items-end">
                <Link to="/rooms" className="w-full bg-amber-500 hover:bg-amber-600 text-white text-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors">
                  Tìm phòng
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Loại phòng */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">3 Trải nghiệm khác biệt</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-amber-100 hover:shadow-lg transition-shadow">
            <span className="text-3xl mb-4 block">🔒</span>
            <h4 className="font-bold text-amber-900 mb-2">Cozy</h4>
            <p className="text-sm text-amber-700">Riêng tư — Không gian chỉ của bạn</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-amber-100 hover:shadow-lg transition-shadow">
            <span className="text-3xl mb-4 block">☕</span>
            <h4 className="font-bold text-amber-900 mb-2">Japandi</h4>
            <p className="text-sm text-amber-700">Thoải mái — Tự do theo cách của bạn</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-amber-100 hover:shadow-lg transition-shadow">
            <span className="text-3xl mb-4 block">🌿</span>
            <h4 className="font-bold text-amber-900 mb-2">Signature</h4>
            <p className="text-sm text-amber-700">Dễ chịu — Núp hẻm, yên tĩnh</p>
          </div>
        </div>
      </section>

      {/* Room Listings */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-amber-900">Phòng nổi bật</h3>
          <Link to="/rooms" className="text-sm text-amber-600 hover:text-amber-800 font-medium transition-colors">
            Xem tất cả →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Room Card 1 - Cozy */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-amber-100 relative">
              <img src="/images/rooms/cozy/cozy-1.jpg" alt="Phòng Hạnh Phúc" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Còn trống</span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-amber-900">Phòng Hạnh Phúc</h4>
              <p className="text-sm text-amber-600 mt-1">Cơ sở 1 Linh Đàm · 2 người</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {['WiFi', 'Máy lạnh', 'Giường king'].map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{a}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-amber-600">90.000 ₫/giờ</p>
                <Link to="/locations/0/rooms/0" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium transition-colors">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>

          {/* Room Card 2 - Japandi */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-amber-100 relative">
              <img src="/images/rooms/japandi/japandi-1.jpg" alt="Phòng Hải Yến" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Còn trống</span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-amber-900">Phòng Hải Yến</h4>
              <p className="text-sm text-amber-600 mt-1">Cơ sở 1 Linh Đàm · 3 người</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {['WiFi', 'Máy lạnh', 'Bồn tắm nước nóng'].map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{a}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-amber-600">130.000 ₫/giờ</p>
                <Link to="/locations/0/rooms/2" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium transition-colors">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>

          {/* Room Card 3 - Signature */}
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 overflow-hidden hover:shadow-lg transition-shadow">
            <div className="h-48 bg-amber-100 relative">
              <img src="/images/rooms/signature/signature-1.jpg" alt="Phòng Xuân Hương" className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Còn trống</span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-amber-900">Phòng Xuân Hương</h4>
              <p className="text-sm text-amber-600 mt-1">Cơ sở 1 Linh Đàm · 5 người</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {['WiFi', 'Bếp chung', 'Bàn làm việc'].map((a) => (
                  <span key={a} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs">{a}</span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-bold text-amber-600">1.250.000 ₫/ngày</p>
                <Link to="/locations/0/rooms/3" className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs rounded-lg font-medium transition-colors">
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quy định */}
      <section className="bg-white/60 border-t border-amber-100 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h3 className="text-2xl font-bold text-amber-900 mb-6 text-center">Những điều cần biết</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-5 border border-amber-100">
              <span className="text-2xl mb-3 block">⏰</span>
              <h4 className="font-bold text-amber-900 mb-2">Đúng giờ</h4>
              <p className="text-sm text-amber-700">Check-out đúng giờ. Trễ từ 10 phút, phí phát sinh 100.000 – 150.000 ₫.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-amber-100">
              <span className="text-2xl mb-3 block">🤫</span>
              <h4 className="font-bold text-amber-900 mb-2">Giờ nghỉ ngơi</h4>
              <p className="text-sm text-amber-700">Sau 22:00, giữ âm lượng nhẹ nhàng để mọi người cùng nghỉ ngơi.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-amber-100">
              <span className="text-2xl mb-3 block">🌿</span>
              <h4 className="font-bold text-amber-900 mb-2">Giữ gìn không gian</h4>
              <p className="text-sm text-amber-700">Không hút thuốc trong phòng. Nấu ăn xong rửa sạch chén bát.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-amber-900 text-amber-100 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/logo.jpg" alt="StayEasy" className="h-10 w-10 rounded-xl object-cover" />
                <div>
                  <h4 className="text-lg font-bold text-white">StayEasy</h4>
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
                <p>📧 Email: stayeasy@gmail.com</p>
                <p>📞 Điện thoại: 0901 234 567</p>
                <p>📍 Cơ sở 1: 111/2 Phạm Văn Bạch, Phường Tân Sơn, Tp. HCM</p>
                <p>📍 Cơ sở 2: 456 Đường Đặng Thùy Trâm, Đà Lạt</p>
                <p>📍 Cơ sở 3: 789 Phố cổ Hội An, Quảng Nam</p>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4">Kết nối với chúng tôi</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-sm">FB</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-sm">IG</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-sm">TT</span>
                </a>
                <a href="#" className="w-10 h-10 bg-amber-800 hover:bg-amber-700 rounded-lg flex items-center justify-center transition-colors">
                  <span className="text-sm">ZL</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-amber-800 pt-6 text-center text-sm text-amber-300">
            <p>© 2026 StayEasy — Hệ thống đặt phòng &amp; quản lý homestay</p>
          </div>
        </div>
      </footer>
    </div>
  )
}