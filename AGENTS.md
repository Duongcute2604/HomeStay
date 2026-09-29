# AGENTS.md — Bộ quy tắc làm việc cho dự án StayEasy

> **Tài liệu này là bất biến.** Mọi code viết ra phải tuân thủ.
> Đọc file này **trước khi viết bất kỳ dòng code nào**.
> Người thực hiện: Nguyễn Hải Nam — 12523W.1 · Đồ án 4: Hệ thống đặt phòng & quản lý homestay

---

## 0. QUY TRÌNH HOÀN THÀNH 1 CHỨC NĂNG (Đọc trước, áp dụng mọi lần)

> **Chức năng chỉ được coi là "xong" khi đi qua ĐỦ 6 bước dưới đây. Thiếu bước nào = chưa xong.**

```
┌─────────────────────────────────────────────────────────────┐
│  BƯỚC 1  Viết code                                           │
│  BƯỚC 2  Build sạch: 0 error, 0 warning                     │
│  BƯỚC 3  Chạy thử TAY 2–3 LẦN với các kịch bản khác nhau   │
│  BƯỚC 4  Viết UNIT TEST cho logic nghiệp vụ — chạy xanh    │
│  BƯỚC 5  Ghi tiến độ vào docs/BAO_CAO_TIEN_DO.md             │
│  BƯỚC 6  Commit git                                          │
└─────────────────────────────────────────────────────────────┘
```

### Bước 3 — Chạy thử tay bắt buộc 2–3 lần

Mỗi chức năng phải thử **ít nhất 3 kịch bản**, và **3 lần thử phải khác nhau**:

| Lần | Loại kịch bản | Ví dụ với chức năng "đặt phòng" |
|-----|---------------|----------------------------------|
| Lần 1 | **Happy path** | Đặt phòng hợp lệ → thành công, dữ liệu đúng |
| Lần 2 | **Edge case** | Đặt phòng 2 tiếng (dưới tối thiểu) → bị từ chối đúng thông báo |
| Lần 3 | **Bất thường** | Hai tab cùng đặt 1 phòng cùng khung giờ → chỉ 1 đơn được tạo |

Ngoài 3 lần trên, phải thử thêm:
- **Người dùng khác**: tài khoản khách khác có bị chặn đúng không?
- **Tải lại trang / đăng xuất rồi đăng nhập lại**: dữ liệu có còn đúng không?
- **Mở trực tiếp URL không qua menu**: route có chặn đúng không?

### Bước 4 — Unit test bắt buộc

| Chức năng | Bắt buộc có test cho |
|-----------|---------------------|
| Đặt phòng | Tính tiền theo giờ/ngày · chống trùng lịch · validate khoảng thời gian |
| Tìm kiếm | Bộ lọc · sắp xếp · phân trang |
| Đăng nhập | Email sai · mật khẩu sai · tài khoản bị khoá |
| Quản lý trạng thái | Ma trận chuyển trạng thái hợp lệ / không hợp lệ |
| Đánh giá | Chỉ cho đánh giá đơn COMPLETED · 1 đơn 1 đánh giá |
| Thống kê | Tính doanh thu · tỷ lệ lấp đầy |

> **Sau khi có test, chức năng đó không được sửa lại ở giai đoạn dồn cuối** — vì đã có test bảo vệ. Đó là mục đích của quy tắc này.

### Không được báo "xong" khi

- ❌ `dotnet build` còn warning
- ❌ chưa chạy thử tay đủ 3 kịch bản
- ❌ chưa có unit test cho logic nghiệp vụ
- ❌ có TODO/FIXME bỏ trong code
- ❌ có `Console.WriteLine` / `Debugger.Break()` sót lại
- ❌ có code chết (biến không dùng, hàm không ai gọi) — C# sẽ báo warning

---

## 0.1. QUY TRÌNH LÀM VIỆC VỚI AI — 6 BƯỚC, KHÔNG BỎ BƯỚC NÀO

> Vibe coding **không phải** là viết prompt rồi ngồi đợi AI làm hết.
> Nó cần kỷ luật và trách nhiệm rõ ràng. Không có bước nào là tùy chọn.

| # | Bước | Làm gì | Ghi ở đâu |
|---|------|--------|----------|
| 1 | **Lập kế hoạch cụ thể, mục tiêu phải ĐO ĐƯỢC** | Viết mục tiêc đo được vào `todo.md` trước khi code | `todo.md` |
| 2 | **Kiểm tra lại kế hoạch** | Đọc lại xem có đúng hướng không. Đi sai hướng → **DỪNG** sửa kế hoạch, không cố làm tiếp | `todo.md` |
| 3 | **Làm xong mục nào đánh dấu mục đó** | Tick `[x]` ngay khi hoàn thành, không để tới cuối | `todo.md` |
| 4 | **Mỗi thay đổi phải có giải thích** | Nói rõ: đổi file nào, vì sao đổi, ảnh hưởng gì | Trong tin nhắn |
| 5 | **Ghi kết quả vào `todo.md`** | Cột "Kết quả" + "Bằng chứng" phải có nội dung thật | `todo.md` |
| 6 | **Tổng kết bài học vào `lessons.md`** | Ghi lỗi vừa gặp, nguyên nhân, cách sửa, quy tắc tránh lặp | `lessons.md` |

### 1. Luôn lập kế hoạch trước khi code
- Việc nhiều bước hoặc ảnh hưởng hệ thống → **dàn ý trước, code sau**.
- Mục tiêu phải đo được, không viết chung chung.
  - ❌ "Làm chức năng đặt phòng"
  - ✅ "API `POST /api/bookings` từ chối đặt trùng lịch — kiểm chứng bằng 3 unit test tình huống chồng lấn khoảng thời gian"
- **Đi sai hướng thì dừng lại sửa kế hoạch ngay.** Cố làm tiếp sẽ tạo nợ kỹ thuật.

### 2. Quản lý ngữ cảnh (context) của AI
- AI có giới hạn ngữ cảnh. **Chia nhỏ bài toán lớn thành từng phần nhỏ**, xử lý lần lượt.
- Không nhồi nhét thông tin không liên quan vào cùng một phiên chat.
- Mỗi lượt làm = **1 chức năng rõ ràng**. Xong rồi mới sang lượt tiếp theo.
- Ưu tiên đọc lại file quy tắc + `todo.md` thay vì kéo hết cả dự án vào phân tích.

### 3. Ghi bài học sau mỗi lỗi
- Ghi vào `lessons.md`: **sai ở đâu → vì sao sai → lần sau tránh thế nào**.
- Kinh nghiệm không ghi lại thì bị quên, và sẽ lặp lại đúng lỗi đó.
- Ghi ngay khi gặp lỗi, **không đợi cuối ngày**.

### 4. Chỉ coi là "XONG" khi có BẰNG CHỨNG
> Code chạy trong đầu hoặc AI tự báo "đã xong" **chưa đủ**.

Một chức năng chỉ xong khi có **đủ 3 loại bằng chứng**:

| Loại bằng chứng | Cụ thể |
|-----------------|--------|
| **Test pass** | `dotnet test` xanh 100% + `dotnet build` 0 error 0 warning |
| **Log sạch** | Không có exception, không có lỗi 404/500 lặp lại, console không báo cảnh báo |
| **Kiểm chứng thực tế** | Chạy thật trên trình duyệt / Swagger theo 3 kịch bản ở Bước 3 |

> "Người khó tính nhất trong nhóm chưa chắc sẽ duyệt" → nghĩa là **chưa xong**.
> Khi báo cáo công việc, luôn kèm **bằng chứng cụ thể** (số test pass, output lệnh, ảnh chụp) — không nói chung chung kiểu "đã xong phần này".

### 5. Giải pháp phải phù hợp
- **Không vá tạm** nếu biết sẽ gây rắc rối về sau.
- Nhưng cũng **không làm quá mức** cho một lỗi nhỏ.
- Biết **khi nào tối ưu, khi nào dừng lại**. Sửa nhỏ thì sửa nhỏ, đừng refactor cả hệ thống.

### 6. Khi có bug → ĐỌC LOG TRƯỚC
- Đừng hỏi những thứ có thể tự kiểm tra trong vài phút.
- Đọc log lỗi / lỗi console / response API trước, xác định nguyên nhân gốc, rồi mới sửa.
- Tôn trọng thời gian của người đọc: báo cáo lỗi kèm **nguyên nhân + cách tái hiện + đã sửa thế nào**.

---

## 0.2. BA NGUYÊN LÝ NỀN TẢNG KHI SỬA LỖI

| Nguyên lý | Nghĩa | Ví dụ trong dự án |
|----------|-------|--------------------|
| **Tối giản** | Chỉ thay đổi những gì cần thiết. Code đơn giản nhất có thể | Lỗi ở hàm tính tiền → sửa hàm đó, **không** dựng lại cả `BookingService` |
| **Triệt để** | Giải quyết tận gốc, không vá tạm | Đặt trùng lịch → sửa ở **thuật toán + transaction + index**, không xử lý bằng cách ẩn nút "Đặt phòng" ở giao diện |
| **Vô hình** | Sửa đúng chỗ, **không làm phát sinh lỗi mới** | Sửa tính tiền → phải chạy lại test đặt theo giờ VÀ theo ngày để chắc không làm hỏng cái kia |

> **Vô hình** là nguyên lý bị bỏ qua nhiều nhất. Mỗi lần sửa code, hỏi: *"thay đổi này có làm hỏng gì đang chạy tốt không?"* → trả lời bằng **test chạy lại**, không phải bằng tự tin.

---

## 0.3. BẢO MẬT & KIỂM SOÁT

### Không copy code khi chưa hiểu
- Cấm chép đoạn code từ nguồn khác (AI, web, repo người khác) mà **chưa hiểu logic**.
- Rủi ro: lỗ hổng bảo mật, sai nghiệp vụ, và **không trả lời được khi thầy hỏi**.
- Code phải do mình hiểu → giải thích được → bảo vệ được.

### Không đưa dữ liệu nhạy cảm vào prompt
- **Cấm** đưa vào chat/prompt: mật khẩu, API key, token, JWT secret, chuỗi kết nối có mật khẩu thật, dữ liệu cá nhân của người thật, mã nguồn độc quyền.
- Ví dụ dữ liệu dùng trong đồ án **phải là dữ liệu giả**: email `khach1@gmail.com`, mật khẩu `123456`, tên người dùng bịa.
- Secret đặt trong `.env` hoặc `appsettings.Development.json`, file đó nằm trong `.gitignore`.

### Luôn review diff và kiểm soát dependency
```powershell
git diff                 # xem chính xác thay đổi trước khi commit
git status               # kiểm tra có file rác/ file nhạy cảm bị lỡ tay thêm vào
```
- **Trước mỗi lần `git commit`: xem lại `git diff`.** Không commit mù.
- **Kiểm tra kỹ mọi thư viện bên ngoài mà AI thêm vào**: dùng để làm gì, có thật sự cần không, có nguồn gốc rõ không, còn được duy trì không.
- **Cấm thêm package không có lý do rõ ràng.** Không `npm install`/`dotnet add package` hàng loạt. Yêu cầu cấu hình mới thì hỏi trước hoặc bỏ.
- Cấm tạo file lạ (log, dump, file tạm) rồi lỡ tay commit.

---

## 0.4. THỰC HÀNH TỪ BÀI VIẾT "VIBE CODING" — 4 QUY TẮC BỔ SUNG

### a) `README.md` là đặc tả sống, chỉ tối đa 5 mốc
- Mỗi mốc = **một chức năng chạy được** mà bạn có thể mở trình duyệt thấy ngay.
- Không chia nhỏ hơn mức đó — mốc quá nhỏ thì không kiểm chứng được.
- Kế hoạch 21 bước chi tiết nằm ở `todo.md`, **không** nhồi vào README.
- Cập nhật README khi hoàn thành mốc → commit kèm.

### b) Định kỳ nhờ tìm code trùng lặp / thừa
Mỗi **3 chức năng** (không phải mỗi ngày), yêu cầu:
> "Quét toàn bộ code hiện tại, liệt kê chỗ trùng lặp, chỗ thừa, chỗ dài quá 40 dòng, rồi sửa từng chỗ một."

- Ưu tiên **sửa từng chỗ một**, không refactor ồ ạt (nguyên lý "Tối giản").
- Sau khi sửa → chạy lại `dotnet test` + `npm run build` để chắc không hỏng (nguyên lý "Vô hình").

### c) Sau mỗi chức năng, mình phải giải thích lại bằng lời
- Không chỉ báo "xong" — phải giải thích: **request đi qua những file nào, tầng nào xử lý gì, dữ liệu chạy ra sao.**
- Bạn đọc và hỏi lại được là đạt mục tiêu. **Đây là thứ GVHD sẽ hỏi khi bảo vệ.**
- Nếu mình không giải thích được bằng lời → chứng tỏ đoạn code đó viết quá khó, phải viết lại.

### d) Một lượt làm = một chức năng, một cụm nhỏ file
- Ngữ cảnh phiên chat có giới hạn. Xong 1 chức năng → **nên mở phiên chat mới** cho chức năng sau.
- Mỗi lượt mình chỉ nên chạm vào **vài file**, không sửa 20 file một lúc.
- Cần bạn luôn dán lại đường dẫn 3 file quy tắc: `AGENTS.md`, `todo.md`, `lessons.md`.

---

## 1. CÔNG NGHỆ ĐÃ CHỐT — KHÔNG ĐỔI

```text
Frontend:  React 18 + TypeScript + Vite + TailwindCSS
           React Router v6 · TanStack Query · Zustand
           React Hook Form + Zod · Axios
Backend:   ASP.NET Core Web API 8.0 (C#)
           Entity Framework Core 8 + Pomelo.MySql
           JWT (Access + Refresh) · xUnit (kiểm thử)
Database:  MySQL 8.0 (Docker)
```

### 1.1 PHIÊN BẢN ĐÃ GIM — KHÔNG ĐƯỢC NÂNG CẤP

> **Đây là quy tắc cứng.** Mỗi thư viện được ghim đúng 1 phiên bản.
> Lý do: cài bản mới hơn trong khi code được viết theo bản cũ → **hỏng build, mất thời gian sửa lỗi**.

| Thư viện | Phiên bản ghim | Ghi chú |
|---|---|---|
| .NET SDK | 8.0.425 | Đã cài, ở `%LOCALAPPDATA%\Microsoft\dotnet` |
| Pomelo.EntityFrameworkCore.MySql | 8.0.2 | Không dùng bản 9.x (cần .NET 9) |
| Microsoft.EntityFrameworkCore.Design | 8.0.x | Khớp với Pomelo |
| Microsoft.AspNetCore.Authentication.JwtBearer | 8.0.x | |
| Swashbuckle.AspNetCore | 6.9.0 | |
| xUnit | Bản mặc định của template .NET 8 | |
| Microsoft.EntityFrameworkCore.InMemory | 8.0.x | Dùng cho unit test, không cần MySQL |
| **react / react-dom** | **18.3.1** | Không dùng 19.x |
| **vite** | **5.4.x** | Không dùng 6/7/8 |
| **typescript** | **5.5 – 5.9** (đang cài 5.9.3) | Không dùng 7.x (bản viết lại bằng Go) |
| **tailwindcss** | **3.4.x** | Không dùng 4.x (đổi hoàn toàn cách cấu hình) |
| **react-router-dom** | **6.28.x** | Không dùng 7.x |
| **zod** | **3.23.x** | Không dùng 4.x |
| @tanstack/react-query | 5.x | API ổn định từ v4→v5 |
| react-hook-form + @hookform/resolvers | 7.x / 3.x | resolvers 3.x hỗ trợ Zod 3 |
| zustand | 4.x hoặc 5.x | API giống nhau |
| axios | 1.x | |
| recharts | 2.x | Thư viện biểu đồ cho Dashboard |

**MySQL:** chạy bằng **Docker**, cổng `3307`, image `mysql:8.0`. **Không cài MySQL trực tiếp lên máy.**

### 1.2 Quy tắc VÀNG: kiểm tra phiên bản thật TRƯỚC khi cài

> Bài học đắt nhất trong dự án này (xem `lessons.md` mục 9):
> AI viết code theo kiến thức cũ, còn `npm` cài bản mới hơn → **hỏng ngay**.

**Trước khi `npm install` hoặc `dotnet add package` bất kỳ thứ gì:**

```powershell
# Frontend — hỏi npm, đừng đoán
npm view react version
npm view tailwindcss version

# Backend — hỏi NuGet qua trình duyệt hoặc file csproj đã có
```

**Quy tắc:** nếu phiên bản mới hơn mục 1.1 → **KHÔNG nâng cấp vội.** Cài đúng bản đã ghim, viết code, chạy được thì đã đạt. Nâng cấp là việc của giai đoạn sau, khi còn thời gian.

**Cài đúng phiên bản ghim — dùng `npm install <tên>@<phiên bản>`, không dùng `@latest`.**

### 1.3 Cấm thêm

- Không tự ý thêm: NestJS · Prisma · SQL Server · MongoDB · Firebase · JWT library khác · state manager khác.
- Không thêm package mà chưa nêu rõ "dùng để làm gì, bắt buộc không".
- **Không nâng cấp phiên bản ghim** kể cả khi bản mới có tính năng hay hơn.

**Hai tác nhân duy nhất:** `CUSTOMER` và `ADMIN`. Không tạo `Employee`, `Staff`, `Host`, `Manager`, `Receptionist`.
→ Mọi chức năng vận hành (check-in, check-out, cập nhật trạng thái phòng) thuộc **Admin**.

---

## 2. QUY TẮC ĐẶT TÊN VÀ TRÌNH BÀY (Coding Conventions)

### 2.1 Quy tắc chung

- Tên phản ánh đúng chức năng. **Cấm tuyệt đối**: `a`, `b`, `x`, `data`, `temp`, `foo`, `item`, `obj`, `result` (khi không rõ nghĩa).
- Dùng **tiếng Anh** cho toàn bộ tên biến/hàm/lớp. Tiếng Việt chỉ dùng cho **nội dung hiển thị** và **thông báo lỗi**.
- Cấm viết tắt không rõ nghĩa. Chấp nhận: `Id`, `Dto`, `Api`, `Url`, `Http`, `Db`.
- Cấm ký hiệu Hungary (`strName`, `intCount`, `bIsActive`).
- Indentation: **4 space** cho C#, **2 space** cho TypeScript/TSX.
- Một dòng trên mỗi statement. Cấm nhiều statement trên một dòng bằng `;`.
- Không để dòng dài hơn 120 ký tự.

### 2.2 C# — quy ước đặt tên

| Thành phần | Quy ước | Ví dụ |
|------------|----------|-------|
| Class / Record | `PascalCase` | `BookingService`, `RoomDto` |
| Interface | `I` + `PascalCase` | `IBookingService` |
| Method | `PascalCase` | `CreateBookingAsync` |
| Method bất đồng bộ | Bắt buộc hậu tố `Async` | `GetRoomByIdAsync` |
| Public/Protected property | `PascalCase` | `TotalAmount`, `CheckIn` |
| Private field | `_` + `camelCase` | `_bookingRepository` |
| Local variable / parameter | `camelCase` | `checkIn`, `guestCount` |
| Hằng số | `PascalCase` | `MinBookingHours` |
| Giá trị enum | `SCREAMING_SNAKE_CASE` | `PENDING`, `CHECKED_IN` |
| Tên bảng trong DB | `PascalCase` số nhiều | `BookingStatusHistory` |
| DTO | Hậu tố `Dto` / `Request` / `Response` | `CreateBookingRequest`, `BookingResponse` |

**Tiền tố boolean** bắt buộc: `Is` / `Has` / `Can` / `Should`
```csharp
bool isRoomAvailable;      ✅
bool hasCheckedOut;        ✅
bool flag;                 ❌
```

**Cấm dùng `var` khi kiểu không rõ rõ** — dùng `var` khi kiểu dài hoặc rõ ngay (`var room = new Room()`), dùng kiểu tường minh khi kiểu ngắn và thường dùng.

### 2.3 TypeScript / React — quy ước đặt tên

| Thành phần | Quy ước | Ví dụ |
|------------|----------|-------|
| Component / file component | `PascalCase.tsx` | `BookingForm.tsx` |
| Hook | `use` + `PascalCase` | `useBooking.ts`, `useAuth.ts` |
| Service file | `<domain>Service.ts` | `bookingService.ts` |
| Type file | `<domain>.ts` | `booking.ts` |
| Interface / type | `PascalCase` (không tiền tố `I`) | `Booking`, `RoomSearchFilter` |
| Function | `camelCase` | `formatVnd()` |
| Component con dùng trong JSX | Tên đại diện, viết hoa như component | `<SearchFilterBar />` |

- **Cấm tuyệt đối `any`.** Dùng `unknown`, hoặc định nghĩa type rõ ràng.
- Component dùng `function` khai báo, có kiểu trả về rõ ràng.
- Một component **một file**.

---

## 3. NGUYÊN TẮC LẬP TRÌNH KINH ĐIỂN

### 3.1 SRP — Trách nhiệm đơn lẻ (áp dụng đầu tiên)
Một class/hàm **chỉ làm đúng một việc**.
```csharp
// ❌ BookingService vừa check trùng, vừa tính tiền, vừa gửi email
public async Task<Booking> CreateBooking(CreateBookingRequest request) { ... }

// ✅ Tách nhỏ, mỗi hàm một việc, dễ test
public async Task<Booking> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct);
public async Task<bool> IsRoomAvailableAsync(int roomId, DateTime checkIn, DateTime checkOut, CancellationToken ct);
public decimal CalculateTotalAmount(BookingType type, decimal price, int units);
public void ValidateBookingRules(CreateBookingRequest request);
```

**Giới hạn:** một hàm **≤ 40 dòng**. Quá dài → tách.

### 3.2 DRY — Không lặp lại
- Logic trùng lặn ở 2 nơi → tách thành hàm dùng chung.
- Thông báo lỗi, quy tắc nghiệp vụ, hằng số phải khai báo **1 lần**.
```csharp
// ❌ magic number rải khắp nơi
if (hours < 3) ...
if (duration.TotalHours < 3) ...
if (totalHours < 3) ...

// ✅ hằng số có tên
public static class BookingRules {
    public const int MinHoursForHourlyBooking = 3;
    public const int MinHoursAdvanceNotice = 2;
    public const int CleaningHoursAfterCheckout = 2;
    public const int StandardCheckInHour = 14;
    public const int StandardCheckOutHour = 12;
}
```
- Component React lặp lại layout → tách component dùng chung (`DataTable`, `Pagination`, `EmptyState`).

### 3.3 KISS — Đơn giản nhất có thể
- Không thêm abstraction chưa cần thiết. Chưa có 2 chỗ dùng thì **đừng** tạo interface chung.
- Không dùng pattern phức tạp cho bài toán đơn giản.
- `if/else` rõ ràng hơn strategy pattern nếu chỉ có 2 trường hợp.
- Câu truy vình SQL thuần khi SQL phức tạp hơn LINQ.

### 3.4 YAGNI — Không viết trước thứ chưa cần
- **Cấm** code thừa cho tương lai: interface chưa có 2 lớp cài đặt, generic chưa dùng, config cho môi trường chưa deploy.
- Không tạo bảng cho tính năng chưa làm (thanh toán, notification).
- **Cấm** comment `// TODO: sau này sẽ làm thêm...`

### 3.5 SOLID
| Nguyên tắc | Áp dụng cụ thể trong dự án |
|------------|------------------------------|
| **S** Trách nhiệm đơn lẻ | Controller chỉ tiếp nhận/validate/trả response. Service chứa nghiệp vụ. Entity chỉ mô tả dữ liệu. |
| **O** Mở/Đóng | Thêm loại phòng mới = thêm 1 giá trị enum + 1 nhánh xử lý, **không** sửa code cũ đang chạy. |
| **L** Thay thế Liskov | Service phải thay thế được `IBookingService`. Dùng interface khi có từ 2 lớp trở lên. |
| **I** Phân chia interface | Interface nhỏ, mỗi interface 1 trách nhiệm (ISP). Không tạo `IAllService`. |
| **D** Đảo ngược phụ thuộc | Service phụ thuộc `IBookingRepository`, không phụ thuộc thẳng vào `DbContext`. |

---

## 4. QUY TẮC CHÚ THÍCH (Comments)

**Chỉ chú thích khi code không tự nói rõ.** Ưu tiên viết lại code cho dễ hiểu thay vì giải thích bằng comment.

```csharp
// ❌ Sẵn miếng thịt — không cần thiết
// Lấy phòng từ database
var room = await _context.Rooms.FirstOrDefaultAsync(r => r.Id == id);

// ❌ Comment lặp lại tên hàm
// Hàm này kiểm tra phòng còn trống không
public bool IsRoomAvailable() { }

// ✅ Giải thích QUY TẮC NGHIỆP VỤ — thứ mà đọc code không suy ra được
// Đặt theo giờ tối thiểu 3 giờ (quy định tại mục 3.1.3 báo cáo đồ án)
if (duration.TotalHours < BookingRules.MinHoursForHourlyBooking) { ... }

// ✅ Giải thích LÝ DO kỹ thuật
// Dùng '<' chứ không dùng '<=' vì khách trả phòng 12:00 thì khách mới
// được nhận phòng 12:00 ngày hôm sau, hai khoảng chạm biên không tính là trùng
var isOverlap = existing.CheckIn < checkOut && existing.CheckOut > checkIn;
```

Quy tắc thêm:
- Comment viết bằng **tiếng Việt**, giải thích **tại sao**, không **làm gì**.
- Comment đánh số bước thuật toán khi logic dài hơn 3 nhánh.
- **Cấm** comment thời gian (`// 29/09/2026 sửa lỗi gì đó`).
- Dùng XML doc `///` cho public service method dùng lại nhiều nơi.
- File đầu dự án có header tiêu đề + ngày + tác giả.

---

## 5. KIỂM THỬ (Testing)

### 5.1 Cấu trúc project test
```text
server/
├── StayEasy.sln
├── StayEasy/                 ← code chính
└── StayEasy.Tests/           ← project test xUnit
    ├── Services/
    │   ├── BookingServiceTests.cs
    │   ├── RoomSearchTests.cs
    │   └── AuthServiceTests.cs
    ├── Helpers/
    │   └── TestDbContextFactory.cs
    └── Common/
        └── TestDataBuilder.cs
```

### 5.2 Điều kiện bắt buộc để test được
> **Business logic phải nằm trong hàm thuần thuộc Service**, không được rút ngắn thẳng trong Controller hay trong Entity. Nếu không tách được thì không test được — đó là lý do phải tách.

```csharp
// ❌ Không test được — logic nằm trong Controller
[HttpPost]
public async Task<IActionResult> Create([FromBody] CreateBookingRequest req) {
    if (req.CheckIn < DateTime.Now.AddHours(2)) return BadRequest();
    ...
}

// ✅ Test được — logic nằm trong Service
public async Task<Booking> CreateBookingAsync(CreateBookingRequest request, CancellationToken ct)
{
    ValidateBookingRules(request);
    var isAvailable = await IsRoomAvailableAsync(request.RoomId, request.CheckIn, request.CheckOut, ct);
    if (!isAvailable) throw new BookingConflictException(...);
    ...
}
```

### 5.3 Cách viết test
- Framework: **xUnit**.
- Quy tắc đặt tên test: `TênHàm_TìnhHuống_KếtQuaMongĐợi`
```csharp
[Fact] public void CalculateTotalAmount_HourlyBooking_ThreeHours_ReturnsThreeTimesPricePerHour()
[Fact] public void CreateBooking_OverlapsWithExistingBooking_ThrowsConflictException()
[Theory] [InlineData(...)] public void ValidateBookingRules_LessThanTwoHoursAdvance_ThrowsValidationException()
```
- **Happy path + Edge case + Không hợp lệ** cho mỗi hàm nghiệp vụ.
- Test dùng `InMemoryDatabase` hoặc `TestDbContextFactory` — **không** cần MySQL thật cho unit test.
- Dùng `TestDataBuilder` tạo dữ liệu mẫu → **không** hardcode dữ liệu rải rác trong test.

### 5.4 Chạy test
```powershell
cd server
dotnet test                    # chạy toàn bộ
dotnet test --filter "Booking" # chạy nhóm test đang sửa
```
**Yêu cầu: 100% test mới viết phải PASS trước khi chuyển sang chức năng khác. Không có test nào FAIL được bỏ qua.**

### 5.5 Kiểm thử tay (bổ sung, làm trên trình duyệt)
Ghi kết quả vào `docs/KIEM_THU_TAY.md` theo bảng:
```markdown
| STT | Chức năng | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|-----|----------|----------|---------|---------|---------|
```

### 5.6 Kiểm thử tích hợp
Dùng **Postman**: export collection vào `docs/api/postman_collection.json`, có ít nhất 18 test case (xem `KE_HOACH_TRIEN_KHAI_CHI_TIET.md` mục 18.1).

---

## 6. QUY TẮC RIÊNG CHO BACKEND (ASP.NET Core)

### 6.1 Phân tầng bắt buộc
```
HTTP Request → [Controller] → [Service] → [Repository/EF] → Database
                  ↑              ↑             ↑
            validate +      nghiệp vụ     truy vấn dữ liệu
            trả response
```
- **Cấm** viết truy vấn database trong Controller.
- **Cấm** viết logic nghiệp vụ trong Controller.
- Controller **luôn trả về `ApiResponse<T>`**, không trả entity thô.

### 6.2 Cấm trả entity thô ra ngoài
```csharp
// ❌ Rò rỉ cấu trúc DB, lộ field nhạy cảm, dễ lộ Id
return Ok(await _context.Rooms.ToListAsync());

// ✅ Trả DTO đã định nghĩa
return Ok(ApiResponse.Success(roomDtos));
```

### 6.3 Quy tắc ẩn Id (bất biến)
| Loại endpoint | Trả về |
|---------------|--------|
| Danh sách / public | **KHÔNG có** `Id`. Giao diện tự tính STT = `index + 1 + page * size` |
| Chi tiết | Có `Id` nội bộ, nhưng **giao diện tuyệt đối không hiển thị** |
| Đơn đặt phòng | Hiển thị `Code` (vd: `HS-250930-4821`), **không hiển thị Id** |

### 6.4 Quy tắc truy vấn
- Mọi truy vấn **phải `async`** và nhận `CancellationToken`.
- Đọc dữ liệu dùng `.AsNoTracking()`.
- Lấy danh sách phải **phân trang**, cấm trả toàn bộ bảng.
- Dùng `Include`/`ThenInclude` cho quan hệ; **cấm N+1 query**.
- Ưu tiên `Select` thẳng ra DTO thay vì lấy entity rồi map tay.

### 6.5 Quy tắc xử lý lỗi
- `ExceptionMiddleware` bắt toàn bộ lỗi, trả về format thống nhất.
- **Không bao giờ** trả stack trace / message lỗi hệ thống ra ngoài.
- Dùng đúng mã lỗi:
  | Mã | Khi nào |
  |-----|--------|
  | 400 | Dữ liệu sai định dạng / vi phạm quy tắc nghiệp vụ |
  | 401 | Chưa đăng nhập / token hết hạn |
  | 403 | Đã đăng nhập nhưng không đủ quyền |
  | 404 | Không tìm thấy dữ liệu |
  | **409** | **Xung đột nghiệp vụ — ví dụ: phòng đã có đơn** |
  | 500 | Lỗi hệ thống |

### 6.6 Bảo mật
- Mật khẩu lưu dạng **BCrypt hash**, không bao giờ lưu dạng thô.
- Đăng ký **không cho tự chọn quyền ADMIN**.
- Lấy `userId` từ token, **không tin giá trị gửi từ client**.
- Secret/JWT key đặt trong `appsettings`/`appsettings.Development`, **không commit** vào Git.
- Kiểm tra phân quyền ở **cả API (attribute) và route (ProtectedRoute)**.

### 6.7 Hiệu năng & tính đúng đắn
- Dùng **transaction** cho mọi thao tác nhiều bảng (tạo booking + đổi trạng thái phòng + ghi lịch sử).
- Không hardcode chuỗi kết nối, định dạng tiền, thông báo lỗi.
- Tất cả truy vấn lọc/sắp xếp cần **index** tương ứng.

---

## 7. QUY TẮC RIÊNG CHO FRONTEND (React + TypeScript)

### 7.1 Cấu trúc thư mục
```
client/src/
├── api/            # axios client + interceptor
├── components/     # component dùng chung (common/), admin/
├── context/        # AuthContext, ToastContext
├── hooks/          # useAuth, useToast...
├── layouts/        # CustomerLayout, AdminLayout
├── pages/          # khách/  và admin/
├── services/       # <domain>Service.ts — gọi API, không chứa logic UI
├── types/          # <domain>.ts
└── utils/          # format.ts, date.ts
```

### 7.2 Nguyên tắc
- **Service chỉ gọi API**, không chứa JSX. **Page/Component chỉ hiển thị**, không tự `axios` trực tiếp.
- Dữ liệu server → **TanStack Query**; dữ liệu phiên/UI → **Zustand**.
- Mọi form dùng **React Hook Form + Zod**, type suy ra từ schema:
```typescript
const bookingSchema = z.object({
  checkIn: z.string().min(1, 'Vui lòng chọn ngày nhận phòng'),
  guestCount: z.coerce.number().min(1, 'Phải có ít nhất 1 khách'),
});
type BookingForm = z.infer<typeof bookingSchema>;
```
- **Cấm** `any`. Dùng `unknown` + kiểm tra.
- Component > 300 dòng → tách.
- Xử lý 3 trạng thái bắt buộc ở mọi danh sách: **Loading / Error / Empty**.

### 7.3 Quy tắc hiển thị — BẤT BIẾN
| Loại dữ liệu | Cách hiển thị |
|---------------|---------------|
| Chữ, tên, địa chỉ, mô tả | `text-left` |
| **Số, tiền, diện tích, số phòng, số khách** | `text-right` + class `.number-vn` |
| Tiền VND | `formatVnd()` → `500.000 ₫` (dấu chấm phân cách nghìn) |
| STT | Tự tính: `index + 1 + page * pageSize` |
| Id nội bộ | **Không bao giờ hiển thị** |

```typescript
export const formatVnd = (value: number): string =>
  new Intl.NumberFormat('vi-VN').format(value) + ' ₫';
```

### 7.4 Bảo mật phía client
- Token lưu trong `localStorage`, **không** log ra console.
- Response 401 → gọi refresh token → thất bại thì đăng xuất và chuyển về trang đăng nhập.
- Route admin bọc trong `ProtectedRoute` kiểm tra `role === 'ADMIN'`.

---

## 8. QUY TẮC GIT

- Nhánh: `main` (đã chạy được) · `develop` (đang phát triển) · `feature/<ten-tinh-nang>`.
- **Commit mỗi ngày 1 lần, tối thiểu** — không được để 2 ngày không commit.
- Message theo Conventional Commits:
```text
feat: them chuc nang dat phong theo gio va theo ngay
fix: sua loi chong dat trung khi check-in
refactor: tach logic tinh tien sang BookingPricingService
test: them test case chong dat trung
docs: bo sung anh chuc nang quản lý đơn
chore: them index cho bang booking
```
- Không commit file nhạy cảm: `.env`, `appsettings.Production.json`, `secrets.json`.
- Đẩy lên GitHub (private repo) **hằng ngày** — để mất máy không mất đồ án.

---

## 9. GHI TIẾN ĐỘ

Cập nhật `docs/BAO_CAO_TIEN_DO.md` sau **mỗi chức năng** (không phải mỗi ngày):
```markdown
| Ngày | Bước trong kế hoạch | Chức năng hoàn thành | Test tay | Unit test | Trạng thái |
|------|--------------------|----------------------|----------|-----------|-----------|
| 02/10 | Bước 5 | Đăng ký / đăng nhập | 3/3 ✓ | 12 pass | Xong |
```

File này cuối kỳ chuyển thành **bảng tiến độ đưa vào báo cáo** → thầy rất thích nhìn thấy tiến độ đều đặn.

---

## 10. DANH SÁCH CẤM (checklist review nhanh)

Trước khi kết luận "xong", quét lại:

- [ ] Không còn `any` (TypeScript)
- [ ] Không còn `var` không cần thiết, không có magic number
- [ ] Không có `TODO` / `FIXME` / `Console.WriteLine` sót
- [ ] Không trả entity thô ra API
- [ ] Mọi hàm nghiệp vụ **≤ 40 dòng**
- [ ] Mọi hàm public trong Service có XML doc
- [ ] Có test cho: happy path, edge case, case không hợp lệ
- [ ] `dotnet build` 0 error 0 warning · `dotnet test` 100% pass
- [ ] `npm run build` không lỗi
- [ ] Giao diện chạy được trên màn hình điện thoại
- [ ] Có xử lý Loading / Error / Empty
- [ ] Số tiền đúng định dạng VND, căn lề phải
- [ ] Không hiển thị Id nội bộ
- [ ] Đã commit git + ghi tiến độ

---

## 11. KHI MÂU THUẪN

Thứ tự ưu tiên khi có mâu thuẫn:
```text
Yêu cầu của Nguyễn Hải Nam (hiện tại)
        ↓
Tài liệu nghiệp vụ đã chốt (báo cáo đồ án)
        ↓
Schema database đã chốt
        ↓
API contract đã chốt
        ↓
Code hiện tại
```
Phát hiện mâu thuẫn → **dừng thay đổi lớn, nêu rõ mâu thuẫn, đề xuất phương án, chờ xác nhận rồi mới làm.** Không tự đoán nghiệp vụ.
