# KIỂM THỬ TAY — Hệ thống đặt phòng & quản lý homestay

> SV: Nguyễn Hải Nam — 12523W.1
> Bắt buộc chạy **ít nhất 3 kịch bản khác nhau** cho mỗi chức năng (xem `AGENTS.md` mục 0 — Bước 3)

---

## Quy tắc điền

| Cột | Ý nghĩa |
|-----|---------|
| **Kịch bản** | Loại: `HP` (happy path) · `EC` (edge case) · `AB` (bất thường) · `AU` (khác vai trò) |
| **Kỳ vọng** | Điều đúng phải xảy ra |
| **Thực tế** | Điều thực sự xảy ra |
| **Kết quả** | ✅ đạt · ❌ không đạt → ghi vào mục 4 và sửa ngay |

---

## 0. Cơ sở dữ liệu — 9 bảng (Bước 3)

> Bước này không có giao diện nên kiểm thử tay chạy **trực tiếp SQL trên MySQL**.
> Cách mở: `docker exec -it stayeasy-mysql mysql -ustayeasy -pstayeasy123 -D stayeasy`

| STT | Chức năng | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|-----|----------|----------|---------|---------|---------|
| 1 | 9 bảng | HP: `SHOW TABLES` | Đủ 9 bảng | Đủ 9 bảng + `__EFMigrationsHistory` | ✅ |
| 2 | Cấu trúc `Bookings` | HP: `DESCRIBE Bookings` | `Code` unique, enum lưu dạng chữ, có index `RoomId`/`Status` | `Code=varchar(20) UNI` · `Status=varchar(20) MUL` · `CheckIn=datetime(6) MUL` · tiền `decimal(18,2)` | ✅ |
| 3 | Khoá ngoại | HP: đọc `information_schema` | 11 FK đúng quan hệ đã thiết kế | Đúng 11 FK, không thừa không thiếu | ✅ |
| 4 | Enum đọc được | HP: `SELECT Role, Status FROM Users` | Thấy `CUSTOMER` / `ADMIN`, không phải số | `CUSTOMER`, `ADMIN` hiển thị đúng chữ | ✅ |
| 5 | Chống trùng tài khoản | EC: thêm 2 user cùng email `khach1@gmail.com` | MySQL từ chối | `ERROR 1062 Duplicate entry 'khach1@gmail.com' for key 'Users.IX_Users_Email'` | ✅ |
| 6 | Chặn trả phòng trước | AB: đặt `CheckOut < CheckIn` | MySQL từ chối | `ERROR 3819 Check constraint 'CK_Bookings_TimeRange' is violated` | ✅ |
| 7 | Chặn đánh giá 7 sao | AB: `INSERT Reviews` rating = 7 | MySQL từ chối | `ERROR 3819 Check constraint 'CK_Reviews_Rating' is violated` | ✅ |
| 8 | 1 đơn 1 đánh giá | AB: đánh giá lần 2 cho cùng đơn | MySQL từ chối | `ERROR 1062 Duplicate entry '1' for key 'Reviews.IX_Reviews_BookingId'` | ✅ |
| 9 | Chặn trùng tiện nghi | AB: gán 2 lần cùng tiện nghi cho 1 phòng | MySQL từ chối | `ERROR 1062 Duplicate entry '1-1' for key 'RoomAmenities.PRIMARY'` | ✅ |
| 10 | Xoá phòng | AU: xoá 1 phòng đã có ảnh + tiện nghi | Ảnh và liên kết tiện nghi bị xoá theo, địa điểm còn lại | Kiểm chứng bằng unit test `XoaPhong_TuDongXoaAnhVaLienKetTienNghi` | ✅ |

**Kết quả: 10/10 đạt.** Dữ liệu test đã dọn sạch sau khi kiểm thử (`Users`/`Rooms`/`Bookings` = 0 dòng).

---

## 0b. Dữ liệu mẫu tự sinh (Bước 4)

> Bước này cũng không có giao diện nên kiểm thử tay chạy **bằng cách khởi động app thật**
> rồi xem log `dotnet run` + truy vấn SQL trên MySQL.
> Lệnh: `dotnet run --project server\StayEasy\StayEasy.csproj`

### Kịch bản 1 — Database rỗng → chạy app lần 1 (Happy path)

| STT | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|-----|----------|---------|---------|---------|
| 1 | HP | App khởi động không lỗi, seed đủ 9 bảng | Log 731 dòng, `Now listening on: http://localhost:5080`, **không có** `fail:` / `Exception` | ✅ |
| 2 | HP | Đủ số lượng bản ghi | `Users 4` · `Locations 3` · `Rooms 10` · `Amenities 8` · `RoomAmenities 59` · `RoomImages 20` · `Bookings 15` · `BookingStatusHistory 42` · `Reviews 6` | ✅ |
| 3 | HP | Enum lưu đúng dạng chữ | `Status` in ra `COMPLETED`, `CANCELLED`, `PENDING`…; `Role` in ra `ADMIN`, `CUSTOMER` | ✅ |
| 4 | HP | Mật khẩu lưu dạng BCrypt, **không** lưu thô | Cả 4 tài khoản: `LEFT(PasswordHash,7) = $2a$11$`, `LENGTH = 60` | ✅ |
| 5 | HP | 4 người 4 hash khác nhau (BCrypt tự sinh salt) | `COUNT(DISTINCT PasswordHash) = 4` | ✅ |
| 6 | HP | Đủ 5 trạng thái phòng | `AVAILABLE 5` · `BOOKED 2` · `CLEANING 1` · `MAINTENANCE 1` · `OCCUPIED 1` | ✅ |
| 7 | HP | Đủ 6 trạng thái đơn | `COMPLETED 7` · `CANCELLED 1` · `REJECTED 1` · `CHECKED_IN 1` · `CONFIRMED 2` · `PENDING 3` | ✅ |
| 8 | HP | Ngày tháng **tương đối** so với hôm nay, không ghi cứng | Đơn `PENDING` nằm ở `30/09`, `03/10`, `29/10` — quanh ngày chạy app `29/09/2026` | ✅ |
| 9 | HP | Tiền khớp công thức | VD `HS-260929-0006` (theo giờ 4h × 85.000) = `340000.00` ✅ · `HS-261002-0011` (1 đêm `02/10 14:00 → 04/10 12:00` × 950.000) = `1900000.00` ✅ | ✅ |
| 10 | HP | Lịch sử trạng thái đúng người thực hiện | Đơn `CHECKED_IN`: `NULL→PENDING` (khách) · `PENDING→CONFIRMED` (admin) · `CONFIRMED→CHECKED_IN` (admin) | ✅ |
| 11 | HP | Điểm phong tính lại từ đánh giá chưa ẩn | Phòng có 1 đánh giá 5 sao → `RatingAvg 5.00, RatingCount 1`; đánh giá bị ẩn không tính | ✅ |

### Kịch bản 2 — Chạy app lần 2 (Bất thường: khởi động lại)

| STT | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|-----|----------|---------|---------|---------|
| 12 | AB | Chạy lại app **không** nhân bản dữ liệu | Log chỉ có **14 dòng**; đếm `INSERT INTO` = **0**; chỉ có **1** lệnh `SELECT` (kiểm tra `Users.AnyAsync`) | ✅ |
| 13 | AB | Số bản ghi 9 bảng **giữ nguyên** | Đối chiếu lại: `4/3/10/8/59/20/15/42/6` — y hệt lần 1 | ✅ |
| 14 | AB | App vẫn chạy bình thường | `Now listening on: http://localhost:5080`, `Application started`, không lỗi | ✅ |

### Kịch bản 3 — Xoá sạch dữ liệu rồi chạy lại (Edge case)

| STT | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|-----|----------|---------|---------|---------|
| 15 | EC | `TRUNCATE` 9 bảng (giữ `__EFMigrationsHistory`) → app seed lại đủ | `20260929144921_InitialCreate` còn nguyên; sau khi chạy lại: `4/3/10/8/59/20/15/42/6` | ✅ |
| 16 | EC | MySQL **không** báo lỗi CHECK / unique / khoá ngoại | Log 731 dòng, không có `Duplicate entry` / `violates check constraint` / `Exception` | ✅ |
| 17 | EC | 10 ràng buộc nghiệp vụ trong dữ liệu mẫu — **tất cả 0 vi phạm** | ① chồng lịch phòng 0 · ② số khách > sức chứa 0 · ③ đơn theo giờ < 3h 0 · ④ đánh giá trên đơn chưa `COMPLETED` 0 · ⑤ điểm phong lệch số đánh giá 0 · ⑥ trùng mã đơn 0 · ⑦ trùng phòng + khung giờ 0 · ⑧ đơn không có lịch sử 0 · ⑨ phòng không có ảnh chính 0 · ⑩ phòng không có tiện nghi 0 | ✅ |

**Kết quả: 17/17 đạt.**

---

## 1. Đăng ký / Đăng nhập / Phiên (Bước 5)

> **Bước 5 chia làm 2 lượt.** Mục 1A kiểm tầng API bằng PowerShell gọi thẳng
> `http://localhost:5080` (ngày 29/09/2026, **51/51 đúng mã lỗi**). Mục 1B kiểm tầng
> giao diện bằng trình duyệt thật trên `http://localhost:5174` (ngày 30/09/2026,
> **18/20 ca đạt, 2 ca hoãn có ghi rõ lý do**).

### 1A. Backend — 3 kịch bản bắt buộc

**Kịch bản 1 — Happy path** (đúng dữ liệu hợp lệ → thành công)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1.1 | HP | `POST /api/auth/register` dữ liệu hợp lệ, lần đầu | 201 + access + refresh token | 201, `expiresInMinutes=60`, `role=0`, `status=0` | ✅ |
| 1.2 | HP | `POST /api/auth/login` đúng email/mật khẩu | 200 + token hạn 60 phút | 200, `expiresInMinutes=60` | ✅ |
| 1.3 | HP | `GET /api/auth/me` kèm access token | 200 + hồ sơ | 200, đúng email vừa đăng ký | ✅ |
| 1.4 | HP | `POST /api/auth/refresh` | 200 + cặp token mới | 200, refresh token **khác** token cũ | ✅ |
| 1.5 | HP | `PUT /api/auth/profile` | 200, cập nhật tên/SĐT/địa chỉ | 200, dữ liệu mới ghi đúng | ✅ |
| 1.6 | HP | `PUT /api/auth/change-password` | 200, yêu cầu đăng nhập lại | 200 | ✅ |
| 1.7 | HP | `POST /api/auth/logout` | 200, kết thúc phiên | 200 | ✅ |

**Kịch bản 2 — Edge case** (giá trị biên → vẫn phải xử lý đúng)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 2.1 | EC | Email viết HOA + khoảng trắng thừa | Chuẩn hoá về chữ thường rồi lưu | 201, lưu `bienhoachu...@gmail.com` | ✅ |
| 2.2 | EC | SĐT đúng 9 chữ số (biên dưới) | Chấp nhận | 201 | ✅ |
| 2.3 | EC | SĐT đúng 11 chữ số (biên trên) | Chấp nhận | 201 | ✅ |
| 2.4 | EC | Mật khẩu đúng 6 ký tự (biên dưới) | Chấp nhận | 201 | ✅ |
| 2.5 | EC | Bỏ trống SĐT và địa chỉ | Chấp nhận, lưu `null` | 201, `phoneNumber=null`, `address=null` | ✅ |
| 2.6 | EC | Họ tên có khoảng trắng ở hai đầu | Cắt khoảng trắng thừa | 201, lưu `"Nguyen Van C"` | ✅ |
| 2.7 | EC | Mật khẩu có ký tự đặc biệt `Abc@123!#` | Chấp nhận | 201 | ✅ |
| 2.8 | EC | Đăng ký lại bằng email HOA CHU đã có | 409 trùng với bản chữ thường | **409** "Email này đã được đăng ký" | ✅ |

**Kịch bản 3 — Bất thường** (hệ thống phải từ chối, không lộ chi tiết kỹ thuật)

| # | Nhóm | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 3.1 | ĐK | Email đã tồn tại | 409 | 409 | ✅ |
| 3.2 | ĐK | Email sai định dạng (không có `@`) | 409 | 409 "Email không hợp lệ…" | ✅ |
| 3.3 | ĐK | Mật khẩu 5 ký tự (dưới biên) | 400 | 400 | ✅ |
| 3.4 | ĐK | Xác nhận mật khẩu không khớp | 400 | 400 | ✅ |
| 3.5 | ĐK | SĐT 8 chữ số (dưới biên) | 400 | 400 | ✅ |
| 3.6 | ĐK | SĐT 12 chữ số (trên biên) | 400 | 400 | ✅ |
| 3.7 | ĐK | SĐT chứa chữ cái | 400 | 400 | ✅ |
| 3.8 | ĐK | Body không phải JSON | 400, **không** lộ lỗi kỹ thuật | 400 "Dữ liệu gửi lên không hợp lệ" | ✅ |
| 3.9 | ĐK | Body là mảng `[1,2,3]` thay vì object | 400, thông báo chung | 400 "Dữ liệu gửi lên không hợp lệ" | ✅ |
| 3.10 | ĐK | Body rỗng `{}` | 400, báo **đúng** trường thiếu | 400 "Vui lòng nhập email" | ✅ |
| 3.11 | ĐK | `email` gửi sai kiểu (số thay vì chuỗi) | 400, thông báo chung | 400 "Dữ liệu gửi lên không hợp lệ" | ✅ |
| 3.12 | ĐK | Gửi kèm `role:1` và `status:1` trong JSON | 201 nhưng bỏ qua, tự chọn quyền không được | 201 | ✅ |
| 3.13 | ĐK | `GET /me` tài khoản tạo ở 3.12 | `role=0`, `status=0` | `role:0`, `status:0` | ✅ |
| 3.14 | ĐN | Sai mật khẩu | 401, không trả token | 401 | ✅ |
| 3.15 | ĐN | Email không tồn tại | 401, **thông báo y hệt 3.14** | 401, trùng khớp từng chữ | ✅ |
| 3.16 | ĐN | Tài khoản bị khoá (`khach3@gmail.com`) | 403 | 403 "Tài khoản đã bị khoá…" | ✅ |
| 3.17 | ĐN | So sánh lại 3.14 | Không lộ email nào tồn tại | Hai thông báo giống hệt nhau | ✅ |
| 3.18 | Token | `GET /me` không gửi token | 401 **có body tiếng Việt** | 401 "Bạn chưa đăng nhập…" | ✅ |
| 3.19 | Token | `POST /logout` không gửi token | 401 có body | 401 | ✅ |
| 3.20 | Token | Token ký bằng khoá khác (giả mạo) | 401 | 401 | ✅ |
| 3.21 | Token | Token đã hết hạn | 401 | 401 | ✅ |
| 3.22 | Token | `refresh` với chuỗi không phải JWT | 401 | 401 | ✅ |
| 3.23 | Token | Gõ sai đường dẫn API | 404 có body | 404 "Không tìm thấy dữ liệu yêu cầu" | ✅ |
| 3.24–3.26 | Phiên | Máy 1 và máy 2 đăng nhập cùng tài khoản | Hai refresh token phải **khác nhau** | `A == B` → **False** | ✅ |
| 3.27 | Phiên ⭐ | Dùng refresh token **cũ** (máy 1) sau khi máy 2 đăng nhập | **401** — phiên cũ mất tác dụng | 401 "Phiên đăng nhập đã hết hạn" | ✅ |
| 3.28 | Phiên | Dùng refresh token **mới** (máy 2) | 200 | 200 | ✅ |
| 3.29 | Phiên | `GET /me` bằng access token còn hiệu lực | 200 | 200 | ✅ |
| 3.30 | Phiên | `POST /logout` | 200 | 200 | ✅ |
| 3.31 | Phiên ⭐ | Dùng lại refresh token **sau khi đã đăng xuất** | **401** — đăng xuất phải vô hiệu thật | 401 | ✅ |
| 3.32 | MK | Đổi mật khẩu nhưng sai mật khẩu hiện tại | 400, không đổi | 400 | ✅ |
| 3.33 | MK | Mật khẩu mới trùng mật khẩu cũ | 409 | 409 | ✅ |
| 3.34 | MK | Mật khẩu mới 5 ký tự | 400 | 400 | ✅ |
| 3.35 | MK | Đổi mật khẩu thành công | 200 | 200 | ✅ |
| 3.36 | Phiên ⭐ | Dùng lại refresh token **sau khi đổi mật khẩu** | **401** — đổi mật khẩu phải đuổi phiên cũ | 401 | ✅ |
| 3.37 | MK | Đăng nhập lại bằng mật khẩu **cũ** | 401 | 401 | ✅ |
| 3.38 | MK | Đăng nhập lại bằng mật khẩu **mới** | 200 | 200, đúng email | ✅ |
| 3.39 | HS | `PUT /profile` gửi kèm `email` mới và `role` | 200 nhưng không đổi 2 trường này | 200, `email` và `role` giữ nguyên | ✅ |
| 3.40 | HS | `GET /me` xác nhận lại | Email & quyền không đổi | `khach1@gmail.com`, `role:0` | ✅ |

### 1B. Giao diện (đã làm)

> **Ngày chạy: 30/09/2026.** Giao diện chạy ở `http://localhost:5174`
> (cổng 5173 bị pm2 chiếm cho dự án khác trên máy — xem `client/vite.config.ts`).
> Test bằng trình duyệt thật, thao tác từng bước, quan sát nội dung trang và console.
>
> **Kết quả: 18/20 ca đạt, 2 ca hoãn có lý do rõ ràng.** Xem bảng chi tiết bên dưới.

**Kịch bản 1 — Happy path**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1.1 | Đăng ký `kieuthu123@gmail.com`, mật khẩu 6 ký tự, có SĐT + địa chỉ | Tạo tài khoản, quyền CUSTOMER, tự đăng nhập | Tạo xong, tự vào trang chủ, header hiện tên. Hồ sơ hiện Quyền = **Khách** | ✅ |
| 1.2 | Đăng nhập đúng `khach1@gmail.com` / `123456` | Vào trang chủ, hiện tên + menu | Vào trang chủ, header hiện "Trần Thị Mai" + nút Đăng xuất | ✅ |
| 1.3 | Mở `/profile`, sửa họ tên rồi bấm "Lưu thay đổi" | Thông báo thành công, tên mới hiện | Hiện "Đã cập nhật hồ sơ thành công.", header đổi sang tên mới | ✅ |
| 1.4 | Đổi mật khẩu (nhập đúng mật khẩu hiện tại) | Thành công, buộc đăng nhập lại | Thành công, tự chuyển về `/login`, header mất tên + nút Đăng xuất | ✅ |
| 1.5 | F5 lại trang `/profile` khi đang đăng nhập | Vẫn giữ phiên | Vẫn ở `/profile`, dữ liệu hồ sơ đầy đủ | ✅ |
| 1.6 | Đăng nhập bằng `admin@stayeasy.vn` | Nhận đúng quyền quản trị | Trang chủ hiện "Xin chào Nguyễn Minh Quân **(Quản trị viên)**" | ✅ |

**Kịch bản 2 — Edge case**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 2.1 | Đăng ký mật khẩu **5 ký tự** | Báo lỗi ngay dưới ô, KHÔNG gọi API | Hiện "Mật khẩu phải có ít nhất 6 ký tự" dưới ô Mật khẩu, vẫn ở `/register` | ✅ |
| 2.2 | Xác nhận mật khẩu **không khớp** | Báo lỗi dưới ô xác nhận | Hiện "Mật khẩu xác nhận không khớp" đúng dưới ô Xác nhận mật khẩu | ✅ |
| 2.3 | Đăng ký lại email đã có (`khach1@gmail.com`) | Báo email đã đăng ký, KHÔNG tạo tài khoản | Hiện "Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác" (409) | ✅ |
| 2.4 | Đăng ký email sai định dạng `khong-phai-email` | Báo lỗi 409 của server | Hiện "Email không hợp lệ. Vui lòng nhập đúng định dạng, ví dụ: ten@gmail.com" | ✅ |
| 2.5 | Đổi mật khẩu nhưng nhập **sai** mật khẩu hiện tại | Báo lỗi, không đổi | Hiện "Mật khẩu hiện tại không đúng" (401), vẫn ở `/profile` | ✅ |
| 2.6 | Gõ thẳng `/profile` khi **chưa** đăng nhập | Bị chuyển về `/login` | Tự chuyển sang `http://localhost:5174/login` | ✅ |
| 2.7 | Mở `/login` khi **đã** đăng nhập | Tự về trang chủ | Tự chuyển về `/` | ✅ |
| 2.8 | Gõ URL không tồn tại `/trang-khong-ton-tai` | Trang 404, không trắng màn | Hiện trang 404 kèm nút "Về trang chủ" | ✅ |

**Kịch bản 3 — Bất thường / người dùng khác / hiển thị**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 3.1 | Đăng nhập sai mật khẩu | Báo lỗi 401, không tạo token | Hiện "Email hoặc mật khẩu không đúng", vẫn ở `/login` | ✅ |
| 3.2 | Đăng nhập tài khoản **bị khoá** `khach3@gmail.com` | Báo "Tài khoản đã bị khoá" | Hiện "Tài khoản đã bị khoá. Vui lòng liên hệ quản trị viên" (403) | ✅ |
| 3.3 | Bấm "Đăng xuất" | Về `/login`, phiên xoá cả hai phía | Về `/login`. Truy vấn CSDL xác nhận `RefreshTokenHash = NULL` cho cả 4 tài khoản | ✅ |
| 3.4 | Xem trang đăng ký ở màn hình điện thoại 390px | Không tràn ngang, dùng được | 6 ô nhập nằm trọn trong 390px, thanh điều hướng vừa khít | ✅ |
| 3.5 | Kiểm tra quy tắc hiển thị bất biến | KHÔNG lộ `Id` nội bộ ở bất kỳ trang nào | Trang hồ sơ chỉ có email / quyền / ngày tạo, không có Id | ✅ |
| 3.6 | Theo dõi console trình duyệt khi thao tác | Không có cảnh báo / lỗi | 0 warning, 0 error (đã tắt 2 cảnh báo React Router bằng cờ `future`) | ✅ |

**1 ca hoãn + 1 ca đã chuyển sang unit test — đều có lý do rõ ràng, không bỏ sót**

| # | Kịch bản | Vì sao chưa làm | Khi nào làm |
|---|----------|-----------------|------------|
| H1 | Khách gõ thẳng URL `/admin` | **Chưa có route `/admin`** — trang quản trị thuộc Bước 14. `ProtectedRoute` đã sẵn sàng nhận tham số `yeuCauQuyen={UserRole.ADMIN}` | Bước 14 |
| H2 | Token hết hạn giữa chừng, tự refresh | ~~Cần sửa `localStorage` để ép access token hết hạn; công cụ kiểm thử trình duyệt ở đây không cho chạy lệnh trong trang~~ → **ĐÃ ĐƯỢC KIỂM CHỨNG BẰNG UNIT TEST** (30/09, lượt cài vitest): `client/src/api/client.interceptor.test.ts` có 13 ca cho đúng phần này, gồm refresh thành công rồi thử lại bằng token mới, 3 request 401 cùng lúc chỉ gọi refresh **1 lần**, thử lại vẫn 401 thì không refresh lần nữa, và cả 3 kiểu không refresh được đều phải xoá phiên. Phía server đã kiểm chứng ở mục 1A | **Xong** — không còn là khoảng trống |

> **Ghi chú:** ca H2 vẫn nên thử tay thêm một lần ở Bước 14 khi có màn hình liên tục
> gọi API, vì lúc đó sẽ quan sát được hành vi thật (đang ở trang nào thì bị đưa về
> đâu) chứ không chỉ logic bên trong interceptor.

> **Ca "đăng ký có tham số `role: ADMIN`" đã bỏ khỏi bảng, không phải quên:** form đăng ký
> không có ô nhập quyền nên giao diện không thể gửi `role` lên. Trường hợp này đã kiểm
> ở tầng API trong mục 1A (ca 3.39 và 3.40) — `PUT /profile` có gửi email và role mới
> nhưng server bỏ qua, dữ liệu giữ nguyên.
>
> **Sau khi đăng ký, người dùng vào thẳng hệ thống chứ không qua trang đăng nhập** — vì
> endpoint đăng ký cũng trả về cặp token giống đăng nhập. Đây là hành vi chủ ý.

### 1C. Lỗ hổng phát hiện & đã sửa trong lúc kiểm thử

> Ghi lại vì đây là bằng chứng cho việc "kiểm thử tay không thay thế được unit test":
> 2 lỗi đầu đã đi qua **toàn bộ 147 unit test mà không bị bắt**. Lỗi thứ 3 ở tầng
> giao diện, không có unit test nào phủ nên đã đi qua **toàn bộ 51 ca kiểm thử tay
> phía API mà vẫn không lộ ra** — phải mở trình duyệt thao tác thật mới thấy.

| Lỗi | Biểu hiện | Nguyên nhân gốc | Đã sửa |
|------|-----------|-----------------|---------|
| **Refresh token cũ vẫn dùng được** (3.27 trả 200 thay vì 401) | Đăng nhập ở máy 2 không làm mất tác dụng token máy 1 → giới hạn "mỗi tài khoản một phiên" ghi trong báo cáo là vô hiệu | Refresh token dài ~196 ký tự nhưng lại băm bằng **BCrypt**, mà BCrypt chỉ xét **72 byte đầu**. Hai token chỉ khác nhau ở phần cuối nên cho **cùng một hash** | Tách `ITokenHasher` (SHA-256, xét toàn bộ chuỗi) khỏi `IPasswordHasher` (BCrypt, dành cho mật khẩu). Cột `RefreshTokenHash` giữ nguyên `varchar(100)` — SHA-256 hex đúng 64 ký tự |
| **Hai lần đăng nhập trong cùng giây sinh ra token giống hệt nhau** | Refresh token không thay đổi sau khi làm mới phiên → token bị đánh cắp không bị vô hiệu hoá | JWT chỉ chứa `userId` + `exp`, mà `exp` tính theo giây; không có mã định danh duy nhất | Thêm claim `jti` = `Guid.NewGuid()` vào refresh token (chuẩn JWT 7519 mục 4.1.7) |
| **147 unit test không bắt được cả hai lỗi trên** | Test xanh trong khi bản thật hỏng | `FakeJwtTokenService` trả về `fake-refresh-{id}` — **giống nhau mọi lần gọi**; `FakePasswordHasher` so sánh chuỗi thuần. Bản giả che mất đúng đặc tính gây lỗi của hàm thật | Sửa `FakeJwtTokenService` sinh token khác nhau mỗi lần (`fake-refresh-{id}-{số thứ tự}`), dùng `TokenHasher` **thật** trong `AuthServiceTests`. Bài học ở `lessons.md` mục 20 |
| **Đổi mật khẩu & đăng xuất báo "Đã xảy ra lỗi" dù server đã làm đúng** (lượt làm giao diện, ca 1.4) | Bấm "Đổi mật khẩu" với mật khẩu đúng → hiện lỗi chung chung, **không** chuyển về trang đăng nhập. Log server cho thấy `UPDATE Users SET PasswordHash...` đã chạy thành công, không có exception | `bocDuLieu()` trong `authService.ts` coi `data === null` là lỗi. Nhưng `POST /auth/logout` và `PUT /auth/change-password` trả `ApiResponse<object>.Success(...)` — **không có data, tức `data` là `null` cả khi thành công**. Hàm này viết cho endpoint có data rồi dùng lại cho endpoint không có data | Tách hàm `kiemTraThanhCong()` chỉ kiểm `success`, dành cho endpoint không mang dữ liệu. Đồng thời cho `layThongBaoLoi()` trả `error.message` khi lỗi do chính tầng service ném ra, thay vì nuốt mất nguyên nhân. Bài học ở `lessons.md` mục 25 |

---

## 2. Xem địa điểm (Bước 6)

> Ngày chạy: 30/09/2026. API `GET /api/locations` (public, không cần token) +
> trình duyệt thật trên `http://localhost:5174`.
> **Kết quả: 9/9 ca đạt.** Xem bảng chi tiết bên dưới.

**Kịch bản 1 — Happy path**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1.1 | `GET /api/locations` không gửi token | 200, 3 địa điểm, mỗi địa điểm kèm phòng | 200, Hưng Yên (4 phòng) + Đà Lạt (3) + Hội An (3) = 10 phòng | ✅ |
| 1.2 | Mở `/locations` | 3 thẻ địa điểm: ảnh, tên, địa chỉ, số phòng, giá thấp nhất | Đủ 3 thẻ, ảnh SVG hiện, "Từ 520.000 ₫/ngày" | ✅ |
| 1.3 | Bấm vào địa điểm đầu | Sang `/locations/0`, hiện thông tin + 4 phòng kèm giá giờ/ngày, đánh giá, nhãn trạng thái | Hiện đủ: "Phòng tại Hưng Yên Ven Biển (4)", "90.000 ₫/giờ", "★ 5,0 (1 đánh giá)", "Còn trống"/"Đang dọn dẹp" | ✅ |

**Kịch bản 2 — Edge case**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 2.1 | Gõ thẳng `/locations/1` chưa vào list | Vẫn hiện đúng Đà Lạt (tự tải list rồi chọn) | Hiện "Đà Lạt Đồi Thông" + 3 phòng | ✅ |
| 2.2 | Gõ `/locations/99` | Báo không tìm thấy, không trắng màn | Hiện "Không tìm thấy địa điểm" + nút "Về danh sách địa điểm" | ✅ |
| 2.3 | Màn hình điện thoại 390px | Không tràn ngang | Thẻ xếp 1 cột, rộng 343px trong 390px | ✅ |

**Kịch bản 3 — Bất thường**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 3.1 | Tắt server rồi mở `/locations` (tab mới, cache trống) | Hiện lỗi + nút "Thử lại", không trắng màn | Hiện "Yêu cầu thất bại (mã 500)" + nút "Thử lại" (mã 500 do proxy Vite trả khi không nối được API) | ✅ |
| 3.2 | Bật server lại rồi bấm "Thử lại" | Tải lại được danh sách | Hiện đủ 3 địa điểm | ✅ |
| 3.3 | Kiểm tra quy tắc hiển thị bất biến | KHÔNG lộ `Id` ở response lẫn màn hình | Quét JSON: không có `id`/`locationId`/`roomId`; STT = chỉ số + 1; giá `text-right` + `.number-vn` | ✅ |

> Console trình duyệt 0 warning 0 error trong cả 3 kịch bản. CSDL sau test:
> 4 users, 3 locations, 10 rooms, `RefreshTokenHash` treo = 0.

---
## 3. Tìm kiếm & lọc phòng (Bước 7)

> Ngày chạy: 30/09/2026. API `GET /api/rooms/search` (public) + trình duyệt thật
> trên `http://localhost:5174/rooms`.
> **Kết quả: 11/11 ca đạt.** Bảng kế hoạch cũ giữ nguyên số thứ tự, chỉ điền kết quả.

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Không lọc | Hiện tất cả phòng, phân trang đúng | 10 phòng / 2 trang (6 + 4), "Tìm thấy 10 phòng · Trang 1/2" | ✅ |
| 2 | HP | Lọc theo địa điểm Hưng Yên | Chỉ còn phòng của Hưng Yên | `locationIndex=0` → 4 phòng, toàn "Hưng Yên Ven Biển" | ✅ |
| 3 | EC | Lọc giá 0 – 1.000 | Danh sách rỗng, hiện trạng thái "Không tìm thấy" | Hiện "Không tìm thấy phòng nào" + hướng dẫn nới điều kiện | ✅ |
| 4 | EC | Lọc giá 0 – 1.000.000.000 | Hiện tất cả phòng, không lỗi | 10/10 phòng (giá cao nhất seed là 1.800.000/ngày) | ✅ |
| 5 | AB | Số khách vượt sức chứa mọi phòng | Danh sách rỗng | `capacity=6` → 0 phòng (sức chứa lớn nhất là 5) | ✅ |
| 6 | HP | Sắp xếp giá tăng dần | Đúng thứ tự từ thấp đến cao | 520.000 → ... → 1.800.000, kiểm bằng script so sánh từng cặp | ✅ |
| 7 | AB | Tìm kiếm từ khóa không có kết quả | Danh sách rỗng + thông báo | Từ khoá lạ → 0 phòng + Empty state | ✅ |
| 8 | EC | Chuyển sang trang 2 | STT liên tục, không đánh lại từ 1 | STT 7, 8, 9, 10; nút "Trang sau" mờ ở trang cuối | ✅ |
| 9 | HP | Giá hiển thị | Đúng định dạng `1.200.000 ₫`, **căn phải** | "550.000 ₫/ngày" `text-right` + `.number-vn`; từ khoá "Hạnh Phúc" → đúng 1 phòng | ✅ |
| 10 | AB | `minPrice > maxPrice` | 400 kèm thông báo | 400 "Giá thấp nhất không được lớn hơn giá cao nhất" | ✅ |
| 11 | AB | `roomType` / `sort` sai | 400 kèm thông báo | 400 "Loại phòng không hợp lệ" / "Cách sắp xếp không hợp lệ" | ✅ |

> Chưa kiểm tay: ô chọn địa điểm / loại phòng / sắp xếp bằng chuột (công cụ trình
> duyệt không thao tác được `select`). Ba ô này đã có test giao diện + kiểm API
> trực tiếp (`locationIndex=0` → 4 phòng Hưng Yên, `sort=priceAsc` → tăng dần đúng).
> Console 0 warning 0 error. Mobile 390px: form 1 cột, ô rộng 309px, không tràn.
> Response quét sạch `Id`. CSDL sau test: 4 users, 3 locations, 10 rooms.

## 4. Chi tiết phòng (Bước 8)

> Ngày chạy: 30/09/2026. Dữ liệu từ `GET /api/locations` (đã mở rộng) + trình duyệt
> thật trên `http://localhost:5174/locations/0/rooms/0`.
> **Kết quả: 8/8 ca đạt.**

**Kịch bản 1 — Happy path**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1.1 | Mở `/locations/0/rooms/0` | Đủ breadcrumb, ảnh, mô tả, giá, tiện nghi, đánh giá, khung ngày | Đủ: "Phòng Hạnh Phúc", 5 tiện nghi, 1 đánh giá 5 sao + ngày, "90.000 ₫/giờ / 550.000 ₫/ngày" | ✅ |
| 1.2 | Bấm thumbnail 2 rồi bấm ảnh chính | Đổi ảnh chính, mở lớp phủ xem lớn, bấm Đóng thì đóng | Ảnh chính đổi, lớp phủ mở, nút Đóng hoạt động | ✅ |
| 1.3 | Chọn nhận 05/10 14:00, trả 07/10 12:00 (theo ngày) | Tạm tính đúng công thức backend | "Tạm tính: 2 ngày × 1.100.000 ₫" (46 giờ → 2 ngày) | ✅ |
| 1.4 | Bấm thẻ phòng từ trang `/rooms` | Sang đúng chi tiết phòng đó | Sang `/locations/0/rooms/0` | ✅ |

**Kịch bản 2 — Edge case**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 2.1 | Gõ `/locations/0/rooms/99` | Báo không tìm thấy, có đường về | "Không tìm thấy phòng" + nút "Về trang tìm kiếm" | ✅ |
| 2.2 | Mobile 390px | Không tràn ngang | Thẻ 343px, form 1 cột, nút vừa màn hình | ✅ |

**Kịch bản 3 — Bất thường**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 3.1 | Đánh giá bị Admin ẩn | Không hiện ở bất kỳ đâu | Seed có 1 đánh giá ẩn ("...bẩn..."); API chỉ trả 5 hiện; unit test khẳng định | ✅ |
| 3.2 | Quét `Id` trong response mở rộng | Không lộ `id/locationId/roomId/userId/bookingId` | Quét JSON sạch — reviewer chỉ có tên, không có `userId` | ✅ |

> Console 0 warning 0 error. Khung ngày chưa có nút đặt — nút thuộc Bước 10,
> làm trước là UI chết (quyết định #4 trong `todo.md`).
> CSDL sau test: 4 users, 3 locations, 10 rooms, `RefreshTokenHash` treo = 0.

## 5. Kiểm tra phòng trống (Bước 9)

> Ngày chạy: 30/09/2026. API `GET /api/rooms/availability` (public) + khung chọn
> ngày ở `http://localhost:5174/locations/1/rooms/0`.
> **Kết quả: 8/8 ca đạt.**

**Kịch bản 1 — Happy path**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1.1 | Khoảng xa đơn nào (+30 ngày) | 200 + `isAvailable: true` | Đúng | ✅ |
| 1.2 | Khoảng trùng đơn CONFIRMED (B101 Đà Lạt) | 200 + `isAvailable: false` + lý do | "Phòng đã có người đặt trong khoảng thời gian này" | ✅ |
| 1.3 | Chọn ngày trùng trên khung ở trang chi tiết | Hiện đỏ "đã có người đặt" + vẫn hiện giá tạm tính | Đúng cả hai | ✅ |

**Kịch bản 2 — Edge case**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 2.1 | Nhận đúng giờ đơn cũ trả (chạm biên) | `true` — chạm biên không tính trùng | `true` | ✅ |
| 2.2 | Chọn khoảng trống trên khung | Hiện xanh "còn trống" | "Phòng còn trống trong khoảng đã chọn" + "2 ngày × 1.900.000 ₫" | ✅ |
| 2.3 | Mobile 390px trang chi tiết | Không tràn ngang | Ô ngày 309px, nút vừa màn hình | ✅ |

**Kịch bản 3 — Bất thường**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 3.1 | Trả trước nhận / đặt gấp / theo giờ 2h | 400 kèm thông báo đúng | "Giờ trả phòng phải sau giờ nhận phòng" / "Phải đặt trước ít nhất 2 giờ" / "Đặt theo giờ tối thiểu 3 giờ" | ✅ |
| 3.2 | Chỉ số sai / phòng bảo trì | 404 / 200+bận | 404 "Không tìm thấy phòng" / 200 + "Phòng đang bảo trì, không nhận đặt" | ✅ |

> Console 0 warning 0 error. CSDL sau test: 4 users, 15 bookings
> (không tạo đơn mới — endpoint chỉ đọc), `RefreshTokenHash` treo = 0.


## 6. Đặt phòng (Bước 10) ⭐

> Ngày chạy: 30/09/2026. API `POST /api/bookings` + trình duyệt thật
> (đăng nhập `khach1@gmail.com`, đặt Phòng Xuân Hương A301).
> **Kết quả: 10/10 ca đạt.**

**Kịch bản 1 — Happy path**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1.1 | Đặt theo ngày 2 đêm qua API | 201, tiền = 2 × giá ngày | 201, `HS-261030-4167`, 1.100.000 ₫, status 0 (PENDING) | ✅ |
| 1.2 | Đặt theo giờ 3 tiếng qua API | 201, tiền = 3 × giá giờ | 201, `HS-261030-1930`, 255.000 ₫ | ✅ |
| 1.3 | Luồng trình duyệt: chi tiết → chọn ngày → tiếp tục → xác nhận | Hiện mã `HS-...`, tiền đúng, không `Id` | `HS-261205-3031`, 3 khách, 2.500.000 ₫, chỉ hiện `Code` | ✅ |

**Kịch bản 2 — Edge case**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 2.1 | Vượt sức chứa (9 khách, phòng 5) | Chặn ở form, không gọi API | "Phòng chỉ chứa tối đa 5 khách", API không nhận request | ✅ |
| 2.2 | Vượt sức chứa qua API (6 khách) | 400 | 400 "Phòng chỉ chứa tối đa 5 khách" | ✅ |
| 2.3 | Ghi chú 501 ký tự | 400 | 400 "Ghi chú không được vượt quá 500 ký tự" | ✅ |
| 2.4 | Mobile 390px trang đặt | Không tràn ngang | Ô 325px, nút vừa màn hình | ✅ |

**Kịch bản 3 — Bất thường**

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 3.1 | Đặt trùng đơn vừa tạo | 409, không tạo đơn mới | 409 "Phòng đã có người đặt trong khoảng thời gian này" | ✅ |
| 3.2 | **2 tab cùng đặt 1 phòng 1 khung giờ** | Chỉ 1 đơn, tab kia 409 | TAB1 201 (`HS-261109-4809`), TAB2 409 — transaction SERIALIZABLE giữ đúng | ✅ |
| 3.3 | Không gửi token | 401 | 401 "Bạn chưa đăng nhập..." | ✅ |
| 3.4 | Mở `/booking/...` khi chưa đăng nhập | Về `/login` | Tự chuyển về `/login` (ProtectedRoute) | ✅ |

> Đơn của tôi ở ca 1.3 đã xoá sau test (kèm lịch sử). CSDL sau test: 15 đơn
> (đúng seed), 42 dòng lịch sử (đúng seed), `RefreshTokenHash` treo = 0.
> Console 0 warning 0 error.


## 7. Quản lý đơn của tôi (Bước 11)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Xem danh sách đơn của tôi | Chỉ thấy đơn của chính mình | | |
| 2 | HP | Hủy đơn `PENDING` | Thành `CANCELLED`, phòng về `AVAILABLE` | | |
| 3 | AB | Cố hủy đơn `CHECKED_IN` | Bị từ chối, báo lý do | | |
| 4 | AU | Khách khác sửa URL để xem đơn của người khác | Bị chặn 403 | | |
| 5 | HP | Xem lịch sử trạng thái | Hiện đủ các bước với thời gian + ai thực hiện | | |
| 6 | EC | Lọc đơn theo trạng thái | Danh sách đúng | | |

---

## 8. Admin — quản lý danh mục (Bước 12) — **30/09/2026**

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | AU | Khách gõ URL `/admin/rooms` | Bị chặn, đưa về trang chủ | `ProtectedRoute` chặn khi `role !== ADMIN`; backend `[Authorize(Roles = "ADMIN")]` chặn tiếp | ✅ |
| 2 | HP | Admin tạo cơ sở mới qua API | Lưu được, `totalRooms = 0` | `{"success":true,"message":"Tạo cơ sở thành công","totalRooms":0}` | ✅ |
| 3 | AB | Sửa cơ sở + tắt hoạt động | Cập nhật đúng tên, `isActive = false` | `name="Homestay Test B12 - Đã sửa", isActive=false` | ✅ |
| 4 | AB | Tạo cơ sở với tên rỗng | 400 kèm thông báo tiếng Việt | HTTP 400 `{"success":false,"message":"Vui lòng nhập tên cơ sở"}` | ✅ |
| 5 | AB | Xoá cơ sở **đang có phòng** | Bị từ chối, báo lý do | HTTP 400 `"Không thể xoá cơ sở đang có phòng. Vui lòng xoá hoặc chuyển các phòng trước"` | ✅ |
| 6 | EC | Xoá cơ sở đã rỗng | Xoá được | HTTP 200 `"Xoá cơ sở thành công"` | ✅ |
| 7 | HP | Tạo phòng + 2 ảnh + 2 tiện nghi | Ảnh đầu là ảnh chính, tiện nghi gắn đủ | `images: [cozy-1.jpg, cozy-2.jpg]`, `amenityNames: ["WiFi miễn phí","Máy lạnh"]`, `status: 0` | ✅ |
| 8 | AB | Tạo phòng với giá giờ = 0 | Bị chặn | HTTP 400 `"Giá theo giờ phải lớn hơn 0"` | ✅ |
| 9 | HP | Đổi trạng thái phòng sang `MAINTENANCE` | Chỉ đổi trạng thái, không đụng tên/giá | `status: 4`, `name` và `pricePerHour` giữ nguyên | ✅ |
| 10 | AB | Xoá phòng đã có đơn | Bị từ chối, giữ nguyên phòng | HTTP 400 `"Không thể xoá phòng đã có đơn đặt. Vui lòng chuyển phòng sang bảo trì"`; kiểm CSDL phòng vẫn còn | ✅ |
| 11 | AB | Tạo khách với email đã tồn tại | 409 Conflict | HTTP 409 `"Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác"` | ✅ |
| 12 | HP | Tạo khách mới + danh sách khách | Không lẫn tài khoản Admin | 4 khách, `totalBookings` lần lượt 6/4/5/0 — không có dòng nào là `admin@stayeasy.vn` | ✅ |
| 13 | GIAO DIỆN | `/admin/facilities` — 3 cơ sở, 10 phòng | Bảng hiển thị đúng, STT tự tính | Header "Tổng 3 cơ sở · 10 phòng"; STT 1, 2, 3; **không hiển thị Id** | ✅ |
| 14 | GIAO DIỆN | Mở form "Thêm cơ sở", bấm Lưu khi tên rỗng | Chặn ngay, chưa gọi API | Hiện đỏ "Vui lòng nhập tên cơ sở" trong form, danh sách không đổi | ✅ |
| 15 | GIAO DIỆN | Bấm "Xoá" cơ sở đang có phòng | Bấm 1 lần hỏi lại, bấm 2 lần mới xoá | Nút đổi thành "Chắc chắn xoá?"; sau cú bấm 2 hiện đỏ "Không thể xoá cơ sở đang có phòng…" | ✅ |
| 16 | GIAO DIỆN | `/admin/rooms` — 10 phòng | Giá đúng định dạng VND, căn phải | "90.000 ₫", "1.800.000 ₫" căn phải; concept hiện Cozy / Japandi / Signature | ✅ |
| 17 | GIAO DIỆN | `/admin/rooms` — đổi trạng thái bằng dropdown | Ô chọn hiện 5 trạng thái tiếng Việt | "Còn trống / Đã được đặt / Đang có khách / Đang dọn dẹp / Bảo trì" | ✅ |

> **Lỗi phát hiện trong lúc kiểm thử:** 22 ảnh trong `public/images/rooms/{cozy,japandi,signature}/` **không phải ảnh phòng** mà là poster quảng cáo của một dự án khác ("Nhà Ở Hẻm": banner, bản đồ tiện ích, poster khuyến mãi). Xem trực tiếp `cozy-1.jpg`, `cozy-2.jpg`, `cozy-3.jpg`, `signature-1.jpg` để xác nhận. Đường dẫn trong seed + CSDL đã sửa sang bộ ảnh mới, nhưng **nội dung ảnh vẫn cần thay bằng ảnh thật**.

---

## 9. Admin — vòng đời đơn & phòng (Bước 13) ⭐

> Chạy trọn vẹn 1 vòng đời, quan sát từng bước:

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Khách đặt phòng | Đơn `PENDING`, phòng `BOOKED` | | |
| 2 | HP | Admin xác nhận đơn | `CONFIRMED` | | |
| 3 | AB | Admin xác nhận đơn đã hủy | Bị từ chối | | |
| 4 | HP | Admin check-in | `CHECKED_IN`, phòng `OCCUPIED` | | |
| 5 | AB | Khách khác đặt phòng đó trong lúc đang ở | Bị từ chối | | |
| 6 | HP | Admin check-out | `COMPLETED`, phòng `CLEANING` | | |
| 7 | AB | **Đặt phòng đó trong 2 giờ vệ sinh** | **Bị từ chối** | | |
| 8 | HP | Sau 2 giờ | Phòng tự về `AVAILABLE` | | |
| 9 | HP | Admin từ chối đơn kèm lý do | `REJECTED`, phòng về `AVAILABLE`, lưu lý do | | |
| 10 | HP | Xem lịch sử trạng thái | Có đủ 4 bước + người thực hiện + thời điểm | | |
| 11 | EC | Admin đổi trạng thái phòng thủ công sang `MAINTENANCE` | Không nhận đặt mới | | |

---

## 10. Dashboard & đánh giá (Bước 15, 16)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Mở Dashboard | Số liệu khớp với database | | |
| 2 | HP | Biểu đồ doanh thu | Đúng các tháng có đơn `COMPLETED` | | |
| 3 | EC | Phân trang danh sách đơn ở Admin | STT liên tục qua các trang | | |
| 4 | AB | Đánh giá đơn chưa `COMPLETED` | Bị từ chối | | |
| 5 | AB | Đánh giá 2 lần cùng 1 đơn | Lần 2 bị từ chối | | |
| 6 | HP | Đánh giá 5 sao | Rating trung bình trên trang phòng thay đổi | | |
| 7 | AU | Admin ẩn đánh giá vi phạm | Không hiện nữa trên trang phòng | | |

---

## 11. Giao diện & trải nghiệm (Bước 17)

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1 | Thu nhỏ cửa sổ về kích thước điện thoại (375px) | Mọi trang dùng được, không tràn ngang | | |
| 2 | Tải trang chậm | Hiện spinner / skeleton | | |
| 3 | Danh sách không có dữ liệu | Hiện thông báo "Chưa có dữ liệu", không phải trang trắng | | |
| 4 | Gọi API lỗi | Hiện thông báo lỗi thân thiện, không lộ stack trace | | |
| 5 | Thao tác thành công | Hiện toast xanh | | |
| 6 | Thao tác thất bại | Hiện toast đỏ | | |
| 7 | Gõ URL không tồn tại | Hiện trang 404 | | |

---

## 12. Tổng kết

| Nhóm chức năng | Số test | Đạt | Không đạt |
|----------------|---------|-----|-----------|
| Tài khoản | 12 | | |
| Tìm kiếm & lọc | 9 | | |
| Kiểm tra phòng trống | 9 | | |
| Đặt phòng | 8 | | |
| Quản lý đơn của tôi | 6 | | |
| Admin danh mục | 9 | | |
| Admin vòng đời | 11 | | |
| Dashboard & đánh giá | 7 | | |
| Giao diện | 7 | | |
| **Tổng** | **78** | | |

**Đạt ≥ 95% là đủ.** Các mục "không đạt" phải sửa hết trước khi chốt báo cáo.
