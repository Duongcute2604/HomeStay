# Nguồn ảnh phòng

Toàn bộ ảnh trong `client/public/images/rooms/` lấy từ **StockSnap.io** — kho ảnh
miễn phí với giấy phép **CC0** (public domain: không cần ghi tên tác giả, không
cần xin phép, không giới hạn sử dụng thương mại).

| Concept | File | Nội dung |
|---------|------|----------|
| Cozy | `cozy-1.jpg` | Phòng gỗ ấm, cửa sổ nhìn vườn, nến cây — "trốn phố cực chill" |
| Cozy | `cozy-2.jpg` | Phòng gỗ 2 giường, cửa sổ nhìn núi |
| Cozy | `cozy-3.jpg` | Phòng gỗ tối giản, ánh sáng vàng ấm |
| Cozy | `cozy-4.jpg` | Rèm cửa sổ và cây xanh nhỏ trên bệ |
| Japandi | `japandi-1.jpg` | Phòng trắng tối giản, cây xanh, đèn chùm |
| Japandi | `japandi-2.jpg` | Giường trắng, cửa sổ sáng, bình cà phê trên bàn |
| Japandi | `japandi-3.jpg` | Giường gỗ + rèm trắng, tường gỗ tối giản |
| Japandi | `japandi-4.jpg` | Phòng khách xám tối giản, cửa sổ lớn |
| Signature | `signature-1.jpg` | Phòng suite gỗ rộng, TV, bàn tròn, ban công |
| Signature | `signature-2.jpg` | Phòng rộng xám, lò sưởi, cửa sổ nhìn cây xanh |
| Signature | `signature-3.jpg` | Ghế vàng, tường góc kim loại, cây xanh |
| Signature | `signature-4.jpg` | Phòng ăn sang trọng, đèn chandelier, bộ bàn gỗ |

## Vì sao dùng CC0 thay vì Unsplash / Pexels

- **CC0** là giấy phép rõ ràng nhất: dùng thương mại, sửa đổi, không cần ghi
  công. Khi thầy hỏi "ảnh này lấy ở đâu, có bản quyền không" thì trả lời được
  ngay.
- Unsplash và Pexels yêu cầu ghi tên tác phẩo (Attribution) — đồ án không có
  chỗ để ghi, hoặc ghi ở đâu cũng không rõ ràng.

## Ảnh này từng bị thay sai — ghi lại để không lặp lại

Lần trước, thư mục `rooms/` chứa 22 ảnh lấy nhầm từ dự án khác (poster quảng
cáo "Nhà Ở Hẻm": banner, bản đồ tiện ích, poster khuyến mãi). Chỉ phát hiện được
khi **mở xem trực tiếp từng ảnh** — đường dẫn file đúng, dung lượng lớn, nhưng
nội dung hoàn toàn không liên quan.

Bài học: đổi tên ảnh hoặc sửa đường dẫn KHÔNG đồng nghĩa với ảnh đúng. Phải
xem ảnh. Và với ảnh của người khác thì **không commit vào repo đồ án** — cần
`.gitignore` ngay từ khi phát hiện, không đợi đến lúc commit.

## Nếu sau này muốn dùng ảnh chụp thật

Bỏ 3 dòng `client/public/images/rooms/...` trong `.gitignore`, thay file cùng
tên, cần thì chạy lại:

```sql
DELETE FROM RoomImages;
-- rồi chạy lại phần seed ảnh trong DuLieuMau.cs bằng cách xoá bảng Users
-- (seed chỉ chạy khi bảng Users rỗng)
```
