# SLIDE THUYẾT TRÌNH — HomeStay

**Đồ án 4 — Hệ thống đặt phòng & quản lý homestay**
Nguyễn Hải Nam — 12523W.1

---

## Cách dùng file này

Mỗi slide gồm 3 phần:

| Phần | Dùng để |
|------|---------|
| **Trên slide** | Chữ sẽ hiển thị — càng ít càng tốt |
| **Nói** | Lời nói tóm tắt, dùng làm ghi chú dưới slide |
| **Thời gian** | Ngân sách thời gian cho slide đó |

**Tổng thời gian: 13 phút 30 giây** — để dưới mức 15 phút có 1 phú 30 giây dự phòng cho
hỏi đáp. Nếu bị hỏi cấm trước, cần nói nhanh hơn mục tiêu — xem cuối file.

| Quy tắc khi dựng slide |
|-----------------------|
| Cỡ chữ **không nhỏ hơn 20pt** — giảng viên ngồi cuối phòng phải đọc được |
| **Mỗi slide không quá 6 dòng chữ**; nội dung dài thì để dưới dạng gạch đầu dòng |
| **Không đọc nguyên văn** slide. Slide là điểm tựa, lời nói ở miệng mới là nội dung |
| Hình phải **rõ, không nhỏ**. Muốn chỉ chi tiết thì zoom vào đúng vùng cần nói |
| Chỉ chuyển slide khi đã nói xong ý chính của slide đó |

---

## Slide 1 — Bìa đề đồ án *(0:00 – 0:30)*

**Trên slide**
```
HỆ THỐNG ĐẶT PHÒNG & QUẢN LÝ HOMESTAY
HomeStay

Học viên: Nguyễn Hải Nam — 12523W.1
Giảng viên hướng dẫn: ____________
Niên khóa: 2024 – 2029
```

**Nói:** "Em xin phép báo cáo đồ án 4 — Hệ thống đặt phòng và quản lý homestay HomeStay.
Hệ thống cho phép khách đặt phòng theo giờ hoặc theo ngày, và cho quản trị viên quản lý
toàn bộ vòng đời đặt phòng."

---

## Slide 2 — Lý do chọn đề tài *(0:30 – 1:15)*

**Trên slide**
```
VÌ SAO CHỌN ĐỀ TÀI NÀY?
• Homestay là mô hình lưu trú đang mở rộng tại Việt Nam
• Đặt phòng trực tuyến là nhu cầu thiết yếu của khách
• Nghiệp vụ đặt phòng có thật, không hư cấu
  → dễ kiểm chứng, dễ giải thích trước GVHD
```

**Nói:** "Homestay đang mở rộng nhanh ở Việt Nam và khách đã quen đặt phòng trực tuyến.
Em chọn đề tài này vì nghiệp vụ đặt phòng là nghiệp vụ có thật — có khung giờ, có giá theo
giờ và theo ngày, có trạng thái phòng — nên khi em nói một quy tắc nghiệp vụ thì ai cũng
kiểm chứng được ngay, không phải nói chung chung."

---

## Slide 3 — Mục tiêu & phạm vi *(1:15 – 2:00)*

**Trên slide**
```
MỤC TIÊU
Xây dựng hệ thống đặt phòng & quản lý homestay chạy được trên nền Web

PHẠM VI
✓ Trong phạm vi:   2 tác nhân (Khách hàng, Quản trị viên) — 17 nhóm chức năng
✗ Ngoài phạm vi:   thanh toán trực tuyến, ứng dụng di động, triển khai máy chủ thật

DỮ LIỆU
Toàn bộ dữ liệu dùng trong đồ án là dữ liệu giả phục vụ thực hành
```

**Nói:** "Mục tiêu là xây dựng hệ thống đặt phòng chạy được trên nền Web. Phạm vi em chốt
là 2 tác nhân: khách hàng và quản trị viên, tổng cộng 17 nhóm chức năng. Ngoài phạm vi là
thanh toán trực tuyến và ứng dụng di động — em ghi rõ ra đây để báo cáo không bao giờ nói
quá. Toàn bộ dữ liệu trong hệ thống là dữ liệu giả."

---

## Slide 4 — Công nghệ sử dụng *(2:00 – 2:45)*

**Trên slide**
```
GIAO DIỆN                     MÁY CHỦ & CƠ SỞ DỮ LIỆU
React 18 · TypeScript        ASP.NET Core Web API 8
Vite · TailwindCSS           Entity Framework Core 8 + Pomelo
TanStack Query · Zustand     MySQL 8.0 (Docker)
React Hook Form + Zod        JWT access token + refresh token

XÁC THỰC KIỂM THỬ
xUnit (414 test) · Vitest (287 test) · Postman (41 request)
```

**Nói:** "Phía giao diện em dùng React 18 với TypeScript, dựng bằng Vite, định dạng bằng
TailwindCSS. Vì sao tách TanStack Query và Zustand: TanStack Query giữ dữ liệu do máy chủ
trả về, còn Zustand giữ trạng thái phiên như token đăng nhập. Phía máy chủ dùng ASP.NET
Core Web API 8 với Entity Framework Core, cơ sở dữ liệu MySQL 8 chạy trong Docker. Xác thực
dùng JWT với hai loại token."

---

## Slide 5 — Phân tích nghiệp vụ: chống đặt trùng *(2:45 – 4:15)*

**Trên slide**
```
BÀI TOÁN KHÓ NHẤT: CHỐNG ĐẶT TRÙNG

Khoảng [c₁, t₁] chồng lấn [c₂, t₂] khi:
            c₁ < t₂   VÀ   t₁ > c₂

Dùng < và > chứ không dùng ≤ và ≥:
khách trả phòng 12:00 thì khách mới được nhận phòng 12:00
→ hai khoảng chạm biên KHÔNG tính là trùng

CHẶN Ở 3 TẦNG ĐỘC LẬP, CÙNG MỘT CÔNG THỨC
① Giao diện    — báo ngay trước khi khách điền form
② Nghiệp vụ    — kiểm tra trong transaction
③ Cơ sở dữ liệu — khoá tường EXISTS + khoá dòng InnoDB
```

**Nói:** "Đây là bài toán khó nhất của hệ thống đặt phòng. Hai đơn của cùng một phòng
chồng lấn nhau khi khoảng nhận–trả của đơn này bắt đầu trước khi kết thúc của đơn kia.
Em dùng phép so sánh nhỏ hơn–lớn hơn chứ không dùng nhỏ hơn hoặc bằng, vì khách trả phòng
lúc 12 giờ thì khách mới được nhận phòng lúc 12 giờ — hai khoảng chạm biên không phải là
trùng. Điểm quan trọng là em chặn ở ba tầng độc lập, cùng dùng một công thức: giao diện báo
ngay để khách biết, tầng nghiệp vụ kiểm tra trong transaction, và tầng cơ sở dữ liệu dùng
khoá tường EXISTS với cơ chế khoá dòng của InnoDB. Vì ba tầng cùng công thức nên không
thể vòng qua bằng cách gọi thẳng API."

---

## Slide 6 — Tác nhân & Use case tổng quát *(4:15 – 5:00)*

**Trên slide** (chèn hình `docs/anh/3-01-use-case-tong-quat.png` và `docs/anh/3-02-use-case-quan-ly-tai-khoan.png`)

```
HỆ THỐNG CÓ 2 TÁC NHÂN
Khách hàng (CUSTOMER) — 7 nhóm chức năng
Quản trị viên (ADMIN)  — 6 nhóm chức năng + 4 nhóm kiểm thử & triển khai
```

**Nói:** "Hệ thống có 2 tác nhân. Khách hàng dùng 7 nhóm chức năng, từ đăng ký, tìm phòng
cho đến đặt phòng và đánh giá. Quản trị viên dùng 6 nhóm chức năng, từ quản lý danh mục,
điều hướng vòng đời đơn cho đến thống kê và duyệt đánh giá."

*Hình: Hình 3.1 và Hình 3.2 trong báo cáo*

---

## Slide 7 — Kiến trúc hệ thống *(5:00 – 5:45)*

**Trên slide** (chèn hình `docs/anh/3-09-bieu-do-lop-thuc-thi.png` — kiến trúc phân tầng)

```
HTTP Request → CONTROLLER → SERVICE → Entity Framework → MySQL
                 ↑            ↑            ↑
           tiếp nhận,     nghiệp vụ,    truy vấn dữ liệu
           trả response   quy tắc       (async)

Nguyên tắc: không viết truy vấn CSDL trong Controller
            không viết logic nghiệp vụ trong Controller
            không trả entity thô ra ngoài — luôn trả DTO
```

**Nói:** "Hệ thống chia 3 tầng. Tầng Controller chỉ tiếp nhận và trả phản hồi. Tầng Service
chứa toàn bộ nghiệp vụ — đây cũng là tầng có thể kiểm thử bằng unit test, vì không phụ thuộc
giao diện. Tầng dưới cùng truy vấn cơ sở dữ liệu. Ba quy tắc em đặt ra và giữ xuyên suốt:
không viết truy vấn trong Controller, không viết nghiệp vụ trong Controller, và không bao
giờ trả entity thô ra ngoài — luôn trả qua DTO để không lộ cấu trúc bảng."

---

## Slide 8 — ERD *(5:45 – 6:30)*

**Trên slide** (chèn hình `docs/anh/3-10-so-do-erd.png`)

```
11 BẢNG · 13 KHÓA NGOẠI
Users ──< Bookings >── Rooms >── RoomImages
              │         │
              │         └──< RoomAmenities >── Amenities
              ├──< BookingStatusHistory
              ├──< Reviews
              └──< Payments
Users ──< Notifications
```

**Nói:** "Cơ sở dữ liệu có 11 bảng. Điểm em muốn nhấn mạnh là bảng `BookingStatusHistory` —
hệ thống không sửa thẳng trạng thái đơn mà ghi lại từng lần chuyển, kèm người thực hiện
và thời điểm. Nhờ đó khi có khiếu nại vẫn trả lời được ai đã làm gì. Ngoài ra đơn đặt phòng
lưu snapshot giá tại thời điểm đặt, nên khi chủ homestay đổi giá thì lịch sử đơn cũ không bị
thay đổi theo."

---

## Slide 9 — Biểu đồ tuần tự: đặt phòng *(6:30 – 7:30)*

**Trên slide** (chèn hình `docs/anh/3-13-sequence-dat-phong.png`)

```
1. Khách chọn khung giờ trên trang chi tiết phòng
2. Hệ thống GỌI KIỂM TRA PHÒNG TRỐNG → báo ngay còn trống / đã có người đặt
3. Khách điền số khách, ghi chú, xác nhận
4. MỞ TRANSACTION:
     4a. Chặn đặt trùng lịch (lần thứ 2 trong nghiệp vụ)
     4b. Chụp snapshot giá phòng
     4c. Tạo đơn, sinh mã HS-YYMMDD-XXXX
     4d. Đổi trạng thái phòng → BOOKED
     4e. Ghi lịch sử "Tạo đơn"
5. CÓ MỘT BƯỚC LỖI → HOÀN TÁC TOÀN BỘ, không để lại đơn mồ côi
```

**Nói:** "Đây là luồng đặt phòng. Bước em muốn nhấn mạnh là bước 2 — kiểm tra phòng trống
chạy trước khi khách điền form, nên khách biết ngay phòng còn trống hay không. Từ bước 4
trở đi nằm trong một transaction: chặn đặt trùng lần thứ hai, chụp snapshot giá, tạo đơn,
đổi trạng thái phòng, ghi lịch sử. Nếu một bước lỗi thì rollback toàn bộ, không để lại
đơn mồ côi."

---

## Slide 10 — Giao diện khách: tìm kiếm phòng *(7:30 – 8:15)*

**Trên slide** (chèn hình `docs/anh/4-03-tim-kiem-phong.jpg`)

```
LỌC THEO 6 TIÊU CHÍ
Từ khoá · Cơ sở · Loại phòng (Cozy / Japandi / Signature / Concept)
Khoảng giá theo ngày · Số khách tối đa · Cách sắp xếp

MỌI DANH SÁCH ĐỀU XỬ LÝ 3 TRẠNG THÁI
Đang tải (khung xương) — Lỗi (kèm nút thử lại) — Không có dữ liệu (kèm gợi ý)
```

**Nói:** "Trang tìm phòng lọc theo 6 tiêu chí. Điểm em muốn nhấn mạnh là mọi danh sách trong
hệ thống đều xử lý đủ ba trạng thái: đang tải có khung xương để người dùng biết đang chờ,
lỗi có thông báo kèm nút thử lại, và không có dữ liệu thì đưa ra gợi ý thao tác tiếp theo
chứ không để trang trắng."

---

## Slide 11 — Giao diện khách: đặt phòng *(8:15 – 9:00)*

**Trên slide** (chèn 2 hình: `4-06-dat-phong-theo-gio.jpg` và `4-05-kiem-tra-phong-trong.jpg`)

```
ĐẶT THEO GIỜ                    ĐẶT TRÙNG → HỆ THỐNG CHẶN
4 giờ × 130.000 ₫ = 520.000 ₫    "Phòng đã có người đặt trong khoảng thời gian này"
                                + KHOÁ nút xác nhận

CÔNG THỨC TÍNH TIỀN — LÀM TRÒN LÊN
Theo giờ: số giờ ↑ × giá 1 giờ    Theo ngày: số ngày ↑ × giá 1 ngày
```

**Nói:** "Đây là màn hình xác nhận đặt phòng, có hai cách thuê. Công thức tính tiền làm
tròn lên nhỏ nhất vì thuê thêm 1 phút không có nghĩa với đơn vị sản phẩm là giờ. Hình bên
phải là khi phòng đã có người đặt — hệ thống báo rõ và khoá luôn nút xác nhận, khách không
thể vô tình đặt trùng."

---

## Slide 12 — Giao diện Admin: thống kê *(9:00 – 9:45)*

**Trên slide** (chèn hình `docs/anh/4-10-dashboard-thong-ke.jpg`)

```
4 CHỈ SỐ + 4 BIỂU ĐỒ
Doanh thu tháng này · Số đơn trong tháng · Tỷ lệ lấp đầy · Số phòng đang có khách
Doanh thu theo tháng · Số đơn theo tháng · Trạng thái phòng · Top 5 phòng doanh thu

CHỈ TÍNH ĐƠN THẬT
COMPLETED + CHECKED_IN  —  không tính đơn chờ xác nhận hoặc bị từ chối
```

**Nói:** "Trang thống kê gồm 4 chỉ số và 4 biểu đồ. Biểu đồ được vẽ từ dữ liệu thật nên
không bao giờ lệch với bảng số liệu. Một chi tiết em muốn nhấn mạnh: doanh thu chỉ tính
đơn đã hoàn thành và đang ở — đơn chờ xác nhận hoặc bị từ chối không phải doanh thu thật
được, tính vào sẽ thổi phóng con số."

---

## Slide 13 — Giao diện Admin: quản lý đơn *(9:45 – 10:30)*

**Trên slide** (chèn hình `docs/anh/4-15-chuyen-trang-thai-don.jpg`)

```
MỖI HÀNG CHỈ HIỆN THAO TÁC ĐÚNG TRẠNG THÁI HIỆN TẠI

Chờ xác nhận  →  Xác nhận  |  Từ chối (bắt buộc nhập lý do)
Đã xác nhận   →  Nhận phòng           →  đổi phòng sang OCCUPIED
Đang ở       →  Trả phòng             →  đổi phòng sang CLEANING
                                        → sau 2 giờ tự về AVAILABLE
Hoàn thành / Đã hủy / Bị từ chối  →  trạng thái kết thúc, không chuyển tiếp được

Thao tác lặp lại cùng trạng thái → 409, không phải 200
```

**Nói:** "Đây là màn hình vận hành chính của quản trị viên. Em thiết kế để mỗi hàng chỉ hiện
đúng những nút hợp lệ với trạng thái hiện tại của đơn, nên không thể bấm nhầm. Khi trả phòng,
phòng chuyển sang trạng thái đang dọn dẹp, sau 2 giờ một tác vụ nền tự đưa về sẵn sàng mà
không cần thao tác tay. Còn khi thao tác lặp lại cùng một trạng thái, hệ thống trả 409 chứ
không phải 200 — tránh việc ghi trùng lịch sử."

---

## Slide 14 — Lỗi thật đã phát hiện & sửa *(10:30 – 11:45)*

**Trên slide**
```
TRONG QUÁ TRÌNH KIỂM THỬ, EM ĐÃ SỬA 3 LỖI THẬT

① Đặt trùng trả 500 thay vì 409 khi 2 khách đặt cùng lúc
   Hai transaction tranh nhau khoá cùng một dòng (MySQL mã 1213).
   Đọc sai mã lỗi: ErrorCode trả về HResult, không phải mã lỗi.
   → Dò cả chuỗi exception, đọc MySqlException.Number

② Trang /swagger không hiển thị
   Thư viện phát tài liệu openapi 3.0.4, còn Swagger UI chỉ hỗ trợ 3.0.x

③ GỬI SAI MỐC GIỜ → HỎNG CẢ CƠ CHẾ CHỐNG ĐẶT TRÙNG
   Giao diện gửi giờ UTC, hệ thống hiểu là giờ địa phương → lệch 7 giờ
   Khách chọn 15:00–19:00 vào phòng ĐÃ CÓ ĐƠN 15:00–19:00 → vẫn tạo đơn
   MÀ MÀN HÌNH HIỂN THỊ "15:00 → 19:00" HOÀN TOÀN ĐÚNG
```

**Nói:** "Em muốn dành thời gian nói về ba lỗi thật này vì em nghĩ đó là phần em học được
nhiều nhất. Lỗi một và hai đã được sửa và có test chặn lại. Lỗi thứ ba đáng nói hơn:
giao diện gửi mốc giờ theo chuẩn UTC, còn hệ thống quy ước mọi mốc giờ là giờ địa phương —
lệch 7 giờ. Hậu quả là khách chọn khung 15 giờ đến 19 giờ vào một phòng đã có đơn đúng khung
giờ đó, hệ thống vẫn tạo đơn — trong khi màn hình hiển thị 15 giờ đến 19 giờ hoàn toàn
đúng. Lỗi này lọt qua 649 test tự động và 12 lần chạy bộ test tích hợp, vì trong test em
cũng gửi chuỗi thời gian không ký chữ Z — đúng kiểu mà máy chủ mong đợi. Nó chỉ lộ ra khi
người dùng thật bấm chuột. Bài học em rút ra là test phải mô phỏng cách người dùng thật
thao tác, không chỉ cách mình tiện viết."

---

## Slide 15 — Bảng kết quả kiểm thử *(11:45 – 12:30)*

**Trên slide**
```
MỨC KIỂM THỬ                      KẾT QUẢ
Kiểm thử đơn vị backend (xUnit)     414 test — 414 đạt
Kiểm thử đơn vị frontend (Vitest)   287 test — 287 đạt
Tích hợp REST API (Postman)         41 request / 115 kiểm chứng — 41 đạt
Kiểm thử tay trên trình duyệt       267 kịch bản — 267 đạt

3 TEST CHỐNG ĐẶT TRÙNG
T1 cùng khách đặt lại khung giờ            → 409
T2 khách thứ hai đặt khung giờ đang có      → 409
T3 hai request gửi SONG SONG cùng phòng      → [201, 409]

dotnet build · npm run build  →  0 lỗi, 0 cảnh báo
```

**Nói:** "Kết quả kiểm thử: 414 test đơn vị backend, 287 test frontend, 41 request tích hợp
với 115 kiểm chứng, và 267 kịch bản kiểm thử tay — tất cả đều đạt, không có kịch bản nào
bị bỏ qua. Riêng ba test chống đặt trùng thì em chạy được tới 12 lần liên tiếp mà vẫn đạt,
trong đó test T3 gửi hai request thật song song và kết quả luôn đúng là một đơn tạo được
một đơn bị chặn. Cả hai lệnh build đều không có lỗi và không có cảnh báo."

---

## Slide 16 — Kết luận & hướng phát triển *(12:30 – 13:30)*

**Trên slide**
```
ĐÃ HOÀN THÀNH
17 nhóm chức năng · 11 bảng CSDL · 47 API · 22 màn hình · 16 sơ đồ UML
701 test tự động + 267 kịch bản tay — đạt 100%

HẠN CHẾ (ghi rõ trong báo cáo)
✗ Chưa tích hợp thanh toán trực tuyến     ✗ Chưa có thông báo tự động
✗ Mới chạy trên máy local                  ✗ Chưa có ứng dụng di động

HƯỚNG PHÁT TRIỂN
Tích hợp VNPay/MoMo · Thông báo email/SMS · Triển khai máy chủ thật
Ứng dụng React Native dùng chung API · Ứng dụng AI gợi ý phòng phù hợp
```

**Nói:** "Tóm lại, em đã hoàn thành 17 nhóm chức năng trên 9 bảng cơ sở dữ liệu, với 649 test
tự động và 267 kịch bản kiểm thử tay, tất cả đều đạt. Hạn chế em ghi rõ trong báo cáo là
chưa tích hợp thanh toán trực tuyến, chưa có thông báo tự động, mới chạy trên máy local và
chưa có ứng dụng di động. Hướng phát triển tiếp theo là tích hợp cổng thanh toán, làm thông
báo tự động và triển khai trên máy chủ thật. Em xin cảm ơn thầy."

---

## PHỤ LỤC — Dự phòng khi bị hỏi

### Nếu còn nhiều thời gian, nói thêm 2 ý này

**Ý dự phòng 1 — Vì sao làm tròn lên khi tính tiền?**
"Vì đơn vị sản phẩm là giờ và ngày. Khách đặt 4 giờ 1 phút vẫn chiếm trọn 5 giờ của
phòng. Nếu làm tròn xuống thì hệ thống phải xử lý phần phút lẻ đó, và phần phút đó khách
không hưởng được gì."

**Ý dự phòng 2 — Vì sao không dùng chỉ 1 tầng kiểm tra trùng lịch?**
"Vì có những cách gọi mà một tầng không chặn được. Cụ thể ở đây là hai khách bấm đặt phòng
cùng một lúc — hai request đến gần như đồng thời, cả hai đều hợp lệ ở thời điểm mỗi người
đọc dữ liệu. Chỉ tầng cơ sở dữ liệu mới chặn được trường hợp này, vì nó giữ khoá dòng tới
hết transaction. Còn tầng giao diện thì để khách biết sớm, đỡ phải điền hết form mới biết
không đặt được."

### Nếu bị hỏi "thử demo lại không?"

Mở theo thứ tự, dự kiến mất 90 giây:

| Bước | Thao tác | Nói 1 câu |
|------|----------|-----------|
| 1 | Mở `localhost:5174` | "Đây là trang chủ với lưới phòng lấy trực tiếp từ CSDL" |
| 2 | Bấm "Tìm phòng", lọc Cơ sở 1 Linh Đàm + số khách 3 | "Lọc 6 tiêu chí, kết quả cập nhật theo từng bộ lọc" |
| 3 | Bấm vào 1 phòng, chọn khung giờ | "Trang chi tiết có sẵn khung chọn giờ và tạm tính tiền" |
| 4 | Chọn khung giờ **trùng** với đơn đang có | "Hệ thống báo đã có người đặt và khoá nút xác nhận" |
| 5 | Đăng nhập `admin@homestay.vn` / `123456`, mở Đơn đặt phòng | "Quản trị viên thấy đúng những thao tác hợp lệ với từng trạng thái" |

**Chuẩn bị trước khi demo:** tắt thông báo trình duyệt, mở sẵn 2 tab (1 tab khách, 1 tab
Admin đã đăng nhập), đảm bảo `docker compose` và 2 tiến trình máy chủ đang chạy.

### Nếu bị hỏi về phạm vi chưa làm

"Phần em chưa làm là thanh toán trực tuyến và thông báo tự động. Em xếp chúng sau cùng có
chủ đích: đó là hai phần cần thêm bảng dữ liệu và hạ tầng bên ngoài, trong khi phần cốt lõi
là đặt phòng và vận hành đơn thì phải làm chắc trước. Em đã ghi rõ hai phần này ở mục hạn
chế và hướng phát triển trong báo cáo, không ghi là đã có."
