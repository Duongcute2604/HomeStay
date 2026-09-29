import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    /*
     * Proxy sang API ASP.NET Core.
     * Nhờ proxy, gọi '/api/rooms' ở client không bị lỗi CORS,
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
