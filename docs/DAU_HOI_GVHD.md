# CHUẨN BỊ TRẢ LỜI CÂU HỎI CỦA GIẢNG VIÊN HƯỚNG DẪN

Đồ án 4 — Hệ thống đặt phòng & quản lý homestay HomeStay · Nguyễn Hải Nam — 12523W.1

---

## Cách dùng file này

Mỗi câu gồm 4 phần:

| Phần | Ý nghĩa |
|------|---------|
| **Câu hỏi** | Câu GVHD thường hỏi |
| **Trả lời ngắn** | Câu trả lời dạng miệng, 30–60 giây — đây là câu dùng thật |
| **Nếu hỏi sâu thêm** | Câu hỏi tiếp theo có khả năng cao, kèm cách trả lời |
| **Dự phòng** | Cách đáp nếu mình bị hỏi bất ngờ hoặc quên |

> **Nguyên tắc khi trả lời GVHD:** nếu không biết, nói thẳng *"em chưa làm phần này, em chỉ
> làm đến ..."*. Trả lời sai còn tệ hơn không trả lời.

---

## Câu 1 — Vì sao chọn kiến trúc này? Phân tầng 3 lớp?

**Trả lời ngắn**

"Em chọn kiến trúc phân tầng vì nó giải quyết đúng vấn đề thay đổi: nghiệp vụ đặt phòng
thay đổi nhiều, còn cấu trúc CSDL thay đổi ít. Với phân tầng, khi quy tắc tính tiền đổi
thì em chỉ sửa ở tầng Service mà không đụng tới Controller hay giao diện.

Ba tầng có trách nhiệm rõ ràng: Controller chỉ tiếp nhận và trả phản hồi; Service chứa toàn
bộ quy tắc nghiệp vụ; tầng dưới cùng truy vấn CSDL. Em đặt ba quy tắc và giữ xuyên suốt là
không viết truy vấn trong Controller, không viết nghiệp vụ trong Controller, và không bao
giờ trả entity thô ra API — luôn trả qua DTO để không lộ cấu trúc bảng.

Quan trọng nhất: nhờ tách nghiệp vụ ra khỏi Controller nên em **kiểm thử được** logic nghiệp
vụ bằng unit test. Nếu để logic trong Controller thì không test được."

**Nếu hỏi sâu thêm**

- *"Vậy có đánh đổi gì không?"* → "Có, phân tầng nhiều tầng thì nhiều file hơn và phải truyền
  qua nhiều lớp. Với hệ thống nhỏ 41 API thì em chấp nhận đánh đổi này vì đổi lại được
  khả năng kiểm thử và dễ mở rộng. Nếu hệ thống chỉ có vài API đơn giản thì viết thẳng
  cũng được."
- *"Có repository không?"* → "Em không tách lớp Repository. Ở .NET, Entity Framework đã đóng
  vai trò lớp truy vấn, và các truy vấn của em không phức tạp đến mức cần thêm một tầng
  trung gian. Thêm Repository chỉ là thêm một lớp chuyển tiếp — nguyên tắc YAGNI."

---

## Câu 2 — Làm sao chống được đặt trùng phòng?

**Trả lời ngắn**

"Em chặn ở **ba tầng độc lập, cùng dùng một công thức**.

Hai khoảng thời gian `[c₁, t₁]` và `[c₂, t₂]` chồng lấn nhau khi `c₁ < t₂` **và** `t₁ > c₂`.
Em dùng `<` và `>` chứ không dùng `<=` và `>=`: khách trả phòng lúc 12:00 thì khách mới
được nhận phòng lúc 12:00, nên hai khoảng chạm biên không tính là trùng.

Ba tầng là: tầng giao diện báo ngay trước khi khách điền form; tầng nghiệp vụ kiểm tra lại
trong transaction; và tầng CSDL dùng truy vấn `EXISTS` phủ định kèm cơ chế khoá dòng của
InnoDB. Chỉ những đơn ở trạng thái `PENDING`, `CONFIRMED`, `CHECKED_IN` mới chiếm chỗ; đơn
đã hủy hoặc bị từ chối thì giải phóng để đặt lại được.

Vì cả ba tầng cùng công thức nên không thể vòng qua bằng cách gọi thẳng API."

**Nếu hỏi sâu thêm**

- *"Chứng minh bằng cách nào?"* → "Bộ test tích hợp có test T3 gửi **hai request thật song
  song** vào cùng phòng, cùng khung giờ. Kết quả luôn đúng một đơn `201` và một đơn `409`.
  Em chạy bộ test này 12 lần liên tiếp, cả 12 lần đều đúng."
- *"Có transaction không?"* → "Có, và em dùng `SERIALIZABLE` cho thao tác tạo đơn vì nó mạnh
  hơn mức `REPEATABLE READ` mặc định. Toàn bộ thao tác tạo đơn, đổi trạng thái phòng và
  ghi lịch sử nằm trong một transaction; có bước nào lỗi thì rollback toàn bộ."
- *"Nếu MySQL xảy ra deadlock thì sao?"* → "Đó chính là lỗi em gặp thật và đã sửa: hai
  transaction tranh nhau khoá cùng một dòng thì MySQL trả mã lỗi `1213`, và ban đầu hệ thống
  trả `500` thay vì `409`. Nguyên nhân là em đọc sai mã lỗi — `ErrorCode` của MySqlConnector
  trả về `HResult`, không phải mã lỗi. Sửa bằng cách dò cả chuỗi exception và đọc
  `MySqlException.Number`, rồi chỉ chuyển đúng 3 mã lỗi tranh chấp thành `409`; lỗi khác vẫn
  giữ `500` để không che giấu sự cố hệ thống."

---

## Câu 3 — Vì sao lưu giá phòng dưới dạng snapshot?

**Trả lời ngắn**

"Vì giá là thông tin **tại thời điểm thỏa thuận**, không phải thuộc tính cố định của phòng.

Nếu bảng đơn chỉ lưu `roomId` và cột giá nằm ở bảng phòng, thì khi chủ homestay đổi giá từ
90.000 lên 120.000, tất cả đơn cũ cũng đổi theo. Khi khách phản ánh *"hôm tôi đặt giá
90.000, giờ hệ thống báo 120.000"* thì không còn căn cứ để giải thích.

Nên em chụp snapshot giá vào chính bảng `Bookings` tại thời điểm tạo đơn. Sau này đổi giá
phòng bao nhiêu thì lịch sử vẫn giữ nguyên. Hệ quả thứ hai là doanh thu lịch sử không bị
cấp nhật vô tình khi giá thay đổi — nếu tính doanh thu bằng cách nhân `giá hiện tại × số
đêm` thì cả báo cáo năm ngoái cũng sai theo."

**Nếu hỏi sâu thêm**

- *"Vậy sửa giá phòng ảnh hưởng đơn nào?"* → "Ảnh hưởng đơn **chưa hoàn thành**. Với đơn đã
  hoàn thành, giá đã chốt nên giữ nguyên."
- *"Có test cho cái này không?"* → "Có, em có test `SeedAsync_LuuGiaPhongLucDatDeLichSuDonKhongBiBienDoi`
  khẳng định mọi đơn trong dữ liệu mẫu đều lưu đúng giá tại thời điểm đặt."

---

## Câu 4 — Phân quyền thế nào?

**Trả lời ngắn**

"Em phân quyền ở **hai tầng, cùng kiểm tra một lần nữa ở giao diện**.

Tầng API dùng attribute `[Authorize]` cho endpoint công khai và `[Authorize(Roles = "ADMIN")]`
cho endpoint quản trị. Không có token thì trả `401`, có token của khách mà gọi API quản trị
thì trả `403`.

Tầng giao diện có `ProtectedRoute` kiểm tra `role === 'ADMIN'` trước khi vào khu vực `/admin`.
Em làm cả hai vì: nếu chỉ chặn ở giao diện thì gọi thẳng API vẫn lọt, còn nếu chỉ chặn ở
API thì người dùng bị đẩy vào trang lỗi mà không hiểu vì sao.

Ba điểm em đặc biệt chú ý: đăng ký không cho tự chọn quyền — mọi tài khoản tự đăng ký đều là
khách; `userId` lấy từ token chứ không lấy từ giá trí gửi lên từ trình duyệt, nếu lấy từ
client thì khách sửa một con số là đổi được thành admin; và mật khẩu lưu dạng BCrypt hash,
API không có endpoint nào trả về trường mật khẩu."

**Nếu hỏi sâu thêm**

- *"JWT lưu ở đâu?"* → "Ở `localStorage` qua middleware `persist` của Zustand. Em chọn vì
  backend và frontend cùng một hệ thống trong phạm vi đồ án; đổi lại em phải chấp nhận rủi
  ro XSS. Trước mắt em chống XSS bằng cách không chèn HTML không tin cậy và không truyền
  token vào URL."
- *"Access token hết hạn thì sao?"* → "Access token 60 phút, refresh token 7 ngày. Khi API
  trả `401`, interceptor tự gọi refresh một lần rồi thử lại; nếu refresh cũng hết hạn thì
  đăng xuất và chuyển về trang đăng nhập."
- *"Tại sao không dùng cookie?"* → "Cookie `httpOnly` chống đánh cắp token qua XSS tốt hơn,
  nhưng kèm phức tạp CSRF và cấu hình SameSite. Với phạm vi đồ án em chọn `localStorage` và
  ghi rõ đánh đổi này trong báo cáo."

---

## Câu 5 — Nếu hai người đặt phòng cùng một lúc thì sao?

**Trả lời ngắn**

"Đây là bài toán mà em coi là khó nhất, và em **chứng minh được** chứ không chỉ nói.

Về mặt lý thuyết, hai request gần như đồng thời sẽ cùng đọc được dữ liệu là phòng còn trống —
mỗi người đọc ở thời điểm trước khi người kia ghi. Chỉ tầng cơ sở dữ liệu mới chặn được,
vì nó giữ khoá dòng tới hết transaction: transaction thứ hai phải chờ, đọc lại thì thấy đơn
của người thứ nhất rồi mới quyết định.

Về mặt thực tế, em viết test T3 gửi hai request thật song song vào cùng phòng, cùng khung
giờ, rồi đo lại. Kết quả luôn đúng một đơn `201` và một đơn `409`. Em chạy test này liên tiếp
12 lần, cả 12 lần đều đúng.

Test này cũng phát hiện ra lỗi thật: ban đầu nó trả `500` thay vì `409`, vì hai transaction
tranh nhau khoá cùng một dòng thì MySQL trả mã lỗi `1213` mà code của em chưa bắt được. Em
đã sửa và bổ sung thêm test khoá lại."

**Nếu hỏi sâu thêm**

- *"Chọn mức transaction nào?"* → "`SERIALIZABLE` cho thao tác tạo đơn. Mặc định của InnoDB là
  `REPEATABLE READ`; em nâng lên vì nghiệp vụ này chấp nhận đọc lâu hơn một chút để không
  bao giờ đặt trùng, và lượng đặt phòng không lớn nên chấp nhận được đánh đổi."
- *"Có phải lúc nào cũng chặn đúng?"* → "Với hai request song song thì em đã kiểm chứng 12 lần.
  Em không dám khẳng định tuyệt đối cho mọi trường hợp tải cao vì em chưa tạo điều kiện
  tải thật — đây là hạn chế em ghi trong báo cáo, và là hướng sẽ làm tiếp."

---

## Câu 6 — Phần nào em tốn thời gian nhất?

**Trả lời ngắn**

"Phần em tốn nhiều thời gian nhất là **sửa một lỗi chỉ lộ ra khi làm báo cáo**: giao diện gửi
mốc giờ bằng `toISOString()` — hàm này trả giờ UTC — trong khi máy chủ hiểu là giờ địa phương.
Máy ở múi giờ UTC+7 nên lệch 7 giờ.

Hậu quả rất đáng sợ: khách chọn khung 15:00–19:00 vào một phòng **đã có đơn** đúng khung giờ
đó, hệ thống nhận 08:00–12:00 nên không thấy trùng và vẫn tạo đơn — trong khi màn hình hiển
thị *"15:00 → 19:00"* hoàn toàn chính xác. Giao diện nhìn không có gì sai, dữ liệu thì sai.

Lỗi này lọt qua 649 test tự động và 12 lần chạy bộ test tích hợp, vì trong test em cũng gửi
chuỗi thời gian không ký chữ `Z` — đúng kiểu mà API mong đợi. Nó chỉ lộ ra khi em chuẩn bị
chụp ảnh hệ thống thật cho báo cáo.

Em đã sửa bằng cách thêm hàm `toLocalIsoString()` định dạng giờ địa phương không ký `Z`,
thay ở cả ba chỗ gửi lên API, và thêm test khẳng định kết quả **không chứa `Z`** và **không
bằng** `toISOString()` để chặn lại đúng lỗi này."

**Nếu hỏi sâu thêm**

- *"Vậy test tự động có đáng tin không?"* → "Có giá trị nhưng có giới hạn, và em rút ra bài học
  từ chính lỗi này: **test phải mô phỏng cách người dùng thật thao tác**. Ở đây người dùng
  thật chọn giờ trên lịch rồi bấm nút, giờ đó đi qua `Date.toISOString()` của trình duyệt —
  còn test của em thì tự dựng chuỗi. Sai ở cách test, không sai ở cách kiểm thử."
- *"Làm sao tránh tái diễn?"* → "Em viết test khoá đúng cơ chế gây lỗi chứ không chỉ khẳng
  định kết quả đúng. Với lỗi này là khẳng định chuỗi gửi lên **không có ký `Z`** và **không
  bằng** `toISOString()` — nếu sau này ai đó đổi lại thì test đỏ ngay."

---

## Câu 7 — Dùng AI thế nào trong đồ án?

**Trả lời ngắn**

"Em dùng công cụ AI như một **trợ lý lập trình**, không phải nhờ nó làm thay. Cụ thể:

*Một*, em đặt kế hoạch và quyết định trước. Chọn công nghệ, chốt quy tắc nghiệp vụ, thiết kế
CSDL, viết đặc tả API — đều là quyết định của em.

*Hai*, em dùng AI để hỏi nhanh hơn: tra cứu cú pháp, so sánh cách làm, hỏi tại sao một
truy vấn không trả kết quả mong đợi.

*Ba*, **mọi dòng code AI viết đều phải qua kiểm tra của em** trước khi dùng. Em đặt ra
quy tắc trong dự án là mỗi chức năng phải có bằng chứng — build không lỗi, kiểm thử tay ít
nhất 3 kịch bản, unit test, rồi mới coi là xong.

Em tìm được 3 lỗi thật và đều là lỗi trong code do AI viết: lỗi trả `500` thay vì `409`,
trang Swagger không render, và lỗi múi giờ nghiêm trọng nhất. Nếu em chỉ tin lời 'đã xong'
mà không tự kiểm chứng thì cả 3 lỗi đó sẽ ra tay giảng viên.

Em ghi toàn bộ bài học vào sổ `lessons.md` — hiện có **86 mục**."

**Nếu hỏi sâu thêm**

- *"Có phần nào AI làm hộ không?"* → "Có phần giao diện: AI tạo nhanh khung HTML và CSS.
  Nhưng em phải chỉnh lại gần hết — sửa lỗi hiển thị tiền VND, căn lề số, kiểm tra ở màn
  hình điện thoại, thêm trạng thái đang tải và lỗi. Có lỗi trang quản trị bị tôi tối màu
  nền khi chụp ảnh, em phải sửa lại lớp nền."
- *"Đã kiểm tra được những gì?"* → "Em có 86 mục bài học, trong đó nhiều mục là lỗi AI tạo ra
  như tôi bắt được. Ví dụ: AI đọc sai tên tham số API nên phải đi tìm tên đúng trong DTO;
  AI viết hàm kiểm tra chồng lấn dùng `<=` thay vì `<` làm tính sai biên."

---

## Câu 8 — Nếu GV hỏi về phần chưa làm

**Trả lời ngắn**

"Em chưa làm hai phần là **thanh toán trực tuyến** và **thông báo tự động**.

Em xếp chúng sau cùng có chủ đích. Lý do: đó là hai phần cần thêm bảng dữ liệu mới và hạ tầng
bên ngoài hệ thống — cổng thanh toán, dịch vụ gửi tin nhắn — trong khi phần cốt lõi là đặt
phòng và vận hành đơn thì phải làm chắc trước. Nếu làm rộng sớm thì phần cốt lõi sẽ không
đủ sâu.

Để cho minh bạch, em đã ghi rõ trong cả ba chỗ: mục hạn chế và hướng phát triển trong báo
cáo, và phần trả lời này. Em **không** ghi trong báo cáo rằng đã có hai phần đó. Em cũng cố
tình **không tạo sẵn bảng `payments` và `notifications` rỗng**, vì bảng rỗng thì khi thầy hỏi
'bảng này dùng làm gì' em sẽ không trả lời được."

**Nếu hỏi tiếp "nếu còn thời gian em làm cái nào trước?"**

"Em làm **thanh toán trực tuyến** trước. Lý do: nó khép kín vòng đời đơn — hiện đơn đã
`COMPLETED` thì hệ thống ghi nhận doanh thu nhưng chưa có bước xác nhận khách đã trả. Và em
chọn cổng VNPay vì có sandbox để kiểm thử mà không cần tài khoản thật."

---

## Câu 9 — Em đảm bảo chất lượng bằng cách nào?

**Trả lời ngắn**

"Em quy định cho mình: **một chức năng chỉ được coi là xong khi có đủ ba loại bằng chứng**.

Một, **test chạy xanh**: em cố định ở 414 test backend, 287 test frontend, và `dotnet build`
cùng `npm run build` không có lỗi lẫn cảnh báo.

Hai, **kiểm thử tay bằng ba loại kịch bản bắt buộc** cho mỗi chức năng: trường hợp bình
thường, trường hợp biên, và trường hợp bất thường. Ví dụ với đặt trùng lịch: khung giờ trống
thì cho đặt; khung chạm biên với đơn cũ thì vẫn cho đặt; hai tab cùng đặt thì chỉ một đơn
được tạo. Tổng cộng 267 kịch bản, tất cả đều đạt.

Ba, **ghi lại kết quả để đối chiếu được**: em lập bảng kỳ vọng và thực tế cho từng kịch bản,
kèm bộ test tích hợp chạy lại được nhiều lần liên tiếp mà không cần dọn dữ liệu mẫu.

Quy trình này không chỉ để chứng minh, nó **tìm ra lỗi thật**: test chống trùng phát hiện
lỗi trả `500`, kiểm tra dữ liệu phát hiện điểm đánh giá lệch, và kiểm tra giao diện phát hiện
lỗi múi giờ."

---

## Câu 10 — Nếu hỏi về phần còn lại sẽ làm gì?

**Trả lời ngắn**

"Theo thứ tự ưu tiên em đã sắp: tích hợp thanh toán trực tuyến, thông báo tự động, rồi
triển khai lên máy chủ thật.

Với thanh toán, em sẽ thêm bảng lưu giao dịch, dùng webhook xác nhận từ cổng thanh toán
thay vì tin ngay trạng thái trả về — vì bên cổng có thể gửi lặp lại. Với thông báo, em sẽ
gửi cho khách khi đơn được xác nhận, bị từ chối, và nhắc trước giờ nhận phòng.

Ngoài ra em muốn bổ sung một hướng kỹ thuật: hiện truy vấn lịch sử đơn đang quét cả bảng
`Bookings`. Với dữ liệu thực tế vài triệu đơn thì cần phân trang ở tầng cơ sở dữ liệu hoặc
chia bảng theo năm. Em ghi đây là hạn chế của hệ thống chứ không giấu, vì đây là điểm yếu
thật của hệ thống."

---

## Ghi chú cuối buổi bảo vệ

| Trước khi vào phòng | Kiểm tra |
|--------------------|----------|
| Docker Desktop đang chạy | `docker ps` thấy container `homestay-mysql` |
| Máy chủ API | `http://localhost:5080/swagger` mở được |
| Giao diện | `http://localhost:5174` mở được |
| Dữ liệu mẫu | Trang chủ hiện 3 phòng, trang thống kê hiện 15 đơn |
| Tài khoản | Ghi sẵn `admin@homestay.vn` / `123456` và `khach1@gmail.com` / `123456` |
| Tab trình duyệt | Mở sẵn 2 tab: 1 tab khách, 1 tab Admin đã đăng nhập |
| File | `docs/CHUONG_4.md` và bảng kết quả kiểm thử mở sẵn để đối chiếu |

| Trong lúc trình bày | Làm gì |
|---------------------|--------|
| Nếu hỏi câu ngoài danh sách trên | Nói thẳng nếu chưa biết; quay lại câu gần nhất trong danh sách để trả lời tương tự |
| Nếu bị hỏi về phần chưa làm | Xem **Câu 8** — nói rõ, không vòng vo |
| Nếu GV nói "ổn" và hỏi thêm | Kéo dài bằng **Câu 9** và **Câu 10**, đừng lặp lại nội dung đã nói |
| Nếu GV hỏi "ở trong code em để ở đâu?" | Mở đúng file tương ứng, ví dụ chống trùng lịch ở `BookingService.TaoDonAsync` |