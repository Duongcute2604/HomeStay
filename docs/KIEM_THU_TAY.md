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
> Cách mở: `docker exec -it homestay-mysql mysql -uhomestay -phomestay123 -D homestay`

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
> Lệnh: `dotnet run --project server\HomeStay\HomeStay.csproj`

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
| 1.6 | Đăng nhập bằng `admin@homestay.vn` | Nhận đúng quyền quản trị | Trang chủ hiện "Xin chào Nguyễn Minh Quân **(Quản trị viên)**" | ✅ |

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
| 1 | HP | Xem danh sách đơn của tôi | Chỉ thấy đơn của chính mình | `khach1` thấy **7** đơn, `khach2` thấy **4** đơn; **0 mã đơn nào trùng** giữa hai tài khoản | ✅ |
| 2 | HP | Hủy đơn `PENDING` | Thành `CANCELLED`, phòng về `AVAILABLE` | `HS-261101-2186`: HTTP 200, `status` **0 → 4**, lưu `cancelReason`; lịch sử ghi `0 → 4`; phòng **A102** trở lại `AVAILABLE` | ✅ |
| 3 | AB | Cố hủy đơn `CHECKED_IN` | Bị từ chối, báo lý do | HTTP **409** — *"Chỉ có thể hủy đơn đang 'chờ xác nhận' hoặc 'đã xác nhận'"* | ✅ |
| 3b | AB | Cố hủy đơn `COMPLETED` | Bị từ chối | HTTP **409**, cùng thông báo | ✅ |
| 4 | AU | Khách khác sửa URL để xem đơn của người khác | Bị chặn, không lộ đơn có tồn tại | HTTP **404** — **không phải 403**. Đúng chủ ý đã chốt ở Bước 16: trả 403 sẽ lộ ra là đơn đó *có thật* | ✅ (kỳ vọng cũ ghi 403, đã sửa) |
| 4b | AU | Khách khác sửa URL để **hủy** đơn của người khác | Bị chặn | HTTP **404** | ✅ |
| 5 | HP | Xem lịch sử trạng thái | Hiện đủ các bước với thời gian + ai thực hiện | `HS-261002-0011` có **2** dòng: `"" → 0` bởi *Trần Thị Mai* (khách tạo) và `0 → 1` bởi *Nguyễn Minh Quân* (Admin xác nhận) — phân biệt được người khách với Admin | ✅ |
| 6 | EC | Lọc đơn theo trạng thái | Danh sách đúng | `?status=0..5`: lọc đúng từng nhóm — `0`→0, `1`→1, `2`→1, `3`→3, `4`→2, `5`→0 đơn (tổng **7** = đúng số đơn của khách) | ✅ *(làm 01/10)* |
| 6b | EC | Không truyền `status` | Trả tất cả, URL không đổi | `?page=1&pageSize=50` → **7** đơn, không có tham số thừa | ✅ |
| 6c | AB | `status` sai: `99`, `6`, `-1`, rỗng | Không lỗi, coi như không lọc | `99`/`6`/`-1`/rỗng → đều HTTP **200**, **7** đơn | ✅ |
| 6d | AB | Lọc `COMPLETED` rồi mở trang 2 | Trang rỗng, không phải lỗi | `?status=3&page=2&pageSize=3` → 200, `items: []`, `totalItems: 3`, `totalPages: 1` | ✅ |
| 6e | AU | Lọc có rò rỉ đơn người khác không? | Không | `khach1` lọc `CONFIRMED` → 1 đơn; `khach2` lọc `COMPLETED` → 3 đơn; **0 mã trùng** giữa hai tài khoản | ✅ |
| 6f | GIAO DIỆN | Trang `/bookings` ở 375px | Ô lọc xếp dọc, không tràn ngang | Nhãn "Lọc theo trạng thái" + `<select>` **7 lựa chọn** (Tất cả + 6 trạng thái) chiếm 1 hàng; `html` rộng 375px, **không tràn ngang** | ✅ |
| 6g | GIAO DIỆN | Lọc mà không ra đơn nào | Ô lọc **vẫn còn**, có lối thoát | Hiện thẻ *"Không có đơn nào ở trạng thái này"* + nút "Xem tất cả đơn"; **không** hiện "Tìm phòng ngay" (sai hướng khi người dùng chỉ đang lọc đơn cũ) | ✅ |

> **Phát hiện 01/10, đã sửa:** dòng 6 lúc đầu là bằng chứng Bước 11 **chưa thực sự xong** —
> tính năng lọc theo trạng thái chưa tồn tại ở cả API lẫn giao diện, nhưng `todo.md` lại đánh dấu Bước 11 là `[x]`.
> Đã làm ở Bước 11 vây (01/10) và giờ đạt **12/12**. Bài học ở `lessons.md` mục 70.
>
> **Sửa thêm 01/10:** dòng 4 ghi kỳ vọng "403" nhưng hệ thống trả **404**. Đây **không phải lỗi** mà là quyết định
> chốt từ Bước 16 (không để lộ sự tồn tại của đơn người khác). Đã sửa lại kỳ vọng cho khớp thực tế.

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
| 12 | HP | Tạo khách mới + danh sách khách | Không lẫn tài khoản Admin | 4 khách, `totalBookings` lần lượt 6/4/5/0 — không có dòng nào là `admin@homestay.vn` | ✅ |
| 13 | GIAO DIỆN | `/admin/facilities` — 3 cơ sở, 10 phòng | Bảng hiển thị đúng, STT tự tính | Header "Tổng 3 cơ sở · 10 phòng"; STT 1, 2, 3; **không hiển thị Id** | ✅ |
| 14 | GIAO DIỆN | Mở form "Thêm cơ sở", bấm Lưu khi tên rỗng | Chặn ngay, chưa gọi API | Hiện đỏ "Vui lòng nhập tên cơ sở" trong form, danh sách không đổi | ✅ |
| 15 | GIAO DIỆN | Bấm "Xoá" cơ sở đang có phòng | Bấm 1 lần hỏi lại, bấm 2 lần mới xoá | Nút đổi thành "Chắc chắn xoá?"; sau cú bấm 2 hiện đỏ "Không thể xoá cơ sở đang có phòng…" | ✅ |
| 16 | GIAO DIỆN | `/admin/rooms` — 10 phòng | Giá đúng định dạng VND, căn phải | "90.000 ₫", "1.800.000 ₫" căn phải; concept hiện Cozy / Japandi / Signature | ✅ |
| 17 | GIAO DIỆN | `/admin/rooms` — đổi trạng thái bằng dropdown | Ô chọn hiện 5 trạng thái tiếng Việt | "Còn trống / Đã được đặt / Đang có khách / Đang dọn dẹp / Bảo trì" | ✅ |

> **Lỗi phát hiện trong lúc kiểm thử:** 22 ảnh trong `public/images/rooms/{cozy,japandi,signature}/` **không phải ảnh phòng** mà là poster quảng cáo của một dự án khác ("Nhà Ở Hẻm": banner, bản đồ tiện ích, poster khuyến mãi). Xem trực tiếp `cozy-1.jpg`, `cozy-2.jpg`, `cozy-3.jpg`, `signature-1.jpg` để xác nhận. **Đã sửa xong:** thay bằng 12 ảnh CC0 của StockSnap (xem `docs/NGUON_ANH.md`), vẽ lại logo bằng SVG, sửa ảnh hero + 3 địa chỉ trong footer.

---

## 9. Admin — vòng đời đơn đặt phòng (Bước 13) — **30/09/2026**

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Xác nhận đơn `HS-261003-0014` (PENDING) | Đơn → CONFIRMED, phòng A101 → BOOKED | HTTP 200, `status: 1`; kiểm CSDL: A101 = `BOOKED` | ✅ |
| 2 | HP | Nhận phòng cùng đơn đó | Đơn → CHECKED_IN, phòng → OCCUPIED | HTTP 200, `status: 2` | ✅ |
| 3 | HP | Trả phòng cùng đơn đó | Đơn → COMPLETED, **phòng → CLEANING chứ không AVAILABLE** | HTTP 200, `status: 3`; kiểm CSDL: A101 = `CLEANING`. Đúng quy định vệ sinh 2 giờ | ✅ |
| 4 | AB | Từ chối mà không nhập lý do | 400, đơn giữ nguyên PENDING | HTTP 400 `"Vui lòng nhập lý do để khách biết vì sao đơn bị hủy"`; phòng A301 vẫn `AVAILABLE` | ✅ |
| 5 | EC | Từ chối kèm lý do | Đơn → REJECTED, lưu lý do vào `CancelReason`, phòng → AVAILABLE | HTTP 200, `status: 5`, `cancelReason: "Phòng đang bảo trì, đã sửa xong sẽ liên hệ lại"` | ✅ |
| 6 | AB | Nhận phòng đơn **chưa xác nhận** | 409, không đổi trạng thái | HTTP 409 `"Thao tác này chỉ áp dụng cho đơn đang \"đã xác nhận\". Đơn hiện ở trạng thái \"chờ xác nhận\""` | ✅ |
| 7 | AB | Xác nhận đơn đã bị từ chối | 409 | HTTP 409 `"Thao tác này chỉ áp dụng cho đơn đang \"chờ xác nhận\". Đơn hiện ở trạng thái \"đã từ chối\""` | ✅ |
| 8 | AB | Trả phòng 2 lần liên tiếp | Lần 2 bị chặn 409 | HTTP 200 lần 1, HTTP 409 lần 2 | ✅ |
| 9 | AB | Mã đơn không tồn tại | 404 | HTTP 404 `"Không tìm thấy đơn đặt phòng"` | ✅ |
| 10 | EC | Lọc `status=0` (PENDING) | Chỉ trả đơn chờ xác nhận | `totalItems: 1` sau khi đã xử lý 2 đơn PENDING | ✅ |
| 11 | EC | Tìm từ khoá `HS-2610` / `khach1` | Lọc theo mã và theo email khách | `HS-2610` → 4 đơn; `khach1` → 6 đơn | ✅ |
| 12 | AB | Lịch sử trạng thái ghi đúng người thực hiện | Dòng `PENDING→CONFIRMED` ghi Admin, không phải khách | CSDL: `NULL→PENDING` bởi `khach1@gmail.com`; `PENDING→CONFIRMED` bởi `admin@homestay.vn` | ✅ |
| 13 | GIAO DIỆN | `/admin/bookings` — 15 đơn đủ 6 trạng thái | Bảng gọn, cột "Thao tác" không bị đẩy khỏi màn hình | Mã đơn 1 dòng, tiền 1 dòng (`520.000 ₫`), phân trang "Trang 1 / 2" | ✅ |
| 14 | GIAO DIỆN | Bấm "Xác nhận" trên đơn PENDING | Toast + bảng tự tải lại, nút đổi thành "Nhận phòng" | Đơn `HS-261029-0015` chuyển "Chờ xác nhận" → "Đã xác nhận"; nút đổi đúng | ✅ |
| 15 | GIAO DIỆN | Bấm "Từ chối" rồi submit khi chưa nhập lý do | Chặn tại giao diện, **không gọi API** | Hiện đỏ "Vui lòng nhập lý do để khách biết vì sao đơn bị từ chối"; đơn vẫn "Chờ xác nhận" | ✅ |
| 16 | GIAO DIỆN | Tìm từ khoá `khach1` | 15 đơn → 6 đơn của khách đó, nút "Bỏ lọc" xuất hiện | Header đổi "15 đơn" → "6 đơn", đều là Trần Thị Mai | ✅ |

> **Lỗi nghiệm vụ do unit test bắt được (đã sửa):** `ChangedByUserId` trong `BookingStatusHistory` ban đầu ghi `don.UserId` — tức **id của khách đặt phòng**, không phải Admin thao tác. Khi tra lịch sử sẽ thấy "khách tự xác nhận đơn của mình", sai hoàn toàn. Sửa bằng cách truyền `adminUserId` từ token qua controller xuống service; test `XacNhanAsync_GhiLichSuTrangThai_GhiDungAdminIdKhongPhaiIdKhach` chốt lại hành vi này.
>
> **Lỗi thông báo 409 đọc ngược (đã sửa):** bản đầu `"Đơn đang ở trạng thái \"đã hoàn tất\", không thể chuyển sang \"khách đang ở\""` — với thao tác một chiều như trả phòng, câu này đọc ra thành nghĩa ngược. Đổi thành `"Thao tác này chỉ áp dụng cho đơn đang \"{cần}\". Đơn hiện ở trạng thái \"{đang có}\""`.

---

### 9b. Khoảng vệ sinh 2 giờ sau khi trả phòng (Bước 13)

| # | Loai | Kich ban | Ky vong | Thuc te | Ket qua |
|---|------|----------|---------|---------|---------|
| 1 | HP | Phong `CLEANING` 3 gio truoc, khoi dong lai server | Job nen tu chuyen sang `AVAILABLE` | SQL: A102 `CLEANING` (moc -3h) -> `AVAILABLE`, `UpdatedAt` duoc cap nhat | PASS |
| 2 | EC | Phong `CLEANING` 17 phut truoc, khoi dong lai server | **Van** `CLEANING` (chua du 2 gio) | SQL: A101 van `CLEANING` | PASS |
| 3 | AB | Khach xem khung ngay cho phong A101 (dang ve sinh) | Bao ban kem ly do cu the | `{"isAvailable":false,"reason":"Phong vua duoc ve sinh, chua san sang nhan don moi"}` | PASS |
| 4 | AB | Khach bam **Dat phong** voi phong A101 | 409, khong tao don | HTTP 409 "Phong vua duoc ve sinh, chua san sang nhan don moi" | PASS |
| 5 | HP | Khach dat phong A102 (da ve sinh xong) | Tao don thanh cong | HTTP 201, ma `HS-261101-2186`, tong `1.040.000 d` | PASS |
| 6 | GIAO DIEN | Trang Phong cua Admin sau khi job chay | Nhan dung trang thai | A101 "Dang don dep", A102 "Con trong" | PASS |

> **Vi sao can job nen chu khong bam tay:** neu de Admin chuyen `CLEANING -> AVAILABLE`
> tay thi (1) phong da san sang van bi chan dat neu quen bam, (2) phong ket vinh
> vien neu quen. Ca deu la loi van hanh. Tinh luoi (lazy, chi sua luc doc) cung
> khong duoc vi CSDL van sai, thong ke o Buoc 15 se dem sai so phong dang ve sinh.


---

---

## 10. Bước 14 — khoá tài khoản khách (30/09/2026)

> Phan chuc nang da lam xong o Buoc 12 (trong trang "Khach hang"). Buoc 14 chi
> kiem chung lai day du chuoi khoa -> bi tu choi -> mo khoa.

| # | Loai | Kich ban | Ky vong | Thuc te | Ket qua |
|---|------|----------|---------|---------|---------|
| 1 | HP | Admin khoa tai khoan `khach2@gmail.com` | `isLocked = true` | `{"success":true,"message":"Da khoa tai khoan khach hang","data":{"isLocked":true,...}}` | PASS |
| 2 | AB | Khach dang bi khoa thu dang nhinh | **403** kem thong bao ro rang | HTTP 403 `{"success":false,"message":"Tai khoan da bi khoa. Vui long lien he quan tri vien"}` | PASS |
| 3 | AB | Dung refresh token cu cua tai khoan vua bi khoa | 401 | HTTP 401 (token gia bi tu choi ngay) | PASS |
| 4 | HP | Admin mo khoa lai | `isLocked = false` | `{"success":true,"message":"Da mo khoa tai khoan khach hang","data":{"isLocked":false,...}}` | PASS |
| 5 | HP | Khach dang nhinh lai sau khi mo khoa | Duoc, co access token | `success=true`, `role=0` (CUSTOMER), token cap | PASS |
| 6 | AB | Admin thu khoa chinh tai khoan Admin | 403, khong doi trang thai | Unit test `DoiTrangThaiAsync_TaiKhoanAdmin_ThrowForbidden` | PASS |

> Khong co buoc "xoa khach": xoa se lam mat lun lich su don. Vi pham thi chi khoa
> tai khoan, giu nguyen du lieu giao dich — thiet ke nay da chot o Bước 12.

---

## 11. Bước 15 — Dashboard thống kê (30/09/2026)

### 11A. Đối chiếu số liệu với SQL trực tiếp (bắt buộc)

Lệnh: `docker exec -i homestay-mysql mysql -uhomestay -p****** homestay`
Ngày chạy: **30/09/2026** · Cửa sổ tỷ lệ lấp đầy: `2026-09-01` → `2026-09-30`

| # | Loại | Số liệu | API trả về | SQL truy vấn trực tiếp | Kết quả |
|---|------|---------|------------|------------------------|---------|
| 1 | HP | Doanh thu tháng 9/2026 | `2.700.000` | `SELECT SUM(TotalAmount) FROM Bookings WHERE Status='COMPLETED' AND CheckOut >= '2026-09-01' AND CheckOut < '2026-10-01'` → `2.700.000` | **PASS** |
| 2 | HP | Doanh thu tháng 6/2026 | `7.250.000` | Cùng truy vấn, đổi khoảng tháng → `7.250.000` | **PASS** |
| 3 | HP | Tổng số đơn | `16` | `SELECT COUNT(*) FROM Bookings` → `16` | **PASS** |
| 4 | HP | Số đơn tạo trong tháng 9 | `9` | `WHERE CreatedAt >= '2026-09-01' AND CreatedAt < '2026-10-01'` → `9` | **PASS** |
| 5 | HP | Số đêm phòng đã bán (30 ngày) | `4` | `SUM(GREATEST(DATEDIFF(LEAST(CheckOut,NOW()), GREATEST(CheckIn, DATE_SUB(NOW(),INTERVAL 29 DAY))),0))` với `Status IN ('CHECKED_IN','COMPLETED')` → `4` | **PASS** |
| 6 | EC | Doanh thu tháng 9 **nếu tính cả** đơn chưa xác nhận | `2.700.000` (đã **loại** phần này) | Cùng điều kiện nhưng bỏ `Status='COMPLETED'` → `4.500.000` | **PASS** — chứng minh định nghĩa "chỉ tính đơn `COMPLETED`" được áp dụng đúng (chênh `1.800.000` là đơn `PENDING` bị loại **có chủ ý**) |

**Bug phát hiện ở dòng 5 — đã sửa:** lần đầu API trả `2` đêm trong khi SQL trả `4`.
Nguyên nhân: `(den - tu).Days` **cắt cụt phần giờ**. Đơn nhận phòng 14:00 ngày 09, trả phòng 12:00 ngày 11 là **2 đêm**, nhưng 46 giờ bị cắt còn 1.
Vì giờ nhận/trả là quy định cố định nên **mọi đơn đều thiếu 1 đêm** → tỷ lệ lấp đầy ra `0,7%` thay vì `1,3%`.
Cách sửa: cắt về ngày trước rồi mới trừ — `(den.Date - tu.Date).Days`.
Đã thêm unit test dùng đúng giờ `14:00 / 12:00` để chặn (test cũ dùng `00:00` nên không bắt được).

### 11B. Tham số vượt giới hạn (edge case)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | EC | `soThang=0` | Tự chuẩn về mặc định | `theoThang` trả về **6** cột | PASS |
| 2 | EC | `soNgay=9999` | Tự chuẩn về mặc định | `demTongCong` = 10 phòng × 30 = **300** | PASS |
| 3 | AB | `soThang=-5&soNgay=-5` (số âm) | Không được làm hỏng server | Chuẩn về 6 và 30, **không** lỗi 500 | PASS |
| 4 | EC | `soThang=3&soNgay=7` | 7 ngày tính cả hôm nay | `2026-09-24` → `2026-09-30`, `demTongCong` = 70 | PASS |
| 5 | EC | Tháng không có đơn (T4, T5) | Vẫn có cột giá trị **0** | `doanhThu = 0`, `soDon = 0`, cột không biến mất | PASS |

### 11C. Phân quyền (bất thường)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | AB | Khách (`khach1@gmail.com`) gọi `GET /api/admin/dashboard` | **403** | HTTP `403 Forbidden` | PASS |
| 2 | AB | Không gửi token | **401** | HTTP `401 Unauthorized` | PASS |
| 3 | AB | Token giả (`Bearer abc.def.ghi`) | **401** | HTTP `401` | PASS |
| 4 | AB | Khách gõ thẳng URL `/admin` trên trình duyệt | Bị đẩy về trang chủ | URL đổi thành `http://localhost:5174/` | PASS |

### 11D. Giao diện

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Admin mở `/admin` | 4 ô số liệu + 4 biểu đồ + bảng top phòng | Đủ hết, tiền hiện `2.700.000 ₫`, tỷ lệ `1,3%` | PASS |
| 2 | HP | Biểu đồ tròn trạng thái phòng | Đủ 5 trạng thái trong dữ liệu, không chồng chữ | Vòng tròn đầy, legend tự vẽ kèm số đếm: *Còn trống: 4 · Đã được đặt: 3 · Đang dọn dẹp: 2 · Bảo trì: 1* | PASS |
| 3 | HP | Nhãn trục Y của biểu đồ "5 phòng" | Tên phòng nằm **1 dòng**, không chồng nhau | Đủ 5 tên: Phòng Đồi Thông · Hải Yến · Hạnh Phúc · Hoa Tử Đài · Đèn Lồng | PASS |
| 4 | HP | Menu Admin ở `/admin` | Chỉ 1 mục sáng | Chỉ "Thống kê" sáng (dùng `end` của `NavLink`) | PASS |
| 5 | EC | Xem ở khung hẹp (636px) | Không tràn ngang, xếp dọc | Menu và thẻ số liệu xếp 1 cột, không vỡ | PASS |
| 6 | HP | Tải lại trang F5 | Số liệu giữ nguyên | Giữ nguyên `2.700.000 ₫` | PASS |

**Lỗi gặp khi kiểm thử giao diện — đã sửa:** ảnh chụp màn hình nhiều lần cho thấy biểu đồ tròn chỉ vẽ được một phần.
Nguyên nhân thật: `recharts` mặc định `isAnimationActive = true`, quét góc trong **1,5 giây**; ảnh chụp rơi vào giữa chừng nên nhìn như biểu đồ vỡ.
Đã đặt `isAnimationActive={false}` cho mọi biểu đồ — dashboard không nên vẽ lại mỗi lần bấm "Làm mới", và ảnh chụp cho báo cáo phải ổn định.

### 11E. Tổng kết

| Hạng mục | Kết quả |
|----------|---------|
| Đối chiếu SQL | **6/6** khớp (1 dòng cố tình khác để chứng minh định nghĩa) |
| Tham số vượt giới hạn | **5/5** PASS |
| Phân quyền | **4/4** PASS |
| Giao diện | **6/6** PASS |
| Unit test | Backend **333/333** (thêm 21) · Frontend **208/208** (thêm 10) |
| Build | `0 Error(s) · 0 Warning(s)` · `npm run build` sạch |
---

## 12. Bước 16 — Đánh giá & nhận xét (kiểm thử 30/09/2026)

### 12A. Khách ghi đánh giá — API

Đơn dùng để kiểm thử: `HS-260928-0010` (COMPLETED, của khách2, chưa có đánh giá).
Lệnh dùng: `Invoke-RestMethod` (xem mục 11A về lý do không dùng `curl.exe`).

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Khách đánh giá đơn `COMPLETED` của chính mình | 201, điểm phòng tăng | HTTP 201, `rating=4`, nhận xét `"  Phong sang, nhung ghep am hoi khu rieng.  "` → lưu thành `"Phong sang, nhung ghep am hoi khu rieng."` (**đã cắt khoảng trắng**) | **PASS** |
| 2 | HP | Điểm phòng sau khi đánh giá | `0.00 / 0` → `4.00 / 1` | `GET /api/rooms/search` trả `ratingAvg=4.00 ratingCount=1` | **PASS** |
| 3 | HP | Chi tiết đơn báo đã đánh giá | `daDanhGia = true` | `daDanhGia=True`, `danhGiaCuaToi.rating=4` | **PASS** |
| 4 | EC | Đánh giá lần 2 trên cùng đơn | **409** + thông báo rõ | HTTP 409 `"Bạn đã đánh giá đơn này rồi. Mỗi đơn chỉ được đánh giá một lần"` | **PASS** |
| 5 | EC | Đánh giá đơn của khách khác | **404** | HTTP 404 (không phải 403 — không lộ đơn người khác có tồn tại) | **PASS** |
| 6 | EC | Đánh giá đơn `PENDING` | **409** | HTTP 409, thông báo nêu đích danh trạng thái đang có | **PASS** |
| 7 | EC | `rating = 0` | **400** | HTTP 400 | **PASS** |
| 8 | EC | `rating = 6` (vượt trần) | **400** | HTTP 400 | **PASS** |
| 9 | EC | `rating = -1` (số âm) | **400** | HTTP 400 | **PASS** |
| 10 | EC | Nhận xét 1200 ký tự (vượt 1000) | **400** | HTTP 400 | **PASS** |
| 11 | EC | Body không gửi `rating` | **400** | HTTP 400 (không phải 500 vì thiếu rồi mặc định thành 5 sao) | **PASS** |
| 12 | AB | Khách gọi `GET /api/admin/reviews` | **403** | HTTP 403 | **PASS** |
| 13 | AB | Mã đơn không tồn tại | **404** | HTTP 404 | **PASS** |

### 12B. Admin ẩn / hiện / xoá — API

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quá |
|---|------|----------|---------|---------|---------|
| 1 | HP | Danh sách đánh giá (mới nhất trước) | 7 dòng, sắp theo thời điểm giảm dần | 7 dòng, dòng đầu là đánh giá vừa tạo | **PASS** |
| 2 | HP | `PATCH /{id}/hide` | Điểm phòng giảm, `phongSoDanhGia` giảm | `phongDiemTrungBinh=0`, `phongSoDanhGia=0`; `rooms/search` xác nhận `ratingAvg=0.00 ratingCount=0` | **PASS** |
| 3 | HP | `PATCH /{id}/unhide` | Điểm phòng trở lại | `phongDiemTrungBinh=4`, `phongSoDanhGia=1` | **PASS** |
| 4 | HP | `DELETE /{id}` | Bản ghi mất, điểm tính lại | Tổng đánh giá 7 → 6, `phongDiemTrungBinh=0` | **PASS** |
| 5 | EC | `?anId=true` | Chỉ đánh giá đang ẩn | 1 dòng | **PASS** |
| 6 | EC | `?soSao=5` | Chỉ đánh giá 5 sao | 3 dòng | **PASS** |
| 7 | EC | `?page=0&pageSize=9999` | Tự chuẩn về mặc định | `page=1 pageSize=20`, không lỗi | **PASS** |
| 8 | AB | Thao tác đánh giá không tồn tại (`id=9999`) | **404** | HTTP 404 cho cả `hide` lẫn `DELETE` | **PASS** |

### 12C. Đối chiếu với SQL trực tiếp

| # | Kiểm tra | Kết quả SQL | Kỳ vọng |
|---|----------|-------------|---------|
| 1 | Số bản ghi `Reviews` | `6` | Khớp số API trả về sau khi xoá 1 dòng thử |
| 2 | Số đơn `COMPLETED` | `9` | — |
| 3 | Số đơn `COMPLETED` **chưa** có đánh giá | `3` | Khớp |
| 4 | **Số đơn có > 1 đánh giá** | **`0`** | **Chứng minh unique index giữ được** |
| 5 | `SHOW INDEX FROM Reviews` | `Non_unique = 0` trên `IX_Reviews_BookingId` | Index **thật sự** là UNIQUE ở tầng CSDL |
| 6 | Check constraint `CK_Reviews_Rating` | ``((`Rating` >= 1) and (`Rating` <= 5))`` | Đúng thiết kế |
| 7 | Check constraint `CK_Rooms_Rating` | ``((`RatingAvg` >= 0) and (`RatingAvg` <= 5))`` | Đúng thiết kế |

### 12D. Giao diện

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Khách mở đơn **chưa** đánh giá | Hiện form chấm sao + ô nhận xét | 5 sao rỗng, dòng *"Chưa chọn — hãy chấm số sao trước khi gửi"*, nút Gửi **bị khoá** | **PASS** |
| 2 | HP | Chấm 4 sao + ghi nhận xét rồi bấm Gửi | Đánh giá lưu, form đổi sang dòng đã đánh giá | Thành công: hiện 4★ + 1☆, `4,0`, nhận xét, thời điểm, và dòng *"Mỗi đơn chỉ được đánh giá một lần"* | **PASS** |
| 3 | HP | Mở lại đơn đã đánh giá | Không còn form sửa | Chỉ hiện "Đánh giá của bạn", không có nút Gửi | **PASS** |
| 4 | HP | Trang `/admin/reviews` | Bảng đủ cột, STT tự tính, có nút Ẩn/Xoá | 7 dòng, STT 1–7 (không phải Id), cột Mã đơn hiện `HS-260929-0006` | **PASS** |
| 5 | HP | Đánh giá đang ẩn trong bảng Admin | Nhãn đổi đúng | Dòng 4 có badge "Đang ẩn" + nút **"Hiện lại"** (không phải "Ẩn") | **PASS** |
| 6 | HP | Trang chi tiết phòng | Danh sách đánh giá hiện sao kèm **sao rỗng** | Đánh giá 3★ hiện `★★★☆☆` — trước đây chỉ vẽ `★★★` nên không so sánh được với 5★ | **PASS** |

### 12E. Bug phát hiện khi kiểm thử giao diện — đã sửa

Trang chi tiết đơn hiện **"NaN ₫/giờ"** và **"NaN ₫/ngày"** (lỗi có sẵn từ Bước 11, phát hiện khi chụp ảnh Bước 16).

**Nguyên nhân gốc — không phải chỗ hiển thị:**
`BookingDetail` ở TypeScript khai `pricePerHour`, `pricePerDay` là **bắt buộc**, nhưng `BookingDetailDto` của backend **không gửi** 2 trường đó → giá trị `undefined` → `formatVnd(undefined)` = `NaN`.
Khai bắt buộc cho trường mà API không gửi khiến `tsc` không bắt được, và mình tin `tsc` sạch là đúng.

**Đã sửa triệt để (không vá chỗ hiện):**
1. Xoá 6 trường không thuộc về chi tiết đơn khỏi kiểu `BookingDetail` (`pricePerHour`, `pricePerDay`, `description`, `ratingAvg`, `ratingCount`, `reviews`) — chúng là dữ liệu của chi tiết **phòng**.
2. Thay dòng giá bằng **Tổng tiền** (`totalAmount` — API có sẵn, đúng nghĩa với một đơn).
3. Thêm `roomNumber` + `capacity` vào `BookingDetailDto` (giao diện đã cần mà thiếu), lấy trong **1** truy vấn thay vì 3.
4. Thêm test `expect(document.body.textContent).not.toContain('NaN')` chặn hồi quy.

**Xác nhận:** sau khi sửa, trang hiện `Theo giờ · Phòng C101 · Tối đa 2 khách` và `Tổng tiền 1.160.000 ₫`.

### 12F. Tổng kết

| Hạng mục | Kết quả |
|----------|---------|
| API khách ghi đánh giá | **13/13** PASS |
| API Admin ẩn/hiện/xoá | **8/8** PASS |
| Đối chiếu SQL | **7/7** khớp (1 đơn `SHOW INDEX` chứng minh unique index) |
| Giao diện | **6/6** PASS |
| Unit test | Backend **358/358** (thêm 25) · Frontend **244/244** (thêm 36) |
| Build | `0 Error(s) · 0 Warning(s)` · `npm run build` sạch |

---

## 13. Giao diện & trải nghiệm (Bước 17)

> Kiểm ngày 01/10/2026. Mục tiêu: mọi trang dùng được ở khung **375px** · mọi danh sách có đủ 3 trạng thái · thông báo lỗi không lộ chi tiết kỹ thuật.

| # | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|----------|---------|---------|---------|
| 1 | Thu nhỏ cửa sổ điện thoại (375px) | Mọi trang dùng được, không tràn ngang | **Trang chủ vỡ**: logo chồng lên menu, menu bị xuống dòng thành "Trang/chủ", nút "Đăng ký" bị cắt ở mép phải, **có thanh cuộn ngang** dưới cùng. → Đã sửa: thêm nút 3 gạch, dưới `sm` menu xếp dọc, chữ logo ẩn. Kiểm lại: sạch | ✅ *(sau khi sửa)* |
| 2 | Tải trang chậm | Hiện spinner / skeleton | Các trang có dữ liệu đều hiện dòng "Đang tải..." (`isPending`). Trang chủ là trang tĩnh, không gọi API nên không cần | ✅ |
| 3 | Danh sách không có dữ liệu | Hiện thông báo, không trang trắng | Tìm "zzzzkhongco" → hiện thẻ **"Không tìm thấy phòng nào / Thử nới rộng khoảng giá, giảm số khách hoặc bỏ bớt điều kiện lọc"** — có cả gợi ý hành động | ✅ |
| 4 | Gọi API lỗi | Thông báo thân thiện, không lộ stack trace | **Tìm ra lỗi thật ở trang đặt phòng**: khi API địa điểm hỏng, `diaDiemList` rỗng ⇒ rơi vào nhánh *"không tìm thấy phòng"* và báo **"Đường dẫn trỏ sai phòng"** — người dùng tưởng mình gõ sai trong khi hệ thống đang lỗi. Đã tách nhánh lỗi riêng: *"Không tải được danh sách phòng / Hệ thống đang không phản hồi"* + nút Thử lại | ✅ *(sau khi sửa)* |
| 5 | Thao tác thành công | Hiện toast xanh | Toast `success` hiện lớp `toast-success`, tự tắt sau **3 giây**. Kiểm bằng **unit test** với đồng hồ giả | ✅ |
| 6 | Thao tác thất bại | Hiện toast đỏ | Toast `error` hiện lớp `toast-error`, tự tắt sau 3 giây. Kiểm bằng **unit test** | ✅ |
| 7 | Gõ URL không tồn tại | Hiện trang 404 | `/khong-ton-tai-abc` → trang 404 *"Không tìm thấy trang bạn yêu cầu..."* + nút "Về trang chủ". Không lộ stack trace | ✅ |

### Vì sao kịch bản 5 và 6 kiểm bằng unit test chứ không bấm tay

Hai kịch bản này cần đăng nhập rồi bấm một thao tác. Trong phiên làm việc 01/10, công cụ điều khiển trình duyệt **từ chối tham số khi nhập vào ô mật khẩu** (thử 8 lần với các cách chọn khác nhau, đều báo `value is required`), nên không đăng nhập được để bấm tay.

Unit test lại **chắc hơn bấm tay** ở đúng chỗ này: toast tự tắt sau 3 giây, bấm tay chậm một chút là bỏ lịch mà không phân biệt được do tool hay do code. Dùng đồng hồ giả thì kiểm đúng mốc 3 giây, không có nhân tố con người.

| Nội dung kiểm | Test |
|----------------|------|
| Toast xanh / đỏ đúng màu | `Toast.test.tsx` — `ThanhCong_HienToastXanh`, `ThatBai_HienToastDo` |
| Tự tắt sau 3 giây | `SauMotKhongGiVanConHien` |
| Nhiều toast không xóa oan nhau | `MotToastHetHanKhongXoaNhatPhaiKhac` |
| Trình đọc màn hình có thông báo | `KhaiBaoRoleDeTrinhDocManHinhThongBao` |
| Menu thu gọn mở/đóng, không tràn ngang | `PageLayout.test.tsx` — 7 test |

### Cải thiện thêm phát hiện khi kiểm thử

**Toast không có `role` → trình đọc màn hình im lặng.** Toast tự hiện lên chứ không phải do người dùng bấm, nên người mù không biết thao tác của mình đã thành công hay thất bại. Đã thêm `role="status"` + `aria-live="polite"` (thành công) và `role="alert"` + `aria-live="assertive"` (lỗi).

### 6 trang Admin ở khung 375px — đã kiểm bằng mắt (01/10, bổ sung)

Lúc đầu mục này ghi "chưa kiểm được vì công cụ trình duyệt lỗi khi nhập ô mật khẩu". Sau đó công cụ đã
hoạt động lại, đã đăng nhập Admin và kiểm đủ **6/6** trang.

Cách kiểm không phải "nhìn có vỡ không" mà **đo**: `html` phải có bề rộng đúng bằng khung chụp. Nếu trang
tràn ngang thì bề rộng `html` sẽ **lớn hơn** 375px.

| Trang | Bề rộng `html` | Kết luận |
|-------|----------------|----------|
| `/admin` | 375px | Không tràn |
| `/admin/bookings` | 375px | Không tràn |
| `/admin/facilities` | 375px | Không tràn |
| `/admin/rooms` | 375px | Không tràn |
| `/admin/reviews` | 375px | Không tràn |
| `/admin/customers` | 375px | Không tràn |

**Bảng rộng vẫn cuộn ngang — và đó là đúng.** Ở `/admin/rooms`, các ô cột "Trạng thái" và "Thao tác" nằm ở
x ≈ 639–900px, tức bảng rộng gấp đôi khung chụp. Nhưng chúng nằm trong khung `overflow-x-auto`, nên
**trang** không tràn — chỉ bảng tự cuộn trong chỗ của nó. Đây là cách làm đúng cho bảng nhiều cột trên
điện thoại: thay vì ép bảng nhỏ lại (chữ 6px, không đọc được) hoặc làm cả trang tràn ngang.

Trang `/admin/locations` **không tồn tại** — route thật là `/admin/facilities` (menu ghi "Cơ sở"). Gõ sai
URL thì ra trang 404, cũng không tràn ngang.

⚠️ Lưu ý thấy khi kiểm: còn tài khoản rác `khachdienthoai@gmail.com` (0 đơn, tạo lúc kiểm thử Bước 5).

| Hạng mục | Kết quả |
|----------|---------|
| Kịch bản | **7/7 PASS** (2 kịch bản kiểm bằng unit test) |
| Lỗi tìm ra & sửa | **2** — header tràn ngang 375px · trang đặt phòng báo nhầm lỗi API thành "sai phòng" |
| Cải thiện | **1** — thêm `role`/`aria-live` cho Toast |
| Unit test | Frontend **258/258** (thêm **14**: 7 Toast + 7 PageLayout) · Backend **361/361** |
| Build | `npm run build` sạch · `dotnet build` 0 error 0 warning |

---

## 14. Kiểm thử tích hợp bằng Postman (Bước 18)

> Bộ test: `docs/api/postman_collection.json` — **41 request** trong 7 nhóm.
> Chạy: `node docs/api/run-postman.mjs` (runner tự viết, không cần cài Newman).
> Import vào Postman cũng chạy được: Import → chọn file → Run collection.
>
> **Kết quả: 41/41 request đạt · 115/115 kiểm chứng đạt · 12/12 lần chạy liên tiếp trong hết.**

### 3 test chống đặt trùng (yêu cầu bắt buộc của bước này)

| Test | Cách phát hiện trùng | Kỳ vọng | Thực tế | Kết quả |
|------|----------------------|---------|---------|---------|
| **T1** | Cùng khách đặt lại đúng khung giờ | 409 | HTTP 409 *"Phòng đã có người đặt trong khoảng thời gian này"* | **PASS** |
| **T2** | **Khách khác** đặt khung giờ đang có đơn | 409 | HTTP 409 | **PASS** |
| **T3** | **2 request gửi SONG SONG** cùng phòng + cùng khung giờ | đúng 1 đơn tạo (201), đúng 1 bị chặn (409) | `ketQuaRace = [201, 409]` | **PASS** *(sau khi sửa)* |

T3 là kiểm tra **race condition** — kiểm tầng transaction + unique index, không phải kiểm tra
`if` trong code. Hai request `T3a`/`T3b` được gắn cùng nhóm `race-trung`; runner gửi chúng
đồng thời bằng `Promise.all`. Chạy tay trên Postman thì mở **2 tab** và bấm Send gần như
cùng lúc.

### ⚠️ Lỗi thật do T3 phát hiện: đặt trùng song song trả **500** thay vì 409

Lần chạy đầu tiên T3 trả về **`[500, 201]`**. Đọc log server:

```
System.InvalidOperationException: ...transient failure...
 ---> Microsoft.EntityFrameworkCore.DbUpdateException
  ---> MySqlConnector.MySqlException: Deadlock found when trying to get lock
```

Hai request cùng đặt 1 phòng 1 khung giờ thì InnoDB báo **DEADLOCK (1213)** ngay lúc
`INSERT INTO Bookings`. Lỗi đó bị `catch { await Rollback(); throw; }` ném lên thành **500** —
người dùng thấy *"Đã xảy ra lỗi, vui lòng thử lại"* thay vì *"Phòng đã có người đặt"*, tức
không biết phải đổi phòng.

**Đã sửa** trong `BookingService.TaoDonAsync`:

| Việc | Vì sao |
|------|--------|
| Dò **cả chuỗi exception** tìm mã lỗi 1213 / 1205 / 1062 | Pomelo bọc lỗi gốc thành `InvalidOperationException` → `DbUpdateException` → `MySqlException`. Bắt tầng ngoài không thấy mã lỗi |
| Đọc `MySqlException.Number`, **không** đọc `DbException.ErrorCode` | `ErrorCode` của MySqlConnector trả về **HResult** (`0x80004005`) chứ không phải mã lỗi ⇒ bản sửa đầu tiên của tôi **không có tác dụng** |
| `RollbackAnToanAsync` — nuốt lỗi rollback | InnoDB đã tự hủy transaction; gọi `RollbackAsync` lần nữa có thể ném lỗi và **thay thế** lỗi 409 |
| Bỏ `await using`, tự giải phóng trong `finally` | `await using` gọi `DisposeAsync` **sau** dòng `throw new AppException(409)`, lỗi nó ném sẽ thay thế 409 |
| Chỉ chuyển **3 mã lỗi tranh chấp** thành 409, còn lại vẫn 500 | Lỗi khác (sai cấu hình, hết kết nối) phải hiện 500 — biến mọi lỗi thành 409 khiến Admin tưởng phòng đã kín trong khi hệ thống đang hỏng |

Bằng chứng: `RaceConditionTests.cs` — 11 test cho hàm dò mã lỗi, gồm một test **khoá lại**
để không ai vô tình quay về dùng `ErrorCode`:
`LaMaLoiTranhChung_KhongNham_HResult_CuaMySqlConnector`.

### 7 nhóm test

| Nhóm | Số request | Nội dung |
|------|-------------|----------|
| 01 · Xác thực | 4 | Đăng nhập khách / khách thứ hai / Admin · **sai mật khẩu → 401** |
| 02 · Chuẩn bị dữ liệu | 5 | Đặt lại trạng thái 4 phòng về `AVAILABLE` (xem "Chạy lại được" bên dưới) |
| 03 · Tra cứu công khai | 4 | Địa điểm · tìm phòng · `soNgay=9999` · thiếu tham số → 400 |
| 04 · Chống đặt trùng | 8 | Tạo đơn · **T1, T2, T3a, T3b** · vượt sức chứa → 400 · dọn dẹp |
| 05 · Đơn của tôi | 7 | Danh sách · **lọc theo trạng thái** · `status` ngoài enum · chi tiết + lịch sử · đơn người khác → 404 · hủy · hủy lần 2 → 409 |
| 06 · Vòng đời đơn (Admin) | 8 | Tạo → xác nhận → xác nhận lại → 409 · check-in · hủy khi đang ở → 409 · check-out · **lịch sử 4 bước** · danh sách Admin |
| 07 · Phân quyền, thống kê, đánh giá | 5 | Khách gọi API Admin → 403 · không token → 401 · Dashboard · đánh giá → 201 · đánh giá lần 2 → 409 |

### Kết quả chạy

| Lần chạy | Kết quả |
|----------|---------|
| Lần đầu | 26/33 — **3 lỗi của collection, 1 lỗi thật của hệ thống** |
| Sau khi sửa test sai + sửa lỗi race | 34/34, 97/99 |
| Sau khi thêm dọn dẹp + tách dải ngày | 41/41, **115/115** |
| **10 lần liên tiếp** | **10/10 trong hết** |
| **12 lần liên tiếp** (lần cuối) | **12/12 trong hết** |

Bằng chứng lưu tại `docs/api/ket-qua-chay-lan-1.txt` (209 dòng, kết quả từng request) và
`docs/api/ket-qua-chay-lien-tiep.txt`.

### Ba lỗi của **collection** phải sửa (không phải của hệ thống)

| Lỗi | Nguyên nhân |
|-----|-----------|
| `role = undefined` | Role nằm ở `data.user.role`, không phải `data.role` |
| *"Thông báo không nói về đăng nhập"* | Thông báo thật là *"Email hoặc mật khẩu không đúng"* — hoàn toàn thân thiện, chỉ là tôi đoán chữ |
| `totalItems = 26 nhưng items = 20` | Quên có **phân trang**: `totalItems` vốn có thể lớn hơn số dòng trả về |
| Đặt vượt sức chứa ra **409** | Dùng chung ngày với đơn đã đặt nên bị chặn trùng lịch **trước**, chưa tới bước kiểm sức chứa |

### ⚠️ "Chạy lại được" là yêu cầu khó nhất — và nó đã hỏng 3 lần

Bộ test ban đầu **hỏng ngay ở lần chạy thứ hai**. Nguyên nhân nằm ở chính bộ test:

1. Mỗi lần chạy xác nhận 1 đơn ⇒ phòng → `BOOKED`, rồi check-out ⇒ phòng → `CLEANING` **2 giờ**.
   Chạy ~30 lần thì **hết sạch** phòng `AVAILABLE` ⇒ các test đặt phòng hỏng vì lý do
   không liên quan tới chúng.
2. Mỗi lần chạy để lại 1 đơn `PENDING` (đơn thắng cuộc đua của T3). Tích luỹ trong dải ngày
   ⇒ sau đủ lần chạy thì chặn lần chạy sau ⇒ T3 nhận `[409, 409]` thay vì `[201, 409]`.
3. Còn lại đơn `PENDING` từ các lần chạy **hỏng giữa chừng** (không kịp huỷ).

Đã sửa bằng ba việc:

| Cách sửa | Tác dụng |
|----------|----------|
| Nhóm **02 · Chuẩn bị dữ liệu**: đặt lại 4 phòng về `AVAILABLE` | Luôn có chỗ trống để đặt |
| Nhóm **04 · Dọn dẹp**: huỷ chính đơn do T3 tạo ra | Mỗi lần chạy trong vằn không để lại `PENDING` nào |
| **Tách dải ngày**: mỗi nhóm một dải riêng rộng 1500 ngày, cách nhau 2000 ngày | Lần chạy sau không bao giờ đụng lần chạy trước |

Dữ liệu rác đã dọn **có chọn lọc** (theo `Note` của riêng test), không `TRUNCATE`:
**319/337** đơn là dữ liệu test của Bước 18 (ghi chú `Kiem thu…`, `TRUNG…`, `Don rieng…`,
năm 2027–2044). Đã xoá kèm lịch sử và đánh giá, còn lại **18** đơn seed.

Sau 12 lần chạy còn lại **54** đơn, trong đó chỉ **1** đang `PENDING`; các đơn còn lại ở
trạng thái kết thúc (`CANCELLED`/`COMPLETED`) nên **không chặn** ngày mới — vì kiểm tra trùng
lịch chỉ xét `PENDING`/`CONFIRMED`/`CHECKED_IN`.

### Bonus: phát hiện và sửa lỗi trang `/swagger`

Trang Swagger báo *"Unable to render this definition / does not specify a valid version
field"* dù `swagger.json` hợp lệ. Nguyên nhân gốc: csproj tham chiếu
`Microsoft.AspNetCore.OpenApi 8.0.31` — gói **không được dùng** (dự án không gọi
`AddOpenApi`/`MapOpenApi`) nhưng kéo `Microsoft.OpenApi ≥ 1.6.30`, bản phát `"openapi": "3.0.4"`
mà swagger-ui của Swashbuckle 6.9.0 không nhận.

**Đã bỏ gói thừa** (không nâng Swashbuckle theo AGENTS 1.2) ⇒ tài liệu phát `3.0.1` ⇒
trang hiển thị đủ 38 endpoint, 60+ schema và nút Authorize. Ảnh: `.openchamber/screenshots/b18-swagger-ok-*.jpg`.

> Đếm từ chính các bảng trong tài liệu này: mỗi dòng bắt đầu bằng số thứ tự ở cột `#` là **một kịch bản**.

---

## 15. Tổng kết

### 15.1 Kiểm thử tay (mục 0 – 13)

> Đếm từ chính các bảng trong tài liệu này: mỗi dòng bắt đầu bằng số thứ tự ở cột `#` là **một kịch bản**.
> Cột "Đạt" đếm dòng đã đánh dấu ✅ hoặc PASS.

| Bước | Nhóm chức năng | Số kịch bản | Đạt | Chưa đạt |
|-------|----------------|-------------|-----|----------|
| 3 | Cơ sở dữ liệu 9 bảng | 10 | 10 | 0 |
| 4 | Dữ liệu mẫu tự sinh | 17 | 17 | 0 |
| 5 | Tài khoản (đăng ký / đăng nhập / hồ sơ) | 72 | 72 | 0 |
| 6 | Xem địa điểm | 9 | 9 | 0 |
| 7 | Tìm kiếm & lọc phòng | 11 | 11 | 0 |
| 8 | Chi tiết phòng | 8 | 8 | 0 |
| 9 | Kiểm tra phòng trống | 8 | 8 | 0 |
| 10 | Đặt phòng | 11 | 11 | 0 |
| 11 | Quản lý đơn của tôi (gồm lọc trạng thái) | 14 | 14 | 0 |
| 12 | Admin quản lý danh mục | 17 | 17 | 0 |
| 13 | Admin vòng đời đơn & phòng (+ khoảng vệ sinh) | 22 | 22 | 0 |
| 14 | Admin khoá tài khoản | 6 | 6 | 0 |
| 15 | Dashboard thống kê | 21 | 21 | 0 |
| 16 | Đánh giá & nhận xét | 34 | 34 | 0 |
| 17 | Giao diện & trải nghiệm | 7 | 7 | 0 |
| **Tổng** | | **267** | **267** | **0** |

**Tỉ lệ đạt kiểm thử tay: 267/267 = 100%.**

Dòng chưa đạt đã hết từ 01/10: **"Lọc đơn theo trạng thái"** (mục 7) — lúc đầu phát hiện là tính năng
chưa tồn tại dù `todo.md` đã đánh dấu Bước 11 là xong. Đã làm xong, nay mục 7 đạt **14/14**. Chi tiết ở mục 7.

### 15.2 Kiểm thử tích hợp bằng Postman (mục 14 — Bước 18)

| Hạng mục | Kết quả |
|----------|---------|
| Số request trong collection | **41** trong 7 nhóm |
| Request đạt | **41/41** |
| Kiểm chứng (assertion) | **115/115** |
| Chạy liên tiếp | **12/12 lần** trong hết, không cần dựng lại dữ liệu mẫu |
| 3 test chống đặt trùng | **3/3** — T1 `[409]` · T2 `[409]` · T3 song song `[201, 409]` |
| Lỗi hệ thống phát hiện | **1** — đặt trùng song song trả **500** thay vì 409 (đã sửa) |

### 15.3 Tổng hợp cả hai loại

| Loại | Số kịch bản | Đạt | Chưa đạt |
|------|-------------|-----|----------|
| Kiểm thử tay (mục 0 – 13) | 267 | 267 | 0 |
| Kiểm thử tích hợp Postman (mục 14) | 41 request / 115 kiểm chứng | 41 / 115 | 0 |
| **Tổng** | **267 kịch bản tay + 41 request tích hợp** | **100%** | **0** |

### Ghi chú về cách đếm

- Mục 5 (72 kịch bản) gộp ba bảng: gọi API, kiểm thử giao diện, và bảng lỗi phát hiện khi kiểm thử.
- Mục 13 (22) gồm 16 kịch bản vòng đời đơn + 6 kịch bản khoảng vệ sinh 2 giờ.
- Các bảng "Tổng kết" nhỏ ở cuối mỗi mục **không tính** vào số kích bản (chúng là bảng tổng hợp, dòng đầu cột không phải số thứ tự).

### Việc còn lại

| # | Việc | Vì sao còn |
|---|------|-----------|
| 1 | Xoá tài khoản rác `khachdienthoai@gmail.com` | Tạo lúc kiểm thử Bước 5, 0 đơn. Hệ thống **không có** chức năng xoá khách (xoá sẽ mất lịch sử đơn — chốt ở Bước 12) |
| 2 | Trang chủ hiện 3 phòng "nổi bật" viết cứng trong code | Hôm nay khớp CSDL, nhưng đổi tên phòng là trang chủ hiện sai |
