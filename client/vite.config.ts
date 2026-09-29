import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
})
