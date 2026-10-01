# KẾT LUẬN

**Đồ án 4 — Hệ thống đặt phòng & quản lý homestay HomeStay**
Học viên: Nguyễn Hải Nam — 12523W.1

---

## 1. Tóm tắt kết quả thực hiện

Đồ án đã xây dựng và vận hành được hệ thống đặt phòng & quản lý homestay **HomeStay**,
gồm 2 tác nhân (khách hàng và quản trị viên) với 17 nhóm chức năng chạy thật.

**Bảng 1. Các chức năng đã triển khai**

| Nhóm | Chức năng | Trạng thái |
|------|-----------|------------|
| **Tài khoản** | Đăng ký, đăng nhập, hồ sơ cá nhân, quản lý & khoá tài khoản khách | Hoàn thành |
| **Danh mục** | Xem địa điểm, quản lý cơ sở, quản lý phòng (kèm ảnh và tiện nghi) | Hoàn thành |
| **Tìm kiếm** | Tìm & lọc phòng theo 6 tiêu chí, xem chi tiết phòng | Hoàn thành |
| **Đặt phòng** | Kiểm tra phòng trống, đặt phòng theo giờ / theo ngày, tính tiền | Hoàn thành |
| **Quản lý đơn** | Danh sách đơn của tôi, lọc theo trạng thái, hủy đơn, lịch sử trạng thái | Hoàn thành |
| **Vận hành** | Quản trị vòng đời đơn: xác nhận, từ chối, nhận phòng, trả phòng; tự động chuyển phòng về trạng thái sẵn sàng sau khoảng vệ sinh | Hoàn thành |
| **Thống kê** | Dashboard doanh thu, tỷ lệ lấp đầy, biểu đồ theo tháng, top phòng doanh thu | Hoàn thành |
| **Đánh giá** | Khách đánh giá & nhận xét sau khi hoàn thành; quản trị duyệt/ẩn đánh giá | Hoàn thành |

**Bảng 2. Quy mô đã đạt được**

| Hạng mục | Kết quả |
|---------|---------|
| Số bảng cơ sở dữ liệu | 9 (`Users`, `Locations`, `Rooms`, `RoomImages`, `Amenities`, `RoomAmenities`, `Bookings`, `BookingStatusHistory`, `Reviews`) |
| Số API | 41 endpoint trên 7 nhóm nghiệp vụ |
| Số màn hình | 13 trang khách hàng + 6 trang quản trị |
| Sơ đồ thiết kế | 15 sơ đồ UML (3 biểu đồ tác nhân, 5 use case, 4 lớp thực thể, 5 tuần tự, 1 ERD) |
| Kiểm thử đơn vị backend | **380 test** — xanh 100% |
| Kiểm thử đơn vị frontend | **269 test** — xanh 100% |
| Kiểm thử tích hợp REST API | **41 request / 115 kiểm chứng** — chạy liên tiếp 12 lần đều đạt |
| Kiểm thử tay | **267 kịch bản** — đạt 267/267 |
| Lỗi phát hiện & sửa | 3 lỗi nghiệp vụ thật, mỗi lỗi có test chặn lại |

Hệ thống được đóng gói bằng Docker Compose, dựng lại đầy đủ bằng một câu lệnh
`docker compose up -d` kèm dữ liệu mẫu sẵn có.

---

## 2. Ưu điểm của hệ thống

**Ưu điểm 1 — Chống đặt trùng lịch ở 3 tầng độc lập.**
Đây là bài toán khó nhất của hệ thống đặt phòng. Hệ thống không dựa vào một lần kiểm tra
mà chặn ở 3 nơi: tầng giao diện (báo ngay trước khi khách điền form), tầng nghiệp vụ
(kiểm tra trong transaction), và tầng cơ sở dữ liệu (khoá tường `EXISTS` cùng cơ chế
khoá dòng của InnoDB). Ba tầng dùng **cùng một công thức** so sánh khoảng thời gian chồng
lấn `c₁ < t₂ VÀ t₁ > c₂`, nên không thể vòng qua bằng cách gọi thẳng API.

**Ưu điểm 2 — Chứng minh được cơ chế này hoạt động cả khi hai khách đặt đúng một lúc.**
Bộ test tích hợp có một test gửi **hai request thật song song** vào cùng một phòng, cùng
khung giờ. Kết quả luôn đúng một đơn được tạo (`201`) và một đơn bị từ chối (`409`).
Trong quá trình kiểm thử, test này đã phát hiện lỗi thật: hai transaction tranh nhau khoá
cùng một dòng khiến hệ thống trả `500` thay vì `409`. Nguyên nhân là đọc sai mã lỗi MySQL
(`ErrorCode` trả về `HResult` chứ không phải mã lỗi), đã sửa và bổ sung test.

**Ưu điểm 3 — Giữ lịch sử thay vì sửa thẳng trạng thái.**
Bảng `BookingStatusHistory` ghi lại từng lần chuyển trạng thái kèm người thực hiện và thời
điểm. Nhờ đó khi phát sinh khiếu nại vẫn trả lời được ai đã làm gì, lúc nào. Đơn đặt phòng
lưu thêm **snapshot giá** tại thời điểm đặt, nên khi chủ homestay đổi giá, lịch sử các đơn cũ
không bị thay đổi theo — đúng nguyên tắc lịch sử không được sửa.

**Ưu điểm 4 — Phân tích nghiệp vụ trước khi thiết kế, và kiểm chứng nghiệp vụ bằng test.**
Trước khi viết code, toàn bộ nghiệp vụ được đặt thành câu hỏi có thể trả lời Đúng/Sai
(ví dụ: "khách trả phòng lúc 12:00 thì khách mới có được nhận phòng lúc 12:00 không?") và
mỗi câu trả lời đều có ít nhất một test. Nhờ vậy 380 test backend không phải test để đủ số
lượng, mà là 380 lần xác nhận lại một quyết định nghiệp vụ.

**Ưu điểm 5 — Bảo mật theo nguyên tắc không tin đầu vào.**
Mật khẩu lưu dạng BCrypt hash; `userId` lấy từ token chứ không lấy từ giá trị gửi lên từ
trình duyệt; mốc thời gian đặt phòng được kiểm tra lại bằng **giờ của máy chủ** chứ không
tin giờ máy khách; phân quyền kiểm tra ở cả API và giao diện nên gọi thẳng URL cũng bị chặn;
API không bao giờ trả về khoá nội bộ hay thông tin nhạy cảm ra ngoài.

**Ưu điểm 6 — Giao diện xử lý đủ 3 trạng thái ở mọi danh sách.**
Mọi danh sách đều có trạng thái đang tải (khung xương), lỗi (kèm nút thử lại) và không có
dữ liệu (kèm hướng dẫn thao tác tiếp theo). Giao diện chạy được trên màn hình điện thoại.

**Ưu điểm 7 — Quy trình phát triển để lại dấu vết kiểm chứng được.**
Mỗi chức năng đều có kịch bản kiểm thử tay ghi lại kỳ vọng và thực tế, và bộ test tích
hợp chạy lại được nhiều lần liên tiếp mà không cần dọn dữ liệu mẫu giữa các lần. Quy trình
này đã phát hiện 3 lỗi thật, trong đó 1 lỗi chỉ lộ ra khi kiểm tra giao diện bằng mắt.

---

## 3. Hạn chế của hệ thống

**Hạn chế 1 — Chưa tích hợp thanh toán trực tuyến.**
Hệ thống chỉ ghi nhận số tiền phải trả chứ không thực hiện giao dịch. Khách chưa thể trả
tiền qua cổng VNPay/MoMo. Nguyên nhân: đây là phạm vi mở rộng được xếp sau cùng để dành
đủ thời gian cho phần cốt lõi, và cần hạ tầng chứng thực thực tế.

**Hạn chế 2 — Chưa có thông báo tự động.**
Khách phải tự mở hệ thống để xem đơn đã được xác nhận hay bị từ chối. Cùng lý do phạm vi:
cần thêm bảng dữ liệu và dịch vụ gửi tin nhắn/email.

**Hạn chế 3 — Mới chạy trên máy local.**
Hệ thống mới triển khai ở môi trường `localhost`, chưa có máy chủ thật, chưa sao lưu dữ
liệu định kỳ và chưa có giám sát vận hành.

**Hạn chế 4 — Ảnh phòng lưu đường dẫn, không lưu tệp tin.**
Khi chuyển sang nhiều máy chủ, đường dẫn cục bộ sẽ không còn đúng.

**Hạn chế 5 — Chưa có ứng dụng di động.**
Chỉ có ứng dụng Web, khách phải dùng trình duyệt trên điện thoại.

**Hạn chế 6 — Bảng `Bookings` lớn sẽ cần chia bảng.**
Hiện truy vấn lịch sử đơn quét cả bảng. Với dữ liệu thực tế vài triệu đơn cần bổ sung
phân trang ở tầng cơ sở dữ liệu hoặc chia bảng theo năm.

---

## 4. Hướng phát triển

| Hướng | Nội dung cụ thể |
|-------|------------------|
| **Thanh toán trực tuyến** | Thêm bảng `payments` lưu giao dịch; tích hợp cổng VNPay/MoMo; webhook xác nhận thanh toán; hoàn tiền tự động khi khách hủy đơn; đối soát doanh thu theo đơn đã thu tiền |
| **Thông báo tự động** | Thêm bảng `notifications`; gửi email/SMS khi đơn được xác nhận, bị từ chối, sắp tới giờ nhận phòng; cho khách tự chọn kênh nhận |
| **Triển khai máy chủ thật** | Đóng gói giao diện thành tệp tĩnh, đặt sau nginx; sao lưu CSDL tự động; HTTPS; biến môi trường thay vì để trong mã nguồn |
| **Ứng dụng di động** | Phát triển React Native dùng chung bộ API hiện có; bổ sung chức năng quét mã QR để nhận phòng nhanh |
| **Nâng cao hiệu năng** | Thêm bộ nhớ đệm cho truy vấn thống kê; đưa tìm kiếm phòng sang Elasticsearch khi dữ liệu lớn; phân trang ở tầng cơ sở dữ liệu |
| **Trí tuệ nhân tạo** | Gợi ý phòng phù hợp dựa trên lịch sử đặt; dự đoán thời điểm thịnh hành để điều chỉnh giá |

---

## 5. Bài học rút ra

Qua toàn bộ quá trình thực hiện, em rút ra ba bài học lớn nhất:

**Một — Một màn hình nhìn đúng không bảo đảm dữ liệu bên trong đúng.**
Trong quá trình chuẩn bị báo cáo, em phát hiện lỗi giao diện gửi mốc giờ theo giờ UTC
trong khi hệ thống hiểu là giờ địa phương, lệch 7 giờ. Hệ quả: khách chọn khung 15:00–19:00
vào một phòng **đã có người đặt** đúng khung giờ đó, hệ thống vẫn tạo đơn — và màn hình hiển
thị *"15:00 → 19:00"* hoàn toàn chính xác. Lỗi này lọt qua **649 test tự động** và **12 lần
chạy bộ test tích hợp**, vì trong test tôi cũng gửi chuỗi thời gian không ký `Z` — đúng
kiểu mà API mong đợi. Chỉ khi người dùng thật bấm chuột thì lỗi mới lộ ra. Bài học là:
**test phải mô phỏng cách người dùng thật thao tác, không chỉ cách mình tiện viết.**

**Hai — Dữ liệu hiển thị phải có đúng một nguồn.**
Trang chủ ban đầu hiển thị ba thẻ phòng viết cứng ngay trong mã nguồn. Khi phát hiện điểm
đánh giá sai, em kiểm tra lại mới thấy trang chủ còn hiện giá phòng cũ ngay cả khi CSDL đã
đổi — dữ liệu hiển thị có hai nguồn nên không thể biết cái nào đúng. Em đã thay toàn bộ bằng
lời gọi API, xoá được 80 dòng mã lặp.

**Ba — Kiểm tra dữ liệu thật, đừng chỉ tin code.**
Khi điểm đánh giá hiện sai, cách phản xạ đầu tiên là sửa code. Nhưng khi đọc kỹ, cả
`ReviewScorer` lúc chạy và `TinhLaiDiemPhong` lúc nạp dữ liệu mẫu đều đúng và nhất quán, và
đã có test chứng minh điều đó. Nguyên nhân thật là hàm nạp dữ liệu mẫu **bỏ qua khi bảng
đã có dữ liệu**, nên máy này vẫn giữ dữ liệu từ trước khi hàm đó được thêm vào. Chỉ có
việc đối chiếu trực tiếp với cơ sở dữ liệu mới phân biệt được "code sai" với "dữ liệu cũ".

Em hi vọng ba bài học này cũng hữu ích với những ai đang học lập trình web.