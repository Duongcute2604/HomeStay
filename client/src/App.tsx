/**
 * Trang chủ — khung tối thiểu của Bước 2.
 * Nội dung thật (danh sách phòng từ API) sẽ làm ở Bước 7.
 * Hiện tại chỉ chứng minh: React + TypeScript + Tailwind đã chạy được.
 */
function App(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
      <h1 className="text-3xl font-bold text-brand-700">StayEasy</h1>
      <p className="text-gray-600">Hệ thống đặt phòng &amp; quản lý homestay</p>

      {/* Kiểm tra format tiền VND và căn lề phải — quy tắc bất biến AGENTS.md mục 7.3 */}
      <p className="number-vn text-gray-500">Giá ví dụ: 1.200.000 ₫</p>

      <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">
        Khung project đã dựng xong — Mốc 1 / Bước 2
      </span>
    </main>
  )
}

export default App
