import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Cấu hình chung cho cả `npm run dev` (Vite) và `npm test` (Vitest).
 *
 * `defineConfig` lấy từ `vitest/config` chứ không phải từ `vite`: bản của Vite
 * không khai báo trường `test`, nên dùng bản của Vite sẽ không type được và
 * không có ý nghĩa khi chạy test (bài học ở `lessons.md` mục 9 — viết theo kiến
 * thức cũ thì hỏng).
 */
export default defineConfig({
  plugins: [react()],
  build: {
    /*
     * Tách thư viện ra khỏi bundle của mã dự án.
     *
     * Vì sao: gộp tất cả lại cho ra một gói ~870 kB, vượt ngưỡng 500 kB mà
     * Vite cảnh báo. Người dùng phải tải trọn gói (kể cả Recharts chỉ dùng ở
     * trang Thống kê của Admin) trước khi thấy được trang đầu tiên.
     *
     * Tách theo nhóm thư viện thay vì theo từng package: nhóm này không đổi
     * giữa các lần sửa mã của mình, nên trình duyệt cache được lâu dài. Và
     * không `import()` lazily các trang — màn hình Admin vốn đã được bảo vệ
     * phân quyền, tách lazy chỉ làm thêm độ phức tạp mà không lợi gì rõ (YAGNI).
     */
    rollupOptions: {
      output: {
        manualChunks: {
          'nhan-react': ['react', 'react-dom', 'react-router-dom'],
          'nhan-du-lieu': ['@tanstack/react-query'],
          'nhan-bieu-mau': ['react-hook-form', 'zod', '@hookform/resolvers/zod'],
          'nhan-bieu-do': ['recharts'],
        },
      },
    },
  },
  server: {
    /*
     * Dùng 5174 vì trên máy này cổng 5173 đang bị pm2 chiếm cho một dự án
     * khác. `strictPort: true` để Vite báo lỗi thay vì tự nhảy sang 5175 —
     * nếu tự nhảy, người khác tưởng app hỏng mà thực ra chỉ sai cổng.
     */
    port: 5174,
    strictPort: true,
    /*
     * Proxy sang API ASP.NET Core.
     * Nhờ proxy, gọi '/api/auth/login' ở client không bị lỗi CORS,
     * và 1 đổi khác cổng phía server không phải sửa lại code client.
     */
    proxy: {
      '/api': {
        target: 'http://localhost:5080',
        changeOrigin: true,
      },
    },
  },
  test: {
    /*
     * `jsdom` thay cho `node`: cần môi trường có `document`, `window`,
     * `localStorage` để dựng component React. `localStorage` là bắt buộc vì
     * `authStore` dùng middleware `persist` của Zustand — không có nó thì
     * store ném lỗi ngay khi import.
     */
    environment: 'jsdom',
    /*
     * File thiết lập dùng chung cho mọi test: đăng ký matcher của
     * jest-dom (`toBeInTheDocument`...) và tự dọn DOM sau mỗi test.
     */
    setupFiles: ['./src/test/vitest.setup.ts'],
    /*
     * Mặc định Vitest chỉ nhận file trong thư mục `test/`. Dự án đặt test cạnh
     * file được kiểm thử (`xxx.test.ts`), nên phải nói rõ đường dẫn.
     */
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    /*
     * Không chạy song song các test cùng đụng một thứ dùng chung — ví dụ
     * `localStorage`. Lỗi loại này hiện ra rất khó đoán vì test chạy thì xanh
     * nhưng chạy song song thì đỏ.
     */
    fileParallelism: false,
    /*
     * Cần lặp lại 3 lần là hợp lý: thay đổi nào ở `describe/it` không nên
     * làm test chập chờn. Nếu tăng lên 10, chậm mà không thêm giá trị.
     */
    retry: 0,
  },
})
