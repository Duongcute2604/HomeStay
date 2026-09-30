# BÁO CÁO QUÉT CODE — Đợt 1 (sau Bước 5, 30/09/2026)

> Yêu cầu ở `AGENTS.md` 0.4b: mỗi 3 chức năng phải quét trùng lặp / thừa / chỗ dài
> quá 40 dòng. Tới đây đã 5 chức năng nên làm ngay, trước khi code Bước 6.
>
> Phạm vi: 47 file `.cs` (bỏ `obj/`, `bin/`, `Migrations/`) + 25 file `.ts`/`.tsx`.
> Nguyên tắc: sửa **từng chỗ một**, chạy lại test sau mỗi nhóm sửa.

## 1. Lỗi nghiệp vụ thật (nghiêm trọng nhất)

| Lỗi | Biểu hiện người dùng thấy | Đã sửa |
|-----|--------------------------|--------|
| Thông báo **mật khẩu quá dài** sai hoàn toàn | Nhập mật khẩu 150 ký tự → đọc *"Mật khẩu phải có ít nhất 6 ký tự"*. Rút xuống 6 ký tự rồi **vẫn lỗi** | Bảng bên dưới |

### Gốc rễ nằm ở DTO, không phải Service

Sửa lần 1 trong `AuthService` + 3 unit test gọi thẳng Service → **3/3 xanh**.
Gọi API thật → **vẫn thông báo cũ**.

Lý do: `[ApiController]` kiểm tra ModelState **trước khi** gọi Service. DTO khai:

```csharp
// SAI — một thông báo cho CẢ HAI ràng buộc trái chiều
[StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]

// ĐÚNG — mỗi ràng buộc một thông báo
[MinLength(AuthRules.MinPasswordLength,      ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
[StringLength(AuthRules.MaxPasswordLength,  ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự")]
```

`MinLength` chỉ fail khi ngắn, `StringLength` chỉ fail khi dài.
Kèm theo: 9 chỗ số thô trong attribute đã đổi sang tham chiếu `AuthRules.*`
(100/150/15/255/6).

Đã thêm `server/HomeStay.Tests/DTOs/AuthDtoValidationTests.cs` (13 ca) gọi đúng
thứ framework gọi: `Validator.TryValidateObject`. Chi tiết: `lessons.md` mục 34.

## 2. Các mục đã sửa

| # | Loại | Trước | Sau |
|---|------|-------|-----|
| 1 | **Cấu hình kiểm token lặp 2 nơi** | `TokenValidationParameters` viết giống hệt ở `Program.cs` và `JwtTokenService` — **8/8 thuộc tính** | Tách `TokenValidationFactory.Tao(JwtOptions)`, một chỗ duy nhất (`lessons.md` 35) |
| 2 | **`ClockSkew = 30` lặp 2 nơi** | Số thô ở cả hai khối | `TokenValidationFactory.DoLechPhepTinhGiay = 30` |
| 3 | **4 lần lặp `if (user is null) throw NotFound`** | 4 khối 4 dòng, chỉ khác `AsNoTracking` | `TaiTaiKhoanDeGhiAsync` + `TaiTaiKhoanDeDocAsync` (`lessons.md` 37) |
| 4 | **2 lần lặp vô hiệu hoá phiên** | `RefreshTokenHash = null; RefreshTokenExpiresAt = null;` | `VoHieuHoaPhien(user)` |
| 5 | **Class chết 30 dòng** | `Common/ErrorCodes.cs` — **0 tham chiếu** | **Xoá file**. Quy tắc 400/409 mà nó ghi đã có ở `AGENTS.md` 6.5 |
| 6 | **2 hằng số chết** | `BookingRules.CleaningHoursAfterCheckout`, `AuthRules.RefreshTokenHashLength` | **Xoá**. Ghi chú trong `BookingRules`: sẽ thêm lại ở Bước 10 kèm unit test |
| 7 | **Comment gây hiểu nhầm** | `User.RefreshTokenExpiresAt` nhưng **ghi 3 chỗ, đọc 0 chỗ** | Ghi rõ "không tham gia quyết định, claim `exp` trong JWT mới là luật" (`lessons.md` 36) |
| 8 | **Frontend: Zod schema nằm trong component** | Không test được | Gom ra `src/schemas/authSchemas.ts` (3 lý do ghi đầu file) |

## 3. Các mục CỐ Ý KHÔNG sửa

| Phát hiện | Không sửa vì |
|-----------|-------------|
| `JwtTokenService.RoleClaimType` — ký vào token, chưa nơi nào đọc | Sẽ dùng cho `[Authorize(Roles = ...)]` ở **Bước 14**. Xoá thì phải làm lại |
| `MinHoursForHourlyBooking` / `MinHoursAdvanceNotice` — chỉ test dùng | Bước 10 mới có chỗ dùng thật |
| `User.RefreshTokenExpiresAt` (cột CSDL) | Hữu ích khi tra cứu mà không muốn giải mã token. Xoá cần migration |
| `Program.cs` 199 dòng top-level | Cách ASP.NET Core tổ chức; tách ra rủi ro lớn, lợi ích nhỏ |
| `DuLieuMau.cs` — initializer `Room` lặp 10 lần, `COMPLETED` 11 lần | Là **dữ liệu mẫu**, rõ ràng hơn khi gọn. Ưu tiên khả năng đọc |
| 7 cảnh báo `npm audit` | Đã phân tích trong `todo.md` PHẦN 3: chỉ vá được bằng nâng major, cấm |
| Component TSX > 300 dòng | Không có file nào vượt |
| `any` / `TODO` / `console.log` / `Console.WriteLine` | Quét bằng grep: **không có** |

## 4. Kết quả kiểm chứng lại sau khi sửa

| Hạng mục | Kết quả |
|----------|---------|
| `dotnet build --no-incremental` | 0 Warning · 0 Error |
| `dotnet test` | **163/163** (thêm 16: 3 Service + 13 DTO validation) |
| `npm test` | **60/60** — không hỏng gì |
| Thông báo mật khẩu trên API thật | 4 ca đúng và **khác nhau**: quá ngắn / quá dài ở cả đăng ký lẫn đổi mật khẩu |
| Token trên API thật | Đăng nhập 200 · `/me` 200 · refresh 200 · chữ ký sai 401 · sai mật khẩu 401 · LOCKED 403 |
| Log server | 0 fail / 0 exception |
| CSDL demo | 4 tài khoản gốc, mọi `RefreshTokenHash = NULL` |

## 5. Giới hạn đã biết (để trả lời được khi bảo vệ)

| Giới hạn | Vì sao chấp nhận được |
|---------|------------------------|
| **Đăng xuất không thu hồi được access token** (tối đa 1 giờ) | Token tự chứa không có chỗ lưu để đối chiếu. Muốn thu hồi thì lưu token vào CSDL và kiểm mỗi request — tốn 1 truy vấn cho mọi API. Đánh đổi tiêu chuẩn, đã ghi ở mục giới hạn trong báo cáo |
| **Access token không đổi nếu phát hành 2 lần trong cùng 1 giây** | Cố ý **không** có `jti`; nội dung chỉ `(userId, email, role, exp)` mà `exp` tính theo giây. Refresh token thì **có** `jti` (`lessons.md` 21) |
| **1 tài khoản chỉ giữ 1 phiên** | Giữ đúng **9 bảng** đã duyệt ở Bước 3 thay vì thêm bảng phiên |
