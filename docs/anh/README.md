# Bộ 22 hình cho Chương 3 của báo cáo

Mục tiêu của Bước 19: **không để trống ô "Hình 3.x" nào** trong báo cáo, và mỗi hình
đều là hình thật — giao diện chụp từ hệ thống đang chạy, sơ đồ dựng từ dữ liệu của chính
dự án.

## Hai loại hình

| Nhóm | Số | Cách tạo | Nguồn |
|------|----|----------|-------|
| Sơ đồ | 15 (3.1 – 3.15) | Sinh bằng script `ve-so-do.mjs` ra SVG, rồi chụp ảnh | Nội dung lấy từ **code thật**: endpoint, entity, tầng kiến trúc, luồng nghiệp vụ |
| Giao diện | 7 (3.16 – 3.22) | Chụp trực tiếp hệ thống đang chạy | Khung 1440 × 900 |

## Danh sách 22 hình

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
