import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

/**
 * Thiết lập dùng chung cho mọi file test.
 *
 * Không đặt logic kiểm thử ở đây — chỉ những thứ mà MỌI test đều cần mới
 * được đặt. Nếu sau này có một quy tắc "trước mỗi test phải xoá gì đó" thì
 * mới thêm vào đây, còn không thì giữ file tối giản.
 */
afterEach(() => {
  /*
   * Dọn DOM sau mỗi test. Không có bước này thì các test render cùng một
   * component sẽ chồng lên nhau, và `screen.getByText('Đăng nhập')` trong test
   * sau tìm thấy nút của test trước — báo sai nguyên nhân rất khó tìm.
   */
  cleanup()

  /*
   * Xoá `localStorage`. `authStore` dùng `persist` nên mọi test có thể để lại
   * phiên đăng nhập cho test kế tiếp đọc trúng — một test đỏ vì test trước.
   */
  window.localStorage.clear()
})
