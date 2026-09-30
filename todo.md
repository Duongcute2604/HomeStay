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
  - Xóa container `homestay-mysql` cũ (đã `Exited(255)` từ hôm qua, tạo bằng `docker run` tay) để nhường tên + cổng 3307 cho dự án mới. **Không đụng `cookbook-mysql`** (dự án khác) vẫn chiếm 3306.
  - Dùng `create-vite@5.5.3` (không phải `@latest`) để sinh đúng React 18 + Vite 5 — tránh bẫy phiên bản.
  - API cổng **5080**; Vite proxy `/api` → 5080 để khỏi lỗi CORS.
- **Kết quả:** Khung chạy được. API trả HTTP 200, build sạch 0 warning.
- **Bằng chứng:**
```
docker ps (homestay-mysql)     Up (healthy)   0.0.0.0:3307->3306/tcp
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
- **Mục tiêu đo được:** database `homestay` có đủ 9 bảng; index trên `bookings(RoomId)`, `bookings(CheckIn,CheckOut)`, `bookings(Status)`; `dotnet test` xanh
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
> - `HomeStayDbContextModelTests` — 22 test kiểm tra **cấu hình**: đủ 9 bảng, tên bảng, 6 enum lưu dạng `varchar(20)`, unique index (Email/Code/BookingId), index chống trùng lịch, khoá chính ghép, 6 CHECK constraint.
> - `HomeStayDbContextDataTests` — 5 test kiểm tra **ghi/đọc dữ liệu**: lưu đồ thị quan hệ đầy đủ, cascade delete, tự điền mốc thời gian.
>
> **Hai file dùng lại cho mọi test sau:** `Helpers/TestDbContextFactory.cs` + `Common/TestDataBuilder.cs`.
> Dữ liệu test trong MySQL đã dọn sạch sau khi kiểm thử (3 bảng đếm 0).

### [x] BƯỚC 4 — Seed data
- **Mục tiêu đo được:** seed thành công 4 user · 3 location · 10 room · 8 amenity · 15 booking (đủ 6 trạng thái, rải nhiều tháng) · 6 review. Đăng nhập được `admin@homestay.vn` / `123456`
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
  8. Tài khoản demo: `admin@homestay.vn` · `khach1@gmail.com` · `khach2@gmail.com` · `khach3@gmail.com` — mật khẩu đều `123456`.
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
| 2 | `store/authStore.ts` | Zustand + persist `homestay.auth` | Token là dữ liệu phiên |
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
| `dotnet test` (lúc cài vitest) | 147/147 — không hỏng gì |
| `dotnet test` (sau quét code đợt 1) | **163/163** — thêm 3 Service (thông báo quá dài) + 13 DTO validation. Chi tiết: `docs/BAO_CAO_QUET_CODE.md` |
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

### [x] BƯỚC 6 — Xem địa điểm · **XONG 30/09/2026**
- **Mục tiêu đo được:** `GET /api/locations` trả 3 địa điểm KHÔNG có `Id`, kèm phòng tóm tắt · trang `/locations` + `/locations/:chiSo` chạy được · 3/3 test tay · **≥ 8 unit test backend** + **≥ 10 unit test frontend**
- **Kết quả đo được:**
  - API: 200, 3 địa điểm + 10 phòng, không lộ `Id`, public không cần token
  - Test tay: **9/9 ca đạt** (HP 3 · EC 3 · AB 3), ghi ở `docs/KIEM_THU_TAY.md` mục 2
  - Unit test backend: `dotnet test --filter "LocationService"` → **10/10**
  - Unit test frontend: `npm test` → **87/87** (thêm 27: format 8 · locationService 4 · Locations 7 · LocationDetail 8)
  - `dotnet build --no-incremental` → **0 error 0 warning** · `npm run build` sạch · `npm run lint` sạch
  - Console trình duyệt 0 warning 0 error · mobile 390px không tràn · CSDL nguyên vẹn
- **Bằng chứng:**
- **Ảnh chụp:**

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | List có trả `Id` không? | **Không** (`AGENTS.md` 6.3). Nhúng luôn phòng tóm tắt vào response list | Dữ liệu nhỏ (3 địa điểm, 10 phòng). Tránh endpoint chi tiết chết (YAGNI): trang chi tiết đọc từ cache TanStack Query của list |
| 2 | Điều hướng tới chi tiết bằng gì? | **Chỉ số trong danh sách** (`/locations/0`, `/locations/1`...) | Không lộ `Id` ở đâu. STT = chỉ số + 1 khớp luôn quy tắc hiển thị. Gõ thẳng URL vẫn chạy (tải list rồi chọn theo chỉ số). Chỉ số sai → thông báo không tìm thấy |
| 3 | Thứ tự sắp xếp | `OrderBy Id` cả địa điểm lẫn phòng | Ổn định giống nhau trên MySQL thật và InMemory của test (sắp theo tên thì collation hai nơi khác nhau, test chập chờn). Sắp theo `Id` không lộ `Id` ra response |
| 4 | Địa điểm ngừng hoạt động | **Lọc `IsActive` ở Service**, không dùng global filter | Entity đã ghi "ngừng hoạt động thì không hiện cho khách". Test được (global filter khó test riêng từng trường hợp) |
| 5 | Phòng nào hiện trong chi tiết? | **Hiện tất cả kèm nhãn trạng thái** (Trống/Đã đặt/Đang ở/Đang dọn/Bảo trì) | Kiểm tra trống thật là Bước 9. Hiện tại chỉ gắn nhãn, không cho đặt |
| 6 | Ảnh đại diện phòng | Ảnh `IsPrimary`, không có thì ảnh `SortOrder` nhỏ nhất | Mỗi phòng seed 2 ảnh (chính + nội thất) |
| 7 | `utils/format.ts` | **Tạo ở bước này** (`formatVnd`) | Bước 5 hoãn vì chưa màn hình nào hiện tiền; bước này hiện giá phòng nên đủ lý do (hết YAGNI) |

#### File dự kiến

| # | File | Viết gì |
|---|------|---------|
| 1 | `DTOs/LocationDtos.cs` | `LocationListItemDto` (không `Id`) + `RoomSummaryDto` (không `Id`, có `thumbnailUrl`, `status` số) |
| 2 | `Services/Locations/ILocationService.cs` + `LocationService.cs` | `GetLocationsAsync(ct)`: chỉ `IsActive`, `Include Rooms + Images`, `AsNoTracking`, `Select` thẳng ra DTO |
| 3 | `Controllers/LocationsController.cs` | `GET /api/locations`, public, trả `ApiResponse<List<...>>` |
| 4 | *Sửa* `Program.cs` | Đăng ký DI |
| 5 | `HomeStay.Tests/Services/LocationServiceTests.cs` | ≥ 8 test: 3 địa điểm · loại `IsActive=false` · số phòng đúng · thumbnail là ảnh chính · thứ tự ổn định · DB rỗng → list rỗng · DTO không có `Id` (biên dịch đã đảm bảo, test khẳng định hành vi) |
| 6 | `types/location.ts` | `Location`, `RoomSummary`, `RoomType`/`RoomStatus` số + nhãn tiếng Việt |
| 7 | `services/locationService.ts` | `layDanhSachDiaDiem()` qua `apiClient`, dùng `bocDuLieu` chung |
| 8 | `utils/format.ts` + `format.test.ts` | `formatVnd`: `500.000 ₫`, số âm, số 0 |
| 9 | `pages/Locations.tsx` | Danh sách: ảnh, tên, địa chỉ, số phòng, giá thấp nhất. Đủ 3 trạng thái Loading/Error/Empty |
| 10 | `pages/LocationDetail.tsx` | Đọc `:chiSo` từ URL, lấy từ cache `['locations']`. Thông tin + lưới phòng (giá giờ/ngày, sức chứa, đánh giá, nhãn trạng thái). Chỉ số sai → trang không tìm thấy |
| 11 | *Sửa* `App.tsx` + `Home.tsx` | Route `/locations`, `/locations/:chiSo`; nút "Xem địa điểm" ở trang chủ |

#### 3 kịch bản test tay

| Lần | Loại | Kịch bản | Kỳ vọng |
|-----|------|----------|---------|
| 1 | **HP** | Mở `/locations` → bấm vào 1 địa điểm → thấy thông tin + phòng kèm giá | 3 địa điểm, ảnh hiện đủ, giá `500.000 ₫` căn phải |
| 2 | **EC** | F5 ở trang chi tiết · gõ thẳng `/locations/1` chưa vào list · gõ `/locations/99` · màn hình 390px | Vẫn hiện đúng · hiện đúng · báo không tìm thấy, không trắng màn · không tràn ngang |
| 3 | **AB** | Tắt server rồi mở trang · ảnh lỗi (đổi tên file tạm) · kiểm tra KHÔNG lộ `Id` | Hiện lỗi + nút thử lại · hiện ảnh thay thế · response và màn hình đều không có `Id` |

### [x] BƯỚC 7 — Tìm kiếm & lọc phòng · **XONG 30/09/2026**
- **Mục tiêu đo được:** `GET /api/rooms/search` đúng 9 tham số + phân trang · STT liên tục qua các trang · 3/3 test tay · **≥ 10 unit test backend** + **≥ 12 unit test frontend**
- **Kết quả đo được:**
  - API: không lọc 10 phòng/2 trang · Hưng Yên 4 phòng · giá tăng dần đúng · trang 2 STT từ 7 · giá 0–1.000 rỗng · `locationIndex=99` rỗng không lỗi · min>max/type/sort sai đều 400 · không lộ `Id`
  - Test tay: **11/11 ca đạt** (HP 4 · EC 4 · AB 3), ghi ở `docs/KIEM_THU_TAY.md` mục 3
  - Unit test backend: `dotnet test --filter "RoomSearch"` → **15/15**
  - Unit test frontend: `npm test` → **111/111** (thêm 24: roomSchemas 10 · roomService 5 · Rooms 9)
  - `dotnet build --no-incremental` → **0 error 0 warning** · `npm run build` sạch · `npm run lint` sạch
  - Console 0 warning 0 error · mobile 390px không tràn · CSDL nguyên vẹn
- **Bằng chứng:**
- **Ảnh chụp:** trang tìm kiếm

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | 9 tham số là gì? | `keyword, locationIndex, roomType, minPrice, maxPrice, capacity, sort, page, pageSize` | Đủ bộ lọc · sắp xếp · phân trang theo `AGENTS.md` 5.4. Không có `status` — hiện tất cả kèm nhãn như Bước 6 |
| 2 | Lọc theo địa điểm bằng gì? | `locationIndex` — chỉ số như Bước 6 | Response không có `Id` nên không lọc theo `Id` được. Server ánh xạ chỉ số → địa điểm theo cùng thứ tự `OrderBy Id` |
| 3 | `locationIndex` vượt phạm vi? | Trả **200 + danh sách rỗng** (không phải 404) | "Không có kết quả" là kết quả hợp lệ, giao diện hiện Empty state |
| 4 | `minPrice > maxPrice`? | Trả **400** kèm thông báo | Giá trị mâu thuẫn là lỗi người dùng, phải báo rõ chứ không tự đoán (đổi chỗ hay bỏ qua) |
| 5 | `roomType` ngoài 0–3? | Trả **400** | Enum không có giá trị đó; trả rỗng thì người gọi tưởng "hết phòng" |
| 6 | Sắp xếp | `priceAsc, priceDesc, ratingDesc, newest` (mặc định `newest`) | Đủ dùng cho trang tìm kiếm. Giá trị tiếng Anh ở API, nhãn tiếng Việt ở giao diện |
| 7 | `pageSize` tối đa | Chặn **50** ở server | Không cho `pageSize=1000000` kéo sập DB |
| 8 | So khớp `keyword` | So tên phòng, không phân biệt hoa thường (`.ToLower()` hai vế) | MySQL collation `ci` vốn không phân biệt hoa thường; viết tường minh để InMemory của test cũng đúng |
| 9 | STT liên tục | `(page-1)*pageSize + chỉ số + 1`, tính ở giao diện | Backend không có `Id` để neo; STT chỉ để hiển thị |
| 10 | Form lọc | React Hook Form + Zod (schema riêng, test được) | `AGENTS.md` 7.2: mọi form dùng RHF + Zod |

#### File dự kiến

| # | File | Viết gì |
|---|------|---------|
| 1 | `DTOs/RoomDtos.cs` | `RoomSearchRequest` (9 query param + attribute kiểm) · `RoomSearchItemDto` (không `Id`, có `locationName`) · `PagedResultDto<T>` chung |
| 2 | `Services/Rooms/IRoomService.cs` + `RoomService.cs` | `SearchAsync`: lọc → đếm → sắp → Skip/Take, `AsNoTracking`, `Select` ra DTO |
| 3 | `Controllers/RoomsController.cs` | `GET /api/rooms/search`, public |
| 4 | *Sửa* `Program.cs` | Đăng ký DI |
| 5 | `HomeStay.Tests/Services/RoomSearchTests.cs` | ≥ 10 test: từng bộ lọc · sắp xếp · phân trang · min>max 400 · type sai 400 · index vượt phạm vi rỗng · pageSize chặn 50 |
| 6 | `types/room.ts` | `RoomSearchItem`, `PagedResult<T>`, `SortOption`, `SearchFilters` — dùng lại `RoomType/RoomStatus` từ `location.ts` |
| 7 | `schemas/roomSchemas.ts` + test | Schema form lọc: số ép kiểu, `minPrice<=maxPrice`, giá trị mặc định |
| 8 | `services/roomService.ts` + test | `timKiem(filters)` dựng query string, mock `apiClient` |
| 9 | `pages/Rooms.tsx` + test | Thanh lọc + lưới kết quả + STT liên tục + phân trang + Loading/Error/Empty |
| 10 | *Sửa* `App.tsx`, `PageLayout.tsx`, `Home.tsx` | Route `/rooms`, link menu, nút trang chủ |

#### 3 kịch bản test tay

| Lần | Loại | Kịch bản | Kỳ vọng |
|-----|------|----------|---------|
| 1 | **HP** | Mở `/rooms` không lọc → lọc Hưng Yên → sắp giá tăng dần → sang trang 2 | 10 phòng / 2 trang · chỉ còn 4 phòng Hưng Yên · giá tăng dần · STT trang 2 tiếp nối (7, 8…) |
| 2 | **EC** | Giá 0–1.000 → từ khoá không có kết quả → `locationIndex=99` gõ tay → mobile 390px | Empty state "Không tìm thấy" · tương tự · tương tự · không tràn ngang |
| 3 | **AB** | `minPrice > maxPrice` → tắt server → kiểm KHÔNG lộ `Id` | 400 kèm thông báo · lỗi + nút thử lại · JSON và màn hình sạch `Id` |

### [x] BƯỚC 8 — Chi tiết phòng · **XONG 30/09/2026**
- **Mục tiêu đo được:** route `/locations/:chiSoDiaDiem/rooms/:chiSoPhong` hiện đủ ảnh (bấm xem lớn) · tiện nghi · giá · mô tả · đánh giá · khung chọn ngày kèm giá tạm tính · 3/3 test tay · **≥ 6 unit test backend** + **≥ 12 unit test frontend**
- **Kết quả đo được:**
  - API: `GET /api/locations` đã kèm `description/images/amenities/reviews` (review ẩn bị loại, đủ 5 hiện); quét sạch `Id` kể cả `userId/bookingId`
  - Test tay: **8/8 ca đạt** (HP 4 · EC 2 · AB 2) — chi tiết đầy đủ, bấm thumbnail + mở ảnh lớn, khung ngày tính "2 ngày × 1.100.000 ₫", link từ tìm kiếm đúng, chỉ số sai báo không tìm thấy, mobile 390px
  - Unit test backend: `dotnet test --filter "LocationService|RoomSearch"` → **32/32** (+7: 5 chi tiết + 2 chỉ số)
  - Unit test frontend: `npm test` → **135/135** (+24: pricing 9 · formatNgay 2 · RoomDateFrame 4 · RoomDetail 9)
  - `dotnet build --no-incremental` → **0 error 0 warning** · `npm run build` sạch · `npm run lint` sạch
  - Console 0 warning 0 error · CSDL nguyên vẹn
- **Bằng chứng:**
- **Ảnh chụp:**

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Lấy chi tiết từ đâu? | **Mở rộng response `GET /api/locations`** — thêm `description`, `images`, `amenities`, `reviews` vào phòng. KHÔNG endpoint mới | Dữ liệu nhỏ. Đúng mẫu Bước 6/7: không `Id`, không endpoint chết, chi tiết đọc từ cache. Route `/locations/:chiSoDiaDiem/rooms/:chiSoPhong` |
| 2 | Trang tìm kiếm link tới chi tiết bằng gì? | Thêm `locationIndex` + `roomIndex` vào `RoomSearchItemDto` | Server biết thứ tự nên đánh số luôn; giao diện khỏi đoán bằng tên (tên phòng có thể trùng giữa các địa điểm) |
| 3 | Đánh giá hiện gì? | Tối đa **5 mới nhất**, **trừ `IsHidden`**, kèm tên người viết + sao + nhận xét + ngày | Seed có 6 đánh giá (5 hiện + 1 ẩn) — đúng ca kiểm "ẩn là mất" |
| 4 | Khung chọn ngày gồm gì? | Chọn loại (giờ/ngày) + giờ nhận/trả + **giá tạm tính trực tiếp** + lỗi khi trả ≤ nhận | Tách `components/RoomDateFrame.tsx` để **Bước 10 dùng lại**. Chưa có nút đặt — nút thuộc Bước 10, làm trước là UI chết |
| 5 | Giá tạm tính tính ở đâu? | `utils/pricing.ts` sao đúng công thức `BookingCalculator` (làm tròn lên × đơn giá) | Quy tắc đơn giản (2 dòng). Ghi rõ "tạm tính"; số cuối cùng do backend tính ở Bước 10 |
| 6 | Ảnh lớn | Bấm thumbnail đổi ảnh chính; bấm ảnh chính mở lớp phủ toàn màn hình | Không thêm thư viện gallery — 2 ảnh/phòng, tự viết ~20 dòng đủ dùng (KISS) |

---

## Giai đoạn 4 — Nghiệp vụ cốt lõi ⭐

### [x] BƯỚC 9 — Kiểm tra phòng trống · **XONG 30/09/2026**
- **Mục tiêu đo được:** `GET /api/rooms/availability` trả `isAvailable` + `reason` · đủ 6 quy tắc · **≥ 12 unit test** (bắt buộc 3 test chồng lấn: chồng lấn, chạm biên, không chạm) · khung ngày ở trang chi tiết báo trống/bận trực tiếp · 3/3 test tay
- **Kết quả đo được:**
  - API: khoảng trống 200+true · trùng CONFIRMED 200+false · chạm biên true · trả trước nhận 400 · đặt gấp 400 · theo giờ 2h 400 · chỉ số sai 404 · bảo trì 200+false
  - Test tay: **8/8 ca đạt** (HP 3 · EC 3 · AB 2) — khung ngày báo "đã có người đặt" rồi "còn trống" trực tiếp, mobile 390px
  - Unit test backend: `dotnet test --filter "Availability"` → **17/17** (3 chồng lấn + 3 trạng thái đơn + 6 thời gian + 3 phòng + 2 happy)
  - Unit test frontend: `npm test` → **143/143** (+8: roomService.kiemTraTrong 4 · RoomDateFrame kiểm trống 4)
  - `dotnet build --no-incremental` → **0 error 0 warning** · `npm run build` sạch · `npm run lint` sạch
  - Console 0 warning 0 error · CSDL nguyên vẹn (4 users, 15 bookings)
- **Bằng chứng:** `dotnet test --filter "Availability"` → `Passed! 17/17`
- **Ghi chú:** URL dùng query thay vì `/api/rooms/{id}/availability` như nháp vì response không có `Id` — đã ghi ở bảng quyết định

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | URL kiểu gì? Kế hoạch nháp ghi `/api/rooms/{id}/availability` | Dùng query `GET /api/rooms/availability?locationIndex&roomIndex&type&checkIn&checkOut` | Response không có `Id` nên giao diện không biết `{id}` là gì. Chỉ số nhất quán với Bước 6/7/8. **Lệch kế hoạch nháp có ghi rõ ở đây** |
| 2 | 6 quy tắc là gì? | (1) trả > nhận · (2) đặt trước ≥ 2 giờ · (3) theo giờ tối thiểu 3 giờ · (4) phòng MAINTENANCE → bận · (5) trùng đơn còn hiệu lực → bận · (6) chạm biên không tính trùng | (2)(3) từ `BookingRules`; (6) là quy tắc biên kinh điển |
| 3 | Mã lỗi | Vi phạm quy tắc (1)(2)(3) → **400**; phòng không tồn tại → **404**; còn lại (kể cả trùng) → **200 + `isAvailable:false`** | Endpoint là truy vấn, không phải lệnh — "bận" là kết quả hợp lệ, không phải lỗi. Trùng khi TẠO đơn (Bước 10) mới 409 |
| 4 | Đơn nào tính là "đang giữ phòng"? | `PENDING, CONFIRMED, CHECKED_IN` | `CANCELLED/REJECTED` đã huỷ; `COMPLETED` đã trả — không giữ nữa |
| 5 | Công thức trùng | `tonTai.CheckIn < checkOut && tonTai.CheckOut > checkIn` | Chạm biên (`==`) không trùng: trả 12:00, nhận 12:00 vẫn được |
| 6 | Có cần đăng nhập? | **Không** — public như tìm kiếm | Khách kiểm trống trước khi đăng nhập mới đúng luồng |
| 7 | Giao diện | Nối vào `RoomDateFrame`: chọn ngày hợp lệ → tự gọi API → hiện "Còn trống" / "Đã có người đặt" | Khung đã tách sẵn ở Bước 8 để dùng lại; Bước 9 làm nó "sống" |
| 8 | Giờ máy khách sai? | Backend tự tính "hiện tại" bằng `DateTime.Now` của server | Không tin giờ máy khách cho quy tắc (2) |

### [x] BƯỚC 10 — Đặt phòng theo giờ / ngày ⭐ · **XONG 30/09/2026**
- **Mục tiêu đo được:**
  - Tính tiền đúng: theo giờ `số giờ × PricePerHour`, theo ngày `số ngày × PricePerDay` → **≥ 4 unit test** (đã có 7 ở `BookingCalculatorTests`, thêm ca cho service)
  - Lưu `PricePerHourSnapshot` / `PricePerDaySnapshot` → **1 test** sửa giá phòng, đơn cũ giữ nguyên
  - Dùng **transaction** + ghi `BookingStatusHistory` → **1 test**
  - Đặt trùng trả HTTP **409**
  - Mã đơn `Code` dạng `HS-YYMMDD-XXXX`, giao diện **không hiển thị Id**
  - 3/3 test tay + 2 tab cùng đặt → chỉ 1 đơn được tạo
- **Kết quả đo được:**
  - API: đặt ngày 201 (`HS-261030-4167`) · đặt giờ 201 · trùng 409 · không token 401 · vượt sức chứa 400 · ghi chú 501 ký tự 400 · **2 tab: 1×201 + 1×409**
  - Test tay: **10/10 ca đạt** (HP 3 · EC 4 · AB 4, mục 6 `KIEM_THU_TAY.md`) — luồng trình duyệt ra mã `HS-261205-3031`, vượt sức chứa chặn ở form, chưa đăng nhập về `/login`, mobile 390px
  - Unit test backend: `dotnet test --filter "Booking"` → **27/27**
  - Unit test frontend: `npm test` → **160/160** (+17: bookingService 4 · bookingSchemas 5 · Booking 7 · RoomDateFrame callback 1)
  - `dotnet build --no-incremental` → **0 error 0 warning** · `npm run build` sạch · `npm run lint` sạch
  - Đơn test đã xoá sạch (kèm lịch sử) — CSDL: 15 đơn, 42 lịch sử, refresh treo 0
- **Bằng chứng:** `dotnet test --filter "Booking"` → `Passed! 27/27`
- **Ảnh chụp:** form đặt phòng theo ngày, theo giờ, kết quả tạo đơn

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Endpoint | `POST /api/bookings` + `[Authorize]`, `userId` lấy từ token | Không tin id client gửi (mẫu `LayUserIdHienTai` ở `AuthController`) |
| 2 | Phòng nào? | Body gửi `locationIndex` + `roomIndex` như availability | Response không có `Id`; nhất quán Bước 6–9 |
| 3 | Tái kiểm quy tắc thế nào? | Trong transaction gọi `IRoomService.KiemTraTrongAsync`, bận → **409** kèm lý do; 400/404 lan tiếp | Không viết lại 6 quy tắc (DRY). Kiểm trống trả 200+false, nhưng khi TẠO thì "bận" là xung đột → 409 |
| 4 | Chống 2 tab cùng đặt | Transaction `SERIALIZABLE` + kiểm trùng LẠI trong transaction rồi mới insert | InMemory không chứng minh được đồng thời — chứng minh bằng test tay 2 tab. Ghi rõ giới hạn này |
| 5 | Mã đơn trùng ngẫu nhiên? | `HS-yyMMdd-XXXX` (4 số ngẫu nhiên), kiểm tồn tại rồi insert; unique index làm chốt chặn cuối | Xác suất trùng ~1/10000/ngày; vòng lặp tối đa 10 lần rồi báo lỗi hệ thống |
| 6 | Giá | `BookingCalculator.TinhTien` + lưu snapshot 2 đơn giá | Admin sửa giá sau không làm đơn cũ đổi tiền |
| 7 | Trạng thái phòng khi đặt? | **Không đổi** (vẫn `AVAILABLE`) | Phòng → `BOOKED` khi Admin xác nhận ở Bước 13, không phải lúc khách đặt |
| 8 | Lịch sử | 1 dòng `FromStatus=null → PENDING`, `ChangedBy` = khách đặt | Entity cho phép `FromStatus` null ở lần tạo |
| 9 | Sức chứa | `guestCount` 1..sức chứa, vượt → **400** | Yêu cầu không thể đáp ứng là lỗi quy tắc, không phải xung đột |
| 10 | Giao diện | Route `/booking/:chiSoDiaDiem/:chiSoPhong?loai&checkIn&checkOut` (bọc `ProtectedRoute`) + form số khách/ghi chú + trang thành công hiện `Code` | Query param để F5 không mất. Chưa link "Đơn của tôi" — trang đó thuộc Bước 11, link chết bị cấm |
| 11 | Nút "Tiếp tục đặt phòng" | Ở trang chi tiết, hiện khi khung báo trống; bấm → sang trang đặt kèm ngày đã chọn | Khung phát lựa chọn ra qua callback `onThayDoi` (Bước 8 đã tách khung để dùng lại) |

### [x] BƯỚC 11 — Đơn của tôi, hủy đơn, lịch sử · **XONG 30/09/2026, bổ sung lọc trạng thái 01/10**
- **Mục tiêu đo được:** `GET /api/bookings/my` chỉ đơn của chính mình · hủy `PENDING`/`CONFIRMED`, từ chối hủy `CHECKED_IN` trở đi · xem lịch sử · 3/3 test tay · **≥ 10 unit test backend** + **≥ 10 unit test frontend**
- **Bằng chứng:** **Backend 238/238** · **Frontend 177/177** · API **8/8** kịch bản · console sạch · đã kiểm tra ở khung mobile 390px (chi tiết ở `docs/KIEM_THU_TAY.md` mục 7)
- **Ảnh chụp:** ✅ `.openchamber/screenshots/buoc11-*.jpg`
- ⚠️ **Bổ sung 01/10: 14/14 kịch bản đạt.** Đã làm nốt tính năng lọc theo trạng thái và sửa lỗi ô lọc biến mất khi lọc ra danh sách rỗng. Bằng chứng ở bảng bên dưới.

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Định danh đơn trên URL | Dùng `Code` (`/api/bookings/HS-261005-4821/cancel`) | `Code` sinh ra để tra cứu thay `Id` (ghi trong entity). `Id` không bao giờ lộ |
| 2 | Xem/hủy đơn người khác? | **404** (không phải 403) | Không để lộ đơn của người khác có tồn tại hay không |
| 3 | Được hủy trạng thái nào? | Chỉ `PENDING`/`CONFIRMED` → `CANCELLED`; còn lại **409** | `CHECKED_IN` đang ở thì phải trả phòng chứ không được huỷ ngang; `COMPLETED/CANCELLED/REJECTED` đã xong |
| 4 | Phòng về `AVAILABLE` khi hủy? | Chỉ khi phòng đang `BOOKED` mới đặt lại `AVAILABLE` | Hiện tại phòng luôn `AVAILABLE` (Bước 13 mới đổi khi xác nhận) nên đây là no-op, nhưng viết sẵn cho đúng sau Bước 13. Không đụng `OCCUPIED` của đơn khác |
| 5 | Lý do hủy | Không bắt buộc (`reason?`, ≤ 500) | Giảm ma sát; vẫn lưu để Admin tra cứu |
| 6 | Danh sách có phân trang? | Có (`page/pageSize`, mặc định 20, tối đa 50), mới nhất trước | `AGENTS.md` 6.4 cấm trả toàn bộ bảng |
| 7 | Giao diện | `/bookings` (danh sách + hủy 2 bước bấm) · `/bookings/:code` (chi tiết + dòng thời gian lịch sử) · link "Đơn của tôi" khi đã đăng nhập · trang thành công Bước 10 nối link xem đơn | Không link chết: trang thành công sửa thêm link (bước trước để trống đúng vì trang chưa có) |

#### Lỗ hổng tìm ra 01/10 (khi rà lại toàn bộ bảng kiểm thử)

| # | Vấn đề | Mức độ | Trạng thái |
|---|--------|--------|------------|
| 1 | **Lọc đơn theo trạng thái chưa làm.** Bảng kiểm thử mục 7 có dòng này nhưng cột "Thực tế" để trống — tức hồi đóng bước này **chưa hề kiểm**. Chạy thật: `GET /api/bookings/my` chỉ nhận `page`/`pageSize`, **không có** tham số trạng thái; giao diện cũng không có ô lọc. Thử `?status=0,1,2,3,4,99` → **đều trả đủ 7 đơn** | Trung bình — tính năng nhỏ, khoảng 30 dòng backend + 1 `<select>` | ✅ **Đã làm 01/10** — xem bảng kết quả bên dưới |
| 2 | Dòng 4 của bảng ghi kỳ vọng "403" nhưng hệ thống trả **404** | Không phải lỗi | ✅ Đã sửa kỳ vọng cho khớp thực tế (404 là quyết định chốt ở Bước 16, xem bảng quyết định dòng 2 ở trên) |

#### Kết quả làm 01/10 — lọc đơn theo trạng thái

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Lọc ở server hay ở client? | **Server** | API đã phân trang. Lọc client chỉ đúng với trang 1 — sang trang 2 là sai, và tải cả 50 đơn về bỏ đi thì lãng phí |
| 2 | Truyền `status` dạng gì? | **Số** (0–5) | Khớp enum backend serialize ra số, và khớp `AdminBookings` đang dùng `?status=0` — một kiểu tham số cho cả hai phía |
| 3 | `status` sai (ví dụ 99)? | **Coi như không lọc**, trả tất cả | Đây là bộ lọc tuỳ chọn do chính giao diện gửi, không phải dữ liệu người dùng nhập tay → sai thì bỏ qua còn hơn báo lỗi |
| 4 | Ràng giá trị hợp lệ ở đâu? | Trong **service** | Controller chỉ tiếp nhận/trả response (AGENTS 6.1). Ràng ở service thì unit test được |
| 5 | Kiểm "có truyền `status` không" bằng gì? | `status is int v` — **không** dùng `status > 0` | `PENDING` có giá trị **0**. Kiểm `> 0` sẽ coi 0 là "không truyền" ⇒ chọn "Chờ xác nhận" ra danh sách tất cả |
| 6 | Cần bảng đếm số đơn theo trạng thái? | **Không** (YAGNI) | Ô chọn đã hiện tên trạng thái; thêm số đếm là thêm endpoint + DTO + bảng mà không ai dùng |
| 7 | `queryKey` của TanStack Query? | Có kèm `status` | Không có nó thì đổi bộ lọc sẽ lấy nhầm cache của bộ lọc cũ — lỗi rất khó thấy bằng mắt |
| 8 | Trạng thái rỗng khi lọc mà không ra đơn? | Tái dùng thẻ **"không có đơn nào ở trạng thái này"** + nút "Xem tất cả đơn" | Đã có sẵn, không thêm nhánh mới |

| Hạng mục | Kết quả |
|----------|---------|
| Backend | `?status=N` lọc đúng cả 6 trạng thái (`0`→0, `1`→1, `2`→1, `3`→3, `4`→2, `5`→0 đơn, tổng **7** khớp) · `99`/`6`/`-1`/rỗng → bỏ qua lọc, **không lỗi** · lọc **không** rò rỉ đơn người khác · unit test **369/369** (thêm 8) |
| Giao diện | `<select>` **7 lựa chọn**, nhãn lấy chung từ `NHAN_TRANG_THAI_DON` nên không lệch chữ với badge trên thẻ đơn · 375px không tràn ngang |
| Lỗi tìm ra khi làm | **1** — ô lọc nằm sau `return` của nhánh rỗng ⇒ lọc ra danh sách rỗng thì **ô lọc biến mất**, người dùng bị kẹt không đổi được bộ lọc. Chạy thử tay không bắt được vì tài khoản kiểm thử luôn có đơn ở mọi trạng thái |
| Bằng chứng | `docs/KIEM_THU_TAY.md` mục 7 — **14** kịch bản, tất cả PASS. Tỉ lệ đạt toàn hệ thống: **267/267 = 100%** |

> **Vì sao lọt lưới:** bước này được tick `[x]` khi *code đã chạy được*, mà chưa đối chiếu với chính bảng kiểm thử.
> Bài học ở `lessons.md` mục 70 — trước khi tick `[x]` phải mở bảng kiểm thử và kiểm không còn dòng nào trống.
>
> **Thêm 3 bài học 72–74:** bộ điều khiển không được đặt sau `return` của nhánh rỗng · `int?` không kiểm
> `> 0` để biết "có truyền" (giết mất `PENDING` = 0) · test đỏ thì hỏi "test sai hay code sai" trước khi sửa.

---

## Giai đoạn 5 — Quản trị

### [x] BƯỚC 12 — Admin quản lý danh mục (xong 30/09/2026)
- **Mục tiêu đo được:** CRUD địa điểm · CRUD tiện nghi · CRUD phòng (kèm ảnh + gán tiện nghi + cập nhật trạng thái) · chặn xóa phòng/địa điểm đang có đơn hoặc đang có phòng · 3/3 test tay
- **Bằng chứng:** 3 bộ API `/api/admin/{locations,rooms,customers}` (chỉ ADMIN) + 3 trang. **Backend 288/288** (thêm 50 unit test) · **Frontend 178/178** · API 8/8 kịch bản · giao diện 3/3 (chi tiết ở `docs/KIEM_THU_TAY.md` mục 8)
- **Ảnh chụp:** ✅ `.openchamber/screenshots/buoc12-admin-rooms-*.jpg`, `admin-bookings-*.jpg`
- **Ghi chú:** khách hàng gộp chung 1 trang với số đơn (theo yêu cầu); `CustomerDto.Id` có trong payload để gọi API nhưng giao diện **không** hiển thị

### [x] BƯỚC 13 — Admin vòng đời đơn & phòng (xong 30/09/2026) ⭐
- **Mục tiêu đo được:**
  - Đủ 6 chuyển trạng thái: `PENDING→CONFIRMED`, `→REJECTED`, `→CHECKED_IN`, `→COMPLETED`, `→CANCELLED`
  - Phòng: `AVAILABLE→BOOKED→OCCUPIED→CLEANING→(2h)→AVAILABLE` và `→MAINTENANCE`
  - Mỗi lần đổi trạng thái ghi 1 dòng `BookingStatusHistory` (có `ChangedBy`)
  - **Chặn đặt phòng trong 2 giờ vệ sinh** → **1 unit test**
  - Ma trận chuyển trạng thái hợp lệ/không hợp lệ → **≥ 8 unit test**
  - Chạy trọn 1 vòng đời thật, 3/3 test tay
- **Bằng chứng:** **Backend 310/310** (thêm 22 unit test) · **Frontend 198/198** (thêm 20 unit test) · API 9/9 kịch bản · lịch sử trạng thái kiểm bằng SQL trực tiếp · giao diện 4/4 (chi tiết ở `docs/KIEM_THU_TAY.md` mục 9)
- **Ảnh chụp:** ✅ `.openchamber/screenshots/admin-bookings-*.jpg`
- **Ghi chú:**
  - Trạng thái `CANCELLED` do **khách** tự hủy (Bước 11), không có endpoint Admin vì Admin không cần hủy hộ.
  - `MAINTENANCE` do Admin đặt trực tiếp ở trang Phòng (Bước 12), không gắn với đơn.
  - Còn nợ Bước 13: **tự động chuyển `CLEANING → AVAILABLE` sau 2 giờ** — hiện phải Admin bấm tay ở trang Phòng. Xem mục "Việc còn lại" bên dưới.

### [x] BƯỚC 14 — Admin khóa tài khoản khách (xong 30/09/2026)
- **Mục tiêu đo được:** khóa → khách đăng nhập bị từ chối với thông báo rõ ràng · mở khóa → đăng nhập lại được
- **Bằng chứng:** **6/6 kịch bản PASS** (chi tiết ở `docs/KIEM_THU_TAY.md` mục 10). Khách bị khoá đăng nhập trả **403** kèm thông báo rõ ràng; refresh token cũ bị từ chối **401**
- **Ghi chú:** ⚠️ Phần chức năng **đã làm sớm ở Bước 12** (khoá/mở khoá trong `AdminCustomerService`, endpoint `PATCH /api/admin/customers/{id}/status`), Bước 14 chỉ kiểm chứng lại đủ bộ kịch bản. **Không có nút xoá khách** — xoá làm mất lịch sử đơn; vi phạm thì khoá tài khoản.

---

## Giai đoạn 6 — Thống kê & đánh giá


### [x] BƯỚC 15 — Dashboard thống kê · **XONG 30/09/2026**
- **Mục tiêu đo được:** 6 số liệu (tổng quan · doanh thu theo tháng · số đơn theo tháng · tỷ lệ lấp đầy · top 5 phòng · tỷ lệ trạng thái) · số liệu khớp với database · biểu đồ vẽ đúng
- **Bằng chứng:** **Backend 333/333** (thêm 21 unit test) · **Frontend 208/208** (thêm 10 unit test) · **build 0 error 0 warning** · **đối chiếu SQL trực tiếp** khớp 4/4 số liệu (chi tiết ở `docs/KIEM_THU_TAY.md` mục 11)
- **Ảnh chụp:** ✅ `.openchamber/screenshots/admin-dashboard-v8-*.jpg`

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | "Doanh thu" tính đơn nào? | Chỉ `COMPLETED`, xếp theo tháng **trả phòng** (`CheckOut`) | Đơn `PENDING` khách còn huỷ được, tính vào là doanh thu ảo. Đối chiếu SQL: tính cả đơn chưa xác nhận ra **4.500.000** thay vì **2.700.000** |
| 2 | "Số đơn theo tháng" tính theo đâu? | Theo tháng **tạo** (`CreatedAt`), mọi trạng thái | Khác cơ sở với doanh thu là có chủ ý: tháng nào người ta đặt và tháng nào tiền vào là 2 câu hỏi khác nhau |
| 3 | "Tỷ lệ lấp đầy" đếm trạng thái nào? | Chỉ `CHECKED_IN` + `COMPLETED` — tức khách **thực sự đã ở** | Đơn mới đặt thì phòng chưa bị chiếm, tính vào sẽ thổi phồng |
| 4 | Một "đêm" tính thế nào? | **Cắt về ngày** (`.Date`) rồi mới trừ | Khách nhận 14:00 ngày 9, trả 12:00 ngày 11 = **2 đêm**. Trừ thẳng thời gian rồi cắt cụt ra 1 — thiếu 1 đêm cho **mọi** đơn |
| 5 | Tháng không có đơn thì? | Vẫn giữ cột với giá trị **0** | Bỏ tháng rỗng thì trục ngang biểu đồ tụt mất tháng, người đọc tưởng tháng đó không tồn tại |
| 6 | Số endpoint? | **1** endpoint gom, không tách 6 | Dashboard cần 6 con số cùng lúc; 6 lần gọi thì tải 6 lần và các con số có thể lệch nhau do đọc ở 6 thời điểm |
| 7 | Gom số liệu bằng SQL hay trong RAM? | Lọc ở CSDL rồi `Sum`/`Count` bằng LINQ | Cột enum lưu dạng **chuỗi** nên `GROUP BY YEAR(), MONTH()` phải viết SQL thô cho mỗi bảng, dễ sai hơn nhiều. Dữ liệu đồ án chỉ vài chục dòng |
| 8 | `/admin` trỏ đi đâu? | `/admin` **là** trang thống kê (bỏ hàm `ChuyenHuongAdmin`) | Menu Admin đổi thứ tự: Thống kê là mục đầu tiên |
| 9 | Biểu đồ tròn dùng `<Legend />` của recharts? | **Không** — tự vẽ 4 chấm màu | Legend của recharts chiếm chỗ trong khung vẽ nên dễ làm lệch hình. Tự vẽ kèm số đếm ngay ("Còn trống: 4") đọc nhanh hơn |

#### Bug phát hiện khi đối chiếu SQL (đã sửa + đã có test chặn)

`(den - tu).Days` **cắt cụt phần giờ** nên mọi đơn đều thiếu 1 đêm → tỷ lệ lấp đầy ra `2/300` thay vì `4/300` (0,7% thay vì 1,3%).
Nguyên nhân: giờ nhận phòng 14:00 và giờ trả phòng 12:00 là quy định cố định, còn test cũ dùng dữ liệu `00:00` nên **không bao giờ bắt được lỗi này**. Đã thêm test dùng đúng 14:00 / 12:00.

#### Ghi chú

- Trang dùng **recharts** — đã có sẵn trong `package.json`, **không thêm thư viện mới**.
- Mọi biểu đồ đặt `isAnimationActive={false}`: dashboard không nên vẽ lại mỗi lần bấm "Làm mới", và ảnh chụp cho báo cáo phải ổn định. Đồng thời tránh được việc ảnh chụp rơi vào giữa animation nên nhìn như biểu đồ vỡ — đã mắc và mất nhiều thời gian chẩn đoán nhầm (xem `lessons.md` mục 56).
### [x] BƯỚC 16 — Đánh giá & nhận xét · **XONG 01/10/2026** (kiểm thử tay 30/09)
- **Mục tiêu đo được:** chỉ đánh giá được đơn `COMPLETED` · 1 đơn 1 đánh giá (unique index) · cập nhật `RatingAvg`/`RatingCount` → **≥ 3 unit test** · Admin ẩn/xóa được
- **Bằng chứng:** **Backend 358/358** (thêm 25 unit test) · **Frontend 244/244** (thêm 36 unit test) · build **0 error 0 warning** · `npm run build` sạch · API **15/15** kịch bản · giao diện **6/6** (chi tiết ở `docs/KIEM_THU_TAY.md` mục 12)
- **Ảnh chụp:** ✅ `.openchamber/screenshots/buoc16-*.jpg`

#### Bug phát hiện khi kiểm thử tay giao diện (đã sửa + đã có test chặn)

Trang chi tiết đơn hiện **"NaN ₫/giờ"** và **"NaN ₫/ngày"**.
Nguyên nhân: `BookingDetail` ở TypeScript khai `pricePerHour`/`pricePerDay` là **bắt buộc**, nhưng `BookingDetailDto` của backend **không gửi** 2 trường đó → `undefined` → `formatVnd(undefined)` ra `NaN`.
Kiểu dữ liệu sai là nguyên nhân gốc: khai bắt buộc cho trường API không gửi thì TypeScript không bắt được, và mình tin `tsc` sạch là đúng.

Đã sửa triệt để, không vá chỗ hiện:
- Xoá `pricePerHour`/`pricePerDay`/`description`/`ratingAvg`/`ratingCount`/`reviews` khỏi `BookingDetail` — chúng thuộc về chi tiết **phòng**, không phải chi tiết **đơn**.
- Thay dòng giá bằng **Tổng tiền** (`totalAmount`, API có sẵn và đúng nghĩa với một đơn).
- Thêm `roomNumber` + `capacity` vào `BookingDetailDto` — giao diện cần và lấy được trong 1 truy vấn.
- Thêm test `expect(document.body.textContent).not.toContain('NaN')` để chặn hồi quy.

#### Ghi chú

- `RatingAvg` của phòng **tính lại từ đầu** mỗi lần có thay đổi (`SUM/COUNT` trên đánh giá chưa ẩn) chứ không cộng dồn — tự sửa được mọi sai lệch tích luỹ.
- Logic tính điểm nằm ở `ReviewScorer`, dùng chung cho cả khách ghi đánh giá lẫn Admin ẩn/xoá. Nếu để mỗi nơi tự `Sum` thì sớm có một chỗ quên điều kiện "không tính đánh giá ẩn".
- `TenTrangThai` tách ra `BookingStatusLabels` (khỏi `private` trong `AdminBookingService`) vì Bước 16 cũng cần — copy là cách chắc chắn hai bên lệch nhau.
- Đã mở khoá lại tài khoản `khach3@gmail.com` bị khoá sót từ kiểm thử tay Bước 14.

#### Khảo sát trước khi code — phần đã có sẵn

| Phần | Trạng thái |
|------|-----------|
| Bảng `Reviews` + `DbSet<Review>` | ✅ có từ Bước 3 |
| Unique index `BookingId` (1 đơn = 1 đánh giá) | ✅ có, test `Reviews_BookingId_LamUnique` đã bảo vệ |
| Check constraint `CK_Reviews_Rating` (1–5) | ✅ có |
| `Room.RatingAvg` / `RatingCount` + `CK_Rooms_Rating` | ✅ có |
| Seed 6 đánh giá mẫu | ✅ có, test `SeedDataTests` kiểm điểm khớp |
| API đọc đánh giá trong chi tiết phòng | ✅ `RoomDetailDto.Reviews` (chỉ 5 cái mới nhất, đã loại đánh giá ẩn) |
| **Ghi đánh giá** | ❌ chưa có — phần chính của Bước 16 |
| **Cập nhật lại điểm phòng** | ❌ chưa có logic nào tính `RatingAvg` khi có đánh giá mới |
| **Quản lý đánh giá phía Admin** | ❌ chưa có |
| **Giao diện — sửa lại sau khi khảo sát kỹ hơn** | Danh sách đánh giá **đã có sẵn** ở trang chi tiết phòng (Bước 8). Lúc đầu mình grep `Reviews` phân biệt hoa thường nên không thấy `phong.reviews` và kết luận nhầm là "chưa có". Việc còn làm ở Bước 16: tách component dùng chung + vẽ sao rỗng + thêm form đánh giá + trang quản trị |

> Nói rõ điểm này vì báo cáo dễ ghi "đã có sẵn" — thực tế **phần ghi và phần quản trị
> là mới**, còn phần đọc và cấu trúc CSDL đã có sẵn từ Bước 3.

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Ai được đánh giá? | Chủ đơn `COMPLETED` **của chính mình** | Không ai đánh giá hộ được: điểm phòng phải phản ánh người thực sự đã ở |
| 2 | Đánh giá đơn của người khác? | **404** (không phải 403) | Đồng Bước 11 — không để lộ đơn người khác có tồn tại hay không |
| 3 | Chặn trùng bằng gì? | **Cả hai lớp**: code trả 409 rõ ràng + unique index | Index là chốt chặn cuối khi 2 request song song; nếu chỉ dựa vào index thì lỗi `DbUpdateException` trả 500 — người dùng không hiểu |
| 4 | Khách có sửa/xoá đánh giá của mình không? | **Không** — chỉ Admin ẩn/xoá | Nếu khách sửa được: đánh giá 1 sao xong sửa lại 5 sao thì điểm phòng bị đầu độc. Đơn giản và công bằng hơn |
| 5 | `RatingAvg` tính trên đánh giá nào? | Chỉ đánh giá **không bị ẩn** | Đánh giá vi phạm bị ẩn thì không được cộng vào điểm, nhưng bản ghi vẫn còn để Admin tra cứu. Khớp với `LocationService` khi đọc |
| 6 | Admin ẩn hay xoá? | **Cả hai** | Ẩn để xử lý vi phạm (giữ dữ liệu để đối chiếu), xoá khi bị spam |
| 7 | Tính lại điểm kiểu nào? | `SUM/COUNT` lại **toàn bộ** đánh giá chưa ẩn của phòng | Tính lại từ đầu tự sửa được mọi sai lệch; cộng dồn `+1/10` thì mất đồng bộ ngay khi có xoá |
| 8 | Có cần transaction không? | **Có** — ghi đánh giá + cập nhật điểm phòng cùng lúc | Không có transaction thì giữa lúc ghi đánh giá và lúc tính điểm, người khác đọc trang phòng sẽ thấy điểm chưa cộng |

---

## Giai đoạn 7 — Hoàn thiện & kiểm thử

### [x] BƯỚC 17 — Responsive + 3 trạng thái + Toast · **XONG 01/10/2026**
- **Mục tiêu đo được:** mọi trang dùng được ở 375px · mọi danh sách có đủ 3 trạng thái · 7/7 test tay mục 11 của `docs/KIEM_THU_TAY.md`
- **Bằng chứng:** **7/7 kịch bản PASS** (chi tiết ở `docs/KIEM_THU_TAY.md` mục 11) · Frontend **258/258** (thêm 14 unit test) · Backend **361/361** · build sạch
- **Ảnh chụp:** ✅ `.openchamber/screenshots/b17-home-375-v2-*.jpg`, `b17-home-menu-mo-*.jpg`, `b17-rooms-375-*.jpg`, `b17-roomdetail-375-*.jpg`, `b17-404-375-*.jpg`, `b17-rong-375-*.jpg`

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Menu trên điện thoại làm tràn ngang | Thêm nút **3 gạch**, dưới `sm` menu xếp dọc | 375px không vừa 5 mục + nút "Đăng ký" trên một hàng. Dùng nút 3 gạch thay vì bớt mục: bớt mục là **giấu chức năng** trên đúng thiết bị mà khách dùng nhiều nhất |
| 2 | Khai báo menu 2 lần cho 2 bố cục? | **Không** — danh sách `MENU_KHACH`/`MENU_DANG_NHAP` khai 1 lần, hàm `veMenu()` dựng ra cả hai bản | Khai 2 lần thì thêm mục mới dễ quên sửa một bên, và hai bên lệch nhau rất khó phát hiện |
| 3 | Trang chủ có cần 3 trạng thái? | **Không** — đây là trang tĩnh, không gọi API | Bắt buộc 3 trạng thái cho trang không có dữ liệu chỉ là thêm mã chết |
| 4 | Toast tự tắt bao lâu? | **3 giây** (đã có sẵn) | Đủ đọc, không che nội dung |
| 5 | Lỗi API có tách khỏi "không tìm thấy"? | **Có** — bắt buộc | Xem mục bug bên dưới |

#### Bug tìm ra khi kiểm thử tay (đã sửa)

**1. Trang chủ tràn ngang ở 375px.** Logo chồng lên menu, menu xuống dòng thành "Trang/chủ", nút "Đăng ký" bị cắt, và có thanh cuộn ngang dưới cùng.
Đã sửa bằng nút 3 gạch + ẩn chữ logo ở màn hình nhỏ (`hidden sm:block`).

**2. Trang đặt phòng báo nhầm lỗi API thành "sai phòng".**
Khi API địa điểm hỏng, `diaDiemList` rỗng ⇒ `phong` cũng `undefined` ⇒ rơi vào nhánh *"không tìm thấy phòng"* và hiện **"Đường dẫn trỏ sai phòng. Hãy chọn lại từ trang chi tiết."**
Người dùng tưởng mình gõ sai đường dẫn, trong khi hệ thống đang lỗi. Đã tách nhánh lỗi riêng: *"Không tải được danh sách phòng / Hệ thống đang không phản hồi"* kèm nút Thử lại.

#### Cải thiện thêm

Toast **không có `role`** → trình đọc màn hình im lặng. Toast tự hiện lên chứ không phải do người dùng bấm, nên người mù không biết thao tác thành công hay thất bại. Đã thêm `role="status"`/`aria-live="polite"` (thành công) và `role="alert"`/`aria-live="assertive"` (lỗi).

#### ⚠️ Còn lại (ghi để không quên)

- **6 trang Admin chưa kiểm bằng mắt ở 375px.** Cần đăng nhập mà công cụ trình duyệt đang lỗi khi nhập ô mật khẩu. Đã kiểm **bằng đọc code**: `AdminLayout` dùng `flex-col`/`lg:flex-row`, cả 6/6 bảng đã bọc `overflow-x-auto` + `min-w-[...]`, menu dùng `flex flex-col`.
- **Trang chủ hiện 3 phòng "nổi bật" viết cứng trong code, không đọc CSDL.** Hôm nay khớp vì CSDL có đúng tên đó, nhưng đổi tên phòng là trang chủ hiện sai. Để ở đây để quyết định ở đợt quét code.

#### Ghi chú

- Kịch bản 5 và 6 (toast xanh/đỏ) kiểm bằng **unit test** với đồng hồ giả, không bấm tay. Bằng chứng này chắc hơn bấm tay vì toast tự tắt sau 3 giây — bấm chậm một chút là bỏ lỡ mà không biết là do tool hay do code.
- Khi viết test trong jsdom, Tailwind không được áp nên phần tử có lớp `hidden` **vẫn xuất hiện** trong DOM. Với menu 2 bản phải dùng `getAllByRole` và đếm số phần tử — đó mới phản ánh đúng hành vi thật (mở menu là **thêm** một bản, không phải thay thế).

### [x] BƯỚC 18 — 18 test case tích hợp (Postman) · **XONG 01/10/2026**
- **Mục tiêu đo được:** `docs/api/postman_collection.json` có **≥ 18 request** · chạy lại được, **≥ 17/18 đạt** · đặc biệt 3 test chứng minh chống đặt trùng · có ảnh kết quả cho báo cáo
- **Bằng chứng:** **41 request / 7 nhóm** · **41/41 request đạt** · **115/115 kiểm chứng** · **12/12 lần chạy liên tiếp** trong hết · 3 test chống đặt trùng **3/3**
- **Bằng chứng lưu file:** `docs/api/ket-qua-chay-lan-1.txt` (209 dòng) · `docs/api/ket-qua-chay-lien-tiep.txt`
- **Ảnh chụp:** ✅ `.openchamber/screenshots/b18-swagger-ok-*.jpg` (trang Swagger sau khi sửa)
- **Chi tiết:** `docs/KIEM_THU_TAY.md` mục 14

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | Cài Newman hay tự viết runner? | **Tự viết** `docs/api/run-postman.mjs` | Newman là gói thêm chỉ để chạy test (AGENTS 0.3: cấm thêm package không có lý do rõ). Một file Node không thêm dependency nào, **và in bảng kết quả** để chụp vào báo cáo |
| 2 | Cần cân đối bao nhiêu kịch bản? | **Cân đối** (HP + EC + AB trong từng nhóm) | Yêu cầu là ≥ 18 nhưng 18 request trải 38 endpoint thì mỏng. 41 request phủ hết 7 nhóm chức năng, vẫn dễ đọc |
| 3 | Collection có làm hỏng dữ liệu mẫu không? | **Không được** — phải tự dọn | Bản đầu tiên **hỏng ngay ở lần chạy thứ 2**: xác nhận đơn làm phòng → `BOOKED`, check-out làm phòng → `CLEANING` 2 giờ ⇒ chạy ~30 lần thì hết sạch phòng trống |
| 4 | Ngày thuê đặt thế nào cho chạy lại được? | **Tự sinh trong script tiền xử lý**, mỗi nhóm một dải riêng | Ngày viết cứng sẽ đụng dữ liệu cũ ngay lần đầu. Dải riêng rộng 1500 ngày, cách nhau 2000 ngày ⇒ lần chạy sau không bao giờ đụng lần chạy trước |
| 5 | Đơn do test T3 tạo ra thì sao? | **Huỷ luôn** (nhóm "Dọn dẹp") | Nếu không, mỗi lần chạy để lại 1 đơn `PENDING`, tích luỹ rồi chặn lần chạy sau ⇒ T3 nhận `[409, 409]` thay vì `[201, 409]` |
| 6 | Nhóm chạy trước cần dữ liệu sẵn? | Có nhóm **"Chuẩn bị dữ liệu"** đặt lại 4 phòng về `AVAILABLE` | Đây là dữ liệu mẫu, thao tác sửa có chủ đích và được ghi rõ trong mô tả nhóm |

#### Lỗi hệ thống phát hiện (đã sửa)

**Đặt trùng song song trả `500` thay vì `409`.** Test T3 làm 2 request cùng đặt 1 phòng 1 khung giờ; log server cho thấy InnoDB báo `Deadlock found when trying to get lock` (1213) ngay lúc `INSERT`, lỗi bị `catch { await Rollback(); throw; }` ném lên thành 500. Người dùng thấy *"Đã xảy ra lỗi, vui lòng thử lại"* thay vì *"Phòng đã có người đặt"* — không biết phải đổi phòng.

Sửa 5 điểm trong `BookingService.TaoDonAsync`: dò **cả chuỗi exception** · đọc `MySqlException.Number` (**không** đọc `DbException.ErrorCode` — cái đó trả về HResult `0x80004005` nên bản sửa đầu tiên không có tác dụng) · `RollbackAnToanAsync` nuốt lỗi rollback · bỏ `await using` vì `DisposeAsync` chạy **sau** dòng `throw 409` và thay thế nó · chỉ chuyển **3 mã lỗi tranh chấp** sang 409, lỗi khác vẫn 500.

Unit test: `RaceConditionTests.cs` — 11 test, gồm một test khoá lại để không ai vô tình quay về dùng `ErrorCode`.

#### Lỗi phát hiện thêm: trang `/swagger` không hiển thị

Trang báo *"Unable to render this definition"* dù `swagger.json` hợp lệ. Nguyên nhân gốc: csproj tham chiếu `Microsoft.AspNetCore.OpenApi 8.0.31` — gói **không được dùng** (không gọi `AddOpenApi`/`MapOpenApi`) nhưng kéo `Microsoft.OpenApi ≥ 1.6.30` phát `"openapi": "3.0.4"`, còn swagger-ui của Swashbuckle 6.9.0 không nhận dạng đó.

**Đã bỏ gói thừa** (không nâng Swashbuckle theo AGENTS 1.2) ⇒ tài liệu phát `3.0.1` ⇒ trang hiện đủ 38 endpoint, 60+ schema, nút Authorize.

#### Dữ liệu rác đã dọn

**319/337** đơn là dữ liệu test của Bước 18 (nhận dạn qua `Note`: `Kiem thu…`, `TRUNG…`, `Don rieng…`, năm 2027–2044). Đã xoá **có chọn lọc** kèm lịch sử và đánh giá, **không** `TRUNCATE`. Còn lại **18** đơn seed.

| Hạng mục | Kết quả |
|----------|---------|
| Backend | **380/380** (thêm 11) · build 0 error 0 warning |
| Frontend | **264/264** · `npm run build` sạch |
| Kiểm thử tích hợp | **41/41** request · **115/115** kiểm chứng · **12/12** lần chạy liên tiếp |

> **Bài học 75–77:** đọc `DbException.ErrorCode` cho lỗi MySQL là luôn sai (phải đọc `MySqlException.Number`) · package không dùng có thể phá chức năng của package khác · bộ test tích hợp tự làm bẩn dữ liệu thì không phải bộ test, chỉ chạy được đúng một lần.
### [x] BƯỚC 19 — 22 hình cho Chương 3 của báo cáo · **XONG 01/10/2026**
- **Mục tiêu đo được:** chụp đủ 22 hình (3.1–3.22), **không được để trống "Hình 3.x" nào trong báo cáo** — ảnh chụp phải là của hệ thống đang chạy
- **Kết quả:** **22/22 hình** trong `docs/anh/` — **7 ảnh giao diện** (3.16–3.22, chụp từ hệ thống chạy thật, khung 1440×900) + **15 sơ đồ** (3.1–3.15)
- **Bằng chứng:** `docs/anh/*.jpg` (22 file) · `docs/anh/so-do/*.svg` (15 file) · `docs/anh/README.md` bảng đối chiếu 22 hình với mẫu báo cáo
- **Chi tiết:** `docs/anh/README.md`

#### Quyết định đã chốt (trước khi code)

| # | Vấn đề | Chốt | Lý do |
|---|--------|------|-------|
| 1 | 15 sơ đồ vẽ tay hay sinh bằng script? | **Sinh bằng script** `docs/anh/ve-so-do.mjs` ra SVG | 15 hình cùng dạng — vẽ tay thì mỗi hình lệch kiểu, mà code đổi (thêm endpoint, đổi tên lớp) thì phải vẽ lại từ đầu. Script thì sửa dữ liệu rồi chạy lại |
| 2 | Nội dung sơ đồ lấy từ đâu? | Từ **code thật**: tên lớp trong `BookingService.cs`, tên bảng trong `HomeStayDbContext`, tên endpoint trong controller | Sơ đồ vẽ theo trí nhớ thì sai, GV hỏi một câu là lộ |
| 3 | Định dạng nộp báo cáo? | Nộp cả **.svg** (sắc nét, không vỡ khi phóng) | Word 2016 trở lới hỗ trợ SVG; ảnh chụp .jpg chỉ dùng khi cần |
| 4 | Dữ liệu để chụp 7 ảnh giao diện? | Đưa về **đúng trạng thái seed**: 15 đơn, 10 phòng `AVAILABLE` | Chụp lúc còn 105 đơn rác ngày 2035–2044 thì ảnh rất khó đọc và không đại diện cho hệ thống |

#### Lỗi thật phát hiện khi chụp (đã sửa)

**Trang quản trị hiện ra tối xám trong khi trang khách vẫn sáng.** Đo style tính toán thấy CSS **đúng** (`rgba(255,251,235,0.4)`), hóa ra là nền trang bán trong suốt để lộ **canvas của trình duyệt** (canvas tối do thiết bị quyết định). `PageLayout` dùng `bg-gray-50` đục nên phủ kín canvas, còn `AdminLayout` dùng `bg-amber-50/40` nên lọt. Sửa thành `bg-amber-50` (đục) + khai báo `:root { color-scheme: light }`.

> Đây là lỗi mà **ảnh chụp mới phát hiện được** — bước trước kiểm tra responsive chỉ đo bề rộng, không soi màu sắc.

#### Ba lỗi hình ảnh phát hiện bằng cách xem lại ảnh

| Lỗi | Nguyên nhân | Sửa |
|------|-------------|------|
| Biểu đồ tác nhân chồng chữ, hộp đè hình người | Dựng lưới không đủ chỗ | Dựng lại theo trục dọc, mỗi bước cách nhau 66px |
| Use case mất cột cuối + tác nhân bên phải | Chiều rộng **đặt cứng** 960 trong khi nội dung cần 1350 | Tính chiều rộng từ nội dung |
| Sơ đồ tuần tự hỏng toàn bộ — mọi mũi tên co về một điểm | Mũi tên dùng **chỉ số cột** thay vì toạ độ x | Đổi qua hàm `cx()`; thêm 100px hở bên phải cho hộp tên |
| Nét nối cắt ngang chữ trong bầu dục / hộp | Vẽ nét **sau** hộp | Đảo thứ tự: nét trước, hộp sau — hộp nền đục che nét |

> Cả ba lỗi đầu đều **không làm script báo lỗi** — script chạy trơn tru, chỉ hình mới hỏng. Không xem lại ảnh thì sẽ nộp báo cáo có hình vỡ mà không biết.

#### ⚠️ Việc còn lại của bước này

Mẫu báo cáo `.docx` vẫn ghi **"Hình 3.8. Kiến trúc hệ thống StayEasy"** — tên cũ. Sửa thành **HomeStay** khi ghép báo cáo (đã ghi trong `docs/anh/README.md`).

| Hạng mục | Kết quả |
|----------|---------|
| Ảnh giao diện | **7/7** — trang chủ, tìm kiếm, chi tiết phòng, đặt phòng, quản lý đơn, thống kê, quản lý phòng |
| Sơ đồ | **15/15** — tác nhân, 6 use case, kiến trúc, lớp, ERD, 5 tuần tự |
| Tổng | **22/22** — không còn ô "Hình 3.x" nào bị trống |
| Frontend | **264/264** test · `npm run build` 0 error |

> **Bài học 78–80:** nền trang bán trong suốt làm lộ canvas của trình duyệt, cả trang bị tối theo · chuỗi `*/` trong chú thích CSS làm hỏng cả bản build · 22 hình trong báo cáo thì sinh bằng script, và phải xem ảnh sau khi sinh vì script chạy sạch không bảo đảm hình đẹp.
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
