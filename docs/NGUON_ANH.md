# Nguồn ảnh phòng

Toàn bộ 48 ảnh trong `client/public/images/rooms/` chia thành **12 phòng, mỗi phòng
4 ảnh chụp của chính căn phòng đó** ở những góc khác nhau.

Ảnh tìm qua **Openverse** (`api.openverse.org`), chỉ lấy ảnh có giấy phép
**CC0** hoặc **Public Domain Mark (PDM)** — tức là dùng thoải mái, không cần xin
phép và không cần ghi tên tác giả.

## 12 bộ ảnh và nguồn gốc

| # | Thư mục | Nội dung | Người chụp | Giấy phép |
|---|---------|----------|------------|-----------|
| 1 | `cove-patrol-cabin` | Nhà gỗ: lò sưởi, khu bếp, góc ngủ | YellowstoneNPS | PDM |
| 2 | `harebell-patrol-cabin` | Nhà gỗ, 4 góc nội thất | YellowstoneNPS | PDM |
| 3 | `cache-creek-patrol-cabin` | Nhà gỗ, bàn ăn + bếp + cửa sổ | YellowstoneNPS | PDM |
| 4 | `peale-island-cabin` | Phòng ngủ giường tầng, phòng sinh hoạt, bếp | YellowstoneNPS | PDM |
| 5 | `mary-lake-patrol-cabin` | Nhà gỗ, 4 góc nội thất | YellowstoneNPS | PDM |
| 6 | `fox-creek-patrol-cabin` | Nhà gỗ, 4 góc nội thất | YellowstoneNPS | PDM |
| 7 | `superior-1-bedroom-suite` | Suite 1 phòng ngủ, bồn tắm, ban công nhìn biển | Hotel Costa Calero | CC0 |
| 8 | `sportsman-lake-patrol-cabin` | Nhà gỗ có gác, bếp, bàn ăn | YellowstoneNPS | PDM |
| 9 | `outlet-patrol-cabin` | Nhà gỗ: lò sưởi, thang leo gác, khu bếp | YellowstoneNPS | PDM |
| 10 | `lower-blacktail-patrol-cabin` | Nhà gỗ lịch sử, 2 phòng trước/sau | YellowstoneNPS | PDM |
| 11 | `nha-o-hai-phong-ngu` | Căn hộ 2 phòng ngủ: ngủ, bếp, phòng khách | YellowstoneNPS | PDM |
| 12 | `select-2-bedroom-suite` | Suite 2 phòng ngủ, ghế sofa xanh, ban công biển | Hotel Costa Calero | CC0 |

Trong mỗi thư mục, ảnh `-1.jpg` là ảnh chính (`IsPrimary = true`) hiện ở danh sách
kết quả tìm kiếm; `-2` đến `-4` là ảnh phụ trong trang chi tiết phòng.

### Vì sao lấy ảnh của cơ quan nhà nước Hoa Kỳ

Yêu cầu là mỗi phòng có 4 ảnh **cùng một phòng** chứ không phải 4 ảnh cùng kiểu.
Đây là điểm khó vì kho ảnh stock (StockSnap, Pexels, Unsplash) lưu từng ảnh lẻ,
về bản chất **không bao giờ** có 4 ảnh của cùng một căn phòng thật.

Đã thử và không dùng được:

| Nguồn | Kết quả |
|-------|---------|
| StockSnap.io | Chặn truy cập (HTTP 403) |
| Openverse — từ khoá "hotel room" | Tìm được nhiều ảnh lẻ nhưng không có bộ 4 ảnh cùng phòng |
| Wikimedia Commons | Duyệt 35 danh mục ảnh phòng khách sạn → 0 danh mục nào có từ 4 ảnh trở lên |
| Booking.com / Airbnb | Có đúng thứ cần nhưng có bản quyền, không dùng cho đồ án |

Ảnh chụp của **Yellowstone National Park Service** và **khách sạn Costa Calero**
lại có sẵn đúng điều cần: mỗi cơ sở được chụp thành bộ nhiều ảnh liên tiếp, cùng
một người chụp, cùng một chủ thể. Đây là nguồn ảnh thật của phòng nghỉ thật.

## Cách tìm lại như vậy nếu cần thay ảnh

Ba script trong `docs/anh/` chạy theo đúng thứ tự:

```powershell
node docs/anh/quet-rong.mjs        # 1. Quét Openverse, gom ảnh theo tên chủ thể → anh-quet-rong.json
node docs/anh/tai-12-bo-anh.mjs    # 2. Lọc bộ nội thất rồi tải về client/public/images/rooms/
node docs/anh/liet-ke-nguon-anh.mjs # 3. In tiêu đề gốc của từng ảnh để cập nhật bảng nguồn ở trên
```

Script 1 cần mạng (gọi API Openverse, mất vài phút); script 2 báo lỗi rõ ràng nếu
chạy khi chưa có cache. Hồ sơ nguồn của những gì đã tải nằm ở
`docs/anh/bo-anh-da-tai.json` và `docs/anh/ung-vien-da-tai.json` — mỗi mục ghi
số ảnh Flickr, tiêu đề gốc, tên người chụp, giấy phép và đường dẫn trang gốc.
Đây là thứ cần mở ra khi thầy hỏi "ảnh này lấy ở đâu".

Điều kiện bắt buộc khi chọn một bộ ảnh: **cả 4 tiêu đề phải cùng tên chủ thể**
(ví dụ `"Cove Patrol Cabin: interior views"` và `"Cove Patrol Cabin: interior
views kitchen area"`). Chỉ dựa vào ID ảnh gần nhau thì dễ gộp nhầm hai phòng
khác nhau của cùng một chuyến chụp.

Hai lỗi kỹ thuật gặp phải khi tải:

- **Flickr chặn hậu tố kích thước `_b`** (đoán là bot) trả về trang lỗi HTML
  919 byte. Đổi sang `_z` — cùng kích thước 1024 px — là tải được.
- **Phải kiểm chữ ký tệp** (`ffd8ff` cho JPEG, `89504e` cho PNG). Chỉ kiểm
  `Content-Length` sẽ lưu nhầm trang lỗi HTML vào thư mục ảnh.

## Ảnh này từng bị thay sai — ghi lại để không lặp lại

Hai lần trước cùng thư mục `rooms/` từng chứa ảnh không liên quan:

1. 22 ảnh lấy nhầm từ dự án khác (poster quảng cáo "Nhà Ở Hẻm": banner, bản đồ
   tiện ích, poster khuyến mãi). Đường dẫn file đúng, dung lượng lớn, nhưng nội
   dung hoàn toàn không liên quan.
2. 12 ảnh CC0 gắn **theo concept** (Cozy / Japandi / Signature), nên 4 ảnh của một
   phòng thực chất là 4 căn phòng khác nhau. Khách bấm vào phòng thấy ảnh chỉ giống
   kiểu chứ không phải phòng mình sắp ở.

Cả hai lần đều chỉ phát hiện được khi **mở xem trực tiếp từng ảnh**.

Bài học: đổi tên ảnh hoặc sửa đường dẫn KHÔNG đồng nghĩa với ảnh đúng. Phải xem
ảnh. Và ảnh của người khác thì **không commit vào repo đồ án** — cần `.gitignore`
ngay từ khi phát hiện, không đợi đến lúc commit.

## Nếu sau này muốn dùng ảnh chụp thật của cơ sở

Thay 4 tệp trong từng thư mục, giữ nguyên tên tệp, rồi nạp lại dữ liệu mẫu:

```sql
DROP DATABASE homestay;   -- rồi chạy lại ứng dụng
```

Seed chỉ chạy khi bảng `Users` còn trống, nên muốn nạp lại phải xoá cả database
chứ không chỉ xoá bảng `RoomImages`.
