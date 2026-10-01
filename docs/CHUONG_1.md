# CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI

## 1.1. Lý do chọn đề tài

Trong những năm gần đây, nhu cầu tìm kiếm và đặt lưu trú trực tuyến ngày càng phổ biến. Khách
không còn phải gọi điện cho từng homestay để hỏi còn phòng hay không, cũng không phải chờ
đến lúc có mạng Wi-Fi mới tra cứa được.

Tuy nhiên, bên cạnh các nền tảng lớn như Booking.com hay Agoda, phần lớn homestay vừa và
nhỏ ở Việt Nam vẫn quản lý bằng sổ tay, tin nhắn Facebook hoặn bảng tính. Cách làm đó có
ba hệ quả trực tiếp:

- **Khách đặt trùng.** Không có dữ liệu tập trung nên không ai biết phòng nào đã có người
  đặt trong khung giờ nào. Hai khách cùng đặt một phòng vào chiều tối là chuyện thường xảy ra.
- **Chủ homestay mất đơn.** Phòng trống không ai thấy, nên chủ cơ sở không biết mình đang
  lãng phí bao nhiêu phòng.
- **Không lưu vết.** Không biết ai xác nhận đơn, lúc nào phòng được dọn, ai là người xử lý
  khiếu nại.

Từ thực tế đó, đề tài **"Xây dựng hệ thống đặt phòng và quản lý homestay"** được thực hiện
nhằm xây dựng một ứng dụng web giúp khách tìm kiếm và đặt phòng trực tuyến, đồng thời giúp
chủ cơ sở quản lý phòng, đơn đặt và doanh thu trên một hệ thống duy nhất.

Hệ thống gồm hai phân hệ người dùng dùng chung một cơ sở dữ liệu và một bộ API:

- **Phân hệ khách hàng** — công khai, không cần đăng nhập để xem; đăng nhập mới đặt phòng
  và viết đánh giá.
- **Phân hệ quản trị** — dành cho quản trị viên, mọi API đều kiểm tra quyền.

## 1.2. Mục tiêu của đề tài

### 1.2.1. Mục tiêu tổng quát

Xây dựng ứng dụng web **HomeStay** phục vụ việc tìm kiếm, xem thông tin và đặt phòng homestay
trực tuyến, đồng thời hỗ trợ quản trị viên quản lý vòng đời đơn đặt phòng và thống kê doanh
thu trên cơ sở dữ liệu tập trung.

Hệ thống tập trung giải quyết ba bài toán cốt lõi:

1. **Quản lý phòng theo thời gian** — mỗi phòng có một vòng đời trạng thái rõ ràng, và khoảng
   thời gian đã có người đặt thì không ai đặt được.
2. **Chống đặt trùng** — cơ chế phát hiện chồng lấn khoảng thời gian chạy ở tầng nghiệp vụ
   và ở tầng cơ sở dữ liệu.
3. **Lưu vết thao tác** — mọi lần chuyển trạng thái đơn đều ghi lại ai làm và lúc nào.

### 1.2.2. Mục tiêu cụ thể

1. **Khảo sát và phân tích nghiệp vụ**

- Phân tích quy trình tìm kiếm, kiểm tra phòng trống và đặt phòng.
- Xác định hai vai trò sử dụng hệ thống là **Khách hàng (CUSTOMER)** và **Quản trị viên (ADMIN)**.
- Phân tích nghiệp vụ quản lý nhiều cơ sở homestay, mỗi cơ sở có nhiều phòng.
- Xác định các quy tắc về thời gian đặt phòng, nhận phòng, trả phòng và dọn phòng.

2. **Phát triển backend**

- Cấu hình dự án ASP.NET Core Web API 8.0, tổ chức theo kiến trúc phân tầng.
- Xây dựng cơ chế xác thực bằng JWT với hai loại token, phân quyền theo vai trò.
- Xây dựng 47 API cho tài khoản, cơ sở, phòng, đặt phòng, đánh giá, thanh toán và thông báo.
- Xây dựng nghiệp vụ kiểm tra phòng trống, tính tiền và quản lý trạng thái.

3. **Phát triển frontend**

- Xây dựng giao diện web bằng React 18, TypeScript và Vite.
- Thiết kế giao diện đáp ứng (responsive) cho máy tính, máy tính bảng và điện thoại.
- Xây dựng 21 màn hình gồm 14 màn hình khách hàng và 7 màn hình quản trị.
- Xử lý ba trạng thái bắt buộc ở mọi danh sách: đang tải, lỗi và không có dữ liệu.

4. **Xây dựng nghiệp vụ cốt lõi**

- Đăng ký, đăng nhập và quản lý tài khoản.
- Tìm kiếm phòng theo cơ sở, khoảng thời gian và số khách.
- Xem thông tin chi tiết, hình ảnh và tiện nghi của phòng.
- Đặt phòng theo giờ hoặc theo ngày.
- Quy định thời gian đặt trước tối thiểu 2 giờ.
- Quy định thời gian đặt theo giờ tối thiểu 3 giờ.
- Tính tổng tiền dựa trên loại đặt phòng và đơn giá tại thời điểm đặt.
- Kiểm tra và ngăn chặn các khoảng thời gian đặt phòng bị trùng.
- Quản lý trạng thái phòng và trạng thái đơn đặt phòng.
- Áp dụng thời gian dọn phòng 2 giờ sau khi khách trả phòng.
- Cho phép khách đánh giá phòng sau khi hoàn thành lưu trú.
- Ghi nhận phương thức thanh toán và đối chiếu số tiền.
- Tự sinh thông báo cho khách khi trạng thái đơn thay đổi.

5. **Kiểm thử và đánh giá**

- Viết 414 unit test cho backend và 287 unit test cho frontend.
- Kiểm thử 41 request tích hợp bằng Postman, chạy liên tiếp 12 lần đều đạt.
- Kiểm thử tay trên trình duyệt với 267 kịch bản gồm cả trường hợp bình thường, biên và bất
  thường.
- Kiểm thử riêng các tình huống khó: hai khách cùng đặt một phòng cùng khung giờ.

## 1.3. Giới hạn và phạm vi của đề tài

### 1.3.1. Đối tượng nghiên cứu

Đối tượng nghiên cứu của đề tài là quy trình phân tích, thiết kế và phát triển ứng dụng web
phục vụ đặt phòng homestay, gồm hai phần:

**Phạm vi phần mềm**

- Quản lý tài khoản, xác thực và phân quyền.
- Quản lý cơ sở homestay, phòng, hình ảnh và tiện nghi.
- Quản lý vòng đời đơn đặt phòng.
- Quản lý thanh toán và thông báo.
- Thống kê doanh thu và tỷ lệ lấp đầy phòng.

**Phạm vi vai trò người dùng**

- **Khách hàng (CUSTOMER):** đăng ký, đăng nhập, tìm kiếm phòng, xem chi tiết phòng, đặt
  phòng, quản lý đơn của mình, hủy đơn, chọn phương thức thanh toán, xem thông báo, đánh giá
  sau khi hoàn thành lưu trú.
- **Quản trị viên (ADMIN):** quản lý cơ sở, phòng, tiện nghi, khách hàng, đơn đặt phòng,
  đánh giá, thanh toán và xem thống kê.

Hệ thống chỉ có hai tác nhân. Mọi thao tác vận hành trong đời thực như nhận phòng, trả phòng
hay cập nhật trạng thái phòng đều thuộc quản trị viên, nên không cần tách thêm vai trò nhân
viên — tách ra chỉ làm phân quyền phức tạp mà không thêm giá trị nghiệp vụ.

### 1.3.2. Phạm vi nghiên cứu

**Về phạm vi chức năng**

Hệ thống tập trung triển khai các chức năng:

1. Quản lý tài khoản.
2. Quản lý nhiều cơ sở homestay.
3. Quản lý phòng và thông tin phòng.
4. Quản lý hình ảnh và tiện nghi.
5. Tìm kiếm và lọc phòng.
6. Kiểm tra phòng trống theo khoảng thời gian.
7. Đặt phòng theo giờ hoặc theo ngày.
8. Quản lý lịch sử đặt phòng.
9. Quản lý trạng thái phòng.
10. Nhận phòng và trả phòng.
11. Quản lý thời gian dọn phòng.
12. Đánh giá và nhận xét.
13. Quản lý người dùng.
14. Ghi nhận và đối soát thanh toán.
15. Thông báo tự động trong hệ thống.
16. Thống kê số lượng đơn đặt phòng và doanh thu.

**Về phạm vi không gia nhập**

Năm mục sau nằm ngoài phạm vi đồ án:

1. Kết nối cổng thanh toán trực tuyến thực tế như VNPay hoặc MoMo.
2. Thanh toán đa tiền tệ.
3. Quản lý tài chính, kế toán chuyên sâu.
4. Gửi thông báo qua email hoặc tin nhắn SMS.
5. Ứng dụng di động.

**Về phạm vi không gian**

- Hệ thống được xây dựng dưới dạng ứng dụng web.
- Trong quá trình phát triển và kiểm thử, hệ thống được triển khai trên môi trường localhost.
- Dữ liệu sử dụng trong quá trình nghiệm thu là dữ liệu giả lập phục vụ mục đích học tập.
- Việc triển khai lên máy chủ thật là hướng phát triển sau của đề tài.

**Về phạm vi thời gian**

Toàn bộ quá trình khảo sát, phân tích, thiết kế, lập trình và kiểm thử được thực hiện trong
thời gian làm đồ án, với mốc bảo vệ dự kiến giữa tháng 10 năm 2026.

## 1.4. Nội dung thực hiện

1. **Phân tích và thiết kế hệ thống**

- Phân tích yêu cầu chức năng và yêu cầu phi chức năng.
- Xác định vai trò sử dụng hệ thống.
- Xây dựng 8 biểu đồ use case.
- Xây dựng biểu đồ lớp thực thi và sơ đồ ERD.
- Xây dựng 6 biểu đồ tuần tự cho các nghiệp vụ chính.

2. **Xây dựng cơ sở dữ liệu**

- Thiết kế 11 bảng với 13 khoá ngoại và các ràng buộc cần thiết.
- Thiết kế cơ chế chống đặt trùng ở hai tầng: kiểm tra chồng lấn khoảng thời gian và khóa
  cô lập mức đọc-ghi trong giao dịch.
- Tạo dữ liệu mẫu phục vụ kiểm thử và trình diễn.

3. **Xây dựng backend**

- Cấu hình dự án ASP.NET Core Web API 8.0.
- Tổ chức theo kiến trúc phân tầng: Controller, Service, Entity Framework, MySQL.
- Xây dựng xác thực và phân quyền bằng JWT với access token và refresh token.
- Xây dựng 47 API chia làm 13 controller.
- Xây dựng nghiệp vụ kiểm tra phòng trống, tính tiền và thay đổi trạng thái.

4. **Xây dựng frontend**

- Xây dựng giao diện bằng React, TypeScript và Vite.
- Xây dựng giao diện phân hệ khách hàng và phân hệ quản trị.
- Kết nối frontend với RESTful API bằng Axios và TanStack Query.
- Xử lý ba trạng thái bắt buộc ở mọi danh sách.

5. **Kiểm thử hệ thống**

- Viết unit test cho từng hàm nghiệp vụ.
- Kiểm thử tích hợp bằng bộ test Postman.
- Kiểm thử nghiệp vụ đặt phòng, đặt trùng và chuyển trạng thái.
- Kiểm thử phân quyền giữa hai vai trò.

6. **Hoàn thiện tài liệu**

- Hoàn thiện báo cáo đồ án.
- Xây dựng bộ slide thuyết trình và danh sách câu hỏi dự kiến hỏi.
- Tổng hợp kết quả kiểm thử và nhận xét hạn chế của hệ thống.

## 1.5. Phương pháp tiếp cận

Đề tài sử dụng **phương pháp phát triển lặp (iterative)** với quy trình gồm 5 bước, mỗi bước
đều kết thúc bằng kiểm thử trước khi chuyển sang bước kế tiếp.

1. **Phân tích nghiệp vụ:** xác định yêu cầu của khách hàng và quản trị viên; phân tích
   quy trình đặt phòng, quy trình vận hành của quản trị viên; mô hình hoá bằng biểu đồ use
   case và biểu đồ lớp.
2. **Thiết kế cơ sở dữ liệu:** xây dựng mô hình dữ liệu quan hệ đảm bảo tính toàn vẹn dữ
   liệu, có khoá chính, khoá ngoại, chỉ mục và ràng buộc chống trùng.
3. **Phát triển lặp:** xây dựng và kiểm thử từng nhóm chức năng một, hoàn thành nhóm trước
   khi tích hợp nhóm tiếp theo. Nhờ vậy lỗi được phát hiện sớm và ảnh hưởng phạm vi nhỏ.
4. **Kiểm thử thực nghiệm:** viết unit test cho từng quy tắc nghiệp vụ trước khi viết giao
   diện, vì quy tắc nghiệp vụ sai thì giao diện đẹp cũng không có ý nghĩa.
5. **Đóng gói và bàn giao:** đóng gói ứng dụng, hướng dẫn cài đặt, tổng hợp kết quả kiểm
   thử và đề xuất hướng phát triển tiếp.

Với mỗi nhóm chức năng, đề tài thực hiện đủ 6 bước: viết mã nguồn, build sạch không lỗi
không cảnh báo, chạy thử tay bằng 3 kịch bản khác nhau, viết unit test, ghi tiến độ vào báo
cáo tiến độ, rồi commit mã nguồn. Nguyên tắc này giúp đảm bảo mỗi chức năng đều có bằng
chứng chạy được trước khi chuyển sang chức năng kế tiếp.