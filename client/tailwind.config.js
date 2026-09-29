/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Màu chủ đạt — chỉ dùng cho trang chủ & nút chính
        brand: {
          50: '#eef7ff',
          100: '#d9edff',
          500: '#0a7ea4',
          600: '#096b8b',
          700: '#085874',
        },
        // Trạng thái phòng / trạng thái đơn — dùng chung để màu nhất quán
        status: {
          available: '#16a34a',
          booked: '#2563eb',
          occupied: '#d97706',
          cleaning: '#7c3aed',
          maintenance: '#6b7280',
          cancelled: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
