# Bộ 39 hình cho báo cáo (Chương 3 và Chương 4)

**39 hình = 22 hình Chương 3 + 17 hình Chương 4.**

Mục tiêu: **không để trống ô "Hình 3.x" hay "Hình 4.x" nào** trong báo cáo, và mỗi hình
đều là hình thật — giao diện chụp từ hệ thống đang chạy, sơ đồ dựng từ dữ liệu của chính
dự án.

| Mục | Nội dung |
|-----|----------|
| [Danh sách 22 hình Chương 3](#danh-sách-22-hình) | 15 sơ đồ (3.1 – 3.15) + 7 ảnh giao diện (3.16 – 3.22) |
| [Danh sách 17 hình Chương 4](#17-ảnh-giao-diện-cho-chương-4-hình-41--417) | 17 ảnh giao diện (4.1 – 4.17), xem cuối file |

## Hai loại hình

| Nhóm | Số | Cách tạo | Nguồn |
|------|----|----------|-------|
| Sơ đồ | 15 (3.1 – 3.15) | Sinh bằng script `ve-so-do.mjs` ra SVG, rồi chụp ảnh | Nội dung lấy từ **code thật**: endpoint, entity, tầng kiến trúc, luồng nghiệp vụ |
| Giao diện | 24 (3.16 – 3.22 và 4.1 – 4.17) | Chụp trực tiếp hệ thống đang chạy | Khung 1440 × 900 |

## Danh sách 22 hình Chương 3

| Hình | Tên trong báo cáo | File ảnh | File SVG |
|------|-------------------|-----------|----------|
| 3.1 | Biểu đồ tác nhân nhân | `3-01-bieu-do-tac-nhan.jpg` | `so-do/3-01-bieu-do-tac-nhan.svg` |
| 3.2 | Use Case tổng quát | `3-02-use-case-tong-quat.jpg` | `so-do/3-02-use-case-tong-quat.svg` |
| 3.3 | Use Case quản lý tài khoản | `3-03-use-case-quan-ly-tai-khoan.jpg` | `so-do/3-03-…svg` |
| 3.4 | Use Case tìm kiếm & đặt phòng | `3-04-use-case-tim-kiem-va-dat-phong.jpg` | `so-do/3-04-…svg` |
| 3.5 | Use Case quản lý đặt phòng | `3-05-use-case-quan-ly-dat-phong.jpg` | `so-do/3-05-…svg` |
| 3.6 | Use Case quản lý phòng | `3-06-use-case-quan-ly-phong.jpg` | `so-do/3-06-…svg` |
| 3.7 | Use Case quản trị hệ thống | `3-07-use-case-quan-tri-he-thong.jpg` | `so-do/3-07-…svg` |
| 3.8 | Kiến trúc hệ thống | `3-08-kien-truc-he-thong.jpg` | `so-do/3-08-kien-truc-he-thong.svg` |
| 3.9 | Biểu đồ lớp thực thi | `3-09-bieu-do-lop-thuc-thi.jpg` | `so-do/3-09-…svg` |
| 3.10 | Sơ đồ ERD của hệ thống | `3-10-so-do-erd.jpg` | `so-do/3-10-so-do-erd.svg` |
| 3.11 | Tuần tự: đăng nhập | `3-11-sequence-dang-nhap.jpg` | `so-do/3-11-…svg` |
| 3.12 | Tuần tự: tìm kiếm phòng | `3-12-sequence-tim-kiem-phong.jpg` | `so-do/3-12-…svg` |
| 3.13 | Tuần tự: đặt phòng | `3-13-sequence-dat-phong.jpg` | `so-do/3-13-…svg` |
| 3.14 | Tuần tự: check-in / check-out | `3-14-sequence-check-in-check-out.jpg` | `so-do/3-14-…svg` |
| 3.15 | Tuần tự: quản lý phòng | `3-15-sequence-quan-ly-phong.jpg` | `so-do/3-15-…svg` |
| 3.16 | Giao diện trang chủ | `3-16-trang-chu.jpg` | — |
| 3.17 | Giao diện tìm kiếm phòng | `3-17-tim-kiem-phong.jpg` | — |
| 3.18 | Giao diện chi tiết phòng | `3-18-chi-tiet-phong.jpg` | — |
| 3.19 | Giao diện đặt phòng | `3-19-dat-phong.jpg` | — |
| 3.20 | Giao diện quản lý đặt phòng | `3-20-quan-ly-don-dat-phong.jpg` | — |
| 3.21 | Giao diện quản trị hệ thống | `3-21-quan-tri-he-thong.jpg` | — |
| 3.22 | Giao diện quản lý phòng | `3-22-quan-ly-phong.jpg` | — |

## ⚠️ Phải sửa trong mẫu báo cáo

Mẫu `.docx` hiện đang ghi **"Hình 3.8. Kiến trúc hệ thống StayEasy"** — tên cũ.
Hệ thống đã đổi tên thành **HomeStay**, nên phải sửa thành *"Kiến trúc hệ thống HomeStay"*
trước khi nộp. Sơ đồ trong `docs/anh/so-do/3-08-kien-truc-he-thong.svg` đã ghi đúng
tên HomeStay.

## Cách sinh lại sơ đồ

Sơ đồ được sinh từ script, **không vẽ tay** — nên khi code đổi (thêm endpoint, đổi tên
lớp, đổi luồng) chỉ cần sửa dữ liệu trong script rồi chạy lại:

```powershell
node docs/anh/ve-so-do.mjs          # ghi 15 file .svg vào docs/anh/so-do/
```

Muốn xem/chụp lại: chạy server tĩnh nhỏ rồi mở trình duyệt

```powershell
node docs/anh/xem-so-do.mjs         # http://localhost:5199/anh/so-do/3-10-so-do-erd.svg
```

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

- Tài khoản: `admin@homestay.vn` (Admin) · `khach1@gmail.com` (khách) — mật khẩu `123456`
- Dữ liệu: **đúng trạng thái seed** — 15 đơn, 10 phòng đều `AVAILABLE`
- Đã dọn sạch dữ liệu rác do các lần chạy test tích hợp (Bước 18), chỉ xoá theo
  `Note` đúng của test, **không** `TRUNCATE`

## 17 ảnh giao diện cho Chương 4 (Hình 4.1 – 4.17)

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

### Chụp lại ảnh này thì cần biết

| Mục đích | Cách làm |
|----------|----------|
| Cần đăng nhập mà `browser.type` không nhận được mật khẩu | Tạo tạm một trang trong `client/public/` đặt `localStorage['homestay.auth']`, mở nó để nạp phiên, **xoá ngay sau khi dùng** (file chứa token, tuyệt đối không commit) |
| Tham số URL đúng của trang đặt phòng | `loai=hour` hoặc `loai=day` — **không phải** `0`/`1`. Giao diện so sánh với hằng chuỗi `BookingType` trong `utils/pricing.ts` |
| Mốc thời gian trong URL | Định dạng **giờ địa phương không ký `Z`**: `2026-10-29T15:00`. Gửi ký `Z` sẽ lệch 7 giờ |
| Ảnh cần đơn ở trạng thái `PENDING` (hình 4.15) | Tạo đơn qua API trước, chụp xong xoá lại để CSDL về 15 đơn |
