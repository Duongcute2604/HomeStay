# KẾ HOẠCH TRIỂN KHAI — HỆ THỐNG ĐẶT PHÒNG & QUẢN LÝ HOMESTAY (Đồ án 4)

> 📌 **Bản chi tiết từng bước nằm ở file [`KE_HOACH_TRIEN_KHAI_CHI_TIET.md`](./KE_HOACH_TRIEN_KHAI_CHI_TIET.md)** — đọc file đó để làm.
> Phạm vi chốt: **2 tác nhân — Khách (Customer) và Admin. Bỏ hẳn nhân viên.** Check-in/check-out do Admin thực hiện.

> Người thực hiện: Nguyễn Hải Nam — 12523W.1
> GVHD: TS. Hồng Quốc Việt
> Thời điểm lập kế hoạch: 29/09/2026
> Hạn bảo vệ dự kiến: **~20/10/2026** (2–3 tuần)

---

## 0. TÌNH HUỐNG HIỆN TẠI — ĐỌC TRƯỚC KHI BẮT TAY

| Việc | Trạng thái |
|------|-----------|
| Báo cáo Chương 1 (Tổng quan đề tài) | ✅ Đã viết |
| Báo cáo Chương 2 (Cơ sở lý thuyết) | ✅ Đã viết |
| Báo cáo Chương 3 (Phân tích thiết kế: UC, kiến trúc, ERD, sequence, UI) | ✅ Đã viết, có ảnh |
| Báo cáo Chương 4 (Triển khai + Kiểm thử) | ❌ **Trống — ưu tiên số 1** |
| Kết luận + TLTK | ⚠️ Có sẵn nhưng cần rà lại khớp với code cuối |
| Ảnh giao diện chụp sẵn | ✅ Có 5 ảnh trong thư mục `hệ thống/` |
| Code ứng dụng | ❌ Đang code lại từ đầu trong thư mục `Homestay/` |
| Môi trường | ⚠️ Có Node 24 + Docker, **thiếu .NET SDK** |

**Kết luận chiến lược:** Phần *tài liệu* đã đi xa hơn phần *code*. Vì vậy ưu tiên là:
**(1) Dựng app chạy được thật → (2) Chụp màn hình chính app đó → (3) Đổ vào Chương 4.**
Viết Chương 4 **song song** chứ đừng để đến cuối mới viết (2–3 tuần là rất ngắn).

---

## 1. CHỐT CÔNG NGHỆ — KHÔNG ĐỔI SAU BÁO CÁO ĐÃ CÓ

Báo cáo hiện tại đã ghi rõ: React + TypeScript + Vite · ASP.NET Core Web API · Entity Framework Core · MySQL.
Giữ nguyên. Lý do:

1. Báo cáo Chương 1.2.2 và Chương 2.3/2.4 đã viết theo hướng này → đổi stack = viết lại 2 chương lý thuyết.
2. Đồ án 2, 3 của t cũng theo hướng C# end-to-end → đồng bộ với chuyên ngành Phát triển ứng dụng phần mềm.
3. Cài .NET SDK mất ~15 phút, không phải vấn đề với tiến độ.

| Tầng | Công nghệ | Ghi chú |
|------|-----------|---------|
| Frontend | React 18 + TypeScript + Vite | React Router v6 |
| | TailwindCSS | Responsive, mobile-first |
| | TanStack Query + Zustand | Server state + client state |
| | React Hook Form + Zod | Validate form |
| | Axios | Gọi REST API |
| Backend | ASP.NET Core Web API 8.0 | Kiến trúc: Controller → Service → Data Access |
| | Entity Framework Core 8 + Pomelo.MySql | Code-first + Migration |
| | JWT (Access + Refresh) | 2 vai trò: CUSTOMER, ADMIN |
| | Swagger / OpenAPI | Chốt API contract |
| Database | MySQL 8.0 (Docker) | Có volume, không mất data |
| Deploy | Docker Compose | frontend + backend + mysql |

### ⚠️ Một điểm phải sửa trong báo cáo
Chương 1.2.2 đang ghi *"SQL Server"* trong khi Chương 2.4 ghi *"MySQL"*. Phải thống nhất về **MySQL** cho khớp với code thật.

---

## 2. CÀI ĐẶT MÔI TRƯỜNG (làm trong buổi tối đầu tiên, ~45 phút)

- [ ] Cài **.NET 8 SDK** (không cần quyền Admin)
      ```powershell
      # tải script cài không cần admin
      Invoke-WebRequest https://dot.net/v1/dotnet-install.ps1 -OutFile $env:TEMP\dotnet-install.ps1
      & $env:TEMP\dotnet-install.ps1 -Channel 8.0 -InstallDir "$env:LOCALAPPDATA\Microsoft\dotnet"
      # thêm vào PATH user
      [Environment]::SetEnvironmentVariable("Path",
        [Environment]::GetEnvironmentVariable("Path","User") + ";$env:LOCALAPPDATA\Microsoft\dotnet","User")
      ```
      Verify: `dotnet --version` → phải ra `8.x`
- [ ] Docker Desktop đã chạy → `docker --version`, `docker compose version`
- [ ] Git: `git --version`
- [ ] **Tạo repo git RIÊNG cho đồ án này** (không nhét vào repo `bai-tap-lon` — repo đó đang lẫn đồ án 3 và có nhiều file bị xóa lung tung)
      ```powershell
      cd "D:\bai tap lon\Đồ án 4- Đặt phòng\Homestay"
      git init
      ```
- [ ] Tạo `.gitignore` (node_modules, bin, obj, .env, uploads, dist)
- [ ] Tạo `README.md` (tên đồ án, cách chạy, tài khoản demo)

**Điều kiện "môi trường READY":** `dotnet build` OK · `npm run build` OK · MySQL container chạy · API Swagger mở được · FE gọi được API.

---

## 3. CẤU TRÚC THƯ MỤC

```
Homestay/
├── client/                     # React + TypeScript + Vite
│   └── src/
│       ├── api/                # axios client, interceptors
│       ├── components/         # UI dùng chung + component theo module
│       ├── context/            # AuthContext, ToastContext
│       ├── hooks/
│       ├── layouts/            # CustomerLayout, AdminLayout
│       ├── pages/              # Home, Rooms, RoomDetail, Booking,
│       │                       # Login, Register, MyBookings, Profile,
│       │                       # Admin/Dashboard, Admin/Rooms, Admin/Bookings, Admin/Reviews
│       ├── services/           # roomService, bookingService, ...
│       ├── types/
│       └── utils/              # formatVnd, formatDate
├── server/                     # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Data/                   # DbContext + Seed
│   ├── DTOs/
│   ├── Entities/
│   ├── Services/               # Business logic (tách riêng khỏi Controller)
│   ├── Middleware/
│   ├── Migrations/
│   └── Program.cs
├── docs/
│   ├── database/init_database.sql
│   ├── api/postman_collection.json
│   ├── screenshots/            # ẢNH CHỤP MÀN HÌNH cho Chương 4
│   └── weekly/                 # Báo cáo tuần theo mẫu 10123234_..._TuanN.docx
├── docker-compose.yml
└── README.md
```

**Quy tắc bất di bất dịch (đã có trong tài liệu cũ, giữ lại):**
1. Backend **không trả `id`** ở endpoint list/public; FE tự tính STT = `index + 1 + page * size`.
2. Chữ → `text-left`; số/tiền → `text-right` + class `.number-vn`.
3. Tiền VND format `Intl.NumberFormat('vi-VN')` → `500.000 ₫`.
4. Business logic nằm ở **Service**, Controller chỉ tiếp nhận/validate/trả response.

---

## 4. THIẾT KẾ DATABASE (chốt trước khi viết API — 1 buổi)

### 4.1. Các bảng

| Bảng | Mô tả | Ghi chú |
|------|-------|---------|
| `users` | Tài khoản | role: CUSTOMER / ADMIN (2 tác nhân), password hash (BCrypt), status |
| `locations` | Địa điểm homestay | tên, địa chỉ, tỉnh/thành, mô tả, ảnh |
| `rooms` | Phòng | location_id, tên, loại, sức chứa, `price_per_hour`, `price_per_day`, `status` (AVAILABLE/BOOKED/OCCUPIED/CLEANING), `rating_avg` |
| `room_images` | Ảnh phòng | room_id, path, thứ tự |
| `amenities` | Tiện nghi | WiFi, máy lạnh, bồn tắm... |
| `room_amenities` | N-N | room_id ↔ amenity_id |
| `bookings` | Đơn đặt phòng | `code` (mã hiển thị cho người dùng), user_id, room_id, check_in, check_out, mode (HOUR/DAY), số giờ/ngày, **tổng tiền snapshot**, status, giờ nhận/trả |
| `booking_status_history` | Lịch sử trạng thái | booking_id, from, to, người thực hiện, thời điểm |
| `reviews` | Đánh giá | booking_id, user_id, rating 1–5, nội dung |
| `notifications` | Thông báo *(Bước 23, tuỳ chọn)* | user_id, tiêu đề, nội dung, read_at — **CHƯA LÀM** |
| `payments` | *(Bước 22, tuỳ chọn)* | booking_id, số tiền, trạng thái, phương thức — **CHƯA LÀM** |

> ⚠️ **Bảng `notifications` và `payments` KHÔNG nằm trong 9 bảng của Bước 3.**
> Đề xuất làm sau cùng, chỉ khi Bước 1–21 xong hết và còn ≥ 3 ngày → xem `todo.md` Giai đoạn 8.
> Trong lúc chưa làm: **không tạo bảng rng**, không để lại model/service chờ sẵn (YAGNI).

**Quy tắc:** mỗi bảng có `created_at`, `updated_at`, soft-delete (`is_deleted`) cho dữ liệu nghiệp vụ.
**Index bắt buộc** (báo cáo có nhắc): `rooms(location_id)`, `bookings(room_id)`, `bookings(check_in, check_out)`, `bookings(status)`.

### 4.2. Quy tắc nghiệp vụ (nhất quán với Chương 3 của báo cáo)

- Check-in: **14:00** · Check-out: **12:00** hôm sau
- Phải đặt trước thời điểm nhận phòng **ít nhất 2 giờ**
- Đặt theo giờ: **tối thiểu 3 giờ** → `tổng tiền = số giờ × price_per_hour`
- Đặt theo ngày: `tổng tiền = số ngày × price_per_day`
- Vòng đời phòng: `OCCUPIED → CLEANING (2h) → AVAILABLE`
- **Giá lưu snapshot** trong booking: sửa giá phòng sau này không làm đổi lịch sử
- **Chống đặt trùng**: trước khi tạo booking phải kiểm tra phòng có booking nào `không bị hủy/từ chối` trong khoảng thời gian đó (đây là nghiệp vụ trọng tâm, GVHD sẽ hỏi)
- Chỉ được đánh giá sau khi booking ở trạng thái `COMPLETED`; 1 booking chỉ 1 đánh giá

### 4.3. Seed data (dùng để demo với GVHD — làm sớm, đừng để cuối)
- 3 tài khoản: 1 admin, 1 host, 2-3 khách (mật khẩu `123456`)
- 3 địa điểm, 8-10 phòng, mỗi phòng 3-4 ảnh, 8 tiện nghi
- 10-15 booking với trạng thái khác nhau (để Dashboard có số liệu)
- 5-6 review

---

## 5. LỘ TRÌNH 3 TUẦN

### 🗓️ TUẦN 1 — NỀN TẢNG (ngày 1 → 7)
*Mục tiêu: app chạy được, đăng ký/đăng nhập được, xem được danh sách phòng.*

| # | Việc | Ưu tiên |
|---|------|---------|
| 1 | Cài .NET SDK, dựng git repo, `.gitignore`, `README` | 🔴 Ngày 1 |
| 2 | Khởi tạo `server/` (dotnet new webapi), nối MySQL qua Docker, chạy migration đầu tiên | 🔴 |
| 3 | Viết entities + `DbContext` + **seed data** | 🔴 |
| 4 | Auth: đăng ký, đăng nhập, JWT access + refresh, middleware phân quyền (2 role) | 🔴 |
| 5 | Khởi tạo `client/` (Vite + TS + Tailwind), layout, router, đăng nhập/đăng ký | 🔴 |
| 6 | API + UI: danh sách phòng, chi tiết phòng (kèm ảnh, tiện nghi) | 🟡 |
| 7 | Tìm kiếm & lọc: theo từ khóa, ngày nhận/trả, giá, sức chứa, sắp xếp, phân trang | 🟡 |
| 8 | **Viết Chương 4 mục 4.1 song song** + chụp ảnh các màn hình đã xong | 🔴 |

### 🗓️ TUẦN 2 — NGHIỆP VỤ LÕI (ngày 8 → 14)
*Mục tiêu: đặt phòng chạy đúng nghiệp vụ, có trang quản trị.*

| # | Việc | Ưu tiên |
|---|------|---------|
| 9 | API đặt phòng: tạo booking, **kiểm tra trùng lịch**, tính tiền, sinh mã đơn | 🔴 |
| 10 | UI: form đặt phòng (chế độ giờ/ngày), trang "Đơn của tôi", hủy đơn | 🔴 |
| 11 | Vòng đời trạng thái: `PENDING → CONFIRMED → CHECKED_IN → COMPLETED / CANCELLED` + `BookingStatusHistory` | 🔴 |
| 12 | Trang quản trị: Dashboard, CRUD phòng, duyệt/hủy đơn, quản lý địa điểm & tiện nghi | 🔴 |
| 13 | Thống kê: doanh thu theo tháng, tỷ lệ lấp đầy, top phòng (biểu đồ) | 🟡 |
| 14 | Đánh giá & nhận xét (chỉ sau khi `COMPLETED`) | 🟡 |
| 15 | **Viết Chương 4 tiếp + chụp ảnh** | 🔴 |

### 🗓️ TUẦN 3 — Hoàn thiện, kiểm thử, bảo vệ (ngày 15 → 21)
*Mục tiêu: không còn tính năng mới, chỉ có tài liệu + demo + luyện trình bày.*

| # | Việc | Ưu tiên |
|---|------|---------|
| 16 | Responsive (mobile) + trạng thái Loading/Error/Empty + Toast | 🔴 |
| 17 | Kiểm thử: bộ test case chống đặt trùng, hủy booking, phân quyền, ràng buộc xóa | 🔴 |
| 18 | Xuất Postman collection + ảnh kết quả test | 🟡 |
| 19 | **Viết xong Chương 4 + Kết luận + rà TLTK** | 🔴 |
| 20 | Làm slide thuyết trình (15–20 slide) + **luyện nói 3 lần** | 🔴 |
| 21 | Chuẩn bị demo: seed data đẹp, dựng sẵn DB, chạy thử offline, quay video 3–5 phút | 🔴 |
| 22 | Chốt sửa theo nhận xét GVHD (nếu có) | 🟡 |

> **Mốc cứng (deadline nộp):** Chương 4 phải xong **muộn nhất hết ngày 18**. Từ đó chỉ còn sửa lỗi chính tả + luyện nói.

---

## 6. VIỆC PHẢI LÀM SONG SONG VỚI CODE (dễ bị bỏ sót nhất)

| Tài liệu | Trạng thái | Việc cần làm |
|-----------|-----------|--------------|
| Báo cáo Chương 1 | ✅ xong | Sửa "SQL Server" → "MySQL" cho khớp |
| Báo cáo Chương 2 | ✅ xong | Rà lại khớp tên thư viện |
| Báo cáo Chương 3 | ✅ xong | Đối chiếu tên bảng/API với code thật |
| Báo cáo Chương 4 | ❌ trống | **Viết mới, có ảnh chụp thật từ app** |
| Kết luận & hạn chế | ⚠️ | Viết lại theo kết quả thực tế + hướng phát triển |
| Slide thuyết trình | ❌ | Làm từ cuối Tuần 2 |
| Báo cáo tuần (Tuan5, Tuan6...) | ❌ | Theo mẫu `10123234_NguyenHaiNam_Do_An_4_TuanN.docx` |

**Quy tắc viết Chương 4:** mỗi mục = 1 ảnh chụp thật + 1 đoạn giải thích nghiệp vụ + (nếu có) 1 đoạn code then chốt. Ảnh lưu vào `docs/screenshots/`, nhúng vào Word.

---

## 7. DANH SÁCH CẮT (để cứu mạng khi trượt tiến độ)

Cắt theo thứ tự, không cắt những mục trước:

1. 🔴 **Thanh toán** (Bước 22) — đã dời xuống **cuối cùng**, làm sau Bước 1–21. Báo cáo đã ghi là *chức năng giới hạn* → nếu không kịp thì viết vào mục "Hướng phát triển" là được điểm.
2. 🔴 **Upload ảnh thật từ máy** — dùng ảnh mẫu trong `uploads/` là được
3. 🟡 **Thông báo / nhắc check-in** (Bước 23) — đã dời xuống **cuối cùng**, cũng chỉ làm nếu còn thời gian
4. 🟡 **Phân trang nâng cao / nhiều bộ lọc** — giữ phân trang cơ bản
5. 🟢 **Dark mode, i18n, đa ngôn ngữ** — không làm

> **Thứ tự ưu tiên nếu chỉ đủ làm 1 cái trong 2 mục mở rộng:** làm **Thông báo** trước.
> Nó ít code hơn, thấy rõ ngay trên giao diện, và không sinh mâu thuẫn với báo cáo.

**Tuyệt đối KHÔNG cắt:** Auth, tìm kiếm phòng trống theo ngày, đặt phòng, chống đặt trùng, quản lý đơn, Dashboard thống kê, ảnh chụp Chương 4.

---

## 8. RỦI RO & CÁCH XỬ LÝ

| Rủi ro | Khả năng | Cách xử lý |
|--------|----------|-----------|
| Cài .NET SDK lỗi | Trung bình | Dùng `dotnet-install.ps1` không cần Admin; backup: chạy backend bằng Docker |
| Docker chạy nặng / lỗi | Trung bình | Chuyển sang MySQL cài local (MySQL Installer hoặc XAMPP) |
| Báo cáo trễ | **Cao** | Viết Chương 4 song song từ Tuần 1, không để cuối kỳ |
| Seed data bẩn, demo rối | Trung bình | Chuẩn bị sẵn DB demo + script reset từ đầu Tuần 3 |
| Trượt tiến độ | Cao | Áp dụng mục 7 ngay khi trễ 2 ngày |
| Mất code / hỏng máy | Thấp | Commit git **mỗi ngày 1 lần**, push lên GitHub |
| GVHD hỏi về phần làm AI | Cao | Báo cáo đã có mục 2.4.2 "Vibe Coding" → phải nắm rõ để trả lời phản biện |

---

## 9. CHECKLIST BẢO VỆ

- [ ] Báo cáo đủ 4 chương + Kết luận + TLTK, đúng mẫu bìa UTEHY, có chữ ký cam đoan
- [ ] App chạy được từ đầu máy lạ (không lỗi) — thử bằng cách tắt Docker rồi bật lại
- [ ] Có tài khoản demo ghi trong README
- [ ] Có slide + luyện trình bày ≥ 3 lần, **đo bằng đồng hồ phải ≤ 15 phút**
- [ ] Sẵn sàng trả lời: vì sao chọn kiến trúc này, vì sao chống trùng lịch bằng cách này, đã test thêm ca nào
- [ ] Chuẩn bị 1–2 câu hỏi phản biện từ GVHD và câu trả lời

---

## 10. BƯỚC TIẾP THEO NGAY BÂY GIỜ

1. Tôi cài `.NET SDK` + dựng `docker-compose` cho MySQL → xác nhận môi trường READY
2. Tôi khởi tạo `server/` và `client/` với cấu trúc ở mục 3
3. Tôi viết entities + `DbContext` + **seed data** đầy đủ (mục 4)
4. Tôi chạy migration, seed, bật Swagger
5. Chuyển sang phần Auth

Bắt đầu từ bước nào tuỳ t, nhưng **bước 1-4 nên xong trong ngày hôm nay** để có nền để viết báo cáo.
