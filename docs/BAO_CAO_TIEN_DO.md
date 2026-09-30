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
| | 6 | Xem địa điểm | ✅ 3/3 (HP/EC/AB) | +14 | ✅ Xong (30/09) |
| | 7 | Tìm kiếm & lọc phòng | ✅ 3/3 (HP/EC/AB) | +16 | ✅ Xong (30/09) |
| | 8 | Chi tiết phòng | ✅ 3/3 (HP/EC/AB) | +10 | ✅ Xong (30/09) |
| | 9 | Kiểm tra phòng trống | ✅ 3/3 (HP/EC/AB) | +22 | ✅ Xong (30/09) |
| | 10 | Đặt phòng theo giờ / ngày | ✅ 3/3 (HP/EC/AB) | +61 | ✅ Xong (30/09) |
| | 11 | Đơn của tôi, hủy đơn, lịch sử | ✅ 3/3 (HP/EC/AB) | +54 | ✅ Xong (30/09) |
| 30/09 | 12 | **Admin quản lý danh mục** (Cơ sở / Phòng / Khách hàng) | ✅ 3/3 mỗi API + 3/3 trên trình duyệt | **288 pass (thêm 50)** | ✅ Xong (30/09) |
| | 13 | Admin: xác nhận/check-in/check-out | ✅ API 9/9 + vệ sinh 6/6 + UI 4/4 | **312 pass (thêm 24)** | ✅ Xong (30/09) |
| | 14 | Admin: khóa tài khoản khách | ✅ 6/6 (khoá → 403 → mở khoá → đăng nhập lại) | giữ nguyên 312 | ✅ Xong (30/09) |
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
| 30/09 | **Sự cố bảo mật:** repo GitHub **từng là public**, mà `appsettings.Development.json` (chứa khoá JWT) đã bị commit ở 3 commit nên khoá nằm trong lịch sử git. `git rm --cached` ở Bước 5 chỉ chặn file mới, **không gỡ được bản đã commit** | Sinh khoá mới bằng `RandomNumberGenerator` (48 byte, không dùng `Guid`/`Get-Random`), ghi đè `Jwt.Secret`, **khởi động lại API** (vì `IOptions` chỉ đọc lúc khởi động). Kiểm chứng 5/5 ca: token khoá mới 200, chữ ký sai 401, không token 401, sai mật khẩu 401, logout `data=null` | ✅ Đã sửa |
| 30/09 | `appsettings.json` (file **được commit**) chứa `Password=stayeasy***` của MySQL — cũng đã public | Chuyểa chuỗi kết nối sang `appsettings.Development.json` (gitignore sẵn), để lại dòng chú thích trong `appsettings.json`, thêm giá trị mẫu vào file `.example.json`. Không ảnh hưởng unit test vì test dùng `InMemoryDatabase` | ✅ Đã sửa |
| 30/09 | Script kiểm chứng báo FAIL 1 ca dù log server đã trả 401 đúng | Lỗi ở **chính script**: `$kyCu[-1]` là chỉ số âm trên `String`, PowerShell 5.1 trả `$null` nên nhánh sửa ký tự rơi nhầm, đôi khi token **không bị hỏng** nên server trả 200. Sửa thành `$kyCu[$kyCu.Length - 1]` | ✅ Đã sửa |

> Ghi lại ở đây, cuối kỳ dùng làm cơ sở cho phần "Hạn chế" và "Bài học kinh nghiệm" trong Kết luận.
| 30/09 | Script kiểm chứng báo FAIL 1 ca dù log server đã trả 401 đúng | Lỗi ở **chính script**: `$kyCu[-1]` là chỉ số âm trên `String`, PowerShell 5.1 trả `$null` nên nhánh sửa ký tự rơi nhầm, đôi khi token **không bị hỏng** nên server trả 200. Sửa thành `$kyCu[$kyCu.Length - 1]` | ✅ Đã sửa |
| 30/09 | **Cài Vitest** cho frontend. `vitest@2.1.9` chọn vì khai báo `dependencies.vite: ^5.0.0` khớp đúng Vite 5.4.8. `vitest` 4.x và 5.x đòi Vite 6+ nên loại. Kèm `jsdom@26.1.0`, `@testing-library/react@16.3.3`, `@testing-library/dom@10.4.2`, `@testing-library/jest-dom@6.9.1` (bỏ 6.10.0 vì npm cảnh báo đây là bản phát hành lỗi) | ✅ Xong (30/09) |
| 30/09 | **Lỗi thật do unit test phát hiện:** `lamMoiToken()` khi không có refresh token thì `return false` mà quên `xoaPhien()`. Hậu quả: access token đã hết hạn vẫn còn trong store, `daDangNhap` vẫn `true`, `ProtectedRoute` vẫn cho vào trang nhưng mọi request đều 401 — người dùng bị kẹt ở trang không dùng được mà không hiểu vì sao | Thêm `xoaPhien()` vào nhánh đó. Đây là ca thứ hai kiểm thử tay không bắt được (lần đầu là `bocDuLieu`) | ✅ Đã sửa |
| 30/09 | **Loi nghiep vu that do quet code phat hien:** nhap mat khau 150 ky tu doc *Mat khau phai co it nhat 6 ky tu*. Sua trong Service + 3 unit test goi thang Service -> 3/3 xanh, nhung goi API that van tra thong bao cu. Nguyen nhan goc: [ApiController] kiem ModelState TRUOC khi goi Service, va attribute [StringLength(100, MinimumLength = 6, ...)] chi mang MOT thong bao cho CA HAI rang buoc | Tach [MinLength] + [StringLength] trong AuthDtos.cs (moi rang buoc mot thong bao), them AuthDtoValidationTests.cs (13 ca) goi dung Validator.TryValidateObject. Kiem chung tren API that: 4 ca dung va khac nhau | Xong |
| 30/09 | **Quet code dot 1 (AGENTS.md 0.4b):** 47 file .cs + 25 file .ts/.tsx. Khong co ham vuot 40 dong (tru Program.cs 199 dong top-level). Khong co ny/TODO/console.log. Khong component TSX > 300 dong | Gop TokenValidationParameters 2 noi thanh TokenValidationFactory; 4 lan lap if user null thanh 2 helper; xoa ErrorCodes.cs + 2 hang so chet; sua comment RefreshTokenExpiresAt | Xem docs/BAO_CAO_QUET_CODE.md |
| 30/09 | Backend 147 -> 163 test (them 3 Service + 13 DTO validation). Frontend 60/60 giu nguyen | Build 0 warning 0 error. Da xac minh lai tren API that (thong bao + token) va CSDL demo sach | Tiep theo: Buoc 6 Xem dia diem |
| 30/09 | 6 | Xem dia diem: GET /api/locations (khong Id, kem phong tom tat) + trang /locations va /locations/:chiSo | 9/9 ca (HP/EC/AB), console sach, mobile 390px | Backend 10/10, frontend 87/87 (them 27) | Xong (30/09) |
| 30/09 | 7 | Tim kiem phong: GET /api/rooms/search (9 tham so) + trang /rooms (loc, sap xep, phan trang, STT lien tuc) | 11/11 ca, console sach, mobile 390px | Backend 15/15, frontend 111/111 (them 24) | Xong (30/09) |
| 30/09 | 8 | Chi tiet phong: mo rong response locations + route /locations/:csDiaDiem/rooms/:csPhong (anh lon, tien nghi, danh gia, khung chon ngay + gia tam tinh) | 8/8 ca, console sach, mobile 390px | Backend 32/32 (them 7), frontend 135/135 (them 24) | Xong (30/09) |
| 30/09 | 9 | Kiem tra phong trong: GET /api/rooms/availability (6 quy tac) + khung ngay bao trong/ban truc tiep | 8/8 ca, console sach, mobile 390px | Backend 17/17, frontend 143/143 (them 8) | Xong (30/09) |
| 30/09 | 10 | Dat phong theo gio/ngay: POST /api/bookings (transaction SERIALIZABLE, snapshot gia, lich su, ma HS-YYMMDD-XXXX) + trang /booking | 10/10 ca (2 tab chi 1 don), console sach, mobile 390px | Backend 27/27, frontend 160/160 (them 17) | Xong (30/09) |
| 30/09 | 11 | Don cua toi: GET /api/bookings/my, GET /api/bookings/{code}, POST /api/bookings/{code}/cancel + trang /bookings va /bookings/:code | 8/8 ca, console sach, mobile 390px | Backend 238/238, frontend 177/177 | Xong (30/09) |
| 30/09 | 12 | **Admin quan tri danh muc**: 3 bo API `/api/admin/{locations,rooms,customers}` (CRUD day du, chan xoa khi con phong/khong cho khoa admin) + 3 trang `/admin/{facilities,rooms,customers}` voi AdminLayout rieng | API 8/8 kich ban (HP/EC/AB); giao dien 3/3 (mo form + validate rong + xoa 2 buoc bi tu choi) | Backend **288/288** (them 50), frontend 177/177 giu nguyen | Xong (30/09) |
| 30/09 | 12 | **Phat hien loi cua lượt truoc (quan trong):** 22 anh trong `public/images/rooms/{cozy,japandi,signature}/` KHONG phai anh phong ma la poster quang cao cua du an khac ("Nha o Hem"). Da xem truc tiep `cozy-1.jpg`, `cozy-2.jpg`, `cozy-3.jpg`, `signature-1.jpg` de xac nhan | **Da sua xong:** 12 anh CC0 tu StockSnap (4 anh/concept) + logo ve bang SVG + sua anh hero va 3 dia chi trong footer; ghi nguon anh vao `docs/NGUON_ANH.md` | Xong (30/09) |
| 30/09 | 13 | **Admin vong doi don**: 4 endpoint `PATCH /api/admin/bookings/{code}/{confirm,reject,check-in,check-out}` (ma tran chuyen trang thai trong 1 cho, transaction SERIALIZABLE, ghi `BookingStatusHistory` kem admin id) + trang `/admin/bookings` voi loc trang thai / tu khoa, phan trang, 1 nut cho moi hanh dong hop le | API 9/9 kich ban (HP/EC/AB) + lich su trang thai kiem bang SQL; khoang ve sinh 2 gio 6/6 (job nen RoomCleaningJob tu chuyen CLEANING->AVAILABLE, chan dat phong dang ve sinh); giao dien 4/4 (xac nhan + validate tu choi + loc + don bi tu choi) | Backend **312/312** (them 24), frontend **198/198** (them 20) | Xong (30/09) |
