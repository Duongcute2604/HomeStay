/**
 * Định dạng hiển thị dùng chung.
 *
 * Quy tắc bất biến AGENTS.md 7.3: tiền VND hiện dạng `500.000 ₫` (dấu chấm phân
 * cách nghìn), số/tiền căn phải với class `.number-vn`, chữ căn trái.
 * File này tạo ở Bước 6 vì đây là bước đầu tiên có màn hình hiện tiền —
 * trước đó tạo là thừa (YAGNI).
 */

/**
 * Định dạng số tiền VNĐ: `500000` → `"500.000 ₫"`.
 *
 * Dùng `Intl.NumberFormat('vi-VN')` của trình duyệt thay vì tự viết hàm thêm
 * dấu chấm — tự viết dễ sai với số lẻ và số âm.
 */
export function formatVnd(value: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(value)} ₫`
}

/**
 * Định dạng điểm đánh giá: `4.5` → `"4,5"`, `4` → `"4,0"`.
 *
 * Luôn hiện 1 chữ số thập phân để các phòng so sánh được với nhau trên cùng
 * một cột — `4` và `4,0` nhìn khác nhau dù giá trị bằng nhau.
 */
export function formatDiem(value: number): string {
  return value.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

/**
 * Định dạng ngày giờ ISO từ API: `"2026-09-29T..."` → `"29/09/2026 14:30"`.
 *
 * Dùng `Intl` của trình duyệt để đúng múi giờ máy khách — server trả UTC,
 * hiện nguyên chuỗi UTC thì giờ lệch với giờ người dùng đang sống.
 */
export function formatNgay(value: string): string {
  const ngay = new Date(value)

  if (Number.isNaN(ngay.getTime())) {
    return value
  }

  const ngayThang = ngay.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const gioPhut = ngay.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return `${ngayThang} ${gioPhut}`
}
