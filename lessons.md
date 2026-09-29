# LESSONS — Bài học đã gặp trong dự án

> Ghi **ngay khi gặp lỗi**, không đợi cuối ngày.
> Cấu trúc bắt buộc: **sai ở đâu → vì sao sai → đã sửa thế nào → lần sau tránh gì**.
> Cuối kỳ dùng file này làm cơ sở cho phần "Bài học kinh nghiệm" trong Kết luận.

---

## 1. Kiểm tra môi trường TRƯỚC khi lên kế hoạch chi tiết

**Ngày:** 29/09/2026
**Sai ở đâu:** Kế hoạch 21 bước viết trước, đến lúc chuẩn bị code mới đi kiểm tra môi trường — và tưởng máy **thiếu .NET SDK**.

**Triệu chứng lúc đầu (sai):**

```
dotnet : Không nhận được dưới dạng lệnh cmdlet
C:\Program Files\dotnet\dotnet.exe    → MISSING
C:\Users\Rimur\.dotnet\dotnet.exe     → MISSING
```

**Nguyên nhân gốc (2 tầng — tầng 2 mới đúng):**
1. *Sai lệch của mình:* .NET **không hề thiếu** — nó được cài bằng `dotnet-install.ps1` vào `%LOCALAPPDATA%\Microsoft\dotnet`, đúng kiểu cài không cần Admin. Mình chỉ dò 2 chỗ quen thuộc nên **kết luận sai rằng máy thiếu SDK**.
2. *Nguyên nhân thật:* thư mục đó **chưa được thêm vào PATH** → không gõ `dotnet` được từ terminal, dù file có thật.

**Đã sửa:** thêm vào user PATH, không cài lại, không cần quyền Admin:

```powershell
[Environment]::SetEnvironmentVariable('Path',
  ([Environment]::GetEnvironmentVariable('Path','User').TrimEnd(';') + ";$env:LOCALAPPDATA\Microsoft\dotnet"), 'User')
```

**Kết quả:** `dotnet --version` → `8.0.425`

**Lần sau tránh gì:**
> 1. **Đừng kết luận "máy thiếu X" khi mới dò 1–2 vị trí.** Chạy `where.exe <lệnh>` hoặc `Get-Command <lệnh> -All`, và dò **cả** các vị trí cài kiểu user (`%LOCALAPPDATA%`, `%USERPROFILE%`) chứ không chỉ `Program Files`.
> 2. **Bước đầu tiên của mọi đồ án phải là chạy 5 lệnh kiểm tra môi trường** rồi mới viết kế hoạch. Mất 2 phút, tiết kiệm hàng giờ.

---

## 2. File Word đang mở thì không đọc được — phải copy ra thư mục tạm

**Ngày:** 29/09/2026
**Sai ở đâu:** Cố đọc trực tiếp `10123234_NguyenHaiNam_Do_An_4_Tuan4.docx`.

**Triệu chứng:** file bị Windows/Word giữ khóa, đọc ra rỗng hoặc báo lỗi quyền truy cập.

**Đã sửa:** copy ra thư mục tạm rồi giải nén `word/document.xml` để đọc text thuần:

```powershell
Copy-Item "<file>.docx" "$env:TEMP\tuan4.zip"
Expand-Archive "$env:TEMP\tuan4.zip" -DestinationPath "$env:TEMP\tuan4_x"
# text nằm ở: $env:TEMP\tuan4_x\word\document.xml
```

**Lần sau tránh gì:**
> Đọc tài liệu `.docx`/`.xlsx` **luôn copy ra thư mục tạm trước**. Đồng thời **đóng file trên máy** khi cần AI đọc, để không phải làm thủ công mỗi lần.

---

## 3. File .docx 2.5 MB nhưng ảnh bên trong gần như không có

**Ngày:** 29/09/2026
**Sai ở đâu:** Mặc định "2486 KB ⇒ báo cáo phải có rất nhiều ảnh".

**Sự thật:** thư mục `word/media/` chỉ có **3 file PNG** (đúng bằng số ảnh chụp giao diện ở thư mục `hệ thống/`). Dung lượng lớn nằm ở style + font nhúng.

**Lần sau tránh gì:**
> Đừng suy đoán dung lượng file. Muốn biết có bao nhiêu ảnh thì **đếm file trong `word/media/`** — chính xác hơn nhiều lần đoán.

---

## 4. Báo cáo tự mâu thuẫn: SQL Server (Chương 1) vs MySQL (Chương 2)

**Ngày:** 29/09/2026
**Sai ở đâu:** Chương 1.2.2 ghi **SQL Server**, còn Chương 2.3–2.4 ghi **MySQL 8.0 + Pomelo**.

**Vì sao nguy hiểm:** nếu GVHD hỏi "dùng cơ sở dữ liệu gì?" mà trả lời khác nhau giữa hai chương → mất điểm ngay lập tức, và có thể bị hỏi tiếp về connection string trong code.

**Đã sửa:** chốt giữ **MySQL 8.0**, sẽ sửa lại Chương 1.2.2 cho khớp (còn nằm trong mục chỉnh 9 chỗ trong Word).

**Lần sau tránh gì:**
> Trước khi code, **đọc lại toàn bộ báo cáo cũ và liệt kê các điểm mâu thuẫn**. Tài liệu cũ và code phải khớp nhau, không phải code khớp tài liệu.

---

## 5. Báo cáo tự mâu thuẫn: "nhân viên" (nhiều lần) vs "2 tác nhân"

**Ngày:** 29/09/2026
**Sai ở đâu:** Thân báo cáo vẫn nhắc tới **nhân viên / staff** ở nhiều chỗ, trong khi Chương 3 ghi "Hình Actor gồm: Customer, Admin".

**Đã sửa:** chốt hệ thống **chỉ có 2 tác nhân: CUSTOMER và ADMIN**. Mọi chức năng vận hành (check-in, check-out, đổi trạng thái phòng) thuộc Admin. Sẽ sửa 9 chỗ trong Word.

**Lần sau tránh gì:**
> Khi thu hẹp phạm vi, **ghi lại đầy đủ các chỗ trong tài liệu cũ cần sửa theo**, để không sót. Danh sách 9 chỗ đã nằm trong `KE_HOACH_TRIEN_KHAI_CHI_TIET.md` mục A2.

---

## 6. 22 hình trong Chương 3 là placeholder, Chương 4 trống hoàn toàn

**Ngày:** 29/09/2026
**Sai ở đâu:** Chương 3 liệt kê đủ tên 22 hình (3.1–3.22) nhưng **không hình nào được chèn**. Chương 4 (Kết quả thực hiện) **trắng trơn**.

**Vì sao nguy hiểm:** đây là phần GVHD chấm điểm nặng nhất, và chụp ảnh cần hệ thống **đang chạy** → không thể dồn vào cuối.

**Đã sửa:** tách thành **Bước 19** (22 hình) và **Bước 20** (Chương 4) trong kế hoạch, với quy tắc **chụp ảnh ngay khi xong từng chức năng**, không dồn cuối.

**Lần sau tránh gì:**
> Phần "kết quả thực hiện" của đồ án phải được **làm song song với phần code**, theo nguyên tắc: *chức năng xong → chụp ảnh ngay*. Việc quay lại chụp lại sau là nguồn lãng phí thời gian lớn nhất.

---

## 7. Repo `bai-tap-lon` bị lẫn đồ án khác — không được dùng lại

**Ngày:** 29/09/2026
**Sai ở đâu:** `D:\bai tap lon` là git repo bao trùm **cả Đồ án 3 (đã bị xóa hàng loạt file, chưa commit)** lẫn Đồ án 4. Nếu commit từ đó sẽ kéo theo hàng trăm file rác.

**Đã sửa:** quyết định **`git init` riêng trong thư mục `Homestay`**, không đụng tới repo cha.

**Lần sau tránh gì:**
> Trước khi `git add`/`git commit`, chạy `git status` xem **số lượng file** sắp commit. Nếu nhiều bất thường → dừng lại kiểm tra.

---

## 8. Chưa chốt stack backend thì đừng viết dòng code nào

**Ngày:** 29/09/2026
**Sai ở đâu:** Đã hỏi lựa chọn backend 2 lần vẫn chưa có câu trả lời chốt, trong khi kế hoạch đã viết chi tiết theo ASP.NET Core.

**Đã sửa:** khuyến nghị **giữ ASP.NET Core 8** vì 3 lý do có bằng chứng:
1. Báo cáo đã chốt kiến trúc Controller–Service–Data Access (Chương 1.2.2, 2.1, 2.3, 2.4).
2. Đã có sẵn **206 file `.cs` 3 lớp** ở `Doan2-main` → không phải học ngôn ngữ mới.
3. Đổi sang Node = mất ~1 ngày sửa báo cáo + 1 tuần làm quen lại.

**Lần sau tránh gì:**
> **Quyết định kiến trúc phải chốt trước khi viết kế hoạch chi tiết**, vì kế hoạch chi tiết phụ thuộc hoàn toàn vào lựa chọn đó. Hỏi 1 câu, chờ trả lời, rồi mới viết.

---

## 9. ĐỪNG BAO GIỜ TIN VÀO TRÍ NHỚ VỀ PHIÊN BẢN THƯ VIỆN ⚠️

**Ngày:** 29/09/2026
**Đây là bài học đắt nhất của dự án — gần như chết người nếu không phát hiện.**

**Sai ở đâu:** `AGENTS.md` ghi "React 18, React Router v6" — đúng với kiến thức của mình. Mình định chạy `npm install` luôn.

**Vì sao nguy hiểm:** thực tế hôm nay khác xa. Chạy `npm view` mới biết:

| Thư viện | Mình tưởng | Thực tế | Lệch |
|---|---|---|---|
| React | 18 | **19.3.0** | 1 đời |
| Vite | 5 | **8.3.1** | 3 đời |
| Tailwind | 3 | **4.3.3** | viết lại hoàn toàn |
| React Router | 6 | **7.18.4** | đổi API |
| Zod | 3 | **4.6.5** | đổi API |
| TypeScript | 5 | **7.0.2** | bản viết lại bằng Go |

Nếu cài bản mới nhất mà code theo bản cũ → **hỏng build ngay**, mất thời gian sửa lỗi hàng giờ, mà lỗi này hoàn toàn do AI, không phải do mình.

**Đã sửa:**
1. **Ghim phiên bản** vào `AGENTS.md` mục 1.1 — chọn bộ *cũ 1 đời* mà mình chắc chắn viết không hỏng.
2. Thêm mục 1.2 làm quy tắc vàng: **trước khi cài bất kỳ thứ gì, phải hỏi `npm view <tên> version` / tra NuGet — không đoán bằng trí nhớ.**
3. Cài đúng bản ghim: `npm install <tên>@<phiên bản>`, **không dùng `@latest`**.

**Lần sau tránh gì:**
> **Trí nhớ của AI có thời hạn. Nguồn thật là npm/NuGet.** Câu hỏi "bạn quen phiên bản nào?" chính là câu hỏi cần hỏi AI trước khi bắt đầu dự án.
> Khi cài xong, **kiểm tra `package.json` xem đúng phiên bản đã ghim chưa** — trước khi viết dòng code đầu tiên.

---

## 10. `npm install` bị timeout giữa chừng — cài sai bộ thư viện

**Ngày:** 29/09/2026
**Sai ở đâu:** Chạy `npm install` 8 gói cùng lúc. Lệnh fail với `EIDLETIMEOUT` giữa chừng.

**Triệu chứng:**
```
npm error code EIDLETIMEOUT
npm error Idle timeout reached for host `registry.npmjs.org:443`
```
Nhưng template Vite (react, vite, typescript, tailwind) **đã cài xong**, còn 8 gói kia **chưa cài gì cả** — nếu không kiểm tra lại sẽ tưởng cài xong rồi viết code thiếu import.

**Đã sửa:** chạy lại với `--fetch-retries=5 --fetch-retry-maxtimeout=120000` → cài đủ.

**Lần sau tránh gì:**
> **Sau MỌI lần `npm install` phải kiểm tra lại thực tế**, không tin dòng "Done" của npm:
> ```powershell
> foreach ($p in @('react','zod','axios')) { ... đọc node_modules/$p/package.json ... }
> ```
> Lệnh `npm install` có thể **fail một phần** — đó là loại lỗi im lặng, chỉ lộ ra khi build mới phát hiện.

## 11. npm 11 chặn `postinstall` của esbuild

**Ngày:** 29/09/2026
**Sai ở đâu:** npm 11.19 (bản mới) mặc định **không chạy script cài đặt** của package khác, nên cảnh báo:
```
npm warn install-scripts  esbuild@0.21.5 (postinstall: node install.js) chưa được cho phép
```

**Đã sửa:** kiểm tra `npx esbuild --version` → `0.21.5` → **vẫn chạy bình thường** (Vite 5 đã đóng gói binary sẵn, không cần postinstall tải gì). Không cần cấu hình thêm.

**Lần sau tránh gì:**
> Thấy `npm warn` **không đồng nghĩa** với hỏng. **Kiểm tra bằng cách chạy thật** (`npx <tool> --version`) trước khi kết luận. Chỉ khi tool thật sự hỏng mới `npm install-scripts approve`.

---

## 12. Tiếng Việt hiện lỗi trong terminal ≠ file hỏng

**Ngày:** 29/09/2026
**Triệu chứng:** đọc `<title>` trong `index.html` ra `StayEasy � �?t ph?ng Homestay` — tưởng file bị hỏng encoding, sắp sửa lại cả dự án.

**Nguyên nhân gốc:** **console Windows dùng codepage 437/850, không có nét dấu tiếng Việt.** Chỉ là hỏng ở tầng hiển thị, file trên đĩa vẫn UTF-8 đúng.

**Cách kiểm chứng đúng (không đoán):**
```powershell
$text = [System.Text.Encoding]::UTF8.GetString([System.IO.File]::ReadAllBytes('index.html'))
$t = [regex]::Match($text, '(?<=<title>)[^<]*').Value
($t.ToCharArray() | Where-Object { [int]$_ -gt 127 }).Count   # => 4  (Đ, ặ, ồ, ụ)
$t.Contains('?')                                              # => False
```
Có 4 ký tự Unicode thật và **không có** ký tự `?` thay thế → file chuẩn.

**Lần sau tránh gì:**
> **Đừng sửa file vì lỗi hiển thị của terminal.** Muốn kiểm tra encoding thật thì đếm ký tự Unicode hoặc mở bằng VS Code.
> Nếu cần terminal hiện đúng tiếng Việt: `chcp 65001` (UTF-8) hoặc `chcp 65001; [Console]::OutputEncoding = [System.Text.Encoding]::UTF8`.

---

## 13. Commit bằng tên/email giả sẽ thành "unverified author" trên GitHub

**Ngày:** 29/09/2026
**Sai ở đâu:** Mình commit 3 lần bằng `-c user.name="Nguyen Hai Nam" -c user.email="12523w1@student.hcmutrp.edu.vn"`. Trong khi git global của máy là `Duongcute2604 / Namnguyen10072000@gmail.com`.

**Vì sao nguy hiểm:** GitHub **chỉ liên kết commit với tài khoản khi email khớp**. Email không khớp → commit hiện màu xám "Unverified" và **không tính vào contribution graph**. Với đồ án, thầy có thể mở repo xem và thấy tác giả không xác thực.

**Đã sửa (làm trước khi push nên chỉ tốn 1 phút):**
```powershell
# 1. Ghi lại cây file để chứng minh không mất nội dung
git rev-parse 'HEAD^{tree}'        # LƯU KẾT QUẢ

# 2. Sửa author cho toàn bộ lịch sử
git config user.name  "Duongcute2604"
git config user.email "Namnguyen10072000@gmail.com"
git filter-branch -f --env-filter "
export GIT_AUTHOR_NAME='Duongcute2604'
export GIT_AUTHOR_EMAIL='Namnguyen10072000@gmail.com'
export GIT_COMMITTER_NAME='Duongcute2604'
export GIT_COMMITTER_EMAIL='Namnguyen10072000@gmail.com'
" -- --all

# 3. Kiểm chứng: cây file phải GIỐNG HỆT
git rev-parse 'HEAD^{tree}'
```
Kết quả: `c90f38d...` **trước = sau** → chỉ đổi metadata, không mất dòng code nào.

**Lần sau tránh gì:**
> **Không tự đặt `-c user.name/email` khi commit.** Để git lấy tự động từ config có sẵn (`git config --global user.email`).
> Lỡ commit sai mà **chưa push** → sửa rẻ như trên. **Đã push rồi** thì phải `force-push`, lịch sử cũ biến mất khỏi remote.
> → Vì vậy: **lần push đầu tiên cũng phải kiểm tra identity trước.**

---

## 14. EF Core 8: `HasCheckConstraint` đã obsolete — phải khai báo trong `ToTable`

**Ngày:** 29/09/2026
**Sai ở đâu:** Viết `room.HasCheckConstraint("CK_Rooms_Capacity", ...)` theo thói quen từ EF Core 6/7. Build ra 6 warning `CS0618`.

**Vì sao:** Từ EF Core 8, check constraint thuộc về **bảng** chứ không thuộc về entity. Nên phải truyền callback vào `ToTable`:
```csharp
room.ToTable("Rooms", table => table.HasCheckConstraint("CK_Rooms_Capacity", "`Capacity` > 0"));
```

**Lần sau tránh gì:**
> Bất kỳ API nào báo `[Obsolete]` thì đừng chỉ dán bỏ warning — đọc dòng gợi ý trong chính warning, nó ghi rõ cách mới.
> Và `AGENTS.md` mục 10 đã ghi rõ: **0 warning mới được coi là xong.** Build có 6 warning thì Bước chưa xong, dù chức năng vẫn chạy.

---

## 15. Pomelo 8.0.2 kéo EFCore 8.0.2, nhưng Design/InMemory cài 8.0.10 → warning MSB3277

**Ngày:** 29/09/2026
**Sai ở đâu:** `StayEasy.csproj` dùng `EFCore.Design 8.0.10`, test project dùng `EFCore.InMemory 8.0.10`, còn Pomelo `8.0.2` kéo theo `EFCore.Relational 8.0.2`.

**Vì sao nguy hiểm:** build vẫn **thành công**, chạy vẫn được — nhưng có **2 assembly cùng tên khác phiên bản** nằm trong output. Hôm nào cần đọc metadata (`GetValueConverter`, `GetColumnType`) thì có thể nạp nhầm bản → lỗi khó hiểu. Với đồ án bị GVHD hỏi "sao log của em lúc nào cũng có dòng MSB3277" thì mất điểm ngay.

**Đã sửa:** hạ cả hai về **8.0.2** cho khớp Pomelo (đúng gợi ý ở `AGENTS.md` mục 1.1: *Design 8.0.x — khớp với Pomelo*).
```powershell
dotnet build   # → 0 Warning(s) 0 Error(s)
```

**Lần sau tránh gì:**
> **Pomelo 8.0.2 ⇒ mọi package EntityFrameworkCore khác cũng phải là 8.0.2.** Trộn `8.0.2` với `8.0.10` trong cùng solution là nguồn của MSB3277.
> Và: MSB3277 là warning **build**, không phải lỗi — `dotnet run` vẫn chạy. Nó chỉ mất khi chủ động đọc toàn bộ warning. Phải luôn đọc cả dòng `Warning(s)` trong output build.

---

## 16. `context.Model` là model ĐỌC TỐI ƯU — đọc tên bảng / check constraint sẽ ra null

**Ngày:** 29/09/2026
**Sai ở đâu:** Test cấu hình CSDL bằng `context.Model`, được `null`/`InvalidOperationException`, tưởng code cấu hình sai → sửa mã hoài không được.

**Vì sao:** `context.Model` là model tối ưu cho lúc **chạy thật** — nó CỐ TÌNH bỏ các thông tin chỉ dùng cho database (tên bảng, CHECK constraint, kiểu cột). Muốn kiểm tra cấu hình phải lấy **model thiết kế**:
```csharp
IModel model = context.GetService<IDesignTimeModel>().Model;
```

**Kèm 1 cái bẫy nữa:** provider **InMemory không có khái niệm bảng**, nên dùng context InMemory thì không đọc được tên bảng dù model thiết kế cũng đúng. Test cấu hình CSDL **phải** dựng context với provider MySQL — chuỗi kết nối có thể là chuỗi bất kỳ vì chỉ đọc metadata trong bộ nhớ, **không mở kết nối**.
> Cách làm: `Helpers/TestDbContextFactory.cs` có 2 hàm — `Create()` (InMemory, test ghi/đọc dữ liệu) và `CreateForSchemaInspection()` (MySQL, test cấu hình).

**Lần sau tránh gì:**
> Test hỏng 3 lần liên tiếp là **dừng sửa code**, hãy **in ra giá trị thật** rồi so với kỳ vọng. Mình đã làm đúng khi viết một test tạm in ra:
> `GetValueConverter() = NULL | ProviderClrType = String | GetColumnType() = varchar(20)`
> → thấy ngay **code cấu hình đúng, test sai**. Nếu tiếp tục "sửa" thì sẽ phá cấu hình đang đúng.

---

## 17. EF Core 8 không lưu enum→string thành `ValueConverter`

**Ngày:** 29/09/2026
**Sai ở đâu:** Test khẳng định enum lưu dạng chữ bằng `property.GetValueConverter()` — luôn ra `null`.

**Vì sao:** EF Core 8 chuyển enum→string qua **type mapping** chứ không gắn `ValueConverter` annotation vào model. Nên đọc `GetValueConverter()` sẽ không có gì dù cấu hình đúng hoàn toàn.

**Đã sửa — test đúng cách:**
```csharp
string columnType = property.GetColumnType()!;           // "varchar(20)"
Type providerType = property.GetProviderClrType();       // typeof(string)
```
Cách này kiểm chứng đúng thứ cần biết: **MySQL sẽ lưu cột này thành `varchar(20)`**, không phải số.

**Lần sau tránh gì:**
> Muốn biết database lưu gì thì hỏi **metadata quan hệ** (`GetColumnType`, `GetProviderClrType`), đừng đoán qua `ValueConverter` — đó là chi tiết cài đặt bên trong EF, đổi theo phiên bản.

---

## 18. Log `dotnet run` bị khoá khi pipe qua `Select-String`

**Ngày:** 29/09/2026
**Sai ở đâu:** Chạy app nền với `dotnet run ... | Select-String -Pattern "..."` để lọc log, rồi định `ReadAllText` đọc file log để kiểm tra. Đọc được: *"The process cannot access the file ... because it is being used by another process"*.

**Vì sao:** `Select-String` giữ file `.out` mở ở chế độ chia sẻ đọc, chặn mọi thao tác ghi/xoá trên file ⇒ đọc bằng `ReadAllText`/`Get-Content` là hỏng. Rõ hơn: **lọc ngay trong lệnh cũng làm mất bằng chứng** — log 731 dòng thành 3 dòng, không còn biết seed có thực sự `INSERT` hay không.

**Đã sửa — ghi log đầy đủ ra file, lọc *sau*:**
```powershell
dotnet run --project server\StayEasy\StayEasy.csproj *>&1 | Out-File -FilePath $log -Encoding UTF8
# đợi app lên rồi đọc:
$n = Get-Content $log -Encoding UTF8
($n | Select-String 'INSERT INTO').Count     # kịch bản 2 phải ra 0
```
Kết quả: lần chạy thứ 2 có **14 dòng / 0 lệnh `INSERT`** — đây mới là bằng chứng cứng cho idempotent, chứ không phải suy đoán "số bản ghi không tăng".

**Lần sau tránh gì:**
> Log nền luôn ghi **nguyên văn** ra file, **lọc ở bước đọc**. Lọc ngay trong lệnh chạy = tự xoá bằng chứng + khoá file không đọc được.

---

## 19. Dữ liệu mẫu ghi cứng ngày tháng sẽ "già" theo thời gian

**Ngày:** 29/09/2026
**Sai ở đâu:** Định viết `new DateTime(2026, 6, 2, 14, 0, 0)` cho `CheckIn` của 15 đơn mẫu.

**Vì sao:** Ngày cứng nghĩa là demo chỉ đẹp đúng vào tháng 9/2026. Sang tháng 11 bảo vệ thì toàn bộ đơn `PENDING`/`CONFIRMED` nằm quá khứ, biểu đồ doanh thu (Bước 15) trống mất phần "tương lai", GVHD hỏi "sao đơn nào toàn trong quá khứ" thì không trả lời được.

**Đã sửa:** `DuLieuMau.TaoDon(..., DateTime now)` — mọi mốc thời gian tính **tương đối** với `DateTime.Now`:
```csharp
CheckIn = now.AddDays(1).Date.AddHours(14)   // ngày mai 14:00
```
Chạy demo ngày nào thì dữ liệu "sống" đúng ngày đó.

**Lần sau tránh gì:**
> Dữ liệu mẫu dùng để **demo** thì không bao giờ ghi cứng ngày tháng. Chỉ ghi cứng thứ **không đổi theo thời gian** (tên phòng, giá, mô tả). Với ngày tháng thì luôn tính từ `DateTime.Now`.

---

# MẪU GHI BÀI HỌC (copy để dùng)

```markdown
### [Số thứ tự]. [Tóm tắt lỗi trong 1 dòng]
**Ngày:** dd/mm/yyyy
**Mục tiêu:** [chức năng đang làm]
**Triệu chứng:** [output lỗi thật, dán nguyên văn]
**Nguyên nhân gốc:** [tìm được từ đâu, không phải đoán]
**Đã sửa:** [thay đổi cụ thể ở file nào]
**Bằng chứng:** [lệnh chạy lại + kết quả]
**Lần sau tránh gì:** [1 quy tắc rút ra]
```

---

# LỤC BẢO HỌC TỪ SAI LẦM CỦA AI

| Lỗi AI từng làm | Nguyên nhân | Quy tắc thêm cho lần sau |
|------------------|-------------|--------------------------|
| Tự thêm package không hỏi | "Cho đủ" là suy nghĩ kiểu lười | Thêm package phải nêu rõ: dùng để làm gì, bắt buộc không |
| Viết code 1 lần 500 dòng rồi mới test | Không tách nhỏ từ đầu | Mỗi hàm ≤ 40 dòng, viết hàm nghiệp vụ xong thì test ngay |
| Comment kiểu "sẵn miếng thịt" | Comment lặp lại tên hàm | Comment phải giải thích **tại sao**, không giải thích **làm gì** |
| Báo "xong" khi mới build được | Không chạy thử tay, không test | "Xong" = test pass + log sạch + kiểm chứng thật (`AGENTS.md` mục 0.1) |
| Sửa 1 chỗ thành 5 chỗ | Không nghĩ tới nguyên lý "Vô hình" | Sửa xong chạy lại **test của phần đang chạy tốt** xem có hỏng không |
| Để TODO/FIXME bỏ lại | Cố làm nhanh cho kịp hạn | Cấm tuyệt đối TODO trong code (AGENTS.md mục 3.4) |
| Ghi cứng ngày tháng cho dữ liệu mẫu | Xét lẻ "cho dễ đọc" mà không nghĩ tới ngày GVHD chạy demo | Mốc thời gian mẫu luôn tính từ `DateTime.Now` |
| Lọc log ngay trong lệnh `dotnet run` nền | Muốn xem "chỗ nào lỗi" cho nhanh | Ghi log **nguyên văn** ra file, lọc ở bước đọc — vừa không khoá file vừa giữ nguyên bằng chứng |
