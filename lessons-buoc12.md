# Ghi chú Bài học - Buoc 12 (Admin quan tri)

## 1. `edit` tool KHÔNG được dùng để "thêm" dòng khi `newString` chứa chính `oldString`

**Sai ở đâu:** Tôi lặp lại ~30 lần cùng một lệnh `edit` với
`oldString = "using StayEasy.DTOs;"` và
`newString = "using StayEasy.DTOs;\nusing StayEasy.Services.Admin;"`.

Kết quả: file có **70 dòng `using StayEasy.Services.Admin;`** trùng nhau, và tôi
cứ lặp lại y hệt vì đọc log lỗi không ra nguyên nhân thật.

**Vì sao sai:** Mỗi lần gọi `edit` thành công (1 dòng cũ → 2 dòng mới). Lần sau
`oldString` vẫn khớp nên lại thêm một dòng nữa. Tôi tưởng lần sau sẽ "hết" nhưng
thực tế nó **luôn** thành công và **luôn** thêm dòng.

**Sửa thế nào:** Khi `newString` chứa trọn `oldString` thì **phải dùng `replaceAll: false`
và chắc chắn chỉ cần 1 lần**, hoặc tốt hơn là dùng `write` để viết lại cả file.
Quy tắc cho bản thân: sửa file nhiều hơn ~2 chỗ thì `write` lại file cho sạch,
đừng vá từng lần.

## 2. `Set-Content` trong PowerShell phá UTF-8 tiếng Việt

**Sai ở đâu:** Dùng `Get-Content | ForEach-Object {...} | Set-Content -Encoding UTF8`
để xoá 1 dòng comment trong `DuLieuMau.cs`. Kết quả toàn bộ dấu tiếng Việt trong
file bị hỏng, **thêm cả BOM** vào đầu file.

**Vì sao:** Windows PowerShell 5.1 mặc định đọc file không BOM bằng encoding ANSI
(cp1252), nên `Get-Content` đọc UTF-8 ra ký tự hỏng rồi ghi lại thành hỏng thật.

**Sửa thế nào:**
- Chỉ dùng `Set-Content` cho file ASCII. File tiếng Việt dùng **`edit` tool**.
- Nếu buộc phải dùng shell: `[System.IO.File]::ReadAllText($p, [Text.Encoding]::UTF8)`
  rồi `[System.IO.File]::WriteAllText($p, $text, (New-Object Text.UTF8Encoding $false))`
  (tham số `$false` = không ghi BOM).
- Gỡ BOM nếu lỡ dính: `WriteAllBytes($p, $bytes[3..($bytes.Length-1)])` khi 3 byte
  đầu là `239,187,191`.

## 3. Namespace `ApiResponse` là `StayEasy.Common`, KHÔNG phải `StayEasy.DTOs`

File `server/StayEasy/DTOs/ApiResponse.cs` nằm trong thư mục `DTOs` nhưng khai báo
`namespace StayEasy.Common`. Dùng `using StayEasy.DTOs;` là **không đủ** — thiếu
`using StayEasy.Common;`.

**Bài học:** Đừng suy namespace từ vị trí file. Khi build báo `CS0246` cho một
loại, hãy `grep "class TenLoai"` rồi mở file ra đọc dòng `namespace` — 10 giây
tiết kiệm hàng chục vòng build-sai.

## 4. Cột enum trong CSDL lưu dạng CHUỖI, không phải số

`Rooms.RoomType` lưu `'COZY'` / `'JAPANDI'` / `'SIGNATURE'` (varchar). Viết SQL
`CASE r.RoomType WHEN 0 THEN ...` sẽ báo
`Truncated incorrect DOUBLE value: 'COZY'`.

**Bài học:** Trước khi viết SQL cập nhật dữ liệu enum, xem cột đó lưu kiểu gì
(migration hoặc `DESCRIBE Rooms`). C# `enum` không có nghĩa DB cũng lưu số.

## 5. Lỗi logic trong giao diện: dùng `null` làm cờ "đang mở form"

Đã viết `{dangSua !== null && (<form>…)}` để mở form. Nhưng nút "Thêm cơ sở" gọi
`moForm(null)` → `dangSua = null` → form **không mở**.

**Bài học:** Một state không được đồng thời mang hai nghĩa ("đang mở" và "đang sửa
ai"). Tách thành 2 state: `dangMoForm: boolean` + `dangSua: AdminLocation | null`.

## 6. Bảng `payments` / `notifications` — vẫn CHƯA tạo, đúng kế hoạch

Bước 12 không đụng vào 2 bảng này. Không có service/model nào chờ sẵn cho chúng.
