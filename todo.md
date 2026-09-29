# TODO — Hệ thống đặt phòng & quản lý homestay

> SV: Nguyễn Hải Nam — 12523W.1 · GVHD: TS. Hồng Quốc Việt
> Bắt đầu: 29/09/2026 · Dự kiến bảo vệ: ~20/10/2026
> Quy trình: xem `AGENTS.md` mục 0.1 · Lỗi ghi vào `lessons.md` · Tiến độ chi tiết ở `docs/BAO_CAO_TIEN_DO.md`

---

## Cách dùng file này

1. **Trước khi code** → viết mục tiêu đo được vào mục tương ứng.
2. **Trong lúc code** → tick `[x]` ngay khi xong mục đó, đừng để tới cuối.
3. **Xong một mục** → điền **Kết quả** + **Bằng chứng** (output lệnh, số test pass, ảnh chụp).
4. **Gặp lỗi** → ghi vào `lessons.md` ngay.
5. **Đi sai hướng** → dừng lại, sửa kế hoạch ở đây trước khi làm tiếp.

> Mục tiêu phải **đo được**. "Làm chức năng đặt phòng" là chưa đủ.
> "API từ chối đặt trùng lịch, chứng minh bằng 3 unit test chồng lấn khoảng thời gian" mới là mục tiêu.

---

## Giai đoạn 0 — Chuẩn bị

### [x] BƯỚC 1 — Cài môi trường
- **Mục tiêu đo được:** 5 lệnh sau đều in ra phiên bản:
  `dotnet --version` → `8.0.x` · `docker --version` · `docker compose version` · `node -v` · `git --version`
- **Ghi chú thực hiện:** .NET SDK vốn đã có sẵn ở `%LOCALAPPDATA%\Microsoft\dotnet` nhưng **chưa nằm trong PATH** → đã thêm vào user PATH. Không cần cài lại, không cần quyền Admin.
- **Kết quả:** Đủ 5/5 công cụ.
- **Bằng chứng:**
```
dotnet --version         8.0.425
docker --version         Docker version 29.6.2, build dfc4efb
docker compose version   Docker Compose version v5.3.1
node -v                  v24.14.0
npm -v                   11.19.0
git --version            git version 2.53.0.windows.1
```
> **Lưu ý:** mở terminal mới (hoặc restart VS Code) để `dotnet` dùng được trong PATH.
> Docker Desktop phải đang chạy mới `docker compose up` được.

### [x] BƯỚC 2 — Dựng khung project
- **Mục tiêu đo được:** `docker compose ps` có MySQL `running` · `dotnet build` thành công · `npm run build` thành công · có git repo riêng với 1 commit
- **Ghi chú thực hiện:**
  - `git init` riêng trong `Homestay` (không dùng repo cha `bai-tap-lon` vì đang lẫn đồ án 3).
  - Xóa container `stayeasy-mysql` cũ (đã `Exited(255)` từ hôm qua, tạo bằng `docker run` tay) để nhường tên + cổng 3307 cho dự án mới. **Không đụng `cookbook-mysql`** (dự án khác) vẫn chiếm 3306.
  - Dùng `create-vite@5.5.3` (không phải `@latest`) để sinh đúng React 18 + Vite 5 — tránh bẫy phiên bản.
  - API cổng **5080**; Vite proxy `/api` → 5080 để khỏi lỗi CORS.
- **Kết quả:** Khung chạy được. API trả HTTP 200, build sạch 0 warning.
- **Bằng chứng:**
```
docker ps (stayeasy-mysql)     Up (healthy)   0.0.0.0:3307->3306/tcp
dotnet build                   Build succeeded.  0 Warning(s)  0 Error(s)
dotnet test                    Passed!  Failed: 0, Passed: 1, Total: 1
npm run build                  built in 3.59s
npm run lint                   (không có cảnh báo)
API                            Now listening on: http://localhost:5080
GET /swagger/index.html        HTTP 200 (714 bytes)
```
Phiên bản thực tế đã cài: React 18.3.1 · Vite 5.4.21 · TS 5.9.3 · Tailwind 3.4.19 · Router 6.30.6 · Zod 3.25.76 · TanStack Query 5.104.0 · Zustand 5.0.15 · Axios 1.20.0 · RHF 7.89.0 · resolvers 3.10.0 · Recharts 2.15.4 · Pomelo 8.0.2

---

## Giai đoạn 1 — Cơ sở dữ liệu

### [ ] BƯỚC 3 — 9 bảng + project test
- **Mục tiêu đo được:** database `stayeasy` có đủ 9 bảng (`users`, `locations`, `rooms`, `room_images`, `amenities`, `room_amenities`, `bookings`, `booking_status_history`, `reviews`); có index trên `bookings(RoomId)`, `bookings(CheckIn,CheckOut)`, `bookings(Status)`; `StayEasy.Tests` chạy `dotnet test` ra 1 test mặc định pass
- **Ghi chú thực hiện:**
- **Kết quả:**
- **Bằng chứng:**

### [ ] BƯỚC 4 — Seed data
- **Mục tiêu đo được:** seed thành công 4 user · 3 location · 10 room · 8 amenity · 15 booking (đủ 6 trạng thái, rải nhiều tháng) · 6 review. Đăng nhập được `admin@stayeasy.vn` / `123456`
- **Ghi chú thực hiện:**
- **Kết quả:**
- **Bằng chứng:**

---

## Giai đoạn 2 — Tài khoản

### [ ] BƯỚC 5 — Đăng ký / đăng nhập / hồ sơ
- **Mục tiêu đo được:** 7 API xong (`register`, `login`, `refresh`, `logout`, `me`, `profile`, `change-password`) · **3/3 kịch bản test tay** theo `docs/KIEM_THU_TAY.md` mục 1 · **≥ 8 unit test pass** trong `AuthServiceTests`
- **Bằng chứng test:** `dotnet test --filter "Auth"` → `Passed! 8/8`
- **Ảnh chụp:** trang đăng nhập, trang hồ sơ
- **Ghi chú:**

---

## Giai đoạn 3 — Khách tìm kiếm & xem

### [ ] BƯỚC 6 — Xem địa điểm
- **Mục tiêu đo được:** `/api/locations` trả danh sách không có `Id` · trang danh sách + trang chi tiết địa điểm chạy được · 3/3 test tay
- **Bằng chứng:**
- **Ảnh chụp:**

### [ ] BƯỚC 7 — Tìm kiếm & lọc phòng
- **Mục tiêu đo được:** `/api/rooms/search` hỗ trợ 9 tham số lọc + phân trang · STT liên tục qua các trang · 3/3 test tay · **≥ 6 unit test** cho bộ lọc/sắp xếp
- **Bằng chứng:**
- **Ảnh chụp:** trang tìm kiếm

### [ ] BƯỚC 8 — Chi tiết phòng
- **Mục tiêu đo được:** trang chi tiết hiện đủ ảnh (bấm xem ảnh lớn) · tiện nghi · giá giờ/ngày · mô tả · đánh giá · khung chọn ngày
- **Bằng chứng:**
- **Ảnh chụp:**

---

## Giai đoạn 4 — Nghiệp vụ cốt lõi ⭐

### [ ] BƯỚC 9 — Kiểm tra phòng trống
- **Mục tiêu đo được:** `/api/rooms/{id}/availability` trả `isAvailable` + `reason` · kiểm tra đủ 6 quy tắc nghiệp vụ · **≥ 10 unit test** (trong đó bắt buộc có 3 test chồng lấn khoảng thời gian: chồng lấn, chạm biên, không chạm) · 3/3 test tay
- **Bằng chứng:** `dotnet test --filter "Availability"` → `Passed! 10/10`
- **Ghi chú:**

### [ ] BƯỚC 10 — Đặt phòng theo giờ / ngày ⭐
- **Mục tiêu đo được:**
  - Tính tiền đúng: theo giờ `số giờ × PricePerHour`, theo ngày `số ngày × PricePerDay` → **≥ 4 unit test**
  - Lưu `PricePerHourSnapshot` / `PricePerDaySnapshot` → **1 test** sửa giá phòng, đơn cũ giữ nguyên
  - Dùng **transaction** + ghi `BookingStatusHistory` → **1 test**
  - Đặt trùng trả HTTP **409**
  - Mã đơn `Code` dạng `HS-YYMMDD-XXXX`, giao diện **không hiển thị Id**
  - 3/3 test tay + 2 tab cùng đặt → chỉ 1 đơn được tạo
- **Bằng chứng:** `dotnet test --filter "Booking"` → `Passed! 15/15`
- **Ảnh chụp:** form đặt phòng theo ngày, theo giờ, kết quả tạo đơn

### [ ] BƯỚC 11 — Đơn của tôi, hủy đơn, lịch sử
- **Mục tiêu đo được:** `/api/bookings/my` chỉ trả đơn của chính mình (lấy `userId` từ token) · hủy đơn `PENDING`/`CONFIRMED` đưa phòng về `AVAILABLE` · từ chối hủy đơn `CHECKED_IN` · xem lịch sử trạng thái · 3/3 test tay
- **Bằng chứng:**
- **Ảnh chụp:**

---

## Giai đoạn 5 — Quản trị

### [ ] BƯỚC 12 — Admin quản lý danh mục
- **Mục tiêu đo được:** CRUD địa điểm · CRUD tiện nghi · CRUD phòng (kèm ảnh + gán tiện nghi + cập nhật trạng thái) · chặn xóa phòng/địa điểm đang có đơn hoặc đang có phòng · 3/3 test tay
- **Bằng chứng:**
- **Ảnh chụp:** bảng quản lý phòng, form thêm/sửa phòng

### [ ] BƯỚC 13 — Admin vòng đời đơn & phòng ⭐
- **Mục tiêu đo được:**
  - Đủ 6 chuyển trạng thái: `PENDING→CONFIRMED`, `→REJECTED`, `→CHECKED_IN`, `→COMPLETED`, `→CANCELLED`
  - Phòng: `AVAILABLE→BOOKED→OCCUPIED→CLEANING→(2h)→AVAILABLE` và `→MAINTENANCE`
  - Mỗi lần đổi trạng thái ghi 1 dòng `BookingStatusHistory` (có `ChangedBy`)
  - **Chặn đặt phòng trong 2 giờ vệ sinh** → **1 unit test**
  - Ma trận chuyển trạng thái hợp lệ/không hợp lệ → **≥ 8 unit test**
  - Chạy trọn 1 vòng đời thật, 3/3 test tay
- **Bằng chứng:** `dotnet test --filter "Status"` → `Passed! 8/8`
- **Ảnh chụp:** màn hình quản lý đơn, nút xác nhận / check-in / check-out

### [ ] BƯỚC 14 — Admin khóa tài khoản khách
- **Mục tiêu đo được:** khóa → khách đăng nhập bị từ chối với thông báo rõ ràng · mở khóa → đăng nhập lại được
- **Bằng chứng:**

---

## Giai đoạn 6 — Thống kê & đánh giá

### [ ] BƯỚC 15 — Dashboard thống kê
- **Mục tiêu đo được:** 6 số liệu (tổng quan · doanh thu theo tháng · số đơn theo tháng · tỷ lệ lấp đầy · top 5 phòng · tỷ lệ trạng thái) · số liệu khớp với database · biểu đồ vẽ đúng
- **Bằng chứng:** đối chiếu tay 1 số liệu doanh thu với truy vấn SQL trực tiếp
- **Ảnh chụp:** dashboard

### [ ] BƯỚC 16 — Đánh giá & nhận xét
- **Mục tiêu đo được:** chỉ đánh giá được đơn `COMPLETED` · 1 đơn 1 đánh giá (unique index) · cập nhật `RatingAvg`/`RatingCount` → **≥ 3 unit test** · Admin ẩn/xóa được
- **Bằng chứng:**
- **Ảnh chụp:** form đánh giá, danh sách đánh giá trong admin

---

## Giai đoạn 7 — Hoàn thiện & kiểm thử

### [ ] BƯỚC 17 — Responsive + Loading/Error/Empty + Toast
- **Mục tiêu đo được:** mọi trang dùng được ở 375px · mọi danh sách có đủ 3 trạng thái · 7/7 test tay mục 9 của `docs/KIEM_THU_TAY.md`
- **Bằng chứng:** ảnh chụp 2 trang ở khung 375px

### [ ] BƯỚC 18 — 18 test case tích hợp (Postman)
- **Mục tiêu đo được:** `docs/api/postman_collection.json` có **≥ 18 request** · chạy lại được, **≥ 17/18 đạt** · đặc biệt 3 test chứng minh chống đặt trùng · có ảnh kết quả cho báo cáo
- **Bằng chứng:** ảnh Postman + bảng kết quả

### [ ] BƯỚC 19 — 22 hình cho Chương 3 của báo cáo
- **Mục tiêu đo được:** chèn đủ 22 hình (3.1–3.22), **không còn dòng "Hình 3.x" nào trống** · ảnh chụp phải là của hệ thống đang chạy
- **Tiến độ:** ____ / 22 hình
- **Bằng chứng:** ảnh chụp màn hình báo cáo

### [ ] BƯỚC 20 — Viết Chương 4
- **Mục tiêu đo được:** đủ 17 ảnh chức năng + bảng 18 test case + phần đóng gói & triển khai · **xong trước ngày 15/10**
- **Tiến độ:** ____ / 17 mục
- **Bằng chứng:** file Word đầy đủ

### [ ] BƯỚC 21 — Kết luận, TLTK, slide, luyện trình bày
- **Mục tiêu đo được:** Kết luận có 4 phần (tóm tắt · ưu điểm · hạn chế · hướng phát triển) · slide 15–20 trang · luyện nói **≥ 3 lần**, mỗi lần **≤ 15 phút** (có ghi giờ)
- **Bằng chứng:** ghi lại thời gian từng lần luyện

---

## Mốc cứng (deadline)

| Mốc | Hạn | Trạng thái |
|-----|-----|-----------|
| Xong Bước 1–4 (môi trường + CSDL) | 01/10 | ⬜ |
| Xong Bước 5 (tài khoản) | 02/10 | ⬜ |
| Xong Bước 11 (khách đặt phòng xong) | 06/10 | ⬜ |
| Xong Bước 16 (hết tính năng) | 11/10 | ⬜ |
| Xong Bước 18 (kiểm thử) | 12/10 | ⬜ |
| **Xong Chương 4** | **15/10** | ⬜ |
| Xong slide + Kết luận | 17/10 | ⬜ |
| Luyện trình bày xong | 19/10 | ⬜ |
| Bảo vệ | ~20/10 | ⬜ |

> **Từ 15/10 trở đi không code thêm tính năng mới.** Chỉ sửa lỗi và luyện trình bày.

---

## Danh sách cắt được (nếu trượt tiến độ)

| Thứ tự | Cắt gì | Bước liên quan |
|--------|--------|---------------|
| 1 | Quản lý tài khoản khách | Bước 14 |
| 2 | Quản lý tiện nghi riêng (gộp vào form phòng) | Bước 12 |
| 3 | Bảng lịch trạng thái phòng theo ngày | Bước 13 |
| 4 | Tỷ lệ lấp đầy | Bước 15 |
| 5 | Trạng thái `MAINTENANCE` | Bước 13 |
| 6 | Ẩn/xóa đánh giá (chỉ cho xem) | Bước 16 |

**Không bao giờ cắt:** Bước 5 · 7 · 8 · 9 · 10 · 11 · 13 (vòng đời) · 12 (quản lý phòng) · 15 (thống kê) · 18 (kiểm thử) · 19–20 (báo cáo)
