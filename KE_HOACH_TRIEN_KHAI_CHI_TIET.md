# BẢN KẾ HOẠCH CHI TIẾT — TỪNG BƯỚC LÀM
## Đồ án 4: Hệ thống đặt phòng và quản lý homestay (HomeStay)

> SV: Nguyễn Hải Nam — 12523W.1 · GVHD: TS. Hồng Quốc Việt
> Lập ngày 29/09/2026 · Hạn bảo vệ dự kiến ~20/10/2026
> **Phạm vi: 2 tác nhân — KHÁCH (Customer) và ADMIN. Bỏ hẳn nhân viên.**
> Công nghệ (giữ nguyên theo báo cáo): React + TypeScript + Vite · ASP.NET Core 8 · EF Core · MySQL 8

---

## ⚠️ BẮT BUỘC ĐỌC TRƯỚC KHI CODE

**Bộ quy tắc bất biến nằm ở file [`AGENTS.md`](./AGENTS.md).** Đọc trước khi viết dòng code đầu tiên.

Điểm quan trọng nhất — **quy trình hoàn thành 1 chức năng** (áp dụng cho MỌI bước từ Bước 3 đến Bước 16):

```
Bước 1  Viết code
Bước 2  Build sạch: 0 error, 0 warning
Bước 3  Chạy thử TAY 2–3 lần với 3 kịch bản khác nhau (happy / edge / bất thường)
Bước 4  Viết UNIT TEST cho logic nghiệp vụ — dotnet test phải xanh 100%
Bước 5  Ghi vào docs/BAO_CAO_TIEN_DO.md
Bước 6  Commit git
```

**Không chuyển sang bước tiếp theo khi chưa đủ 6 bước.** Mục tiêu: chức năng nào xong thì không phải sửa lại ở giai đoạn dồn cuối.

Hai file cần cập nhật liên tục:
- `docs/BAO_CAO_TIEN_DO.md` — tiến độ tổng quan (mỗi chức năng 1 dòng)
- `docs/KIEM_THU_TAY.md` — kết quả chạy thử tay từng kịch bản


---

## PHẦN A — TÌNH HUỐNG ĐỌC TRƯỚC

### A1. Báo cáo đang ở đâu

| Phần | Trạng thái thật |
|------|-----------------|
| Chương 1 – Tổng quan đề tài | ✅ Xong |
| Chương 2 – Cơ sở lý thuyết | ✅ Xong |
| Chương 3 – Phân tích & thiết kế | ⚠️ **Chỉ mới có tiêu đề + bảng mô tả, 22 hình đều trống** |
| Chương 4 – Triển khai & kiểm thử | ❌ Trống hoàn toàn |
| Kết luận, TLTK | ⚠️ Có khung, phải rà lại khớp code cuối |

### A2. Những chỗ trong báo cáo phải sửa cho khớp "2 tác nhân"

Đọc vào Word tìm các chỗ sau rồi sửa (tầm 30 phút):

| Vị trí | Đang ghi | Sửa thành |
|--------|----------|-----------|
| 3.1.1 Xác định tác nhân | "Chèn hình Actor gồm: Customer, Admin" | Giữ đúng 2: **Customer, Admin** — xoá dòng "nhân viên" nếu có |
| 3.1 Yêu cầu phần mềm | Có đoạn *"Đối với nhân viên vận hành: ..."* | Bỏ đoạn này, gộp nội dung vào *"Đối với quản trị viên (Admin)"* |
| Bảng Use Case tổng quát, dòng 8 | "Check-in / Check-out — **Nhân viên** thực hiện" | "**Admin** thực hiện" |
| Bảng Use Case tổng quát, dòng 9 | "Quản lý trạng thái phòng" | Ghi rõ: "**Admin** theo dõi và cập nhật" |
| 3.1.3.e Quản lý hệ thống | Có "Quản lý nhân viên" | Bỏ dòng này |
| 1.3.1 Đối tượng nghiên cứu | "Quản trị viên / Chủ homestay (Admin/Host)" | Chỉ còn **Admin** |
| Mục 4.3 | "Triển khai chức năng cho phân hệ **nhân viên**" | Sửa thành: *"4.3 Triển khai chức năng cho phân hệ Quản trị (Admin)"* |
| Chương 1.2.2 | "SQL Server" | **MySQL** (khớp Chương 2.4 và code thật) |
| Chương 2.3 | "ba vai trò" | "**hai vai trò**" |

### A3. Nguyên tắc chung cho toàn bộ dự án

1. **Code viết ra phải chạy được và nhìn được** → xong bước nào thì chụp màn hình luôn.
2. **Ảnh chụp thật > ảnh vẽ** cho phần giao diện. Ảnh lưu vào `docs/screenshots/`.
3. **Business logic nằm ở tầng Service**, Controller chỉ nhận request → validate → gọi Service → trả về.
4. Backend **không trả `id`** ở endpoint danh sách; giao diện tự tính STT = `index + 1 + page * size`.
5. Chữ → `text-left`; **số và tiền → `text-right`** + class `.number-vn`; tiền format `500.000 ₫`.
6. Commit git **mỗi ngày 1 lần**.
7. Chỉ làm **đúng 2 tác nhân**. Không tự thêm Host/Nhân viên/Payment thật.

---

## PHẦN B — BẢN ĐỒ CHỨC NĂNG (đối chiếu với 15 Use Case trong báo cáo)

| STT | Use Case trong báo cáo | Ai dùng | Bước thực hiện |
|-----|------------------------|---------|-----------------|
| 1 | Đăng ký / Đăng nhập | Khách, Admin | Bước 5 |
| 2 | Tìm kiếm phòng | Khách | Bước 7 |
| 3 | Xem thông tin phòng | Khách | Bước 8 |
| 4 | Kiểm tra phòng trống | Khách | Bước 9 |
| 5 | Đặt phòng theo giờ | Khách | Bước 10 |
| 6 | Đặt phòng theo ngày | Khách | Bước 10 |
| 7 | Quản lý đặt phòng (xem, hủy, theo dõi) | Khách | Bước 11 |
| 8 | Check-in / Check-out | **Admin** | Bước 13 |
| 9 | Quản lý trạng thái phòng | **Admin** | Bước 13 |
| 10 | Quản lý địa điểm | Admin | Bước 12 |
| 11 | Quản lý phòng | Admin | Bước 12 |
| 12 | Quản lý tiện nghi | Admin | Bước 12 |
| 13 | Quản lý hình ảnh | Admin | Bước 12 |
| 14 | Quản lý đánh giá | Khách (tạo), Admin (quản lý) | Bước 16 |
| 15 | Thống kê doanh thu | Admin | Bước 15 |

Ngoài ra: Khách xem/cập nhật hồ sơ, đổi mật khẩu (Bước 5) · Admin quản lý tài khoản khách (Bước 14).

---

## PHẦN C — CÁC BƯỚC THỰC HIỆN

> Mỗi bước có 4 phần: **Việc cần làm** → **Chi tiết kỹ thuật** → **Cách kiểm tra** → **Kết quả bàn giao**.

---

# BƯỚC 1 — Cài môi trường
**Thời gian: 45 phút · Ngày 1 (buổi tối)**

### 1.1 Việc cần làm
1. Cài .NET 8 SDK (máy hiện **chưa có**, đây là việc quan trọng nhất của bước này)
2. Kiểm tra Docker Desktop đang chạy
3. Kiểm tra Node.js và Git

### 1.2 Chi tiết kỹ thuật

Cài .NET 8 SDK **không cần quyền Administrator**:
```powershell
# 1. Tải script cài đặt
Invoke-WebRequest https://dot.net/v1/dotnet-install.ps1 -OutFile "$env:TEMP\dotnet-install.ps1"

# 2. Cài vào thư mục user (không đụng Program Files)
& "$env:TEMP\dotnet-install.ps1" -Channel 8.0 -InstallDir "$env:LOCALAPPDATA\Microsoft\dotnet"

# 3. Thêm vào PATH của user
[Environment]::SetEnvironmentVariable("Path",
  [Environment]::GetEnvironmentVariable("Path","User") + ";$env:LOCALAPPDATA\Microsoft\dotnet",
  "User")
```
Sau đó **đóng mở lại PowerShell** rồi kiểm tra:
```powershell
dotnet --version        # phải ra 8.0.x
docker --version
docker compose version
node -v                  # v24.x
git --version
```

> **Nếu `dotnet` vẫn không chạy:** mở lại terminal hoặc đăng xuất/đăng nhập lại Windows. Nếu vẫn lỗi thì backend vẫn chạy được bằng Docker (xem Bước 2), không bị chặn.

### 1.3 Cách kiểm tra
Cả 5 lệnh trên đều in ra phiên bản → OK.

### 1.4 Kết quả bàn giao
Máy có đủ 4 công cụ. **Nếu `dotnet --version` chạy được thì bước 1 xong.**

---

# BƯỚC 2 — Dựng khung project
**Thời gian: 1 giờ · Ngày 1**

### 2.1 Việc cần làm
1. Tạo **git repo riêng** cho đồ án
2. Tạo cấu trúc thư mục `client/` và `server/`
3. Dựng MySQL bằng Docker
4. Tạo `server/` bằng `dotnet new webapi`
5. Tạo `client/` bằng Vite
6. Viết `.gitignore` và `README.md`

### 2.2 Chi tiết kỹ thuật

**(a) Git repo riêng** — KHÔNG dùng repo `bai-tap-lon` (đó là repo chứa đồ án 3, đang lẫn file bị xóa):
```powershell
cd "D:\bai tap lon\Đồ án 4- Đặt phòng\Homestay"
git init
```

**(b) Khởi tạo backend:**
```powershell
mkdir server
cd server
dotnet new webapi -n HomeStay
cd HomeStay
dotnet add package Pomelo.EntityFrameworkCore.MySql --version 8.0.2
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.10
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer --version 8.0.10
dotnet add package Swashbuckle.AspNetCore --version 6.9.0
```
Sau đó **xoá file mẫu** `WeatherForecast.cs`, `Controllers/WeatherForecastController.cs` cho sạch.

**(c) Khởi tạo frontend:**
```powershell
cd ..
npm create vite@latest client -- --template react-ts
cd client
npm install
npm install react-router-dom axios @tanstack/react-query zustand react-hook-form zod @hookform/resolvers
npm install -D tailwindcss @tailwindcss/vite recharts
```

**(d) `docker-compose.yml`** — chỉ MySQL là đủ lúc đầu:
```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: homestay-mysql
    environment:
      MYSQL_ROOT_PASSWORD: "123456"
      MYSQL_DATABASE: homestay
      MYSQL_USER: homestay
      MYSQL_PASSWORD: "123456"
    ports: ["3306:3306"]
    volumes:
      - mysql_data:/var/lib/mysql      # BẮT BUỘC: để xóa container không mất dữ liệu
volumes:
  mysql_data:
```
```powershell
docker compose up -d
docker compose ps          # phải thấy homestay-mysql là running
```

**(e) `.gitignore`** phải có: `node_modules/`, `bin/`, `obj/`, `dist/`, `.env`, `uploads/`, `*.tsbuildinfo`

**(f) Cấu trúc thư mục** — tạo sẵn để sau không bị lệch:
```
Homestay/
├── client/src/
│   ├── api/  components/  context/  hooks/  layouts/
│   ├── pages/  services/  types/  utils/
├── server/
│   ├── Controllers/  Data/  DTOs/  Entities/
│   ├── Services/  Middleware/  Migrations/  Program.cs
├── docs/
│   ├── database/  api/  screenshots/  weekly/
├── docker-compose.yml
├── .gitignore
└── README.md
```

### 2.3 Cách kiểm tra
```powershell
docker compose ps                                   # mysql running
cd server && dotnet build                           # Build succeeded
cd ..\client && npm run build                       # build thành công
```

### 2.4 Kết quả bàn giao
Cả 3 lệnh trên chạy được. Commit lần đầu: `git commit -m "chore: khoi tao khung project HomeStay"`.

---

# BƯỚC 3 — Thiết kế cơ sở dữ liệu
**Thời gian: 3 giờ · Ngày 2 · Đây là bước nền tảng, làm chắc**

### 3.1 Việc cần làm
Tạo 9 bảng, kết nối backend với MySQL, chạy migration đầu tiên.

### 3.2 Bảng dữ liệu (chốt theo báo cáo, 2 tác nhân → không có bảng nhân viên)

**users** — tài khoản
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | int, PK, tự tăng | |
| FullName | nvarchar(100) | |
| Email | nvarchar(150), unique | dùng để đăng nhập |
| Phone | nvarchar(20), null | |
| PasswordHash | nvarchar(255) | BCrypt, **không bao giờ lưu mật khẩu thô** |
| Role | enum('CUSTOMER','ADMIN') | **chỉ 2 giá trị** |
| Status | enum('ACTIVE','LOCKED') | Admin khóa được tài khoản khách |
| Address, Avatar | nvarchar, null | |
| CreatedAt, UpdatedAt | datetime | |

**locations** — địa điểm homestay
`Id, Name, Address, City, Province, Description, Image, IsDeleted, CreatedAt, UpdatedAt`

**rooms** — phòng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | int, PK | |
| LocationId | int, FK → locations | |
| Name, RoomType | nvarchar | RoomType: đơn / đôi / gia đình |
| Capacity | int | số khách tối đa |
| PricePerHour | decimal(12,0) | tiền |
| PricePerDay | decimal(12,0) | tiền |
| Description | nvarchar(max) | |
| Status | enum('AVAILABLE','BOOKED','OCCUPIED','CLEANING','MAINTENANCE') | trạng thái phòng |
| RatingAvg | decimal(3,2) | cập nhật khi có đánh giá |
| RatingCount | int | |
| CreatedAt, UpdatedAt | datetime | |

**room_images** — `Id, RoomId (FK), Url, IsPrimary, SortOrder`
**amenities** — tiện nghi: `Id, Name, Icon, Description`
**room_amenities** — bảng nối nhiều-nhiều: `RoomId (FK), AmenityId (FK),` khóa chính gộp 2 cột

**bookings** — đơn đặt phòng
| Cột | Kiểu | Ghi chú |
|-----|------|---------|
| Id | int, PK | |
| Code | nvarchar(20), unique | **mã hiển thị cho người dùng**, ví dụ `HS-250930-4821` (không lộ Id) |
| UserId | int, FK → users | |
| RoomId | int, FK → rooms | |
| BookingType | enum('HOUR','DAY') | |
| CheckIn, CheckOut | datetime | khoảng thời gian chiếm phòng |
| Hours | int, null | khi đặt theo giờ |
| Days | int, null | khi đặt theo ngày |
| PricePerHourSnapshot | decimal(12,0) | **lưu giá lúc đặt** |
| PricePerDaySnapshot | decimal(12,0) | **lưu giá lúc đặt** |
| TotalAmount | decimal(12,0) | tổng tiền |
| Status | enum('PENDING','CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED','REJECTED') | |
| Note | nvarchar(500), null | ghi chú khách |
| CreatedAt, UpdatedAt | datetime | |

**booking_status_history** — lịch sử trạng thái
`Id, BookingId (FK), FromStatus, ToStatus, ChangedBy (FK users), Note, CreatedAt`

**reviews** — đánh giá
`Id, BookingId (FK, unique — 1 đơn 1 đánh giá), RoomId (FK), UserId (FK), Rating (1–5), Content, IsHidden, CreatedAt`

### 3.3 Index bắt buộc (báo cáo có nhắc tới)
`rooms(LocationId)` · `bookings(RoomId)` · `bookings(CheckIn, CheckOut)` · `bookings(Status)` · `reviews(RoomId)`
Thêm unique index `(BookingId)` trong `reviews` để chặn đánh giá 2 lần.

### 3.4 Chi tiết kỹ thuật
- Tạo file `Entities/User.cs`, `Room.cs`, ... trong `server/Entities/`
- Tạo `Data/HomeStayDbContext.cs`, khai báo `DbSet<T>` và quan hệ
- `Program.cs` — đăng ký `DbContext`:
```csharp
builder.Services.AddDbContext<HomeStayDbContext>(options =>
    options.UseMySql(builder.Configuration.GetConnectionString("DefaultConnection"),
                     ServerVersion.AutoDetect(conn)));
```
- `appsettings.json` — chuỗi kết nối:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Port=3306;Database=homestay;User=homestay;Password=123456;"
}
```
- Chạy migration:
```powershell
cd server
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 3.5 Cách kiểm tra
Mở Swagger → xem danh sách bảng; hoặc mở DBeaver/Workbench → thấy 9 bảng trong database `homestay`.

### 3.6 Kết quả bàn giao
Database có đủ 9 bảng, backend kết nối được MySQL. Commit: `feat(DB): them 9 bang co ban`.

### 3.7 Tạo project kiểm thử (làm ngay ở bước này, đừi để cuối)
```powershell
cd server
dotnet new xunit -n HomeStay.Tests
dotnet sln add HomeStay.Tests
dotnet add HomeStay.Tests reference HomeStay
dotnet add HomeStay.Tests package Microsoft.EntityFrameworkCore.InMemory
dotnet add HomeStay.Tests package Moq
```
Tạo sẵn `Helpers/TestDbContextFactory.cs` và `Common/TestDataBuilder.cs` — 2 file này dùng lại cho **mọi** test sau đó (đúng tinh thần DRY trong `AGENTS.md`).
Xem thêm `AGENTS.md` mục 5.1–5.3.

---

# BƯỚC 4 — Tạo dữ liệu mẫu (Seed)
**Thời gian: 2 giờ · Ngày 2 · Đừng để cuối kỳ mới làm — cần để demo**

### 4.1 Việc cần làm
Tạo sẵn dữ liệu giả để: app có nội dung khi demo với GVHD, và Dashboard có số liệu để vẽ biểu đồ.

### 4.2 Chi tiết kỹ thuật
Tạo `Data/SeedData.cs`, gọi tự động trong `Program.cs` khi app khởi động (chỉ seed nếu bảng `users` đang rỗng).

**Nội dung seed:**

| Loại | Số lượng | Chi tiết |
|------|----------|----------|
| Tài khoản | 4 | `admin@homestay.vn` / `123456` (ADMIN)<br>`khach1@gmail.com`, `khach2@gmail.com`, `khach3@gmail.com` / `123456` (CUSTOMER) |
| Địa điểm | 3 | Hà Nội, Hưng Yên, Sa Pa |
| Tiện nghi | 8 | WiFi, Máy lạnh, Tủ lạnh, Bồn tắm, Ban công, Bãi đỗ xe, TV, Bàn ăn |
| Phòng | 10 | Mỗi phòng 3–4 ảnh, 3–5 tiện nghi, giá 150.000–1.200.000/giờ và 700.000–3.500.000/ngày |
| Đơn đặt | 15 | Rải đều các trạng thái: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, REJECTED — **và rải trong nhiều tháng khác nhau** để biểu đồ doanh thu có số liệu |
| Đánh giá | 6 | 3–5 sao, gắn vào các đơn `COMPLETED` |

**Ghi chú ảnh:** copy 5 ảnh có sẵn trong thư mục `Đồ án 4- Đặt phòng\hệ thống\` vào `server/wwwroot/uploads/` rồi trỏ URL vào database. Không cần xây chức năng upload ảnh thật.

### 4.3 Cách kiểm tra
```powershell
dotnet run
```
→ đăng nhập `admin@homestay.vn` / `123456` được, database có 10 phòng, 15 đơn.

### 4.4 Kết quả bàn giao
App chạy được với dữ liệu mẫu. **Đây là dữ liệu dùng cho toàn bộ phần demo.**

---

# BƯỚC 5 — Chức năng tài khoản (Use Case 1)
**Thời gian: 4 giờ · Ngày 3**

### 5.1 Chức năng cần làm
| # | Chức năng | Ai dùng |
|---|-----------|---------|
| 1 | Đăng ký tài khoản khách | Khách |
| 2 | Đăng nhập | Khách, Admin |
| 3 | Lưu phiên đăng nhập (token) | Cả hai |
| 4 | Đăng xuất | Cả hai |
| 5 | Xem hồ sơ cá nhân | Khách |
| 6 | Cập nhật hồ sơ (tên, điện thoại, địa chỉ) | Khách |
| 7 | Đổi mật khẩu | Cả hai |

### 5.2 API cần tạo (Backend)

| Method | Đường dẫn | Mô tả | Quyền |
|--------|-----------|-------|-------|
| POST | `/api/auth/register` | Tạo tài khoản (luôn là CUSTOMER, Admin tạo bằng seed) | Công khai |
| POST | `/api/auth/login` | Trả về accessToken + refreshToken + thông tin user | Công khai |
| POST | `/api/auth/refresh` | Làm mới access token khi hết hạn | Công khai |
| POST | `/api/auth/logout` | Vô hiệu refresh token | Đã đăng nhập |
| GET | `/api/auth/me` | Thông tin user hiện tại | Đã đăng nhập |
| PUT | `/api/auth/profile` | Cập nhật hồ sơ | Đã đăng nhập |
| PUT | `/api/auth/change-password` | Đổi mật khẩu (kiểm tra mật khẩu cũ) | Đã đăng nhập |

**Quy tắc nghiệp vụ phải kiểm tra:**
- Email phải đúng định dạng, **không trùng** với tài khoản đã có
- Mật khẩu tối thiểu 6 ký tự, xác nhận mật khẩu khớp
- Tài khoản `LOCKED` thì không đăng nhập được → trả về thông báo "Tài khoản đã bị khoá"
- Đăng ký **không tự chọn được quyền ADMIN** (chống đăng ký thành admin — đây là lỗi bảo mật GVHD hay hỏi)

### 5.3 Phần cần tạo
**Backend:** `DTOs/AuthDtos.cs` · `Services/AuthService.cs` (+ interface) · `Controllers/AuthController.cs` · cấu hình JWT trong `Program.cs` (Access 1h, Refresh 7 ngày, BCrypt) · `Middleware/ExceptionMiddleware.cs` trả lỗi đúng format.

**Frontend:** `pages/Login.tsx` · `pages/Register.tsx` · `pages/Profile.tsx` · `context/AuthContext.tsx` · `hooks/useAuth.ts` · `services/authService.ts` · `types/auth.ts` · `api/client.ts` (axios + interceptor tự gắn token, tự refresh khi 401) · component `ProtectedRoute.tsx` (chặn khách vào trang admin).

### 5.4 Cách kiểm tra
1. Đăng ký tài khoản mới → thông báo thành công, tự đăng nhập
2. Đăng ký lại cùng email → báo "Email đã tồn tại"
3. Đăng nhập sai mật khẩu → báo lỗi rõ ràng
4. Đăng nhập `admin@homestay.vn` → thấy menu Admin; đăng nhập `khach1@gmail.com` → không thấy menu Admin
5. Gõ thẳng đường dẫn `/admin` khi đang đăng nhập bằng khách → bị chặn
6. Đổi mật khẩu → đăng nhập lại bằng mật khẩu mới

### 5.5 Kết quả bàn giao
Có thể đăng ký, đăng nhập, đăng xuất, sửa hồ sơ, đổi mật khẩu. **Chụp ảnh 2 màn hình: Đăng nhập, Hồ sơ cá nhân.**

---

# BƯỚC 6 — Khách xem địa điểm
**Thời gian: 1,5 giờ · Ngày 4 (buổi sáng)**

### 6.1 Chức năng
Xem danh sách địa điểm homestay và mô tả chi tiết địa điểm đó.

### 6.2 API
| Method | Đường dẫn | Quyền |
|--------|-----------|-------|
| GET | `/api/locations` | Công khai — trả danh sách, **không có Id** |
| GET | `/api/locations/{id}` | Công khai — có Id nội bộ |

### 6.3 Phần cần tạo
**Backend:** `Services/LocationService.cs` · `Controllers/LocationsController.cs` · `DTOs/LocationDtos.cs`
**Frontend:** `services/locationService.ts` · `types/location.ts` · `components/LocationCard.tsx` · `pages/Locations.tsx` · `pages/LocationDetail.tsx` (danh sách phòng thuộc địa điểm)

### 6.4 Cách kiểm tra
Trang địa điểm hiện 3 địa điểm từ seed, bấm vào xem được danh sách phòng của địa điểm đó.

---

# BƯỚC 7 — Tìm kiếm & lọc phòng (Use Case 2)
**Thời gian: 4 giờ · Ngày 4 (buổi chiều)**

### 7.1 Chức năng
Tìm kiếm phòng theo: từ khóa · địa điểm · ngày nhận/trả · số khách · khoảng giá · có tiện nghi. Sắp xếp và phân trang.

### 7.2 API
| Method | Đường dẫn | Mô tả |
|--------|-----------|-------|
| GET | `/api/rooms` | Danh sách phòng có phân trang |
| GET | `/api/rooms/search` | Tìm kiếm + lọc nâng cao |

**Query parameters của `/api/rooms/search`:**
`search` (từ khóa) · `locationId` · `checkIn` · `checkOut` · `guests` · `minPrice` · `maxPrice` · `amenityIds` · `sortBy` (`price_asc`, `price_desc`, `rating_desc`, `newest`) · `page` · `pageSize`

**Quy tắc quan trọng:** nếu có `checkIn` + `checkOut` thì **loại ra những phòng đã có đơn** trong khoảng thời gian đó. Đây là nửa của bài toán "chống đặt trùng", GVHD sẽ hỏi kỹ phần này.

### 7.3 Phần cần tạo
**Backend:** `Services/RoomService.cs` · `Controllers/RoomsController.cs` · `DTOs/RoomDtos.cs` + `RoomSearchRequest` · `Common/PagedResult.cs`
**Frontend:** `services/roomService.ts` · `components/SearchFilterBar.tsx` · `components/RoomCard.tsx` · `pages/Rooms.tsx` · `utils/format.ts` (hàm `formatVnd`)

### 7.4 Cách kiểm tra
- Lọc theo địa điểm Hưng Yên → chỉ còn phòng của Hưng Yên
- Lọc giá 200.000–800.000/ngày → kết quả đúng khoảng
- Chọn ngày nhận/trả trùng với một đơn `CONFIRMED` có sẵn → phòng đó **không xuất hiện**
- Chuyển trang 2 → STT hiển thị 11, 12, 13... (không phải 1, 2, 3)
- Giá hiển thị đúng `1.200.000 ₫`, căn phải

---

# BƯỚC 8 — Xem chi tiết phòng (Use Case 3)
**Thời gian: 3 giờ · Ngày 5 (buổi sáng)**

### 8.1 Chức năng
Trang chi tiết phòng: ảnh (xem ảnh lớn), tên, loại, sức chứa, giá theo giờ/ngày, mô tả, tiện nghi, đánh giá của khách, trạng thái phòng, và **khung chọn ngày nhận/trả**.

### 8.2 API
| Method | Đường dẫn |
|--------|-----------|
| GET | `/api/rooms/{id}` |
| GET | `/api/rooms/{id}/reviews` |

### 8.3 Phần cần tạo
**Backend:** cập nhật `RoomService.GetByIdAsync` trả kèm ảnh + tiện nghi + rating
**Frontend:** `pages/RoomDetail.tsx` · `components/RoomImageGallery.tsx` · `components/AmenityList.tsx` · `components/ReviewList.tsx` · `components/BookingWidget.tsx` (khung chọn ngày)

### 8.4 Cách kiểm tra
Bấm vào phòng bất kỳ → thấy đủ ảnh, tiện nghi, giá, mô tả, đánh giá. Ảnh bấm được ra ảnh lớn.

---

# BƯỚC 9 — Kiểm tra phòng trống (Use Case 4) ⭐
**Thời gian: 3 giờ · Ngày 5 (buổi chiều) · Đây là nghiệp vụ quan trọng nhất của đồ án**

### 9.1 Chức năng
Khách chọn thời gian → hệ thống trả lời ngay phòng đó còn trống hay không, kèm thông báo lý do nếu không (đã có đơn / ngoài giờ cho phép / quá ngắn).

### 9.2 API
`GET /api/rooms/{id}/availability?checkIn=2026-10-05T14:00&checkOut=2026-10-07T12:00`

Trả về: `{ isAvailable: bool, reason: string|null, conflicts: [...] }`

### 9.3 Thuật toán kiểm tra trùng lịch (viết ra giấy để giải thích với GVHD)

Hai khoảng thời gian `[A1, A2]` và `[B1, B2]` **trùng nhau** khi:
```
A1 < B2  VÀ  B1 < A2
```
Áp dụng: đơn mới `[checkIn, checkOut]` trùng đơn cũ khi:
```csharp
var conflict = await _db.Bookings.AnyAsync(b =>
    b.RoomId == roomId &&
    b.Status != BookingStatus.CANCELLED &&
    b.Status != BookingStatus.REJECTED &&
    b.CheckIn < checkOut &&
    b.CheckInDate < checkOut &&
    b.CheckIn < b.CheckOut &&      // loại bỏ điều kiện thừa nếu không dùng
    b.CheckOut > checkIn);
```
Câu hỏi GVHD hay đặt: *"Tại sao dùng `<` mà không dùng `<=`?"* → Trả lời: vì khách trả phòng 12:00 thì khách mới có thể nhận phòng 12:00 cùng ngày, nên hai khoảng chạm biên **không** tính là trùng.

### 9.4 Các quy tắc phải kiểm tra
| Quy tắc | Thông báo lỗi |
|---------|---------------|
| `checkIn` phải cách thời điểm hiện tại ít nhất **2 giờ** | "Vui lòng đặt trước thời gian nhận phòng ít nhất 2 giờ" |
| `checkOut > checkIn` | "Thời gian trả phòng phải sau thời gian nhận phòng" |
| Đặt theo giờ: tối thiểu **3 giờ** | "Thời gian đặt theo giờ tối thiểu là 3 giờ" |
| Đặt theo ngày: nhận phòng **14:00**, trả phòng **12:00 hôm sau** | "Giờ nhận phòng tiêu chuẩn là 14:00" |
| Số khách vượt sức chứa phòng | "Phòng chỉ chứa tối đa N người" |
| Phòng `MAINTENANCE` | "Phòng đang bảo trì, tạm thời chưa nhận đặt" |

### 9.5 Cách kiểm tra
Lấy một phòng có đơn `CONFIRMED` từ seed → đặt đúng khoảng thời gian đó → hệ thống báo "phòng đã có đơn trong khung giờ này". Đặt khoảng thời gian khác → báo còn trống.

---

# BƯỚC 10 — Đặt phòng theo giờ & theo ngày (Use Case 5, 6) ⭐
**Thời gian: 4 giờ · Ngày 6**

### 10.1 API
| Method | Đường dẫn | Quyền |
|--------|-----------|-------|
| POST | `/api/bookings` | Đã đăng nhập |

**Body mẫu (đặt theo ngày):**
```json
{ "roomId": 3, "bookingType": "DAY", "checkIn": "2026-10-05T14:00:00",
  "checkOut": "2026-10-07T12:00:00", "guests": 2, "note": "Tôi đến muộn khoảng 1 tiếng" }
```

**Body mẫu (đặt theo giờ):**
```json
{ "roomId": 3, "bookingType": "HOUR", "checkIn": "2026-10-05T14:00:00",
  "checkOut": "2026-10-05T19:00:00", "guests": 2 }
```

### 10.2 Công thức tính tiền
```
Đặt theo giờ:  Tổng tiền = Số giờ × PricePerHour   (tối thiểu 3 giờ)
Đặt theo ngày: Tổng tiền = Số ngày  × PricePerDay
```
**Và bắt buộc:** lưu `PricePerHourSnapshot` / `PricePerDaySnapshot` vào booking. Sau này Admin sửa giá phòng thì lịch sử đơn cũ **không được đổi theo**. Đây là ý GVHD rất dễ hỏi.

### 10.3 Mã đơn `Code`
Sinh ngẫu nhiên, ví dụ `HS-250930-4821`. **Đây là thứ hiển thị cho người dùng, không phải Id.** Quy tắc báo cáo: không lộ Id nội bộ ra giao diện.

### 10.4 Chống đặt trùng — dùng Transaction
```csharp
await using var tx = await _db.Database.BeginTransactionAsync();
// 1. kiểm tra trùng (như Bước 9.3)
// 2. tạo booking
// 3. đổi trạng thái phòng sang BOOKED
// 4. thêm BookingStatusHistory (null -> PENDING)
await tx.CommitAsync();
```
Trạng thái đơn mới luôn là **`PENDING`** (chờ Admin xác nhận). GVHD sẽ hỏi "hai người đặt cùng lúc thì sao?" → trả lời: **dùng transaction + index và kiểm tra lại trong transaction**, đồng thời chặn ở tầng database.

### 10.5 Phần cần tạo
**Backend:** `Services/BookingService.cs` · `Controllers/BookingsController.cs` · `DTOs/BookingDtos.cs` · `Services/CodeGenerator.cs`
**Frontend:** `components/BookingModal.tsx` hoặc trang `pages/Booking.tsx` · `services/bookingService.ts` · `types/booking.ts`
Giao diện cần: 2 tab (Theo giờ / Theo ngày), hiện **tạm tính tiền**, nút "Xác nhận đặt phòng".

### 10.6 Cách kiểm tra
1. Đặt theo ngày 2 đêm, phòng 1.200.000/ngày → tổng tiền hiển thị `2.400.000 ₫`
2. Đặt theo giờ 2 tiếng → báo lỗi tối thiểu 3 giờ; đặt 3 tiếng → OK
3. Đặt phòng đang có đơn trùng giờ → báo lỗi, **không tạo được đơn**
4. Đặt xong thì vào "Đơn của tôi" thấy đơn ở trạng thái `PENDING`, có mã `HS-...`
5. Admin vào sửa giá phòng → đơn cũ **giữ nguyên tổng tiền**

---

# BƯỚC 11 — Khách quản lý đơn của mình (Use Case 7)
**Thời gian: 3 giờ · Ngày 6 (buổi chiều)**

### 11.1 Chức năng
| # | Chức năng | Quy tắc |
|---|-----------|---------|
| 1 | Xem danh sách đơn của tôi (phân trang, lọc theo trạng thái) | Chỉ thấy đơn của chính mình — **kiểm tra `userId` từ token, không nhận từ client** |
| 2 | Xem chi tiết đơn | Hiện mã đơn, thời gian, số tiền, trạng thái, lịch sử trạng thái |
| 3 | Hủy đơn | Chỉ hủy được khi `PENDING` hoặc `CONFIRMED`. Hủy → phòng về `AVAILABLE` |
| 4 | Xem lịch sử trạng thái | Đọc từ bảng `booking_status_history` |

### 11.2 API
| Method | Đường dẫn |
|--------|-----------|
| GET | `/api/bookings/my` |
| GET | `/api/bookings/{id}` |
| PUT | `/api/bookings/{id}/cancel` |
| GET | `/api/bookings/{id}/history` |

### 11.3 Phần cần tạo
**Frontend:** `pages/MyBookings.tsx` · `pages/BookingDetail.tsx` · `components/BookingStatusBadge.tsx` (màu khác nhau cho từng trạng thái) · `components/StatusTimeline.tsx`

### 11.4 Cách kiểm tra
- Hủy đơn `PENDING` → thành `CANCELLED`, phòng về `AVAILABLE`
- Cố hủy đơn `CHECKED_IN` → báo "Không thể hủy đơn đã nhận phòng"
- Đăng nhập khách khác, thử xem đơn của khách trước → **bị chặn 403**

---

# BƯỚC 12 — Admin: quản lý danh mục (Use Case 10, 11, 12, 13)
**Thời gian: 5 giờ · Ngày 7–8**

### 12.1 Chức năng
| # | Chức năng | Ghi chú |
|---|-----------|---------|
| 1 | Khung quản trị: layout riêng, menu, chỉ Admin mới vào được | Dùng `ProtectedRoute` kiểm tra `role === 'ADMIN'` |
| 2 | CRUD **địa điểm** | Không cho xóa địa điểm đang có phòng → báo lỗi rõ ràng |
| 3 | CRUD **tiện nghi** | Tên tiện nghi không được trùng |
| 4 | **Thêm / Sửa phòng** | Validate: giá > 0, sức chứa 1–20 |
| 5 | **Xem danh sách phòng** | Lọc theo địa điểm, tìm theo tên, phân trang |
| 6 | **Xóa phòng** | Phòng đang có đơn chưa hoàn tất → **không cho xóa** (chỉ cho ẩn) |
| 7 | **Quản lý ảnh phòng** | Thêm/xóa ảnh, chọn ảnh đại diện |
| 8 | **Gán tiện nghi cho phòng** | Checkbox, lưu qua bảng `room_amenities` |
| 9 | **Cập nhật trạng thái phòng** | Chọn: AVAILABLE / CLEANING / MAINTENANCE |

### 12.2 API (tất cả đều yêu cầu role ADMIN)
```
GET    /api/admin/locations          POST   /api/admin/locations
PUT    /api/admin/locations/{id}     DELETE /api/admin/locations/{id}

GET    /api/admin/amenities          POST   /api/admin/amenities
PUT    /api/admin/amenities/{id}     DELETE /api/admin/amenities/{id}

GET    /api/admin/rooms              POST   /api/admin/rooms
GET    /api/admin/rooms/{id}         PUT    /api/admin/rooms/{id}
DELETE /api/admin/rooms/{id}

POST   /api/admin/rooms/{id}/images      DELETE /api/admin/images/{imageId}
PUT    /api/admin/rooms/{id}/amenities   (gán/bỏ tiện nghi)
PUT    /api/admin/rooms/{id}/status
```

### 12.3 Phần cần tạo
**Backend:** `Services/LocationService.cs` · `AmenityService.cs` · `RoomService.cs` (kèm phần Admin) · 3 Controller tương ứng trong `Controllers/Admin/`
**Frontend:** `layouts/AdminLayout.tsx` · `components/admin/DataTable.tsx` (bảng dùng chung có STT, phân trang) · `components/admin/ConfirmDialog.tsx` · `components/admin/ImageUploader.tsx`
**Pages:** `Admin/Dashboard.tsx` · `Admin/Locations.tsx` · `Admin/Amenities.tsx` · `Admin/Rooms.tsx` · `Admin/RoomForm.tsx`

### 12.4 Cách kiểm tra
- Đăng nhập bằng tài khoản khách, gõ `/admin` → bị chặn
- Thêm 1 địa điểm mới → xuất hiện ngoài trang chủ khách ngay
- Xóa địa điểm đang có phòng → báo "Không thể xóa địa điểm đang có phòng"
- Xóa phòng đang có đơn → bị từ chối
- Tạo phòng mới + gán tiện nghi + thêm ảnh → khách thấy phòng mới ở trang tìm kiếm
- STT trong bảng admin hiện 1, 2, 3... liên tục qua các trang

---

# BƯỚC 13 — Admin: quản lý đơn & vòng đời phòng (Use Case 8, 9) ⭐
**Thời gian: 4 giờ · Ngày 9 · Đây là phần "nghề" của phân hệ quản trị**

### 13.1 Vòng đời trạng thái đơn
```
PENDING ──xác nhận──▶ CONFIRMED ──check-in──▶ CHECKED_IN ──check-out──▶ COMPLETED
   │                     │                        │
   └──từ chối──▶ REJECTED                       └──hủy/khách hủy──▶ CANCELLED
   └──hủy/khách hủy──▶ CANCELLED
```

### 13.2 Vòng đời trạng thái phòng (theo đúng báo cáo mục 3.1)
```
AVAILABLE ──đặt phòng──▶ BOOKED ──check-in──▶ OCCUPIED ──check-out──▶ CLEANING ──(2 giờ)──▶ AVAILABLE
                                                                                                   
        └──────────────── admin đánh dấu bảo trì ──▶ MAINTENANCE ──▶ AVAILABLE
```
**Quy tắc 2 giờ vệ sinh:** khi check-out, phòng sang `CLEANING` với thời điểm `CleaningUntil = checkOut + 2 giờ`. Trong khoảng này **phòng không nhận đặt mới** — phải kiểm tra ở cả Bước 9 (kiểm tra trống) và Bước 10 (tạo đơn).

### 13.3 Chức năng
| # | Chức năng | Ghi chú |
|---|-----------|---------|
| 1 | Danh sách tất cả đơn, lọc theo trạng thái / địa điểm / khoảng ngày, phân trang | |
| 2 | Chi tiết đơn + lịch sử trạng thái | |
| 3 | **Xác nhận** đơn | `PENDING → CONFIRMED`, phòng giữ `BOOKED` |
| 4 | **Từ chối** đơn | `PENDING → REJECTED`, phòng về `AVAILABLE`, ghi lý do |
| 5 | **Check-in** | `CONFIRMED → CHECKED_IN`, phòng → `OCCUPIED` |
| 6 | **Check-out** | `CHECKED_IN → COMPLETED`, phòng → `CLEANING`, set `CleaningUntil` |
| 7 | **Hủy** đơn của khách | `PENDING/CONFIRMED → CANCELLED`, phòng → `AVAILABLE` |
| 8 | Xem lịch trạng thái phòng theo ngày (bảng lịch) | Ghép từ `bookings` |
| 9 | Cập nhật trạng thái phòng thủ công | |

**Bắt buộc:** mỗi lần đổi trạng thái phải ghi 1 dòng vào `booking_status_history` (trạng thái cũ → mới, ai thực hiện, thời điểm, ghi chú). Đây là dữ liệu để vẽ **lịch sử trạng thái** trong báo cáo.

### 13.4 API (role ADMIN)
```
GET  /api/admin/bookings?status=&from=&to=&page=
GET  /api/admin/bookings/{id}
PUT  /api/admin/bookings/{id}/confirm
PUT  /api/admin/bookings/{id}/reject      { "reason": "Phòng đã kín" }
PUT  /api/admin/bookings/{id}/check-in
PUT  /api/admin/bookings/{id}/check-out
PUT  /api/admin/bookings/{id}/cancel
GET  /api/admin/rooms/calendar?from=&to=
```

### 13.5 Phần cần tạo
**Frontend:** `pages/Admin/Bookings.tsx` · `pages/Admin/BookingDetail.tsx` · `components/admin/BookingActions.tsx` (các nút hành động theo trạng thái hiện tại) · `components/admin/RoomCalendar.tsx`

### 13.6 Cách kiểm tra
Chạy trọn vẹn 1 vòng đời và quan sát từng bước:
1. Khách đặt phòng → đơn `PENDING`, phòng `BOOKED`
2. Admin xác nhận → `CONFIRMED`
3. Admin check-in → `CHECKED_IN`, phòng `OCCUPIED`
4. Khách thử đặt phòng khác trong lúc đó → bị chặn
5. Admin check-out → `COMPLETED`, phòng `CLEANING`
6. Thử đặt phòng đó trong 2 giờ vệ sinh → **bị chặn**
7. Sau 2 giờ → phòng tự trở lại `AVAILABLE`
8. Mở lịch sử trạng thái → thấy đủ 4 bước

---

# BƯỚC 14 — Admin: quản lý khách hàng
**Thời gian: 2 giờ · Ngàc 9 (buổi chiều)**

### 14.1 Chức năng
Xem danh sách khách hàng · xem thông tin · **khóa / mở khóa** tài khoản. Xóa tài khoản thì **không làm** (chỉ khóa) — an toàn dữ liệu.

### 14.2 API
`GET /api/admin/users?search=&role=&page=` · `PUT /api/admin/users/{id}/lock` · `PUT /api/admin/users/{id}/unlock`

### 14.3 Cách kiểm tra
Khóa `khach3@gmail.com` → tài khoản đó đăng nhập báo "Tài khoản đã bị khoá" · mở khóa → đăng nhập lại được.

---

# BƯỚC 15 — Dashboard thống kê (Use Case 15)
**Thời gian: 3 giờ · Ngày 10**

### 15.1 Chức năng
| # | Thống kê | Cách tính |
|---|----------|-----------|
| 1 | Tổng quan | Tổng phòng · Tổng đơn · Đơn chờ xác nhận · Doanh thu tháng này |
| 2 | Doanh thu theo tháng | Cộng `TotalAmount` của đơn `COMPLETED` theo tháng, 6–12 tháng gần nhất |
| 3 | Số đơn theo tháng | Đếm đơn theo tháng |
| 4 | Tỷ lệ lấp đầy | `số đêm đã đặt / tổng số đêm khả dụng` của tháng đó (chỉ tính đơn `COMPLETED` + `CHECKED_IN`) |
| 5 | Top phòng được đặt nhiều nhất | 5 phòng, đếm số đơn |
| 6 | Tỷ lệ đơn theo trạng thái | Để vẽ biểu đồ tròn |

### 15.2 API
`GET /api/admin/statistics/summary` · `/revenue?months=12` · `/occupancy?year=` · `/top-rooms?limit=5` · `/booking-status`

### 15.3 Phần cần tạo
**Backend:** `Services/StatisticsService.cs` · `Controllers/StatisticsController.cs` · `DTOs/StatisticsDtos.cs`
**Frontend:** `pages/Admin/Dashboard.tsx` · `components/charts/RevenueChart.tsx` · `OccupancyChart.tsx` · `BookingStatusPie.tsx` · `StatCard.tsx` (dùng thư viện `recharts`)

### 15.4 Cách kiểm tra
Dashboard hiện số liệu khớp với database; biểu đồ doanh thu vẽ đúng các tháng có đơn `COMPLETED`.

---

# BƯỚC 16 — Đánh giá & nhận xét (Use Case 14)
**Thời gian: 2,5 giờ · Ngày 10 (buổi chiều)**

### 16.1 Quy tắc nghiệp vụ
- Chỉ được đánh giá khi đơn ở trạng thái **`COMPLETED`** (đã trả phòng)
- **1 đơn chỉ 1 đánh giá** (chặn bằng unique index trên `BookingId`)
- Rating từ 1 đến 5 sao
- Sau mỗi đánh giá → cập nhật `rooms.RatingAvg` và `RatingCount`
- Khách tự xoá/sửa đánh giá của mình được không → **không**, chỉ Admin

### 16.2 API
| Method | Đường dẫn | Quyền |
|--------|-----------|-------|
| POST | `/api/reviews` | Khách (chỉ chủ đơn `COMPLETED`) |
| GET | `/api/rooms/{id}/reviews` | Công khai |
| GET | `/api/admin/reviews` | Admin |
| DELETE | `/api/admin/reviews/{id}` | Admin (xoá đánh giá vi phạm) |
| PUT | `/api/admin/reviews/{id}/hide` | Admin (ẩn vi phạm) |

### 16.3 Phần cần tạo
**Frontend:** `components/ReviewForm.tsx` (chấm sao) · `components/StarRating.tsx` (hiển thị) · `pages/Admin/Reviews.tsx` (duyệt/ẩn/xoá)

### 16.4 Cách kiểm tra
- Cố đánh giá đơn chưa `COMPLETED` → bị từ chối
- Đánh giá 1 lần rồi thử đánh giá lại → bị từ chối
- Đánh giá xong → rating trung bình trên trang phòng thay đổi
- Admin ẩn đánh giá → không hiện nữa

---

# BƯỚC 17 — Hoàn thiện giao diện & trải nghiệm
**Thời gian: 3 giờ · Ngày 11**

### 17.1 Việc cần làm
1. Responsive: Ảnh 3.16–3.22 trong báo cáo cần chạy được trên điện thoại
2. Trạng thái **Loading** (đang tải), **Error** (lỗi), **Empty** (không có dữ liệu) cho mọi danh sách
3. Thông báo bằng **Toast** khi thành công / thất bại
4. Trang 404, trang không có quyền truy cập
5. Nút quay lại đầu trang, tiêu đề trang đầy đủ

### 17.2 Phần cần tạo
`context/ToastContext.tsx` · `components/common/Button.tsx` · `Input.tsx` · `Modal.tsx` · `Spinner.tsx` · `EmptyState.tsx` · `Pagination.tsx` · `ConfirmDialog.tsx`

### 17.3 Cách kiểm tra
Thu nhỏ cửa sổ trình duyệt xuống kích thước điện thoại → mọi trang dùng được, không tràn ngang. Tắt mạng giả lập → hiện thông báo lỗi thay vì trang trắng.

---

# BƯỚC 18 — Kiểm thử
**Thời gian: 3 giờ · Ngày 12**

### 18.1 Bộ test case bắt buộc (lập bảng trong báo cáo mục 4.4.1)

| STT | Tên test | Kỳ vọng | Kết quả |
|-----|----------|---------|---------|
| 1 | Đăng ký email đã tồn tại | Báo lỗi, không tạo tài khoản | ☐ |
| 2 | Đăng nhập sai mật khẩu | Báo lỗi 401 | ☐ |
| 3 | Khách truy cập API của Admin | Bị chặn 403 | ☐ |
| 4 | Khách xem đơn của người khác | Bị chặn 403 | ☐ |
| 5 | Tìm phòng theo ngày có đơn sẵn | Phòng đó không xuất hiện | ☐ |
| 6 | **Đặt phòng trùng khung giờ** | Bị từ chối, không tạo đơn | ☐ |
| 7 | Đặt theo giờ dưới 3 tiếng | Bị từ chối | ☐ |
| 8 | Đặt phưa hơn 2 giờ | Bị từ chối | ☐ |
| 9 | Đặt vượt sức chứa phòng | Bị từ chối | ☐ |
| 10 | Sửa giá phòng sau khi đã có đơn | Đơn cũ giữ nguyên giá | ☐ |
| 11 | Hủy đơn đã check-in | Bị từ chối | ☐ |
| 12 | Xóa phòng đang có đơn | Bị từ chối | ☐ |
| 13 | Xóa địa điểm đang có phòng | Bị từ chối | ☐ |
| 14 | Đặt phòng trong 2 giờ vệ sinh | Bị từ chối | ☐ |
| 15 | Đánh giá đơn chưa hoàn tất | Bị từ chối | ☐ |
| 16 | Đánh giá 2 lần cùng 1 đơn | Bị từ chối | ☐ |
| 17 | Khách bị khoá đăng nhập | Báo tài khoản bị khoá | ☐ |
| 18 | Vào `/admin` bằng tài khoản khách | Bị chuyển hướng | ☐ |

### 18.2 Cách làm
- Tạo collection Postman từ các API đã có, **export ra file** `docs/api/postman_collection.json`
- Chụp ảnh kết quả từng test (đặc biệt là 6 test chứng minh chống trùng) đưa vào báo cáo
- Test thủ công trên trình duyệt theo checklist trên

### 18.3 Kết quả bàn giao
File collection + bảng kết quả test có ảnh. **Đây là phần GVHD chấm điểm, không được bỏ trống.**

---

# BƯỚC 19 — Chèn hình cho Chương 3 (báo cáo)
**Thời gian: 4 giờ · Nên làm SONG SONG từ Bước 5, không dồn cuối**

### 19.1 Việc cần làm
Báo cáo có **22 vị trí hình đang để trống**. Cần chèn đủ:

| Hình | Loại | Cách làm | Bước code tương ứng |
|------|------|----------|--------------------|
| 3.1 | Biểu đồ tác nhân | draw.io / PlantUML | Bước 5 |
| 3.2 | Use Case tổng quát | draw.io / PlantUML | Bước 7–16 |
| 3.3 | Use Case quản lý tài khoản | draw.io | Bước 5 |
| 3.4 | Use Case tìm kiếm & đặt phòng | draw.io | Bước 7–10 |
| 3.5 | Use Case quản lý đặt phòng | draw.io | Bước 11, 13 |
| 3.6 | Use Case quản lý phòng | draw.io | Bước 12 |
| 3.7 | Use Case quản trị hệ thống | draw.io | Bước 12–15 |
| 3.8 | Kiến trúc hệ thống | draw.io | Bước 2 |
| 3.9 | Biểu đồ lớp thực thể | draw.io (lấy từ entity) | Bước 3 |
| 3.10 | **ERD** | draw.io hoặc dbdiagram.io | Bước 3 |
| 3.11 | Biểu đồ tuần tự đăng nhập | draw.io | Bước 5 |
| 3.12 | Biểu đồ tuần tự tìm kiếm phòng | draw.io | Bước 7 |
| 3.13 | Biểu đồ tuần tự đặt phòng | draw.io | Bước 10 |
| 3.14 | Biểu đồ tuần tự check-in/check-out | draw.io | Bước 13 |
| 3.15 | Biểu đồ tuần tự quản lý phòng | draw.io | Bước 12 |
| 3.16 | Giao diện trang chủ | **ảnh chụp thật** | Bước 6 |
| 3.17 | Giao diện tìm kiếm phòng | ảnh chụp thật | Bước 7 |
| 3.18 | Giao diện chi tiết phòng | ảnh chụp thật | Bước 8 |
| 3.19 | Giao diện đặt phòng | ảnh chụp thật | Bước 10 |
| 3.20 | Giao diện quản lý đặt phòng | ảnh chụp thật | Bước 13 |
| 3.21 | Giao diện quản trị hệ thống | ảnh chụp thật | Bước 15 |
| 3.22 | Giao diện quản lý phòng | ảnh chụp thật | Bước 12 |

**Công cụ gợi ý:** [app.diagrams.net](https://app.diagrams.net) (miễn phí, không cần cài) hoặc [plantuml.com](https://www.plantuml.com/plantuml) (viết code sinh hình tự động — nhanh hơn nhiều).

### 19.2 Quy tắc khi chèn
- Đặt ảnh **đúng số Hình** đã ghi trong báo cáo
- Chèn **kèm chú thích** bên dưới: *"Hình 3.13. Biểu đồ tuần tự chức năng đặt phòng"* — chữ nhỏ hơn nội dung, căn giữa
- Ảnh giao diện chụp ở kích thước cửa sổ sạch, không lộ thanh địa chỉ trình duyệt

### 19.3 Cách kiểm tra
Mở báo cáo, đi từ trang 1 đến hết → không còn dòng nào ghi "Hình 3.x" mà không có ảnh đi kèm.

---

# BƯỚC 20 — Viết Chương 4
**Thời gian: 6 giờ · Chia làm 4 lần viết, mỗi lần 1,5 giờ · Xong trước ngày 18**

### 20.1 Cấu trúc Chương 4

**4.1 Triển khai chức năng cho khách hàng**
Mỗi mục = 1 ảnh chụp thật + giải thích:
- 4.1.1 Đăng ký / đăng nhập → *Hình 4.1, 4.2*
- 4.1.2 Tìm kiếm & lọc phòng → *Hình 4.3*
- 4.1.3 Chi tiết phòng → *Hình 4.4*
- 4.1.4 Kiểm tra phòng trống → *Hình 4.5* (kèm giải thích thuật toán chồng lấn khoảng thời gian)
- 4.1.5 Đặt phòng theo giờ / theo ngày → *Hình 4.6, 4.7* (kèm công thức tính tiền)
- 4.1.6 Quản lý đơn của tôi, hủy đơn → *Hình 4.8*
- 4.1.7 Đánh giá phòng → *Hình 4.9*

**4.2 Triển khai chức năng cho quản trị viên**
- 4.2.1 Dashboard thống kê → *Hình 4.10*
- 4.2.2 Quản lý địa điểm → *Hình 4.11*
- 4.2.3 Quản lý phòng, ảnh, tiện nghi → *Hình 4.12, 4.13*
- 4.2.4 Quản lý đơn: xác nhận / từ chối / check-in / check-out → *Hình 4.14, 4.15*
- 4.2.5 Quản lý khách hàng → *Hình 4.16*
- 4.2.6 Quản lý đánh giá → *Hình 4.17*

**4.3 Kiểm thử và triển khai ứng dụng**
- 4.3.1 Kiểm thử → bảng 18 test case ở Bước 18.1 + ảnh Postman
- 4.3.2 Đóng gói ứng dụng → mô tả `docker-compose up --build` (1 cụm, 1 lệnh)
- 4.3.3 Triển khai ứng dụng → ảnh chạy thử, địa chỉ truy cập, tài khoản demo

**4.4 Kết luận chương** (nếu mẫu có yêu cầu)

### 20.2 Công thức viết cho mỗi mục (bám theo đúng đó, giáo viên dễ chấm)
```
[Ảnh chụp màn hình]

<Giải thích chức năng làm gì> 2–3 câu, nêu rõ luồng nghiệp vụ.

Các quy tắc nghiệp vụ đã áp dụng: liệt kê từng quy tắc dưới dạng gạch đầu dòng.

[Có thể kèm 1 đoạn code then chốt — 5–10 dòng, in đậm tên hàm]
```

### 20.3 Mẹo
- **Chụp ảnh ngay khi xong mỗi bước code**, đừng đợi cuối kỳ mới quay lại chụp
- Lưu ảnh vào `docs/screenshots/`, đặt tên theo số Hình: `4-05-dat-phong.png`
- Chụp ảnh nền trắng/sạch, cửa sổ trình duyệt không có tab lạ

---

# BƯỚC 21 — Kết luận, TLTK, slide, luyện trình bày
**Thời gian: 4 giờ · Ngày 18–20 · KHÔNG ĐỤNG VÀO CODE NỮA**

### 21.1 Kết luận
Viết theo mẫu, gồm 4 phần:
1. **Tóm tắt kết quả**: hệ thống đã đạt được những gì (liệt kê chức năng thực sự chạy)
2. **Ưu điểm**: ví dụ "chặn đặt trùng ở cả tầng nghiệp vụ và tầng cơ sở dữ liệu", "giá lưu snapshot bảo toàn lịch sử", "phân tách rõ 2 phân hệ"
3. **Hạn chế**: chưa tích hợp thanh toán trực tuyến, chưa có ứng dụng di động, mới triển khai trên localhost
4. **Hướng phát triển**: thanh toán VNPay/MoMo, thông báo email/sms, đa nhánh, ứng dụng mobile

### 21.2 Tài liệu tham khảo
Giữ 10 tài liệu đã có, kiểm tra lại ngày truy cập, bổ sung tài liệu công nghệ mới dùng (nếu có).

### 21.3 Slide thuyết trình (15–20 slide)
1. Bìa — tên đồ án, tên SV, GVHD
2. Lý do chọn đề tài
3. Mục tiêu & phạm vi
4. Công nghệ sử dụng
5. Phân tích nghiệp vụ
6. Tác nhân + Use case tổng quát
7. Kiến trúc hệ thống
8. **ERD**
9. Biểu đồ tuần tự đặt phòng
10. Giao diện khách: tìm kiếm
11. Giao diện khách: đặt phòng
12. Giao diện Admin: dashboard
13. Giao diện Admin: quản lý đơn
14. Nghiệp vụ chống đặt trùng (giải thích kỹ)
15. Bảng kết quả kiểm thử
16. Kết luận & hướng phát triển

### 21.4 Luyện trình bày
- Luyện **ít nhất 3 lần**, mỗi lần **đo bằng đồng hồ**, phải **≤ 15 phút**
- Lần 1: đọc theo slide → luyện nhịp nói
- Lần 2: nhìn slide thật, không đọc → tập chuyển ý mượt
- Lần 3: **không có slide**, chỉ tay vào phần demo → giả lập bị GVHD hỏi

### 21.5 Chuẩn bị trả lời câu hỏi phản biện
| Câu hỏi dễ bị hỏi | Chuẩn bị sẵn câu trả lời |
|------------------|--------------------------|
| Vì sao chọn kiến trúc này? | So sánh 3 lớp Controller–Service–Data, chỉ ra vì sao tách Service |
| Làm sao chống đặt trùng? | Giải thích thuật toán khoảng thời gian chồng lấn + transaction + index |
| Vì sao lưu giá snapshot? | Bảo toàn lịch sử khi giá phòng thay đổi |
| Phân quyền thế nào? | JWT + role + middleware, kiểm tra ở cả API lẫn route |
| Nếu 2 người đặt cùng lúc? | Giải thích transaction và ràng buộc ở database |
| Phần nào tốn thời gian nhất? | Trả lời trung thực, nêu rõ đã cải thiện cách gì |
| Dùng AI thì sao? | Báo cáo mục 2.4.2 đã có "Vibe Coding" — nói rõ mình **kiểm tra lại** phần nào, quyết định thiết kế nào là của mình |

---

## PHẦN D — LỊCH THEO NGÀY (3 tuần)

| Ngày | Bước | Việc kèm theo |
|------|------|---------------|
| **1** | Bước 1, 2 | Sửa các chỗ trong báo cáo ở mục A2 (30 phút) |
| **2** | Bước 3, 4 | Vẽ sẵn 5 hình Use Case + ERD (Bước 19) |
| **3** | Bước 5 | Vẽ biểu đồ tuần tự đăng nhập |
| **4** | Bước 6, 7 | Chụp ảnh trang chủ, trang tìm kiếm |
| **5** | Bước 8, 9 | Vẽ biểu đồ lớp + tuần tự tìm kiếm |
| **6** | Bước 10, 11 | **Viết 4.1 trong báo cáo** + chụp ảnh |
| **7** | Bước 12 (1/2) | |
| **8** | Bước 12 (2/2) | Vẽ tuần tự quản lý phòng |
| **9** | Bước 13, 14 | **Viết 4.2 (1/2)** + chụp ảnh |
| **10** | Bước 15, 16 | Vẽ tuần tự check-in/out |
| **11** | Bước 17 | **Viết 4.2 (2/2)** + chụp ảnh |
| **12** | Bước 18 | Chạy 18 test case, lập bảng kết quả |
| **13** | Bước 19 (dỡ hình còn thiếu) | **Viết 4.3 (kiểm thử + đóng gói)** |
| **14** | Nghỉ / sửa lỗi | |
| **15** | **Viết xong Chương 4** | |
| **16** | Kết luận + TLTK | |
| **17** | Làm slide | |
| **18** | Luyện trình bày lần 1, 2 | Chuẩn bị bộ dữ liệu demo |
| **19** | Luyện trình bày lần 3 + chạy thử từ máy sạch | |
| **20** | Dự phòng | Không code thêm, chỉ sửa lỗi |

**Mốc cứng: hết ngày 15 phải xong Chương 4.** Từ đó chỉ luyện nói.

---

## PHẦN E — NẾU BỊ TRƯỞI TIẾN ĐỘ (cắt theo thứ tự)

| Thứ tự | Cắt gì | Còn lại gì |
|--------|--------|-----------|
| 1 | Quản lý tài khoản khách (Bước 14) | Khóa tài khoản làm trong trang quản lý đơn, hoặc bỏ luôn |
| 2 | Quản lý tiện nghi riêng (Bước 12) | Tiện nghi nhập tay khi tạo phòng, giữ nguyên bảng dữ liệu |
| 3 | Biểu đồ lịch phòng (Bước 13 mục 8) | Chỉ cần danh sách đơn |
| 4 | Tỷ lệ lấp đầy (Bước 15 mục 4) | Còn doanh thu + top phòng + tổng quan |
| 5 | Trạng thái `MAINTENANCE` | Còn AVAILABLE/BOOKED/OCCUPIED/CLEANING |
| 6 | Ẩn/xóa đánh giá (Bước 16) | Khách xem đánh giá, Admin chỉ xem |

**Không bao giờ cắt:** chức năng 1 (tài khoản) · 2 (tìm kiếm) · 3 (chi tiết phòng) · 4 (kiểm tra trống) · 5, 6 (đặt phòng) · 7 (quản lý đơn) · 8, 9 (check-in/out + trạng thái phòng) · 11 (quản lý phòng) · 15 (thống kê) · Chương 4 + ảnh.

---

## PHẦN F — CHECKLIST TRƯỚC KHI BẢO VỆ

- [ ] Báo cáo đủ 4 chương + kết luận + TLTK, đúng bìa UTEHY, có chữ ký cam đoan
- [ ] **22 hình ở Chương 3 đã chèn đủ**, không còn dòng "Hình 3.x" trống
- [ ] Chương 4 có ảnh chụp thật của **đúng hệ thống đang chạy**
- [ ] Không còn chỗ nào ghi "nhân viên" trong báo cáo
- [ ] SQL Server / MySQL đã thống nhất
- [ ] Chạy `docker compose up --build` từ máy sạch → hệ thống lên được
- [ ] Có tài khoản demo ghi rõ trong README: `admin@homestay.vn` / `123456`
- [ ] Có 18 test case với kết quả thật, có ảnh
- [ ] Slide 15–20 trang, luyện nói **≥ 3 lần**, **≤ 15 phút**
- [ ] Git có lịch sử đều đặn, đẩy lên GitHub
- [ ] Đã đọc mục 2.4.2 "Vibe Coding" để trả lời câu hỏi về AI

---

**Bắt đầu ngay với BƯỚC 1.** Xong Bước 1–2 thì báo mình, mình sẽ viết code khung project giúp t.
