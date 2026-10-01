# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT

Chương này trình bày những kiến thức nền tảng được sử dụng để xây dựng hệ thống HomeStay:
quy trình phát triển phần mềm, công nghệ phía giao diện, công nghệ phía máy chủ, công nghệ
thao tác dữ liệu, cơ chế xác thực phân quyền và các công cụ hỗ trợ phát triển.

## 2.1. Quy trình phát triển phần mềm

Quy trình phát triển phần mềm là chuỗi hoạt động có thứ tự, mỗi hoạt động tạo ra một sản
phẩm trung gian làm đầu vào cho hoạt động kế tiếp. Có nhiều mô hình khác nhau; với đồ án này,
em chọn **mô hình phát triển lặp** vì yêu cầu nghiệp vụ được làm rõ dần trong quá trình
phát triển, đặc biệt là các quy tắc về khoảng thời gian đặt phòng.

Quy trình gồm 7 bước:

1. **Bước 1 — Xác định yêu cầu:** thu thập thông tin về mục tiêu và yêu cầu cụ thể, bao gồm
   việc hiểu rõ về thị trường, khách hàng tiềm năng và những gì hệ thống cần đáp ứng.
2. **Bước 2 — Phân tích yêu cầu:** xác định yêu cầu cần thiết, phân loại thành yêu cầu chức
   năng và yêu cầu phi chức năng. Ở đồ án này, em chuyển từng câu hỏi nghiệp vụ thành câu
   hỏi có thể trả lời Đúng hoặc Sai, ví dụ "khách trả phòng lúc 12:00 thì khách mới có
   được nhận phòng lúc 12:00 không?".
3. **Bước 3 — Thiết kế phần mềm:** giải quyết vấn đề và lập kế hoạch cho giải pháp, bao gồm
   thiết kế kiến trúc, thiết kế cơ sở dữ liệu, mô hình hoá bằng biểu đồ UML.
4. **Bước 4 — Lập trình:** cài đặt thuật toán và cấu trúc dữ liệu thành mã nguồn thực thi.
5. **Bước 5 — Kiểm thử:** kiểm tra xem phần mềm có đáp ứng đúng yêu cầu đã đặt ra, gồm kiểm
   thử đơn vị, kiểm thử tích hợp và kiểm thử hệ thống.
6. **Bước 6 — Triển khai:** đưa phần mềm vào sử dụng thực tế sau khi đã kiểm thử và khắc
   phục sai sót.
7. **Bước 7 — Bảo trì:** điều chỉnh các lỗi chưa phát hiện được trong các giai đoạn trước
   và cập nhật phần mềm theo yêu cầu thay đổi.

**Vì sao chọn phát triển lặp thay vì mô hình thác nước:**

| Tiêu chí | Mô hình thác nước | Mô hình lặp | Đồ án HomeStay |
|----------|------------------|--------------|----------------|
| Yêu cầu thay đổi | Khó thích ứng | Linh hoạt | Quy tắc nghiệp vụ rõ dần khi hiểu miền bài toán |
| Thời gian đưa ra bản dùng đầu tiên | Cuối dự án | Sớm | Mỗi nhóm chức năng là một bản chạy được |
| Kiểm thử | Tập trung cuối kỳ | Liên tục | Test đi kèm mỗi chức năng, 414 test backend |
| Phát hiện lỗi | Muộn, khó truy nguyên | Sớm, dễ truy nguyên | 3 lỗi thật phát hiện trong kiểm thử |

Điểm quan trọng nhất: với bài toán đặt phòng, ranh giới giữa hai khoảng thời gian là câu hỏi mà
chỉ giải quyết được khi ngồi xét kỹ từng quy tắc. Phát triển lặp cho phép hỏi và sửa quy
tắc ngay trong khi vẫn còn những phần khác đang chạy tốt.

## 2.2. Công nghệ phía giao diện

### 2.2.1. React và TypeScript

**React** là thư viện JavaScript do Meta phát triển để xây dựng giao diện người dùng. Điểm
khác biệt lớn nhất của React là cách tổ chức giao diện theo **thành phần** (component): mỗi
màn hình được chia thành các phần nhỏ có trách nhiệm riêng, và mỗi phần có **trạng thái**
(state) của riêng nó.

Trong hệ thống HomeStay, các đặc điểm của React được sử dụng gồm:

- **Thành phần dùng lại:** bảng dữ liệu, phân trang, trạng thái rỗng và biểu mẫu được tách
  thành thành phần chung, dùng lại ở nhiều màn hình.
- **Quản lý trạng thái:** dữ liệu từ máy chủ quản lý bằng TanStack Query, trạng thái giao diện
  đơn giản quản lý bằng React Hook Form và Zustand.
- **Điều hướng:** React Router định tuyến 21 màn hình, bao gồm cả đường dẫn có tham số kiểu
  `/locations/:coSo/rooms/:coSoPhong`.
- **Giao diện đáp ứng:** bố cục thay đổi theo kích thước màn hình bằng TailwindCSS.

**TypeScript** là ngôn ngữ mở rộng của JavaScript, bổ sung hệ thống kiểu dữ liệu tĩnh. Nếu
JavaScript cho phép gán số vào một biến vốn chứa chuỗi mà không báo lỗi, thì TypeScript báo lỗi
ngay khi biên dịch. Trong đồ án này, quy tắc của dự án là **không dùng kiểu `any` ở bất cứ
đâu** — mọi kiểu phải rõ ràng hoặc dùng `unknown` kèm kiểm tra.

Nhờ vậy nhiều lỗi chỉ có thể xảy ra khi biên dịch đã bị chặn trước khi chạy. Đây là lý do
tiếng Việt có dấu và tiền Việt Nam có ký hiệu ₫ vẫn hiển thị đúng: kiểu dữ liệu được khai
báo ngay trong tên hàm định dạng.

**Vite** là công cụ đóng gói và chạy máy chủ phát triển. So với công cụ truyền thống, Vite
khởi động máy chủ phát triển gần như tức thì vì nó không dựng lại toàn bộ gói khi thay đổi
một tệp.

**TailwindCSS** là framework CSS tiện ích: thay vì viết từng khối CSS, em dùng các lớp có
sẵn như `text-right`, `text-emerald-700`. Nhờ vậy không phát sinh mã CSS thừa không ai dùng,
và cỡ chữ, khoảng cách luôn thống nhất giữa các màn hình.

### 2.2.2. Các thư viện khác ở phía giao diện

| Thư viện | Dùng để làm gì |
|----------|----------------|
| Axios | Gửi yêu cầu HTTP và tự thêm access token vào tiêu đề |
| TanStack Query | Lấy, ghi, đồng bộ và tự làm mới dữ liệu từ máy chủ |
| React Hook Form + Zod | Quản lý biểu mẫu và kiểm tra dữ liệu ngay khi gõ |
| Zustand | Lưu trạng thái phiên đăng nhập dùng chung nhiều trang |
| Recharts | Vẽ biểu đồ cột và biểu đồ đường cho trang thống kê |

**Vì sao kiểm tra biểu mẫu bằng Zod mà không kiểm tra thủ công:** kịch bản Zod được viết
một lần và dùng lại cho cả kiểm tra ở giao diện lẫn kiểm tra ở API. Nhờ vậy hai đầu không
thể lệch nhau — loại bỏ thứ một trong hai bên là loại bỏ được cả nguồn sai lệch.

## 2.3. Công nghệ phía máy chủ

### 2.3.1. ASP.NET Core Web API

**ASP.NET Core** là framework mã nguồn mở, đa nền tảng của Microsoft, dùng để xây dựng
ứng dụng web và API. Trong hệ thống HomeStay, ASP.NET Core đảm nhiệm:

- Tiếp nhận HTTP Request từ phía giao diện.
- Xác thực token và kiểm tra quyền trước khi vào nghiệp vụ.
- Chuyển đổi dữ liệu JSON qua lại giữa giao diện và nghiệp vụ.
- Trả về thông báo lỗi thống nhất, không để lộ chi tiết bên trong.

Các cơ chế ASP.NET Core cung cấp và được dùng trong đồ án:

| Cơ chế | Dùng ở đâu trong hệ thống |
|--------|----------------------------|
| Dependency Injection | Service được tiêm vào Controller, không tự khởi tạo |
| Middleware | Bắt lỗi tập trung, ghi log request |
| Authentication | Xác thực bearer token bằng JWT |
| Authorization | Phân quyền theo vai trò bằng attribute `[Authorize]` |
| Model binding và validation | Chuyển JSON thành đối tượng yêu cầu có kiểu rõ ràng |

### 2.3.2. Kiến trúc phân tầng của backend

Backend được tổ chức theo kiến trúc phân tầng, mỗi tầng có một trách nhiệm duy nhất:

```
HTTP Request → Controller → Service → Entity Framework → MySQL
                  ↓          ↓            ↓
            tiếp nhận,    nghiệp vụ,    truy vấn và
            kiểm tra      quy tắc       thao tác dữ liệu
            đầu vào       nghiệp vụ
```

| Tầng | Trách nhiệm | Quy tắc bắt buộc |
|------|--------------|-------------------|
| Controller | Tiếp nhận request, kiểm tra dữ liệu đầu vào, trả response | Không viết truy vấn dữ liệu, không chứa nghiệp vụ |
| Service | Xử lý nghiệp vụ, quy tắc tính tiền, kiểm tra điều kiện | Không trả thẳng entity ra ngoài, luôn trả về DTO |
| Entity Framework | Ánh xạ lớp nghiệp vụ sang bảng, sinh câu truy vấn | Không chứa quy tắc nghiệp vụ |

**Vì sao phải phân tầng:** khi cần kiểm thử quy tắc tính tiền, em gọi trực tiếp hàm của
Service với dữ liệu dựng sẵn trong bộ nhớ, không cần dựng máy chủ HTTP hay kết nối MySQL.
Nếu để quy tắc nằm trong Controller thì mỗi lần kiểm thử đều phải gửi request HTTP thật, chậm
hơn nhiều và khó cô lập.

Một quy tắc quan trọng khác: **API không bao giờ trả thẳng đối tượng entity**. Nếu trả thẳng,
cấu trúc bảng lộ ra ngoài, các trường nhạy cảm có nguy cơ bị trả theo, và giao diện phải biết
khoá chính — trong khi quy tắc của đồ án là giao diện không được hiển thị khoá nội bộ.

### 2.3.3. Xác thực và phân quyền

Hệ thống dùng cơ chế xác thực dựa trên **JWT (JSON Web Token)**. Sau khi đăng nhập thành công,
máy chủ cấp hai loại token:

| Loại token | Thời hạn | Dùng để |
|------------|-----------|---------|
| Access token | 15 phút | Gửi kèm mỗi yêu cầu để chứng minh đã đăng nhập |
| Refresh token | 7 ngày | Đổi lấy access token mới khi access token hết hạn |

Phân biệt hai loại token giúp rút ngắn thời gian sống của token dùng hằng ngày: nếu access
token sống cả ngày thì khi bị lộ thì nguy cơ lớn hơn nhiều.

Phân quyền được kiểm tra ở **hai tầng cùng lúc**:

1. **Trên API:** attribute `[Authorize(Roles = "ADMIN")]` chặn request không đúng quyền.
2. **Trên giao diện:** `ProtectedRoute` chuyển hướng khách ra khỏi khu vực quản trị.

Kiểm tra ở cả hai tầng là bắt buộc. Nếu chỉ kiểm tra ở giao diện, khách gõ thẳng địa chỉ
URL vào khu vực quản trị vẫn thấy dữ liệu. Nếu chỉ kiểm tra ở API thì giao diện hiển thị
trang trống rỗng rối đến khi người dùng thấy lỗi 403 mà không hiểu vì sao.

**Nguyên tắc không tin đầu vào** được áp dụng xuyên suốt:

- Mật khẩu lưu dạng BCrypt hash, không API nào trả về trường mật khẩu.
- Định danh người dùng lấy từ token đã xác thực, không lấy từ giá trị gửi lên từ giao diện.
- Đăng ký không cho tự chọn quyền quản trị viên.
- Khóa bí mật ký JWT nằm trong tệp cấu hình riêng cho môi trường phát triển, không đưa vào
  kho mã nguồn.

## 2.4. Công nghệ thao tác dữ liệu

### 2.4.1. MySQL

**MySQL** là hệ quản trị cơ sở dữ liệu quan hệ, dùng để lưu trữ dữ liệu có cấu trúc của hệ
thống HomeStay. Cơ sở dữ liệu gồm 11 bảng thuộc 7 nhóm nghiệp vụ:

| Nhóm | Các bảng |
|------|----------|
| Người dùng | `Users` |
| Cơ sở và phòng | `Locations`, `Rooms`, `RoomImages`, `Amenities`, `RoomAmenities` |
| Đặt phòng | `Bookings`, `BookingStatusHistory` |
| Đánh giá | `Reviews` |
| Thanh toán | `Payments` |
| Thông báo | `Notifications` |

MySQL hỗ trợ các cơ chế khoá chính, khoá ngoại, ràng buộc dữ liệu và giao dịch. Trong đồ án,
hai cơ chế này đóng vai trò quyết định:

- **Ràng buộc ở mức CSDL** chặn được những lỗi mà mã nguồn lẽ ra không bao giờ mắc phải.
  Ví dụ, bảng `Payments` có ràng buộc `UNIQUE` trên `BookingId` nghĩa là **một đơn không thể
  có hai phiếu thu**, cho dù đoạn mã có lỗi. Có thêm ràng buộc `CHECK` để số tiền không thể
  âm.
- **Giao dịch (transaction)** đảm bảo một thao tác gồm nhiều bước là thành công hoặc thất
  bại toàn bộ. Khi tạo đơn đặt phòng có ba bước — tạo bản ghi đơn, ghi lịch sử trạng thái,
  đổi trạng thái phòng — cả ba nằm trong một transaction. Nếu bước thứ ba thất bại thì hai
  bước trước hoàn tác, không để lại đơn mồ côi với phòng vẫn hiện là trống.

### 2.4.2. Entity Framework Core

**Entity Framework Core (EF Core)** là bộ ánh xạ đối tượng (ORM) kết nối tầng nghiệp vụ với
cơ sở dữ liệu. Nhờ đó phần lớn mã truy vấn được sinh ra tự động thay vì viết tay.

Trong hệ thống HomeStay, EF Core được dùng để:

- Ánh xạ lớp C# với bảng MySQL thông qua lớp `HomeStayDbContext`.
- Thực hiện các thao tác thêm, sửa, xoá và truy vấn.
- Quản lý quan hệ giữa các lớp.
- Quản lý phiên bản cấu trúc cơ sở dữ liệu bằng **Migration**.
- Tạo dữ liệu mẫu phục vụ kiểm thử và trình diễn.

**Vì sao chọn EF Core thay vì viết SQL thuần:** phần lớn nghiệp vụ của đồ án là đọc và ghi,
không phải câu truy vấn phức tạp. EF Core giúp mã tập trung vào nghiệp vụ thay vì vào cú pháp
SQL. Các truy vấn được viết bằng biểu thức truy vấn của LINQ, và chỉ chuyển thành SQL khi thực
thi.

**Quy tắc truy vấn được đặt ra trong đồ án:**

- Mọi truy vấn đều bất đồng bộ và có tham số huỷ tác vụ, tránh giữ kết nối không cần thiết.
- Đọc dữ liệu dùng `AsNoTracking()` khi chỉ đọc, tránh theo dõi thay đổi không cần thiết.
- Lấy danh sách luôn phân trang, không trả toàn bộ bảng.
- Dùng `Include` để lấy dữ liệu quan hệ, tránh truy vấn lặp kiểu N+1.

## 2.5. Công cụ hỗ trợ phát triển và kiểm thử

| Công cụ | Dùng để làm gì |
|----------|----------------|
| Visual Studio Code | Soạn thảo mã nguồn Frontend và Backend |
| .NET SDK 8.0 | Biên dịch và chạy backend, sinh migration |
| Node.js và npm | Cài đặt thư viện và chạy dự án React |
| Docker | Chạy MySQL 8.0 mà không cài trực tiếp lên máy |
| Git và GitHub | Quản lý phiên bản mã nguồn |
| xUnit | Viết unit test cho backend |
| Vitest và Testing Library | Viết unit test cho frontend |
| Postman | Kiểm thử tích hợp REST API |

**Vì sao chạy MySQL bằng Docker:** cài trực tiếp MySQL lên máy học viên dễ xung đột với
phiên bản đang dùng cho môn khác, và việc gỡ cài đặt sau đó rất phiền. Chạy bằng Docker chỉ
cần một tệp cấu hình, dữ liệu nằm trong ổ đĩa ảnh tách biệt, và xoá đi cũng không ảnh hưởng
gì trên máy.

**Vì sao cần nhiều lớp kiểm thử:** mỗi lớp bắt được nhóm lỗi khác nhau.

| Lớp kiểm thử | Phát hiện loại lỗi | Công cụ |
|---------------|-------------------|---------|
| Đơn vị | Quy tắc tính tiền, ma trận chuyển trạng thái, điều kiện biên | xUnit, Vitest |
| Tích hợp API | Sai định dạng request, sai mã lỗi trả về, token hết hạn | Postman |
| Kiểm thử tay trên trình duyệt | Trạng thái bắt buộc thiếu, đáp ứng trên điện thoại, giao diện bị vỡ khi dữ liệu rỗng | Trình duyệt |