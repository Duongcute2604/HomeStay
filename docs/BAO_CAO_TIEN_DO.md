# BÁO CÁO TIẾN ĐỘ — Hệ thống đặt phòng & quản lý homestay

> SV: Nguyễn Hải Nam — 12523W.1 · GVHD: TS. Hồng Quốc Việt
> Bắt đầu: 29/09/2026 · Dự kiến bảo vệ: ~20/10/2026
> **Cập nhật sau MỖI chức năng hoàn thành** (xem `AGENTS.md` mục 0)

---

## 1. Bảng tiến độ tổng quan

| Ngày | Bước | Chức năng hoàn thành | Test tay | Unit test | Trạng thái |
|------|------|----------------------|----------|-----------|-----------|
| | 1 | Cài .NET SDK, Docker, Node | — | — | ✅ Xong (29/09) |
| | 2 | Khung project + git repo | — | — | ✅ Xong (29/09) |
| | 3 | 9 bảng CSDL + project test | ✅ 6/6 kịch bản SQL | 27 pass | ✅ Xong (29/09) |
| | 4 | Seed data | ⬜ | — | ⬜ Chưa làm |
| | 5 | Tài khoản (đăng ký/đăng nhập/hồ sơ) | ⬜ | ⬜ | ⬜ Chưa làm |
| | 6 | Xem địa điểm | ⬜ | ⬜ | ⬜ Chưa làm |
| | 7 | Tìm kiếm & lọc phòng | ⬜ | ⬜ | ⬜ Chưa làm |
| | 8 | Chi tiết phòng | ⬜ | ⬜ | ⬜ Chưa làm |
| | 9 | Kiểm tra phòng trống | ⬜ | ⬜ | ⬜ Chưa làm |
| | 10 | Đặt phòng theo giờ / ngày | ⬜ | ⬜ | ⬜ Chưa làm |
| | 11 | Đơn của tôi, hủy đơn, lịch sử | ⬜ | ⬜ | ⬜ Chưa làm |
| | 12 | Admin: địa điểm, tiện nghi, phòng, ảnh | ⬜ | ⬜ | ⬜ Chưa làm |
| | 13 | Admin: xác nhận/check-in/check-out | ⬜ | ⬜ | ⬜ Chưa làm |
| | 14 | Admin: khóa tài khoản khách | ⬜ | ⬜ | ⬜ Chưa làm |
| | 15 | Dashboard thống kê | ⬜ | ⬜ | ⬜ Chưa làm |
| | 16 | Đánh giá & nhận xét | ⬜ | ⬜ | ⬜ Chưa làm |
| | 17 | Responsive, Loading/Error/Empty, Toast | ⬜ | — | ⬜ Chưa làm |
| | 18 | 18 test case tích hợp (Postman) | ⬜ | — | ⬜ Chưa làm |
| | 19 | 22 hình cho Chương 3 | — | — | ⬜ Chưa làm |
| | 20 | Viết Chương 4 | — | — | ⬜ Chưa làm |
| | 21 | Kết luận, slide, luyện trình bày | — | — | ⬜ Chưa làm |
| | 22 | **Thanh toán** (mở rộng, tuỳ chọn) | ⬜ | ⬜ | ⬜ Chỉ làm nếu còn thời gian |
| | 23 | **Thông báo** (mở rộng, tuỳ chọn) | ⬜ | ⬜ | ⬜ Chỉ làm nếu còn thời gian |

**Ký hiệu:** ⬜ Chưa làm · 🟨 Đang làm · ✅ Xong · ❌ Cắt (ghi lý do)

> ⚠️ **Bước 22 & 23 KHÔNG nằm trong phạm vi đã chốt của báo cáo.**
> Chỉ bắt tay vào khi Bước 1–21 xong hết **và** còn ≥ 3 ngày trước ngày bảo vệ.
> Làm thì **phải bổ sung mục vào báo cáo cho khớp**, nếu không sẽ tự tạo mâu thuẫn.
> Điều kiện & phạm vi chi tiết: `todo.md` → Giai đoạn 8.

---

## 2. Bảng tiến độ báo cáo đồ án

| Tuần | Nội dung | Tình trạng |
|------|----------|-----------|
| Tuần 1 (29/09–05/10) | Môi trường, CSDL, seed, tài khoản | ⬜ |
| Tuần 2 (06/10–12/10) | Tìm kiếm, chi tiết phòng, đặt phòng, đơn của tôi | ⬜ |
| Tuần 3 (13/10–19/10) | Admin, thống kê, đánh giá, kiểm thử, Chương 4 | ⬜ |
| Tuần 4 (20/10) | Bảo vệ | ⬜ |

---

## 3. Tiến độ hình ảnh cho báo cáo

| Nhóm | Số lượng | Đã có | Ghi chú |
|------|----------|-------|---------|
| Hình UML (3.1–3.15) | 15 | ⬜ | Vẽ bằng draw.io / plantuml.com |
| Ảnh giao diện Chương 3 (3.16–3.22) | 7 | ⬜ | Chụp từ app đang chạy |
| Ảnh chức năng Chương 4 (4.1–4.17) | 17 | ⬜ | Chụp khi xong từng chức năng |
| Ảnh kiểm thử | ⬜ | ⬜ | Ảnh Postman + kết quả |

> **Ảnh chụp ngay khi xong mỗi chức năng**, đừng đợi cuối kỳ mới quay lại chụp.

---

## 4. Ghi chú vướng mắc / vấn đề gặp phải

| Ngày | Vấn đề | Cách xử lý | Trạng thái |
|------|--------|------------|-----------|
| | | | |

> Ghi lại ở đây, cuối kỳ dùng làm cơ sở cho phần "Hạn chế" và "Bài học kinh nghiệm" trong Kết luận.
