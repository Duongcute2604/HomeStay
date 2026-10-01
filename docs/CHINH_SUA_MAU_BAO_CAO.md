# DANH SÁCH CHỈNH SỬA MẪU BÁO CÁO `.docx`

Đồ án 4 — Hệ thống đặt phòng & quản lý homestay HomeStay · Nguyễn Hải Nam — 12523W.1

---

## Đã sửa tự động

| Nội dung | Kết quả |
|----------|---------|
| **"StayEasy" → "HomeStay"** | Đã sửa **8 chỗ** trong `word/document.xml`. Cả 8 đều là tên hệ thống đứng riêng; "StayEasy" và "HomeStay" cùng 8 ký tự nên không ảnh hưởng cấu trúc tài liệu. Kiểm chứng: 25 phần tử trong file zip giữ nguyên, 3 ảnh nhúng SHA256 không đổi, XML parse hợp lệ. |

Mẫu nằm ở `10123234_NguyenHaiNam_Do_An_4_Tuan4.docx` (thư mục gốc dự án).
**Mở bằng Microsoft Word 2016 trở lên là dùng được ngay.** Nếu Word có cảnh báo gì thì báo em.

---

## Cần sửa tay trong Word — 15 chỗ

### Vì sao phải sửa

Hệ thống HomeStay chỉ có **2 tác nhân**: `CUSTOMER` (khách hàng) và `ADMIN` (quản trị viên).
Mẫu báo cáo viết **3 vai trò** (có thêm *nhân viên*). Nếu giữ nguyên, giảng viên đọc tới ô
phân quyền sẽ hỏi *"nhân viên ở đâu trong hệ thống của em?"* — và đó là câu hỏi mất điểm.

> Đã chốt từ đầu đồ án: mọi chức năng vận hành (check-in, check-out, đổi trạng thái phòng)
> thuộc **Admin**. Không tạo vai trò nhân viên.

### Cách tìm nhanh trong Word

Bấm `Ctrl + H` (Tìm và Thay thế), bật chế độ *Chỉ tìm trong: Chính*, và thay lần lượt các cụm
ở bảng dưới. **Làm theo thứ tự từ trên xuống** — vì một số dòng có hai cụm liên tiếp, thay
sai thứ tự sẽ không khớp.

### Bảng thay thế

| # | Cụm cũ trong mẫu | Thay bằng | Ở đâu |
|---|-----------------|-----------|-------|
| 1 | `nhân viên và quản trị viên quản lý phòng` | `quản trị viên quản lý phòng` | 1.4 Nội dung thực hiện |
| 2 | `quản lý giúp nhân viên và quản trị viên quản lý địa điểm` | `quản trị viên quản lý địa điểm` | 1.4 Nội dung thực hiện |
| 3 | `Employee quản lý đơn đặt phòng và cập nhật trạng thái phòng trong phạm vi tác quyền.` | `Quản trị viên (Admin) quản lý đơn đặt phòng và cập nhật trạng thái phòng.` | 1.4 mục 4 |
| 4 | `Admin quản lý tài khoản, nhân viên, địa điểm` | `Admin quản lý tài khoản khách, địa điểm` | 1.4 mục 5 |
| 5 | `Kiểm thử phân quyền giữa Customer, Employee và Admin.` | `Kiểm thử phân quyền giữa Customer và Admin.` | 1.4 mục 6 |
| 6 | `người dùng, nhân viên, địa điểm, phòng, tiện ích` | `người dùng, địa điểm, phòng, tiện ích` | 1.3.1 vai trò sử dụng |
| 7 | `Quản lý người dùng và nhân viên.` | `Quản lý người dùng và tài khoản khách.` | 1.3.1 vai trò sử dụng |
| 8 | `giao diện quản lý dành cho Employee và Admin.` | `giao diện quản lý dành cho Admin.` | 1.4 mục 3 |
| 9 | `Xác định yêu cầu của Customer, Employee và Admin` | `Xác định yêu cầu của Customer và Admin` | 1.5 Phương pháp tiếp cận |
| 10 | `phân quyền theo ba vai trò:` | `phân quyền theo hai vai trò:` | Mục phân quyền Chương 3 |
| 11 | `Đối với nhân viên vận hành:` | `Đối với quản trị viên (Admin) vận hành:` | 3.x đối chiếu chức năng |
| 12 | `quản lý tài khoản người dùng, nhân viên, quản lý các địa điểm` | `quản lý tài khoản người dùng, quản lý các địa điểm` | 3.x đối chiếu chức năng |
| 13 | `Nhân viên thực hiện nhận phòng và trả phòng` | `Quản trị viên thực hiện nhận phòng và trả phòng` | 3.x đối chiếu chức năng |
| 14 | `Quản lý nhân viên` *(tiêu đề mục)* | `Quản lý khách hàng` | Tiêu đề Chương 2 hoặc 3 |
| 15 | `4.3 Triển khai các chức năng cho phần nhân viên` | `4.3 Triển khai các chức năng cho phần Quản trị (Admin)` | Tiêu đề mục Chương 4 |

### Kiểm tra đã sửa đủ

Sau khi thay, bấm `Ctrl + F` và tìm `nhân viên`. Chỉ còn **0 kết quả** là đúng.
Tìm `Employee` — cũng phải là **0 kết quả**.

---

## Cần cân nhắc — tính năng trong mẫu mà hệ thống chưa làm

Mẫu liệt kê những tính năng **không nằm trong phạm vi đã chốt**. Hai cách xử lý, chọn một:

**Cách A — Xoá khỏi danh sách (khuyến nghị).**
Báo cáo chỉ mô tả những gì hệ thống thật sự làm. Ít nhưng đúng còn hơn nhiều nhưng sai.

**Cách B — Giữ lại nhưng đánh dấu là hướng phát triển.**
Thêm cụm *"nằm ngoài phạm vi đồ án, em ghi vào mục hướng phát triển"*.

| Cụm trong mẫu | Số chỗ | Vì sao |
|---------------|------:|--------|
| `Tích hợp cổng thanh toán trực tuyến thực tế tại VNPay hoặc MoMo` | 1 | Không làm — đã ghi ở hạn chế và hướng phát triển |
| `Thanh toán đa tiền tệ` | 1 | Không làm |
| `thanh toán` (các mục liên quan) | 3 | Xem trên |
| `Ứng dụng di động` | 1 | Không làm — chỉ có ứng dụng Web |
| `thông báo` | 1 | Không làm |

**Tuyệt đối không** viết trong báo cáo là *"đã tích hợp thanh toán"* hoặc *"đã có ứng dụng
di động"*. Khi thầy hỏi *"cho em xem màn hình thanh toán"* thì không có màn hình nào để mở —
mất điểm nặng hơn nhiều so với việc báo cáo thiếu một tính năng.

---

## Bổ sung vào Chương 1

| Mục | Nội dung cần thêm | Nguồn |
|-----|-------------------|-------|
| **1.3.1 Vai trò sử dụng** | Cần **biểu đồ tác nhân** và mô tả 2 tác nhân | `docs/anh/3-01-use-case-tong-quat.png` |
| **1.4 Nội dung thực hiện** | Danh sách 5 phần đã làm: phân tích thiết kế · Backend · Frontend · nghiệp vụ cốt lõi · kiểm thử | `docs/CHUONG_4.md` mục 4.4.1 |
| **1.5 Phương pháp tiếp cận** | Mô tả cách phân tích nghiệp vụ và công cụ dùng | `KE_HOACH_TRIEN_KHAI_CHI_TIET.md` |

---

## Bổ sung vào Chương 3

| Mục | Cần bổ sung |
|-----|-------------|
| Biểu đồ Use Case | 8 hình — `3-02` tổng quát, `3-03` quản lý tài khoản, `3-04` tìm kiếm & đặt phòng, `3-05` quản lý đặt phòng, `3-06` quản lý phòng, `3-07` thanh toán, `3-08` thông báo, `3-09` quản trị hệ thống |
| Biểu đồ lớp thực thể | `3-09-bieu-do-lop-thuc-thi.png` |
| Biểu đồ tuần tự | 6 hình — `3-13` đăng nhập, `3-14` tìm kiếm phòng, `3-15` đặt phòng, `3-16` check-in/check-out, `3-17` quản lý phòng, `3-18` thanh toán |
| ERD | `3-10-so-do-erd.png` |
| Biểu đồ lớp thực thể + ERD | `3-09-bieu-do-lop-thuc-thi.png` và `3-10-so-do-erd.png` |

Nguồn đầy đủ: `docs/anh/README.md`.

---

## Bổ sung vào Chương 4

Chép nội dung từ các file sau, **giữ nguyên số mục và số hình**:

| File | Dán vào mục nào của mẫu |
|------|--------------------------|
| `docs/CHUONG_4.md` | Toàn bộ Chương 4 — 17 mục, 17 hình |
| `docs/KET_LUAN.md` | Mục KẾT LUẬN |
| `docs/TLTK.md` | Mục TÀI LIỆU THAM KHẢO |

**Đối chiếu cấu trúc Chương 4** — mẫu có 4 mục, đồ án có 17 mục con:

| Mẫu | Đồ án HomeStay |
|-----|---------------|
| 4.1 Triển khai chức năng cho khách hàng | 4.1.1 … 4.1.7 — 7 mục con (giữ tiêu đề mẫu, thêm mục con) |
| 4.2 Triển khai chức năng cho quản trị viên | 4.2.1 … 4.2.6 — 6 mục con |
| 4.3 Triển khai chức năng cho phần nhân viên | **4.3 Triển khai chức năng cho phần Quản trị (Admin)** |
| 4.4 Kiểm thử vận hành ứng dụng | 4.3.1 Kiểm thử · 4.3.2 Đóng gói · 4.3.3 Triển khai |

---

## Danh sách 46 hình phải dán

| Nhóm | Số | Khoảng số |
|------|----:|-----------|
| Sơ đồ Chương 3 | 16 | Hình 3.1 – 3.16 |
| Giao diện Chương 3 | 7 | Hình 3.17 – 3.23 |
| Giao diện Chương 4 | 32 | Hình 4.1 – 4.23 |

Tất cả nằm trong `docs/anh/`. **Không ô "Hình 3.x" hay "Hình 4.x" nào được để trống.**

Với 16 sơ đồ, chèn **file `.png`** ở `docs/anh/` (cùng tên, khác đuôi so với `.svg`).
PNG dựng ở hệ số phóng 2× nên chữ nhỏ vẫn rõ khi in. Muốn sửa nội dung sơ đồ thì sửa
`docs/anh/ve-so-do.mjs` rồi chạy lại cả hai lệnh:

```powershell
node docs/anh/ve-so-do.mjs
node docs/anh/svg-2-png.mjs
```

---

## Checklist lần cuối trước khi in

| # | Việc | ✓ |
|---|------|---|
| 1 | Không còn chữ *"nhân viên"* | ⬜ |
| 2 | Không còn chữ *"Employee"* | ⬜ |
| 3 | Không còn chữ *"ba vai trò"* | ⬜ |
| 4 | Không còn chữ *"StayEasy"* | ⬜ |
| 5 | Không chỗ nào nói **đã có** thanh toán / ứng dụng di động | ⬜ |
| 6 | Cổng ghi trong báo cáo là **5174** (không phải 5173) | ⬜ |
| 7 | Cổng API là **5080** | ⬜ |
| 8 | Tài khoản demo ghi `admin@homestay.vn` / `123456` | ⬜ |
| 9 | Đủ **46 hình**, không ô trống | ⬜ |
| 10 | Chương 4 có đủ **17 mục** | ⬜ |
| 11 | Có bảng **18 test case** | ⬜ |
| 12 | Mục KẾT LUẬN có đủ 4 phần | ⬜ |
| 13 | TLTK đủ, trích dẫn đúng định dạng | ⬜ |
| 14 | Chữ trong **ảnh** đọc được khi in (không in nhỏ quá A4) | ⬜ |

**Cách kiểm tra nhanh nhất:** dùng `Ctrl + H` lần lượt tìm `nhân viên`, `Employee`,
`ba vai trò`, `StayEasy`, `5173` — cả 5 đều phải ra **0 kết quả**.