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

## 1. Đăng ký / Đăng nhập (Bước 5)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Đăng ký email mới, mật khẩu 6 ký tự | Tạo tài khoản, quyền CUSTOMER | | |
| 2 | EC | Đăng ký lại cùng email | Báo "Email đã tồn tại", KHÔNG tạo tài khoản | | |
| 3 | AB | Đăng ký mật khẩu 4 ký tự | Báo lỗi, KHÔNG tạo tài khoản | | |
| 4 | AB | Đăng ký có tham số `role: "ADMIN"` trong body | Tài khoản vẫn là CUSTOMER (bỏ qua role) | | |
| 5 | HP | Đăng nhập đúng email/mật khẩu | Vào trang chủ, hiện tên + menu | | |
| 6 | AB | Đăng nhập sai mật khẩu | Báo lỗi 401, không tạo token | | |
| 7 | AB | Đăng nhập tài khoản bị Admin khoá | Báo "Tài khoản đã bị khoá" | | |
| 8 | AU | Đăng nhập bằng `admin@stayeasy.vn` | Có menu Quản trị | | |
| 9 | AU | Khách gõ thẳng URL `/admin` | Bị chuyển hướng ra ngoài | | |
| 10 | HP | Đổi mật khẩu rồi đăng nhập lại bằng mật khẩu mới | Đăng nhập được | | |
| 11 | EC | Đổi mật khẩu nhưng nhập sai mật khẩu cũ | Báo lỗi, không đổi | | |
| 12 | HP | F5 lại trang sau khi đăng nhập | Vẫn giữ phiên, không bị đẩy ra trang đăng nhập | | |

---

## 2. Tìm kiếm & lọc phòng (Bước 7)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Không lọc | Hiện tất cả phòng, phân trang đúng | | |
| 2 | HP | Lọc theo địa điểm Hưng Yên | Chỉ còn phòng của Hưng Yên | | |
| 3 | EC | Lọc giá 0 – 1.000 | Danh sách rỗng, hiện trạng thái "Không tìm thấy" | | |
| 4 | EC | Lọc giá 0 – 1.000.000.000 | Hiện tất cả phòng, không lỗi | | |
| 5 | AB | Số khách vượt sức chứa mọi phòng | Danh sách rỗng | | |
| 6 | HP | Sắp xếp giá tăng dần | Đúng thứ tự từ thấp đến cao | | |
| 7 | AB | Tìm kiếm từ khóa không có kết quả | Danh sách rỗng + thông báo | | |
| 8 | EC | Chuyển sang trang 2 | STT hiển thị 11, 12, 13… (không phải 1, 2, 3) | | |
| 9 | HP | Giá hiển thị | Đúng định dạng `1.200.000 ₫`, **căn phải** | | |

---

## 3. Kiểm tra phòng trống (Bước 9)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Chọn khoảng thời gian không có đơn nào | Báo còn trống | | |
| 2 | AB | Chọn đúng khoảng có đơn CONFIRMED trong seed | Báo "phòng đã có đơn trong khung giờ này" | | |
| 3 | EC | Đặt trùng biên: trả phòng 12:00, khách mới nhận 12:00 | Báo **CÒN TRỐNG** (không tính là trùng) | | |
| 4 | EC | Trả phòng 12:01, khách mới nhận 12:00 | Báo **ĐÃ CÓ ĐƠN** | | |
| 5 | AB | Đặt cách hiện tại 1 giờ | Báo lỗi "đặt trước ít nhất 2 giờ" | | |
| 6 | AB | Giờ trả trước giờ nhận | Báo lỗi | | |
| 7 | AB | Đặt theo giờ 2 tiếng | Báo lỗi "tối thiểu 3 giờ" | | |
| 8 | EC | Đặt theo giờ đúng 3 giờ | Chấp nhận | | |
| 9 | AB | Số khách vượt sức chứa phòng | Báo lỗi "chỉ chứa tối đa N người" | | |

---

## 4. Đặt phòng (Bước 10) ⭐

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Đặt theo ngày 2 đêm, giá 1.200.000/ngày | Tạo đơn, tổng tiền `2.400.000 ₫` | | |
| 2 | HP | Đặt theo giờ 5 tiếng, giá 200.000/giờ | Tạo đơn, tổng tiền `1.000.000 ₫` | | |
| 3 | AB | Đặt trùng khung giờ có đơn khác | Bị từ chối, **không tạo đơn**, HTTP 409 | | |
| 4 | AB | **2 tab trình duyệt cùng đặt 1 phòng cùng giờ** | Chỉ **1 đơn** được tạo, tab còn lại báo trùng | | |
| 5 | EC | Sửa giá phòng sau khi đặt → xem lại đơn cũ | Tổng tiền đơn cũ **không đổi** (giá snapshot) | | |
| 6 | HP | Xem đơn vừa đặt | Trạng thái `PENDING`, hiện mã `HS-...`, KHÔNG hiện Id | | |
| 7 | AB | Khách chưa đăng nhập bấm Đặt phòng | Bị chuyển sang trang đăng nhập | | |
| 8 | EC | Đặt phòng có ghi chú dài 500 ký tự | Lưu đúng, không lỗi | | |

---

## 5. Quản lý đơn của tôi (Bước 11)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | HP | Xem danh sách đơn của tôi | Chỉ thấy đơn của chính mình | | |
| 2 | HP | Hủy đơn `PENDING` | Thành `CANCELLED`, phòng về `AVAILABLE` | | |
| 3 | AB | Cố hủy đơn `CHECKED_IN` | Bị từ chối, báo lý do | | |
| 4 | AU | Khách khác sửa URL để xem đơn của người khác | Bị chặn 403 | | |
| 5 | HP | Xem lịch sử trạng thái | Hiện đủ các bước với thời gian + ai thực hiện | | |
| 6 | EC | Lọc đơn theo trạng thái | Danh sách đúng | | |

---

## 6. Admin — quản lý danh mục (Bước 12)

| # | Loại | Kịch bản | Kỳ vọng | Thực tế | Kết quả |
|---|------|----------|---------|---------|---------|
| 1 | AU | Khách gõ URL `/admin/rooms` | Bị chặn | | |
| 2 | HP | Thêm 1 địa điểm mới | Lưu được, khách thấy ngay ở trang chủ | | |
| 3 | AB | Thêm địa điểm trùng tên | Báo lỗi trùng | | |
| 4 | AB | Xóa địa điểm đang có phòng | Bị từ chối, báo lý do | | |
| 5 | HP | Thêm phòng mới + 3 tiện nghi + 2 ảnh | Khách tìm thấy phòng này | | |
| 6 | AB | Nhập giá âm hoặc 0 | Bị chặn bởi validate | | |
| 7 | AB | Xóa phòng đang có đơn chưa hoàn tất | Bị từ chối | | |
| 8 | EC | STT bảng admin qua 2 trang | Liên tục 1, 2, 3… không bị lặp | | |
| 9 | AB | Tạo tiện nghi trùng tên | Bị chặn | | |

---

## 7. Admin — vòng đời đơn & phòng (Bước 13) ⭐

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

## 8. Dashboard & đánh giá (Bước 15, 16)

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

## 9. Giao diện & trải nghiệm (Bước 17)

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

## 10. Tổng kết

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
