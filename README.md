# HomeStay — Hệ thống đặt phòng & quản lý Homestay

Web app cho phép **khách** tìm kiếm homestay và đặt phòng theo **giờ** hoặc theo **ngày**; **Admin** quản lý danh mục, vòng đời đơn đặt phòng và xem thống kê.

**Chỉ có 2 tác nhân:** Khách (`CUSTOMER`) và Admin (`ADMIN`).

---

## 1. Chức năng chính

### Khách (Customer)
- Đăng ký / Đăng nhập / Quản lý hồ sơ / Đổi mật khẩu
- Tìm kiếm phòng theo địa điểm, giá, số khách, loại thuê (giờ/ngày)
- Xem chi tiết phòng (ảnh, tiện nghi, giá, đánh giá)
- Kiểm tra phòng trống theo khung giờ
- Đặt phòng theo giờ / theo ngày (chống đặt trùng)
- Xem đơn của tôi, huỷ đơn, lịch sử trạng thái
- Đánh giá sau khi hoàn thành

### Admin
- CRUD địa điểm, tiện nghi, phòng (+ ảnh, + gán tiện nghi)
- Quản lý vòng đời đơn: Xác nhận → Check-in → Check-out → Hoàn thành
- Cập nhật trạng thái phòng, khoá/mở tài khoản khách
- Dashboard: 6 số liệu + biểu đồ doanh thu, tỷ lệ lấp đầy

---

## 2. Ngăn xếp công nghệ

| Tầng | Công nghệ | Phiên bản |
|---|---|---|
| **Frontend** | React + TypeScript + Vite | React 18.3.1 · TS 5.6 · Vite 5.4 |
| | TailwindCSS | 3.4.x |
| | React Router | 6.28.x |
| | TanStack Query | 5.x |
| | React Hook Form + Zod | 7.x · Zod 3.23.x |
| | Zustand | 4.x–5.x |
| | Axios | 1.x |
| | Recharts | 2.x |
| **Backend** | ASP.NET Core Web API | .NET 8.0 |
| | Entity Framework Core | 8.0.x + Pomelo.MySql 8.0.2 |
| | JWT Access + Refresh Token | JwtBearer 8.0.x |
| | Swagger | Swashbuckle 6.9.0 |
| **Database** | MySQL 8.0 | Docker, cổng 3307 |
| **Test** | xUnit + EF Core InMemory | 8.0.x |

---

## 3. Yêu cầu cài đặt

- .NET SDK 8.0+
- Node.js 20+
- Docker Desktop (phải đang chạy)
- Git 2.x

---

## 4. Cách chạy dự án

```powershell
# Bước 1 — Chạy MySQL (cổng 3307)
docker compose up -d

# Bước 2 — Chạy API
cd server
dotnet run --project HomeStay
# → http://localhost:5080/swagger

# Bước 3 — Chạy web (terminal khác)
cd client
npm install
npm run dev
# → http://localhost:5173
```

### Tài khoản dùng thử

| Vai trò | Email | Mật khẩu |
|---|---|---|
| Admin | `admin@homestay.vn` | `123456` |
| Khách | `khach1@gmail.com` | `123456` |

---

## 5. Cấu trúc thư mục

```
Homestay/
├── server/                 ASP.NET Core Web API
│   ├── HomeStay/           Code chính (Controllers, Services, Entities, DTOs...)
│   └── HomeStay.Tests/     Unit test xUnit
├── client/                 React + TS + Vite
│   └── src/                (api, components, pages, services, types, utils...)
├── docs/                   Báo cáo tiến độ, kiểm thử tay
├── docker-compose.yml      MySQL 8 cổng 3307
├── AGENTS.md               Quy tắc code bắt buộc
├── todo.md                 21 bước chi tiết
└── lessons.md              Bài học từ lỗi
```

---

## 6. Quy tắc cốt lõi (xem chi tiết `AGENTS.md`)

- **Quy trình 6 bước**: Code → Build 0 warning → Test tay 3 kịch bản → Unit test → Ghi tiến độ → Commit
- **DRY/KISS/YAGNI/SOLID** — Ưu tiên đơn giản, không lặp, không viết dư
- **Backend**: Controller chỉ validate/trả response, Service chứa nghiệp vụ, Repository truy vấn DB
- **Frontend**: Service chỉ gọi API, Component chỉ hiển thị, TanStack Query cho data server, Zustand cho UI state
- **Hiển thị**: Chữ `text-left`, Số/Tiền `text-right` + `.number-vn`, VND format `500.000 ₫`, **Không hiển thị Id nội bộ**

---

## 7. Git

- Repo: https://github.com/Duongcute2604/HomeStay (private)
- Nhánh chính: `main`
- Commit mỗi ngày ≥ 1 lần, format Conventional Commits
- Push hằng ngày