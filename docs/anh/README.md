# Bộ hình cho báo cáo (Chương 3 và Chương 4)

**46 hình = 23 hình Chương 3 + 23 hình Chương 4.**

Mục tiêu: **không để trống ô "Hình 3.x" hay "Hình 4.x" nào** trong báo cáo, và mỗi hình
đều là hình thật — giao diện chụp từ hệ thống đang chạy, sơ đồ dựng từ dữ liệu của chính
dự án.

| Mục | Nội dung |
|-----|----------|
| [Danh sách 23 hình Chương 3](#danh-sách-23-hình-chương-3) | 16 sơ đồ (3.1 – 3.16) + 7 ảnh giao diện (3.17 – 3.23) |
| [Danh sách 23 ảnh Chương 4](#23-ảnh-giao-diện-cho-chương-4-hình-41--423) | 32 ảnh giao diện (4.1 – 4.23), xem cuối file |

## Hai loại hình

| Nhóm | Số | Cách tạo | Nguồn |
|------|----|----------|-------|
| Sơ đồ | 16 (3.1 – 3.16) | Sinh bằng script `ve-so-do.mjs` ra SVG, rồi `svg-2-png.mjs` dựng ra PNG | Nội dung lấy từ **code thật**: endpoint, entity, tầng kiến trúc, luồng nghiệp vụ |
| Giao diện | 30 (3.17 – 3.23 và 4.1 – 4.23) | Chụp trực tiếp hệ thống đang chạy | Khung 1440 × 900 |

> Sơ đồ lưu `.png` chứ không phải `.jpg`: sơ đồ nhiều chữ nhỏ và nét mảnh, JPEG bóp mép
> chữ. File `.svg` vẫn giữ nguyên để dựng lại bất cứ lúc nào.

## Danh sách 23 hình Chương 3

| Hình | Tên trong báo cáo | File ảnh | File SVG |
|------|-------------------|-----------|----------|
| 3.1 | Use Case tổng quát | `3-01-use-case-tong-quat.png` | `so-do/3-01-…svg` |
| 3.2 | Use Case quản lý tài khoản | `3-02-use-case-quan-ly-tai-khoan.png` | `so-do/3-02-…svg` |
| 3.3 | Use Case tìm kiếm & đặt phòng | `3-03-use-case-tim-kiem-va-dat-phong.png` | `so-do/3-03-…svg` |
| 3.4 | Use Case quản lý đặt phòng | `3-04-use-case-quan-ly-dat-phong.png` | `so-do/3-04-…svg` |
| 3.5 | Use Case quản lý phòng | `3-05-use-case-quan-ly-phong.png` | `so-do/3-05-…svg` |
| 3.6 | Use Case thanh toán | `3-06-use-case-thanh-toan.png` | `so-do/3-06-…svg` |
| 3.7 | Use Case thông báo | `3-07-use-case-thong-bao.png` | `so-do/3-07-…svg` |
| 3.8 | Use Case quản trị hệ thống | `3-08-use-case-quan-tri-he-thong.png` | `so-do/3-08-…svg` |
| 3.9 | Biểu đồ lớp thực thi | `3-09-bieu-do-lop-thuc-thi.png` | `so-do/3-09-…svg` |
| 3.10 | Sơ đồ ERD của hệ thống | `3-10-so-do-erd.png` | `so-do/3-10-…svg` |
| 3.11 | Tuần tự: đăng nhập | `3-11-sequence-dang-nhap.png` | `so-do/3-11-…svg` |
| 3.12 | Tuần tự: tìm kiếm phòng | `3-12-sequence-tim-kiem-phong.png` | `so-do/3-12-…svg` |
| 3.13 | Tuần tự: đặt phòng | `3-13-sequence-dat-phong.png` | `so-do/3-13-…svg` |
| 3.14 | Tuần tự: check-in / check-out | `3-14-sequence-check-in-check-out.png` | `so-do/3-14-…svg` |
| 3.15 | Tuần tự: quản lý phòng | `3-15-sequence-quan-ly-phong.png` | `so-do/3-15-…svg` |
| 3.16 | Tuần tự: thanh toán | `3-16-sequence-thanh-toan.png` | `so-do/3-16-…svg` |
| 3.17 | Giao diện trang chủ | `3-17-trang-chu.jpg` | — |
| 3.18 | Giao diện tìm kiếm phòng | `3-18-tim-kiem-phong.jpg` | — |
| 3.19 | Giao diện chi tiết phòng | `3-19-chi-tiet-phong.jpg` | — |
| 3.20 | Giao diện đặt phòng | `3-20-dat-phong.jpg` | — |
| 3.21 | Giao diện quản lý đặt phòng | `3-21-quan-ly-don-dat-phong.jpg` | — |
| 3.22 | Giao diện quản trị hệ thống | `3-22-quan-tri-he-thong.jpg` | — |
| 3.23 | Giao diện quản lý phòng | `3-23-quan-ly-phong.jpg` | — |

## ⚠️ Những chỗ mẫu báo cáo còn sai so với hệ thống

Mẫu `.docx` viết tên hệ thống là **StayEasy**; dự án này tên là **HomeStay**. Kiến trúc
nay đã đánh số lại (Hình 3.10, không còn là 3.8) và sơ đồ `3-10-so-do-erd.svg`
đã ghi đúng tên.

Danh sách đầy đủ các chỗ phải sửa tay trong mẫu nằm ở `docs/CHINH_SUA_MAU_BAO_CAO.md` —
đọc file đó **trước khi nộp**, không chỉ dựa vào README này.

## Cách sinh lại sơ đồ

Sơ đồ được sinh từ script, **không vẽ tay** — nên khi code đổi (thêm endpoint, đổi tên
lớp, đổi luồng) chỉ cần sửa dữ liệu trong script rồi chạy lại:

```powershell
node docs/anh/ve-so-do.mjs          # ghi 16 file .svg vào docs/anh/so-do/
node docs/anh/svg-2-png.mjs         # dựng 16 file .png để nhúng vào Word
```

Hai lệnh phải chạy **theo thứ tự**: PNG là ảnh chụp từ SVG, sửa SVG mà không chạy lại
lệnh thứ hai thì báo cáo vẫn hiện hình cũ.

Muốn xem/chụp lại: chạy server tĩnh nhỏ rồi mở trình duyệt

```powershell
node docs/anh/xem-so-do.mjs         # http://localhost:5199/anh/so-do/index.html
```

> `index.html` là **trang xem tất cả 16 sơ đồ trong một trang**, do chính `ve-so-do.mjs`
> sinh ra nên không bao giờ lệch với danh sách hình. Muốn xem toàn bộ sơ đồ thì mở
> trang này thay vì bấm từng file.

> File `.svg` nên mở trực tiếp bằng trình duyệt hoặc chèn vào Word (Word 2016 trở lới
> hỗ trợ SVG) để hình luôn sắc nét, không phụ thuộc độ phân giải ảnh chụp.

## Quy ước hình ảnh dùng chung

| Nội dung | Màu |
|----------|-----|
| Khối nghiệp vụ (service, tầng dữ liệu) | Nền `#fffbeb`, viền `#d97706` (amber-600 — màu thương hiệu) |
| Thành phần hệ thống (controller, hạ tầng) | Nền `#eff6ff`, viền `#2563eb` |
| Tác nhân | Nền `#f5f3ff`, viền `#7c3aed` |
| Cơ sở dữ liệu | Nền `#f0fdf4`, viền `#16a34a` |
| Lỗi / trường hợp bị từ chối | Nền `#fef2f2`, viền `#dc2626` |

Nét nối luôn được vẽ **trước**, hộp **sau** — nhờ vậy hộp có nền che các đoạn nét chạy
qua, không có nét nào cắt ngang chữ bên trong hộp.

## Dữ liệu dùng để chụp 7 ảnh giao diện

- Tài khoận: `admin@homestay.vn` (Admin) · `khach1@gmail.com` (khách) — mật khẩu `123456`
- Dữ liệu: **đúng trạng thái seed** — 4 tài khoản · 10 phòng · 15 đơn · 6 đánh giá ·
  7 phiếu thu · 26 thông báo (11 chưa đọc)
- Muốn trả về đúng trạng thái seed: `DROP DATABASE homestay` rồi chạy lại app; seed chỉ
  nạp khi bảng `Users` còn trống
- Đã dọn sạch dữ liệu rác do các lần chạy test tích hợp (Bước 18), chỉ xoá theo
  `Note` đúng của test, **không** `TRUNCATE`

## 23 ảnh giao diện cho Chương 4 (Hình 4.1 – 4.23)

Chụp từ hệ thống đang chạy thật, dùng cho `docs/CHUONG_4.md`.
Mọi ảnh quy ước nền trắng, không có viền đen của trình duyệt.

| Hình | Nội dung | Tệp |
|------|----------|-----|
| 4.1 | Màn hình đăng nhập | `4-01-dang-nhap.jpg` |
| 4.2 | Màn hình đăng ký | `4-02-dang-ky.jpg` |
| 4.3 | Tìm kiếm và lọc phòng | `4-03-tim-kiem-phong.jpg` |
| 4.4 | Chi tiết phòng | `4-04-chi-tiet-phong.jpg` |
| 4.5 | Kiểm tra phòng trống (đã có người đặt) | `4-05-kiem-tra-phong-trong.jpg` |
| 4.6 | Đặt phòng theo giờ | `4-06-dat-phong-theo-gio.jpg` |
| 4.7 | Đặt phòng theo ngày | `4-07-dat-phong-theo-ngay.jpg` |
| 4.8 | Đơn của tôi (lọc theo trạng thái) | `4-08-don-cua-toi.jpg` |
| 4.9 | Chi tiết đơn + lịch sử + biểu mẫu đánh giá | `4-09-danh-gia-phong.jpg` |
| 4.10 | Dashboard thống kê | `4-10-dashboard-thong-ke.jpg` |
| 4.11 | Quản lý cơ sở (địa điểm) | `4-11-quan-ly-co-so.jpg` |
| 4.12 | Quản lý phòng (danh sách) | `4-12-quan-ly-phong.jpg` |
| 4.13 | Biểu mẫu phòng: ảnh + tiện nghi | `4-13-form-phong-anh-tien-nghi.jpg` |
| 4.14 | Quản lý đơn đặt phòng | `4-14-quan-ly-don-dat-phong.jpg` |
| 4.15 | Nút thao tác theo trạng thái đơn | `4-15-chuyen-trang-thai-don.jpg` |
| 4.16 | Quản lý khách hàng | `4-16-quan-ly-khach-hang.jpg` |
| 4.17 | Quản lý đánh giá | `4-17-quan-ly-danh-gia.jpg` |
| 4.18 | Thanh toán của tôi | `4-18-thanh-toan-cua-toi.jpg` |
| 4.19 | Quản lý thanh toán (Admin) | `4-19-admin-thanh-toan.jpg` |
| 4.20 | Mở khối thao tác thu tiền | `4-20-mo-khoi-thu-tien.jpg` |
| 4.21 | Danh sách thông báo | `4-21-danh-sach-thong-bao.jpg` |
| 4.22 | Đánh dấu đã đọc tất cả | `4-22-da-doc-tat-ca.jpg` |
| 4.23 | Thông báo sinh tự động khi Admin xác nhận | `4-23-thong-bao-sinh-tu-dong.jpg` |

### Chụp lại ảnh này thì cần biết

| Mục đích | Cách làm |
|----------|----------|
| Cần đăng nhập mà `browser.type` không nhận được mật khẩu | Tại tạm một trang trong `client/public/` đặt `localStorage['homestay.auth']`, mở nó để nạp phiên, **xoá ngay sau khi dùng** (file chứa token, tuyệt đối không commit) |
| Tham số URL đúng của trang đặt phòng | `loai=hour` hoặc `loai=day` — **không phải** `0`/`1`. Giao diện so sánh với hằng chuỗi `BookingType` trong `utils/pricing.ts` |
| Mốc thời gian trong URL | Định dạng **giờ địa phương không ký `Z`**: `2026-10-29T15:00`. Gửi ký `Z` sẽ lệch 7 giờ |
| Ảnh cần đơn ở trạng thái `PENDING` (hình 4.15) | Tạo đơn qua API trước, chụp xong xoá lại để CSDL về 15 đơn |
| Ảnh cần badge thông báo khác 0 (hình 4.21) | Xoá bảng `Notifications` rồi khởi động lại app để seed nạp lại; seed cố ý chừa 11 thông báo chưa đọc |