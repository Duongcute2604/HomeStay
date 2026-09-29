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
| | 4 | Dữ liệu mẫu (4 tài khoản, 3 địa điểm, 10 phòng, 15 đơn, 6 đánh giá) + 8 ảnh SVG | ✅ 17/17 kịch bản (HP/AB/EC) | 55 pass (thêm 28) | ✅ Xong (29/09) |
| 29/09 | 5 | Tài khoản (đăng ký/đăng nhập/hồ sơ) — **Backend** | ✅ 51/51 kịch bản (HP/EC/AB) | 147 pass (thêm 92) | ✅ Xong (29/09) |
| 30/09 | 5 | Tài khoản — **giao diện** (16 file FE) | ✅ 18/20 ca (HP/EC/AB), 2 ca hoãn có lý do | 147 pass (không đổi) | ✅ Xong (30/09) |
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
| Tuần 1 (29/09–05/10) | Môi trường, CSDL, seed, tài khoản (cả 2 tầng) | ✅ Xong cả backend lẫn giao diện tài khoản |
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
| 29/09 | Lỗi form binding: body JSON hỏng trả `ProblemDetails` kèm lỗi kỹ thuật .NET (`'d' is an invalid start of a value. Path: $`) ra ngoài | Tự kiểm `ModelState` — key bắt đầu bằng `$` là lỗi đọc body → trả thông báo chung; key là tên trường là lỗi do DTO đặt ra → trả đúng message tiếng Việt | ✅ Đã sửa |
| 29/09 | 401/403/404/415 trả về **không có body**, client đọc `response.data.message` ra `undefined` đúng lúc cần báo "phiên đã hết hạn" | Thêm `app.UseStatusCodePages` trả `ApiResponse` cho mọi mã lỗi không có body; gỡ khối xử lý 401/403 thủ công khỏi `ExceptionMiddleware` để tránh trùng logic | ✅ Đã sửa |
| 29/09 | **Lỗ hổng**: refresh token cũ vẫn dùng được sau khi máy khác đăng nhập (kiểm thử tay 3.27 trả 200 thay vì 401) | Tách `ITokenHasher` (SHA-256) khỏi `IPasswordHasher` (BCrypt) — BCrypt chỉ xét 72 byte đầu nên token dài ~196 ký tự bị cắt cốt, hai token khác nhau ở đuôi cho cùng hash | ✅ Đã sửa |
| 29/09 | **Lỗ hổng**: hai lần đăng nhập trong cùng giây sinh refresh token giống hệt nhau | Thêm claim `jti` (GUID) vào refresh token theo chuẩn JWT 7519 | ✅ Đã sửa |
| 29/09 | 147 unit test **không bắt được** 2 lỗi trên vì bản giả (`FakeJwtTokenService` trả token giống nhau mọi lần, `FakePasswordHasher` so sánh chuỗi thuần) che mất đặc tính gây lỗi của hàm thật | Sửa bản giả sinh token khác nhau mỗi lần; dùng `TokenHasher` thật trong test nghiệp vụ; bổ sung test bắt đúng 2 lỗi trên | ✅ Đã sửa |
| 29/09 | PowerShell 5.1: JSON trong script bọc bằng **dấu nháy đơn** thì backtick thành ký tự thật → body hỏng, 6 ca trả 400 nhầm là lỗi code | Bọc **dấu nháy kép** với backtick (`` `{``"fullName`":...} ``) | ✅ Đã sửa |
| 29/09 | Ca kiểm thử tự vô hiệu mà không nhận ra: `$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())` gọi ở từng dòng → email lệch nhau vài giây, ca "trùng email" luôn trả 201 | Tính hậu tố **một lần** ở đầu script rồi dùng lại; khai báo biến **trước** chỗ dùng (PowerShell chạy tuần tự từ trên xuống) | ✅ Đã sửa |
| 30/09 | **Lỗi**: bấm "Đổi mật khẩu" / "Đăng xuất" báo "Đã xảy ra lỗi" dù server đã cập nhật `PasswordHash` thành công (log có `UPDATE`, không có exception) | `bocDuLieu()` coi `data === null` là lỗi, nhưng `logout` và `change-password` trả `ApiResponse<object>.Success(...)` — **không có data, tức `data` là `null` cả khi thành công**. Tách `kiemTraThanhCong()` cho endpoint không mang dữ liệu; cho `layThongBaoLoi()` trả `error.message` khi lỗi nội bộ | ✅ Đã sửa |
| 30/09 | Cổng 5173 bị **pm2** chiếm cho project khác (`cook-web`) nên gọi `/api/...` qua Vite trả 404 rỗng, trong khi gọi thẳng 5080 thì 200 | Chuyển Vite sang cổng 5174 kèm `strictPort: true`; thêm 5174 vào danh sách CORS server. Không tắt process của người dùng | ✅ Đã sửa |
| 30/09 | 2 warning React Router v6 (future flags) lặp lại trong console mỗi lần tải trang | Bật `future={{ v7_startTransition, v7_relativeSplatPath }}` cho `BrowserRouter` | ✅ Đã sửa |
| 30/09 | Script kiểm thử tay backend ở lượt trước **làm bẩn dữ liệu mẫu**: `khach1` đổi tên thành "Khach Thu Doi Email", `khach2` thành "Admin Doi Quyen", refresh token còn treo trong CSDL | Khôi phục qua chính API `PUT /profile` (tránh lỗi encoding khi gõ SQL tiếng Việt) rồi `POST /logout` để xoá refresh token; xoá tài khoản test `kieuthu123@gmail.com`; kiểm tra lại CSDL khớp `DuLieuMau.cs` | ✅ Đã sửa |
| 30/09 | Ảnh chụp màn hình lúc kiểm thử tay lọt vào `.openchamber/` chưa bị `.gitignore` chặn, có nguy cơ commit nhầm vào repo | Thêm `.openchamber/` vào `.gitignore` nhóm "Công cụ hỗ trợ" | ✅ Đã sửa |

> Ghi lại ở đây, cuối kỳ dùng làm cơ sở cho phần "Hạn chế" và "Bài học kinh nghiệm" trong Kết luận.
