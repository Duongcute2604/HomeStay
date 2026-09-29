# StayEasy — Hệ thống đặt phòng & quản lý Homestay

---

## 1. Hệ thống này là gì

Web app cho phép **khách** tìm kiếm homestay và đặt phòng theo **giờ** hoặc theo **ngày**;
**Admin** quản lý danh mục, vòng đời đơn đặt phòng và xem thống kê.

**Chỉ có 2 tác nhân:** Khách (`CUSTOMER`) và Admin (`ADMIN`).

**Phạm vi đã chốt (9 bảng CSDL):** `users` · `locations` · `rooms` · `room_images` ·
`amenities` · `room_amenities` · `bookings` · `booking_status_history` · `reviews`

> **Thanh toán** (`payments`) và **thông báo** (`notifications`) **không nằm trong phạm vi**.
> Đã ghi vào kế hoạch làm sau cùng (Bước 22 & 23), chỉ khi còn thời gian — xem `todo.md` Giai đoạn 8.

---

## 2. Ngăn xếp công nghệ

| Tầng | Công nghệ | Phiên bản ghim |
|---|---|---|
| **Frontend** | React + TypeScript | React **18.3.1** · TypeScript **5.6.x** |
| | Vite | **5.4.x** |
| | TailwindCSS | **3.4.x** |
| | React Router | **6.28.x** |
| | TanStack Query | 5.x |
| | React Hook Form + Zod | 7.x · Zod **3.23.x** |
| | Zustand (dữ liệu phiên) | 4.x–5.x |
| | Axios | 1.x |
| | Recharts (biểu đồ) | 2.x |
| **Backend** | ASP.NET Core Web API | **.NET 8.0** (SDK 8.0.425) |
| | Entity Framework Core | 8.0.x + **Pomelo.MySql 8.0.2** |
| | JWT Access + Refresh | JwtBearer 8.0.x |
| | Swagger | Swashbuckle 6.9.0 |
| **Database** | MySQL | **8.0 — chạy bằng Docker, cổng 3307** |
| **Kiểm thử** | xUnit + EF Core InMemory | 8.0.x |
| **Tiện ích** | Docker · Git · Node 24 · npm 11 | |

> ⚠️ **Phiên bản đã ghim cứng.** Không nâng cấp giữa chừng.
> Chi tiết lý do + danh sách đầy đủ: [`AGENTS.md` mục 1.1](#).

---

## 3. Yêu cầu cài đặt

| Công cụ | Phiên bản | Ghi chú |
|---|---|---|
| .NET SDK | 8.0.x | Cài kiểu user, không cần Admin |
| Node.js | 20 trở lên | Đã có 24.14.0 |
| Docker Desktop | 29.x | **Phải đang chạy** |
| Git | 2.x | |

---

## 4. Cách chạy dự án

```powershell
# Bước 1 — Chạy MySQL (cổng 3307, KHÔNG đụng dự án cũ)
docker compose up -d

# Bước 2 — Chạy API
cd server
dotnet run --project StayEasy
# → http://localhost:5080/swagger

# Bước 3 — Chạy web (mở terminal khác)
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Tài khoản dùng thử

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@stayeasy.vn` | `123456` |
| Khách | `khach1@gmail.com` | `123456` |
| Khách | `khach2@gmail.com` | `123456` |

> Tài khoản chưa có dữ liệu cho tới khi hoàn thành Mốc 2.

---

## 5. Cấu trúc thư mục

```text
Homestay/
├── server/                  ASP.NET Core Web API
│   ├── StayEasy/            code chính
│   │   ├── Controllers/     ← tiếp nhận, validate, trả response
│   │   ├── Services/        ← NGHIỆP VỤ (nơi duy nhất được viết test)
│   │   ├── Entities/        ← mô tả bảng CSDL
│   │   ├── Data/            ← DbContext + Seed
│   │   ├── DTOs/            ← đối tượng truyền ra ngoài (không lộ entity)
│   │   ├── Middleware/      ← bắt lỗi thống nhất
│   │   └── Migrations/      ← lịch sử cấu trúc CSDL
│   └── StayEasy.Tests/      ← unit test xUnit
├── client/                  React + TS + Vite
│   └── src/
│       ├── api/ components/ context/ hooks/
│       ├── layouts/ pages/ services/ types/ utils/
├── docs/                    báo cáo tiến độ, kiểm thử tay, ảnh
├── docker-compose.yml       MySQL 8 cổng 3307
├── AGENTS.md                BỘ QUY TẮC BẤT BIẾN — đọc trước khi code
├── todo.md                  21 bước chi tiết + mục tiêu đo được
├── lessons.md               bài học từ lỗi đã gặp
└── KE_HOACH_TRIEN_KHAI*.md  kế hoạch tổng quan & chi tiết
```

---

## 6. 5 MỐC QUAN TRỌNG

> Mỗi mốc = **một thứ chạy được**, mở trình duyệt thấy ngay.
> Chi tiết 21 bước nằm ở [`todo.md`](./todo.md).

### Mốc 1 — Nền chạy được

> Chạy `docker compose up` → mở web → thấy dữ liệu phòng thật từ MySQL.

| Việc | Bước |
|---|---|
| MySQL Docker + 9 bảng + seed data | 1–4 |
| API `/api/rooms` trả về danh sách phòng | 7 |
| Trang chủ hiện danh sách phòng | 7 |

**Cách kiểm chứng:** `docker compose ps` → MySQL healthy · mở `localhost:5173` thấy ≥ 10 phòng có tên, giá, ảnh.
**Trạng thái:** ⬜ Chưa làm

---

### Mốc 2 — Tài khoản & Khách tìm kiếm

> Đăng ký, đăng nhập, lọc phòng theo địa điểm/giá/số khách, xem chi tiết phòng.

| Việc | Bước |
|---|---|
| Đăng ký / đăng nhập / JWT refresh / hồ sơ / đổi mật khẩu | 5 |
| Danh sách & chi tiết địa điểm | 6 |
| Tìm kiếm + lọc + sắp xếp + phân trang | 7 |
| Trang chi tiết phòng (ảnh, tiện nghi, giá, đánh giá) | 8 |

**Cách kiểm chứng:** đăng nhập `khach1@gmail.com` / `123456` → lọc Hưng Yên, giá 500k–1tr, 2 khách → ra đúng danh sách.
**Trạng thái:** ⬜ Chưa làm

---

### Mốc 3 — Đặt phòng (⭐ giá trị cốt lõi)

> Kiểm tra phòng trống, đặt theo giờ/ngày, xem & huỷ đơn.

| Việc | Bước |
|---|---|
| Kiểm tra phòng trống theo khung giờ + 6 quy tắc nghiệp vụ | 9 |
| Đặt phòng theo giờ / theo ngày, chống đặt trùng | 10 |
| Đơn của tôi, huỷ đơn, lịch sử trạng thái | 11 |

**Cách kiểm chứng:** đặt phòng 2 đêm × 1.200.000 ₫ → tổng `2.400.000 ₫`, mã đơn `HS-...`; mở 2 tab cùng đặt 1 phòng cùng giờ → chỉ 1 đơn được tạo.
**Trạng thái:** ⬜ Chưa làm

---

### Mốc 4 — Admin vận hành

> Quản lý danh mục + vòng đời đơn + dashboard.

| Việc | Bước |
|---|---|
| CRUD địa điểm / tiện nghi / phòng (+ ảnh, + gán tiện nghi) | 12 |
| Xác nhận → Check-in → Check-out → Hoàn thành, đổi trạng thái phòng | 13 |
| Khoá / mở tài khoản khách | 14 |
| Dashboard 6 số liệu + biểu đồ | 15 |

**Cách kiểm chứng:** chạy trọn 1 vòng đời — khách đặt → Admin xác nhận → check-in → check-out → đặt lại phòng đó trong 2 giờ vệ sinh **bị từ chối**.
**Trạng thái:** ⬜ Chưa làm

---

### Mốc 5 — Hoàn thiện & báo cáo

> Đánh giá, giao diện mobile, kiểm thử, 22 hình, Chương 4.

| Việc | Bước |
|---|---|
| Đánh giá & nhận xét (chỉ đơn `COMPLETED`, 1 đơn 1 đánh giá) | 16 |
| Responsive 375px + Loading/Error/Empty + Toast | 17 |
| 18 test case tích hợp (Postman) | 18 |
| Chèn 22 hình vào Chương 3 | 19 |
| Viết Chương 4 | 20 |
| Kết luận + TLTK + slide + luyện trình bày | 21 |

**Cách kiểm chứng:** `docs/KIEM_THU_TAY.md` đạt ≥ 95% (78 kịch bản) · Chương 3 không còn dòng "Hình 3.x" trống.
**Trạng thái:** ⬜ Chưa làm

---

## 7. Quy tắc — ĐỌC TRƯỚC KHI CODE

| File | Nội dung |
|---|---|
| **[`AGENTS.md`](./AGENTS.md)** | ⭐ Bộ quy tắc bất biến: quy trình 6 bước, đặt tên, DRY/KISS/YAGNI/SOLID, quy tắc backend/frontend, kiểm thử |
| [`todo.md`](./todo.md) | 21 bước chi tiết, mỗi bước có mục tiêu đo được + cột Kết quả/Bằng chứng |
| [`lessons.md`](./lessons.md) | Bài học từ lỗi đã gặp — sai ở đâu, vì sao, lần sau tránh gì |
| [`docs/BAO_CAO_TIEN_DO.md`](./docs/BAO_CAO_TIEN_DO.md) | Tiến độ tổng quan |
| [`docs/KIEM_THU_TAY.md`](./docs/KIEM_THU_TAY.md) | 78 kịch bản kiểm thử tay đã điền sẵn kỳ vọng |

### Quy trình hoàn thành 1 chức năng

```
1. Viết code
2. Build sạch: 0 error, 0 warning
3. Chạy thử TAY 2–3 lần với 3 kịch bản khác nhau
   · Lần 1  Happy path
   · Lần 2  Edge case
   · Lần 3  Bất thường
4. Viết UNIT TEST cho logic nghiệp vụ — dotnet test xanh 100%
5. Ghi vào docs/BAO_CAO_TIEN_DO.md
6. Commit git
```

**Thiếu bước nào = chưa xong, không chuyển bước sau.**

---

## 8. Quy tắc hiển thị — KHÔNG ĐƯỢC VI PHẠM

| Loại dữ liệu | Cách hiển thị |
|---|---|
| Chữ, tên, địa chỉ, mô tả | `text-left` |
| **Số, tiền, diện tích, số khách** | `text-right` |
| Tiền VND | `500.000 ₫` (dấu chấm phân cách nghìn) |
| STT | Tự tính: `index + 1 + page * pageSize` |
| **Id nội bộ** | **Không bao giờ hiển thị** — đơn đặt phòng hiện mã `HS-250930-4821` |

---

## 9. Git

**Repo:** https://github.com/Duongcute2604/HomeStay (private)

- Nhánh chính: `main`
- Commit **mỗi ngày tối thiểu 1 lần**, theo Conventional Commits.
- Đẩy lên GitHub **hằng ngày** — mất máy là mất đồ án.

```powershell
git add -A
git commit -m "feat: them chuc nang dat phong theo gio"
git push
```
