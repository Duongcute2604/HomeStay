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

### [x] BƯỚC 3 — 9 bảng + project test
- **Mục tiêu đo được:** database `stayeasy` có đủ 9 bảng; index trên `bookings(RoomId)`, `bookings(CheckIn,CheckOut)`, `bookings(Status)`; `dotnet test` xanh
- **Ghi chú thực hiện:**
  - **3 quyết định đã hỏi và được duyệt:** enum lưu **dạng chữ** (`varchar(20)`) · tên bảng **PascalCase số nhiều** (`RoomImages`) · **không** thêm cột `is_deleted` (xoá thật).
  - Cột tiền dùng `decimal(18,2)`; `RatingAvg` dùng `decimal(3,2)`.
  - **Không tạo bảng `payments` / `notifications`** — nằm ngoài phạm vi, để Bước 22/23.
  - **Không lưu cột `Units` (số giờ/ngày)** trong `Bookings` — suy ra được từ `CheckIn`/`CheckOut`, lưu thêm là tạo chỗ hai nơi có thể mâu thuẫn.
  - Ràng buộc nghiệp vụ đẩy xuống CSDL bằng **CHECK constraint** (6 ràng buộc) thay vì chỉ kiểm tra trong C#.
  - **"1 đơn 1 đánh giá"** dựng bằng `UNIQUE(Reviews.BookingId)`, không kiểm tra bằng code — code có lỗ hổng khi 2 người gửi cùng lúc.
  - `CreatedAt`/`UpdatedAt` do `DbContext` tự điền lúc `SaveChanges`, không bắt service nào phải nhớ set.
  - Gỡ endpoint mẫu `/weatherforecast` của template .NET (code chết).
  - `EFCore.Design` và `EFCore.InMemory` hạ từ **8.0.10 → 8.0.2** để khớp Pomelo 8.0.2 (xem `lessons.md` mục 15).
- **Kết quả:** 9 bảng trong MySQL · 11 khoá ngoại · 6 CHECK constraint · 27 unit test xanh · build 0 warning · app khởi động log sạch.
- **Bằng chứng:**
```
SHOW TABLES           Amenities, BookingStatusHistory, Bookings, Locations,
                      Reviews, RoomAmenities, RoomImages, Rooms, Users
DESCRIBE Bookings     Code=varchar(20) UNI · Status=varchar(20) MUL
                      CheckIn=datetime(6) MUL · RoomId MUL · UserId MUL
                      TotalAmount/PricePerHourSnapshot/PricePerDaySnapshot = decimal(18,2)
FK                    11 khoá ngoại đúng quan hệ đã thiết kế

dotnet build          Build succeeded.  0 Warning(s)  0 Error(s)
dotnet test           Passed!  Failed: 0, Passed: 27, Total: 27
dotnet run            Now listening on: http://localhost:5080  (không có fail/warn)
```
**Test tay 3 kịch bản** (chạy trực tiếp SQL trên MySQL, xem `docs/KIEM_THU_TAY.md` mục 0):

| # | Loại | Kịch bản | Kết quả thực tế |
|---|------|----------|------------------|
| 1 | Happy path | Tạo 9 bảng, thêm User/Location/Room/Booking hợp lệ | ✅ 9/9 bảng, enum hiện `CUSTOMER`/`PENDING` đọc được bằng mắt |
| 2 | Edge case | Thêm 2 tài khoản trùng email `khach1@gmail.com` | ✅ `ERROR 1062 Duplicate entry ... key 'Users.IX_Users_Email'` |
| 3 | Bất thường | Trả phòng trước khi nhận (`CheckOut < CheckIn`) | ✅ `ERROR 3819 Check constraint 'CK_Bookings_TimeRange' is violated` |
| 3b | Bất thường | Đánh giá 7 sao (ngoài khoảng 1–5) | ✅ `ERROR 3819 Check constraint 'CK_Reviews_Rating' is violated` |
| 3c | Bất thường | Đánh giá lần 2 cho cùng 1 đơn | ✅ `ERROR 1062 Duplicate entry '1' for key 'Reviews.IX_Reviews_BookingId'` |
| 3d | Bất thường | Gán cùng 1 tiện nghi cho 1 phòng 2 lần | ✅ `ERROR 1062 Duplicate entry '1-1' for key 'RoomAmenities.PRIMARY'` |

> **27 unit test chia làm 2 nhóm** (tách file theo trách nhiệm):
> - `StayEasyDbContextModelTests` — 22 test kiểm tra **cấu hình**: đủ 9 bảng, tên bảng, 6 enum lưu dạng `varchar(20)`, unique index (Email/Code/BookingId), index chống trùng lịch, khoá chính ghép, 6 CHECK constraint.
> - `StayEasyDbContextDataTests` — 5 test kiểm tra **ghi/đọc dữ liệu**: lưu đồ thị quan hệ đầy đủ, cascade delete, tự điền mốc thời gian.
>
> **Hai file dùng lại cho mọi test sau:** `Helpers/TestDbContextFactory.cs` + `Common/TestDataBuilder.cs`.
> Dữ liệu test trong MySQL đã dọn sạch sau khi kiểm thử (3 bảng đếm 0).

### [x] BƯỚC 4 — Seed data
- **Mục tiêu đo được:** seed thành công 4 user · 3 location · 10 room · 8 amenity · 15 booking (đủ 6 trạng thái, rải nhiều tháng) · 6 review. Đăng nhập được `admin@stayeasy.vn` / `123456`
- **Kế hoạch thực hiện (ghi trước khi code):**
  1. **Thêm package `BCrypt.Net-Next` 4.2.1** — bắt buộc, vì `AGENTS.md` mục 6.6 bắt buộc mật khẩu lưu dạng BCrypt hash, seed phải tạo ra hash thật chứ không phải chuỗi giả. Bản 5.0.0 chỉ là prerelease → không dùng.
  2. **Tạo 8 ảnh SVG** trong `client/public/images/` (4 loại phòng + 3 địa điểm + 1 ảnh nội thất chung) vì máy không có sẵn ảnh phòng thật. SVG sinh bằng code ⇒ không tốn dung lượng, không lẫn file nhị phân vào git.
  3. Viết `Data/Seed/SeedData.cs` với **2 hàm độc lập**: `SeedAsync` (tạo dữ liệu) và `KiemTraDaCoDuLieu` (đã có dữ liệu chưa) — tách để test được riêng.
  4. **Seed phải idempotent**: kiểm tra `Users.AnyAsync()` rồi mới ghi. Chạy lại app không nhân bản dữ liệu.
  5. Gọi seed trong `Program.cs` bằng `CreateScope()` — tránh singleton giữ DbContext.
  6. Mốc thời gian `CreatedAt` của booking **phải rải nhiều tháng** (từ 08/2026 tới 09/2026) để biểu đồ doanh thu ở Bước 15 có dữ liệu thật, không phải 1 cột.
- **Kết quả:**
  1. `DuLieuMau.cs` (507 dòng) chứa toàn bộ dữ liệu mẫu dạng hàm thuần — trả về `List<T>`, **không** chạm database ⇒ test được không cần MySQL.
  2. `SeedData.SeedAsync` tự kiểm idempotent **bên trong** hàm, gắn hết vào DbContext rồi `SaveChanges` **một lần** để EF tự chèn theo đúng thứ tự khoá ngoại.
  3. **Tách 2 file ra khỏi seed** để tái dùng cho Bước 9/10: `Services/Booking/BookingRules.cs` (hằng số: tối thiểu 3 giờ, báo trước 2 giờ, dọn phòng 2 giờ, giờ nhận/trả 14h/12h) + `BookingCalculator.cs` (hàm thuần tính tiền theo giờ/ngày).
  4. `Program.cs` gọi seed trong block `CreateAsyncScope` — dùng scope thay vì singleton để không giữ `DbContext` sống quá lâu.
  5. 8 ảnh SVG sinh bằng code, UTF-8 có dấu, đặt đúng chỗ: `client/public/images/rooms/` (5 ảnh) + `locations/` (3 ảnh).
  6. Dữ liệu: 4 user (1 ADMIN + 3 CUSTOMER, trong đó 1 tài khoản `LOCKED`) · 3 địa điểm · 8 tiện nghi · 10 phòng (đủ 4 loại + đủ 5 trạng thái) · 59 liên kết tiện nghi · 20 ảnh phòng · 15 đơn (đủ 6 trạng thái) · 42 dòng lịch sử trạng thái · 6 đánh giá (1 đánh giá bị ẩn) · điểm phòng tính lại từ đánh giá chưa ẩn.
  7. Ngày tháng **tương đối so với `DateTime.Now`** thay vì ghi cứng ⇒ dữ liệu demo luôn "sống" dù GVHD chạy demo vào ngày nào.
  8. Tài khoản demo: `admin@stayeasy.vn` · `khach1@gmail.com` · `khach2@gmail.com` · `khach3@gmail.com` — mật khẩu đều `123456`.
- **Bằng chứng:**
  | Loại | Kết quả |
  |------|---------|
  | Build | `dotnet build` — **0 error, 0 warning** |
  | Unit test | `dotnet test` — **55/55 PASS** (27 cũ + 7 `BookingCalculatorTests` + 21 `SeedDataTests`), 17 giây |
  | Test tay | `docs/KIEM_THU_TAY.md` mục **0b** — **17/17 đạt** (11 kịch bản HP lần 1, 3 kịch bản AB lần 2, 3 kịch bản EC lần 3) |
  | Log sạch | Log lần 1 & lần 3: 731 dòng, chỉ có `Now listening` / `Application started` — không `fail:`, không `Exception`. Log lần 2: **14 dòng, 0 lệnh `INSERT INTO`**, chỉ 1 lệnh `SELECT` kiểm tra `Users.AnyAsync` |
  | MySQL thật | Đếm bản ghi 9 bảng khớp: `4/3/10/8/59/20/15/42/6`; 4 hash BCrypt khác nhau (`$2a$11$`, 60 ký tự); 10 truy vấn kiểm tra ràng buộc nghiệp vụ đều trả **0 vi phạm** |

---

## Giai đoạn 2 — Tài khoản

### [x] BƯỚC 5 — Đăng ký / đăng nhập / hồ sơ · **XONG 30/09/2026** (Backend 29/09 · giao diện 30/09)
- **Mục tiêu đo được:** 7 API xong (`register`, `login`, `refresh`, `logout`, `me`, `profile`, `change-password`) · **3/3 kịch bản test tay** theo `docs/KIEM_THU_TAY.md` mục 1 · **≥ 8 unit test pass** trong `AuthServiceTests`
- **Kết quả đo được:**
  - 7/7 API hoàn chỉnh
  - Test tay: **51/51 ca đúng mã lỗi** (7 HP + 8 EC + 36 AB), ghi ở `docs/KIEM_THU_TAY.md` mục 1A
  - Unit test: `dotnet test` → **`Passed! 147/147`** (thêm 92 so với 55 của Bước 4)
  - `dotnet build --no-incremental` → **0 error 0 warning**
  - Migration `20260929163853_AddRefreshTokenToUsers` đã apply lên MySQL thật
- **Ảnh chụp:** Swagger UI — màn hình `POST /api/auth/login` (bấm Try it out) + màn hình response 401 khi sai mật khẩu
- **Ghi chú:** Phần **Backend** làm lượt 29/09, phần **giao diện** làm lượt 30/09 (16 file, xem mục "PHẦN 2" bên dưới). Cả hai lượt đều theo đủ 6 bước trong `AGENTS.md` mục 0.

#### Bằng chứng cụ thể (không phải "tôi nghĩ là xong")

| Hạng mục | Kết quả thật |
|----------|--------------|
| `dotnet build --no-incremental` | `0 Warning(s)` · `0 Error(s)` |
| `dotnet test` | `Passed! - Failed: 0, Passed: 147, Skipped: 0, Total: 147` |
| Test tay — kịch bản 1 (HP) | 1.1–1.7 đều `201`/`200` |
| Test tay — kịch bản 2 (EC) | 2.1–2.7 `201` · 2.8 `409` |
| Test tay — kịch bản 3 (AB) | 3.1–3.41 đúng mã lỗi mong đợi, **0 sai** |
| Log server | Không có exception, không có lỗi lặp lại |
| Dữ liệu sau khi test | Đã xoá tài khoản test, chỉ còn 4 tài khoản demo |

#### 2 lỗ hổng phát hiện khi kiểm thử tay (đã sửa — xem `lessons.md` mục 20–21)

| Lỗi | Biểu hiện | Nguyên nhân gốc | Cách sửa |
|------|-----------|-----------------|----------|
| Refresh token cũ vẫn dùng được sau khi máy khác đăng nhập | Test tay 3.27 trả `200` thay vì `401` → giới hạn "1 tài khoản 1 phiên" ghi trong báo cáo là vô hiệu | Refresh token dài ~196 ký tự nhưng băm bằng **BCrypt** — BCrypt chỉ xét **72 byte đầu**, nên hai token khác nhau ở phần cuối cho **cùng một hash** | Tách `ITokenHasher` (SHA-256) khỏi `IPasswordHasher` (BCrypt). Thêm 2 file `ITokenHasher.cs` + `TokenHasher.cs`. Cột `RefreshTokenHash` giữ nguyên `varchar(100)` (SHA-256 hex = 64 ký tự) — **không cần migration mới** |
| Hai lần đăng nhập trong cùng giây cho token giống hệt nhau | Làm mới phiên không đổi được token → token bị đánh cắp không bị vô hiệu | JWT chỉ chứa `userId` + `exp` (tính theo giây), thiếu mã định danh duy nhất | Thêm claim `jti` = `Guid.NewGuid()` vào refresh token (chuẩn JWT 7519 mục 4.1.7) |

> ⚠️ **147 unit test cũ KHÔNG bắt được 2 lỗi này** — vì `FakeJwtTokenService` trả về token
> giống nhau mọi lần gọi, còn `FakePasswordHasher` so sánh chuỗi thuần: bản giả che mất
> đúng đặc tính gây lỗi của hàm thật. Đã sửa bản giả + bổ sung 2 test bắt đúng lỗi.
> Chi tiết: `lessons.md` mục 20.

#### 3 vấn đề khác đã xử lý trong lượt này

| Vấn đề | Cách xử lý |
|--------|------------|
| Body JSON hỏng trả `ProblemDetails` kèm lỗi kỹ thuật `.NET` ra ngoài | Kiểm key `ModelState` bắt đầu bằng `$` → trả thông báo chung; key là tên trường → trả đúng message tiếng Việt (`lessons.md` mục 23) |
| 401/403/404/415 trả về **không có body** → client đọc `message` ra `undefined` | Thêm `app.UseStatusCodePages` trả `ApiResponse` cho mọi mã lỗi không có body; gỡ khối 401/403 thủ công khỏi `ExceptionMiddleware` (tránh xử lý trùng ở 2 chỗ) |
| Cột `RefreshTokenHash` trong CSDL | SHA-256 hex = 64 ký tự, `varchar(100)` vẫn vừa nên **không cần migration mới** |

#### PHẦN 2 — GIAO DIỆN (lượt 30/09/2026) · 16 file · `npm run build` 0 lỗi

| Hạng mục | Kết quả thật |
|----------|--------------|
| `npm run build` | 0 lỗi TypeScript (chạy lại sau mọi lần sửa) |
| `npm run lint` | Sạch, không cảnh báo |
| Test tay trình duyệt | **18/20 ca đạt** — HP 6 · EC 8 · AB/bất thường 4 · 2 ca hoãn có lý do ghi rõ (`docs/KIEM_THU_TAY.md` mục 1B) |
| Console trình duyệt | **0 warning, 0 error** trong cả 3 kịch bản |
| Màn hình điện thoại 390px | Trang đăng ký 6 ô nhập nằm trọn, không tràn ngang |
| Quy tắc hiển thị | Không lộ `Id` nội bộ ở bất kỳ trang nào; số/tiền căn phải, chữ căn trái |
| `dotnet test` (chạy lại sau khi sửa CORS) | `Passed! 147/147` — không hỏng gì |
| Dữ liệu demo sau khi test | Đã khôi phục đúng 4 tài khoản gốc, mọi `RefreshTokenHash = NULL` |

**3 kịch bản test tay giao diện (bảng đầy đủ ở `docs/KIEM_THU_TAY.md` mục 1B):**

| Lần | Loại | Ví dụ đã chạy |
|-----|------|---------------|
| 1 | **Happy path** | Đăng ký tài khoản mới 1.1 · đăng nhập 1.2 · sửa hồ sơ 1.3 · đổi mật khẩu 1.4 · F5 giữ phiên 1.5 · đăng nhập Admin 1.6 |
| 2 | **Edge case** | Mật khẩu 5 ký tự 2.1 · xác nhận không khớp 2.2 · email trùng 2.3 · email sai định dạng 2.4 · sai mật khẩu hiện tại 2.5 · gõ thẳng `/profile` 2.6 · mở `/login` khi đã đăng nhập 2.7 · URL sai 2.8 |
| 3 | **Bất thường / người dùng khác** | Sai mật khẩu 3.1 · tài khoản bị khoá 3.2 · đăng xuất xoá cả hai phía 3.3 · điện thoại 390px 3.4 · không lộ Id 3.5 · console sạch 3.6 |

**3 lỗi phát hiện khi làm giao diện (đã sửa):**

| Lỗi | Biểu hiện | Nguyên nhân gốc | Cách sửa | Bài học |
|------|-----------|-----------------|----------|---------|
| Bấm "Đổi mật khẩu" / "Đăng xuất" báo "Đã xảy ra lỗi" | Server log cho thấy `UPDATE Users SET PasswordHash` **đã chạy thành công**, không có exception, nhưng giao diện báo lỗi và không chuyển trang | `bocDuLieu()` coi `data === null` là lỗi. Mà `logout` và `change-password` trả `ApiResponse<object>.Success(...)` — **không gán data**, nên `data` là `null` **cả khi thành công** | Tách `kiemTraThanhCong(response)` chỉ kiểm `success` cho endpoint không mang dữ liệu; `bocDuLieu` gọi hàm này rồi mới kiểm `data === null`. Thêm `error instanceof Error` vào `layThongBaoLoi` để lỗi nội bộ không bị nuốt | `lessons.md` mục 25 |
| Gọi `/api/...` qua Vite trả **404 rỗng**, gọi thẳng 5080 thì 200 | `npm run dev` báo "ready" nhưng form đăng nhập báo lỗi mạng | Cổng 5173 bị **pm2** (`cook-web` pid 14884) chiếm cho project khác. App lạ trả 404 cho mọi đường dẫn | Chuyển Vite sang **5174** kèm `strictPort: true`; thêm 5174 vào CORS server. **Không tắt process của người dùng** | `lessons.md` mục 27 |
| 2 cảnh báo React Router v6 lặp mỗi lần tải trang | Console có warning về `v7_startTransition`, `v7_relativeSplatPath` | React Router 6.28 cảnh báo sẵn cho phiên bản 7 | `<BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>` | — |

**Ghi chú quan trọng — 2 ca test tay hoãn, KHÔNG phải bỏ sót:**

| # | Kịch bản | Vì sao hoãn | Khi nào làm |
|---|----------|-------------|------------|
| H1 | Khách gõ thẳng URL `/admin` | **Chưa có route `/admin`** — thuộc Bước 14. `ProtectedRoute` đã viết sẵn tham số `yeuCauQuyen` | Bước 14 |
| H2 | Token hết hạn giữa chừng thì tự refresh | Cần ép access token hết hạn bằng cách sửa `localStorage`; công cụ kiểm thử trình duyệt ở đây không cho chạy lệnh trong trang. **Phía server đã kiểm chứng** ở mục 1A (refresh trả token khác token cũ) | Bước 14, khi có màn hình liên tục gọi API |

**File frontend đã tạo (16 file) — khác kế hoạch 14 file, thêm 2 vì tách bạch:**

| # | File | Vai trò | Ghi chú |
|---|------|---------|---------|
| 1 | `types/auth.ts` | Kiểu dữ liệu + `UserRole = { CUSTOMER: 0, ADMIN: 1 }` | BE serialize enum thành **số** (`role: 0`), FE tuyệt đối không so sánh chuỗi |
| 2 | `store/authStore.ts` | Zustand + persist `stayeasy.auth` | Token là dữ liệu phiên |
| 3 | `api/client.ts` | axios + interceptor + refresh 401 đúng 1 lần | Đọc token qua `useAuthStore.getState()` để không tạo vòng import |
| 4 | `services/authService.ts` | 7 hàm gọi API, không chứa JSX | Tách `bocDuLieu` / `kiemTraThanhCong` |
| 5 | `hooks/useAuth.ts` | Bọc store + service cho component | — |
| 6 | `components/common/Input.tsx` | Ô nhập có nhãn + lỗi a11y | — |
| 7 | `components/common/Button.tsx` | Nút có trạng thái loading | — |
| 8 | `components/common/FormMessage.tsx` | Dòng báo lỗi/thành công | — |
| 9 | `components/common/PageLayout.tsx` | Khung trang dùng chung | Tách riêng để 3 trang không lặp layout |
| 10 | `components/ProtectedRoute.tsx` | Chặn chưa đăng nhập + kiểm quyền | Generic nhận `yeuCauQuyen` |
| 11 | `pages/Home.tsx` | Trang chủ | — |
| 12 | `pages/Login.tsx` | Đăng nhập | React Hook Form + Zod |
| 13 | `pages/Register.tsx` | Đăng ký | 6 trường |
| 14 | `pages/Profile.tsx` | Hồ sơ + đổi mật khẩu | **Không tạo `utils/format.ts`** vì trang này không hiện tiền (YAGNI) |
| 15 | `pages/NotFound.tsx` | 404 | — |
| 16 | *Sửa* `App.tsx` + `main.tsx` | Router + provider | 5 route |

**Quyết định đã chốt trong lượt giao diện (30/09/2026):**

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Cổng dev Vite | **5174** kèm `strictPort: true` | 5173 do pm2 `cook-web` chiếm. `strictPort` để lỗi báo ngay thay vì tự nhảy 5175 gây rối |
| 2 | Bố cục hàm bóc dữ liệu | Tách `bocDuLieu` (có data) + `kiemTraThanhCong` (không data) | Nguyên lý SRP — 1 hàm 1 việc |
| 3 | Có cài vitest cho frontend không? | **Chưa quyết** — đã hỏi người dùng | `AGENTS.md` 1.3 cấm thêm package chưa có lý do rõ ràng. Logic nghiệp vụ tài khoản đã có 147 test backend |
| 4 | Có tạo `utils/format.ts` không? | **Không** | YAGNI — chỉ tạo khi có màn hình hiện tiền (Bước 10 trở đi) |


#### Quyết định đã chốt (29/09/2026)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Lưu refresh token | **Thêm 2 cột vào bảng `Users`**: `RefreshTokenHash` varchar(100), `RefreshTokenExpiresAt` datetime | Giữ đúng **9 bảng** đã duyệt ở Bước 3, mà `logout` vô hiệu hoá token thật được. Giới hạn: 1 tài khoản chỉ 1 phiên — ghi rõ trong báo cáo |
| 2 | Mã lỗi email | **Cả hai trả 409** — sai định dạng *và* trùng | Cả hai đều là "email này không dùng được". Vì vậy **không** dùng `[EmailAddress]` trên DTO (DataAnnotations ép 400), phải tự kiểm định dạng trong Service |
| 3 | Phạm vi lượt này | **Chỉ Backend.** Giao diện tách sang phiên chat sau | Nhanh hơn, kiểm chứng API bằng Swagger + unit test |
| 4 | Thời hạn token | Access **1 giờ**, Refresh **7 ngày** | Access ngắn để token bị lộ cũng hết hạn nhanh |

**Quy tắc mã lỗi rút ra (dùng nhất quán cho cả dự án):**
- `400` — lỗi **định dạng dữ liệu thuần**: thiếu trường bắt buộc, mật khẩu < 6 ký tự, mật khẩu ≠ xác nhận
- `409` — lỗi liên quan tới **giá trị** người dùng gửi lên: email sai định dạng, email trùng, mật khẩu mới trùng mật khẩu cũ

**Backend — 9 file mới + 4 file sửa:**

| # | File | Viết gì | Lý do cần |
|---|------|---------|-----------|
| 1 | `DTOs/ApiResponse.cs` | `{ success, message, data }` | Controller luôn trả về `ApiResponse<T>`, không trả entity thô (`AGENTS.md` 6.2). Dùng cho cả Bước 5 trở đi |
| 2 | `DTOs/AuthDtos.cs` | 6 request/response | **Không bao giờ** trả `PasswordHash` ra ngoài |
| 3 | `Common/ErrorCodes.cs` + `Common/AppException.cs` | Hằng số 400/401/403/404/409 + exception có mã | Controller không tự `if` từng lỗi |
| 4 | `Middleware/ExceptionMiddleware.cs` | Bắt mọi lỗi → trả format thống nhất, **không lộ stack trace** | `AGENTS.md` 6.5 |
| 5 | `Services/Auth/IAuthService.cs` + `AuthService.cs` | 7 hàm nghiệp vụ, **mỗi hàm ≤ 40 dòng** | Logic phải nằm trong Service mới test được (5.2) |
| 6 | `Services/Auth/IJwtTokenService.cs` + `JwtTokenService.cs` | Ký access + refresh, đọc secret từ `IOptions` | Không hardcode secret |
| 7 | `Services/Auth/IPasswordHasher.cs` + `PasswordHasher.cs` | Bọc `BCrypt.Net.BCrypt` | Test được mà không cần DB |
| 8 | `Services/Auth/EmailValidator.cs` | Regex kiểm định dạng email, hàm thuần | Quyết định #2 — trả 409 chứ không để DataAnnotations ép 400 |
| 8 | `Services/Auth/AuthRules.cs` | Hằng số: min 6 ký tự, độ dài access/refresh, giới hạn độ dài FullName | Không có magic number rải rác (DRY) |
| 9 | `Controllers/AuthController.cs` | 7 endpoint, chỉ validate + trả response | Cấm logic nghiệp vụ trong Controller (6.1) |
| 10 | *Sửa* `Entities/User.cs` + **migration mới** | + `RefreshTokenHash`, `RefreshTokenExpiresAt` | Quyết định #1 |
| 11 | *Sửa* `Program.cs` | JWT bearer, DI 4 interface, CORS, middleware | — |
| 12 | *Sửa* `appsettings.Development.json` | Khối `Jwt` (secret **chỉ** ở file này, file này gitignore) | Không commit secret (6.6) |

> ⚠️ `appsettings.Development.json` có secret JWT nên phải nằm trong `.gitignore`.
> Nhưng file này đã được commit ở Bước 2 → phải dùng `git rm --cached` và tạo
> `appsettings.Development.example.json` (giá trị mẫu, không phải secret thật) để người clone về chạy được.

**Frontend — 16 file (kế hoạch ban đầu 14 file, thêm 2 do tách bạch — xem bảng file thật ở PHẦN 2):**

> ⚠️ **Quyết định #3 ban đầu: lượt Backend CHƯA làm giao diện.** Phần giao diện đã làm xong
> ở lượt 30/09/2026. Danh sách dưới đây là **kế hoạch đã thực hiện**, giữ lại để đối chiếu.

| # | File | Viết gì |
|---|------|---------|
| 1 | `api/client.ts` | axios + interceptor gắn token + tự refresh khi 401 |
| 2 | `types/auth.ts` | Interface `User`, `AuthTokens`, `LoginRequest`… |
| 3 | `services/authService.ts` | Chỉ gọi API, **không** chứa JSX |
| 4 | `store/authStore.ts` (Zustand) | Token + thông tin user = **dữ liệu phiên** → Zustand (7.2) |
| 5 | `hooks/useAuth.ts` | Hook bọc store + `authService` |
| 6 | `components/ProtectedRoute.tsx` | Chặn khách vào `/admin` (kiểm `role === 'ADMIN'`) |
| 7–9 | `components/common/Input.tsx` · `Button.tsx` · `FormMessage.tsx` | Dùng chung, có nhãn + lỗi a11y |
| 10–12 | `pages/Login.tsx` · `Register.tsx` · `Profile.tsx` | React Hook Form + Zod, `z.infer` suy kiểu |
| 13 | *Sửa* `App.tsx` | Router + `<Route>` cho 3 trang + ProtectedRoute |
| 14 | *Sửa* `main.tsx` | Bọc `QueryClientProvider` + `BrowserRouter` |

**Unit test — dự kiến 16 test (bắt buộc có 4 cái AGENTS.md 5.4 liệt kê):**

| Nhóm | Test |
|-------|------|
| Đăng ký | email trùng → 409 · **email sai định dạng → 409** · mật khẩu < 6 ký tự → 400 · mật khẩu ≠ xác nhận → 400 · hash khác bản gốc · **user mới luôn `CUSTOMER`** (chống đăng ký thành admin) · response **không** chứa `PasswordHash` |
| Đăng nhập | **mật khẩu sai** → 401 · **email không tồn tại** → 401 (cùng thông báo, không lộ email nào tồn tại) · **tài khoản `LOCKED`** → 403 "Tài khoản đã bị khoá" · thành công → có access + refresh token |
| Token | access token chứa `role` + `exp` · thiếu `UserId` → ném lỗi |
| Refresh / Logout | refresh hợp lệ → cấp token mới · refresh sai → 401 · logout xoá hash trong DB |
| Đổi mật khẩu | mật khẩu cũ sai → 400 · mật khẩu mới trùng mật khẩu cũ → 409 · thành công → đăng nhận bằng mật khẩu mới được |
| Hồ sơ | tên rỗng → 400 · thành công → chỉ cập nhật tên/SĐT/địa chỉ, **không** đụng email/quyền/trạng thái |

**3 kịch bản test tay (bắt buộc khác nhau) — chạy trên Swagger UI + curl:**

| Lần | Loại | Kịch bản | Kỳ vọng |
|-----|------|----------|---------|
| 1 | **HP** | Đăng ký `haintest1@gmail.com` → đăng nhập → `me` → sửa hồ sơ → đổi mật khẩu → refresh → logout | 8 bước trả đúng 200/201, `me` **không** lộ `PasswordHash` |
| 2 | **EC** | ① email trùng ② email sai định dạng ③ mật khẩu 5 ký tự ④ sai mật khẩu ⑤ đăng nhập `khach3@gmail.com` (LOCKED) | ①②④⑤ → 409/403 · ③ → 400, thông báo tiếng Việt rõ ràng |
| 3 | **AB** | ① Gọi `/api/auth/me` không có token ② Refresh bằng token sai ③ Đăng nhập lại rồi dùng refresh token cũ đã logout | ①②③ → 401 (token đã bị vô hiệu hoá), **không** phải 500 |

**Ước lượng thực tế:** Backend ~2,5 giờ (đúng dự kiến) · Giao diện ~3 giờ (dự kiến 2 giờ, vượt vì phải sửa 3 lỗi phát hiện khi test tay). Tổng Bước 5: **~5,5 giờ**.


#### PHẦN 3 — UNIT TEST GIAO DIỆN (lượt 30/09/2026) · Vitest · **60/60 pass**

**Vì sao làm thêm phần này:** 147 unit test backend không bảo vệ được tầng giao diện,
và kiểm thử tay cũng không với tới được phần xử lý 401. Cài Vitest là để đóng đúng
khoảng trống đó.

**Phiên bản — chọn có căn cứ, không đoán (bài học `lessons.md` mục 9):**

| Package | Phiên bản | Căn cứ chọn |
|---------|-----------|------------|
| `vitest` | 2.1.9 | `dependencies.vite: ^5.0.0` — khớp đúng Vite 5.4.8 của dự án. **`vitest` 4.x và 5.x đòi Vite 6+ nên bị loại** dù là bản mới nhất |
| `jsdom` | 26.1.0 | `engines.node: >=18`, máy đang dùng Node 24 |
| `@testing-library/react` | 16.3.3 | `peerDependencies` chấp nhận React 18; cần `@testing-library/dom ^10` |
| `@testing-library/dom` | 10.4.2 | Bản mới nhất trong major 10, khớp peer của RTL 16 |
| `@testing-library/jest-dom` | 6.9.1 | Cài 6.10.0 trước, npm cảnh báo *"Incorrect minor release with breaking changes"* và chỉ định dùng 6.9.1 → đã hạ xuống 6.9.1 |

> Không cài `@testing-library/user-event` vì không test nào cần gõ phím vào ô — giữ
> đúng nguyên tắc YAGNI của `AGENTS.md` 3.4.

**5 file test · 60 ca · 5,8 giây:**

| File test | Số ca | Bảo vệ cái gì |
|-----------|-------|---------------|
| `schemas/authSchemas.test.ts` | 25 | Toàn bộ quy tắc kiểm dữ liệu: độ dài tối thiểu/tối đa, mật khẩu xác nhận khớp, lỗi gắn đúng ô. Gồm ca **"email sai định dạng thì KHÔNG báo lỗi"** để canh chỗ không ai thêm regex ở giao diện |
| `api/client.interceptor.test.ts` | 13 | Tầng xử lý 401: gắn token vào header, 400/403/404/409 để nguyên thông báo gốc, 401 thì refresh rồi thử lại bằng token **mới**, gom nhiều request 401 về 1 lần gọi refresh, cờ chống vòng lặp, 3 kiểu không refresh được đều phải xoá phiên |
| `services/authService.test.ts` | 10 | Ranh giới **endpoint có data / không có data**. 2 ca `dangXuat` và `doiMatKhau` được viết để **đỏ nếu ai đó gộp `bocDuLieu` với `kiemTraThanhCong` trở lại** |
| `api/client.test.ts` | 6 | `layThongBaoLoi`: 4 nhánh — có body / không có response / lỗi nội bộ / không phải `Error` |
| `components/ProtectedRoute.test.tsx` | 6 | Chặn trang: chưa đăng nhập, khách vào trang yêu cầu ADMIN, admin vào được, và thứ tự hai nhánh chặn |

**Bằng chứng:**

| Hạng mục | Kết quả |
|----------|---------|
| `npm test` | `Test Files 5 passed (5)` · `Tests 60 passed (60)` · 5,58 s |
| `npm run build` | `✓ 167 modules transformed` — 0 lỗi TypeScript (kể cả trong file test) |
| `npm run lint` | sạch |
| `dotnet test` | 147/147 — không hỏng gì |
| Test tay trình duyệt | 3/3 kịch bản sau khi tách schema: HP (đăng nhập) · EC (mật khẩu 5 ký tự + xác nhận không khớp) · AB (email trùng → 409 hiện đúng) |
| Ca H2 của kiểm thử tay | **Đã đóng** bằng 13 unit test — xem `docs/KIEM_THU_TAY.md` mục 1B |

**Lỗi thật do unit test phát hiện (đã sửa):**

| Lỗi | Vì sao kiểm thử tay không thấy | Đã sửa |
|------|----------------------------|--------|
| `lamMoiToken()` nhánh không có refresh token chỉ `return false`, **quên `xoaPhien()`** | Phải tạo ra trạng thái "có access token nhưng không có refresh token" — bình thường không xảy ra, và cả 51 ca kiểm thử tay phía API lẫn 18 ca trình duyệt đều không đụng tới | Thêm `xoaPhien()`. Không có nó thì `daDangNhap` vẫn `true`, `ProtectedRoute` vẫn cho vào trang nhưng mọi request đều 401 — người dùng bị kẹt ở trang không dùng được mà không hiểu vì sao |

**Tách bạch kèm theo — bắt buộc để test được, không phải refactor để đẹp:**

Các Zod schema trước đó nằm **ngay trong component** (`Login.tsx`, `Register.tsx`,
`Profile.tsx`) nên không test được. Đã gom ra `src/schemas/authSchemas.ts`. Ba lý do
ghi ngay đầu file đó:

1. **Test được** — hàm thuần, kiểm trực tiếp, không cần dựng trang (`AGENTS.md` 5.2).
2. **Không lặp** — quy tắc "họ tên tối đa 100 ký tự" nằm ở cả trang đăng ký lẫn trang
   hồ sơ; "mật khẩu 6–100 ký tự" nằm ở cả đăng ký lẫn đổi mật khẩu. Sửa một chỗ
   là phải sửa cả hai, và sửa sót thì hai màn hình báo hai kiểu (DRY).
3. **Một chỗ đối chiếu với server** — mọi số lấy từ `AuthDtos.cs`, đọc một file là biết
   giao diện cho phép bao nhiêu ký tự, không phải mở 3 file trang.

**Cấu hình đã thêm:**

| File | Nội dung |
|------|----------|
| `vite.config.ts` | `test` block; `defineConfig` chuyển từ `vite` sang `vitest/config` vì bản của Vite không khai báo trường `test` |
| `src/test/vitest.setup.ts` | Đăng ký matcher của jest-dom, `cleanup()` và xoá `localStorage` sau mỗi test |
| `package.json` | Thêm `"test": "vitest run"` và `"test:watch": "vitest"` |

**7 cảnh báo `npm audit` — CỐ Ý KHÔNG NÂNG PHIÊN BẢN, đã ghi rõ để bạn quyết:**

| Package | Mức | Nội dung | Vì sao không nâng |
|---------|-----|----------|------------------|
| `vitest` | critical | Đọc / chạy file tùy ý khi bật Vitest UI server | Bản vá nằm ở 5.x, mà 5.x đòi Vite 6+ |
| `vite` | high | Path traversal, `server.fs.deny` bypass trên Windows, NTLM hash disclosure | 5.4.21 **đã là bản mới nhất trong major 5** |
| `esbuild` | moderate | Website bất kỳ gửi request tới dev server | Cùng lý do |
| `react-router` / `react-router-dom` | moderate | Open redirect qua dấu `\` trong `<Link>` / `useNavigate` | 6.30.6 **đã là bản mới nhất trong major 6**, bản vá nằm ở 7.x |

Đánh giá rủi ro thực tế: `vite`, `esbuild`, `vitest` chỉ ảnh hưởng **máy phát triển của
tôi**, không nằm trong gói build đưa lên máy chủ. Lỗi `react-router` là lỗi runtime
nhưng dự án **không nhận đường dẫn từ người dùng** (không có `?redirect=` hay dữ liệu
từ query string) nên không có cách kích hoạt. Vẫn cần nói rõ với GVHD nếu hỏi tới.
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

## Giai đoạn 8 — PHẦN MỞ RỘNG (TUỲ CHỌN — chỉ làm nếu còn thời gian)

> ⚠️ **ĐÂY KHÔNG PHẢI PHẦN BẮT BUỘC.** Hai mục này **nằm ngoài phạm vi đã chốt** trong báo cáo.
> Chỉ bắt tay vào khi **Bước 1 → 21 đã xong hết** và còn **ít nhất 3 ngày** trước ngày bảo vệ.
> Nếu không đủ thời gian → bỏ luôn, **không phải làm nửa vời**.

> **Lưu ý báo cáo:** nếu làm 2 mục này thì **phải bổ sung mục vào báo cáo cho khớp**
> (bảng CSDL, sơ đồ Use Case, danh sách chức năng, ảnh chụp Chương 4).
> Làm mà không sửa báo cáo = **tự tạo mâu thuẫn**, tệ hơn là không làm.

### [ ] BƯỚC 22 — Thanh toán (mở rộng)
- **Điều kiện bắt đầu:** Bước 1–21 xong hết · còn ≥ 3 ngày · sẵn sàng sửa báo cáo
- **Phạm vi tối thiểu (KISS — KHÔNG làm cổng thanh toán thật):**
  - Bảng `payments` (id · booking_id · amount · method · status · paid_at)
  - `method`: `CASH` (tiền mặt) · `MOMO` · `BANK_TRANSFER` — **ghi nhận thủ công, không nối API thật**
  - `status`: `PENDING` · `PAID` · `FAILED`
  - Khách xem lịch sử thanh toán · Admin đánh dấu đã thu tiền
  - Dashboard: cột doanh thu **đã thu** tách khỏi tổng giá trị đơn
- **Mục tiêu đo được:** ≥ 3 unit test (đơn `COMPLETED` mới được đánh dấu `PAID` · không thu 2 lần · số tiền khớp `TotalAmount`)
- **Bằng chứng:**

### [ ] BƯỚC 23 — Thông báo trong hệ thống (mở rộng)
- **Điều kiện bắt đầu:** Bước 22 xong **hoặc** còn ≥ 3 ngày
- **Phạm vi tối thiểu:**
  - Bảng `notifications` (id · user_id · title · content · is_read · created_at)
  - **Trong ứng dụng** (in-app), KHÔNG gửi email/SMS thật
  - Tự sinh thông báo khi: Admin xác nhận / check-in / check-out / từ chối đơn
  - Icon chuông trên header + số badge chưa đọc + trang danh sách thông báo
- **Mục tiêu đo được:** 1 thông báo sinh đúng khi đổi trạng thái đơn · đánh dấu đã đọc hoạt động · ≥ 2 unit test
- **Bằng chứng:**

### Thứ tự ưu tiên nếu chỉ đủ làm 1 cái
| Ưu tiên | Mục | Vì sao |
|---|---|---|
| 1 | **Bước 23 Thông báo** | Ít code hơn, thấy rõ trên giao diện, **không sinh mâu thuẫn với báo cáo** vì thông báo vốn đã được báo cáo nhắc tới |
| 2 | Bước 22 Thanh toán | Phải sửa báo cáo nhiều hơn (bảng mới, thay đổi luồng đặt phòng) |

> **Khuyến nghị thật lòng:** cả 2 mục này đều **đáng giá cho phần "hướng phát triển"** trong Kết luận hơn là làm thật.
> Viết *"hệ thống đã hỗ trợ sẵn cấu trúc cho thanh toán và thông báo, phát triển trong tương lai"* — thầy chấp điểm cho câu đó, mà không tốn giờ làm.

---

## Mốc cứng (deadline)

| Mốc | Hạn | Trạng thái |
|-----|-----|-----------|
| Xong Bước 1–4 (môi trường + CSDL) | 01/10 | ✅ Xong 29/09 |
| Xong Bước 5 (tài khoản) | 02/10 | 🟨 Backend xong 29/09, còn giao diện |
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
