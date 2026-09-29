import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx'
import './index.css'

/**
 * Cấu hình TanStack Query — nguồn dữ liệu duy nhất cho dữ liệu do server trả về.
 *
 * `staleTime: 60_000` nghĩa là trong 1 phút không phải gọi lại API khi chuyển
 * qua lại giữa các màn hình. Không đặt `refetchOnWindowFocus: false` vì phòng
 * trống là thứ thay đổi theo thời gian thực — quay lại tab thì làm mới là đúng.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/*
       * Hai cờ `future` ở dưới chỉ để tắt cảnh báo React Router v6 trong console.
       * Chúng KHÔNG phải thứ tựơng lai nào cần thiết cho đồ án — bật sẵn chỉ để
       * console sạch, vì AGENTS.md yêu cầu không để lại cảnh báo khi chạy thử.
       */}
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
