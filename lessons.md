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
**Triệu chứng:** đọc `<title>` trong `index.html` ra `HomeStay — Đặt phòng Homestay` — tưởng file bị hỏng encoding, sắp sửa lại cả dự án.

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
**Sai ở đâu:** `HomeStay.csproj` dùng `EFCore.Design 8.0.10`, test project dùng `EFCore.InMemory 8.0.10`, còn Pomelo `8.0.2` kéo theo `EFCore.Relational 8.0.2`.

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
dotnet run --project server\HomeStay\HomeStay.csproj *>&1 | Out-File -FilePath $log -Encoding UTF8
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

---

## 20. Bản giả (fake) trong unit test che mất đúng lỗi cần tìm

**Ngày:** 29/09/2026 — Bài học quan trọng nhất từ Bước 5.

**Sai ở đâu:** Viết `AuthService` xong, chạy `dotnet test` → **147 test xanh**. Tưởng phần đăng nhập đã chắc chắn. Chạy kiểm thử tay mới phát hiện: đăng nhập ở máy 2 **không** làm mất tác dụng refresh token của máy 1 — trả `200` thay vì `401`.

**Vì sao 2 lớp test đều xanh trong khi bản thật hỏng:**

1. `FakeJwtTokenService.TaoRefreshToken` trả về `fake-refresh-{id}` — **cùng một chuỗi mọi lần gọi**. Nên "đăng nhập lần 2" trong test sinh ra đúng token của lần 1, và kiểm tra "token cũ có còn dùng được không" trở nên vô nghĩa. Bản thật thì token có mốc hết hạn nên **khác nhau**.
2. `FakePasswordHasher.Verify` so sánh chuỗi thuần. Nhưng lỗi thật nằm ở chỗ **BCrypt cắt cốt 72 byte đầu** — thuộc tính của thư viện bên ngoài mà bản giả không có. So sánh thuần thì luôn đúng.

Lỗi gốc còn sâu hơn: tôi dùng **BCrypt để băm refresh token**. Refresh token dài ~196 ký tự, BCrypt chỉ xét 72 byte đầu, mà payload chỉ khác nhau ở vài chữ số cuối → **hai token khác nhau cho cùng một hash** → bước đối chiếu hash trong CSDL trở nên vô hiệu, đúng cái lỗ hổng mà việc lưu hash sinh ra để chặn.

**Đã sửa:**
- Tách `ITokenHasher` (SHA-256, xét **toàn bộ** chuỗi) khỏi `IPasswordHasher` (BCrypt, dành cho mật khẩu người dùng). Hai mục đích khác nhau thì hai lớp khác nhau — không phải thừa.
- Sửa `FakeJwtTokenService` sinh token **khác nhau mỗi lần** (`fake-refresh-{id}-{số thứ tự}`).
- `AuthServiceTests` dùng `TokenHasher` **thật** (SHA-256 chạy nhanh, không làm chậm test).
- Bổ sung 2 test bắt đúng lỗi: `LamMoiTokenAsync_DangNhapLaiLanNua_TokenCuKhongConDungDuoc` và `TaoRefreshToken_GoiHaiLan_CoHaiTokenKhacNhau`.

**Lần sau tránh gì:**
> 1. **Bản giả phải mô phỏng cả TÍNH CHẤT của hàm thật, không chỉ hành vi "đúng".** Hỏi: "Nếu hàm thật có đặc tính X, bản giả của mình có X không?"
> 2. **Khi dùng thư viện băm mật khẩu cho thứ KHÔNG phải mật khẩu, phải kiểm giới hạn của thuật toán.** BCrypt 72 byte, PBKDF2/Argon2 cũng có giới hạn tương tự. Chuỗi cần so sánh 1-1 (token, khoá phiên) thì dùng hàm băm nhanh xét toàn bộ chuỗi.
> 3. **Test xanh KHÔNG chứng minh đúng** — nó chỉ chứng minh "những gì test kiểm thì đúng". 147 test xanh mà bản thật hỏng là chuyện có thật.
> 4. **Kiểm thử tay không thay thế được unit test, và ngược lại.** Hai cái bắt lỗi khác nhau: unit test bắt lỗi logic lặp lại được, kiểm thử tay bắt lỗi do **cách dùng thực tế** — mà người kế hoạch không thấy trước.

---

## 21. Hai thuật toán băm khác nhau cho hai mục đích khác nhau

**Ngày:** 29/09/2026
**Sai ở đâu:** Một `IPasswordHasher` duy nhất dùng cho cả mật khẩu người dùng lẫn refresh token. Nghe thì "đừng lặp lại" nhưng thực ra **khác bản chất**:

| | Mật khẩu người dùng | Refresh token |
|---|---|---|
| Ai chọn | Người dùng tự nghĩ ra | Hệ thống tự sinh |
| Độ dài | Ngắn, lặp lại, dễ đoán | Dài, ngẫu nhiên hàng trăm bit |
| Cần chậm để chống dò? | **Có** | **Không** — đã ngẫu nhiên sẵn |
| Cần xét hết chuỗi? | Không quan trọng | **Bắt buộc** |

Dùng BCrypt cho token thì "chậm" không tạo thêm an toàn nào, mà "cắt cốt 72 byte" thì gây hại thật.

**Lần sau tránh gì:**
> Không phải thứ gì lặp code cũng nên gộp. Hỏi **"hai chỗ này có cùng bản chất không"** trước khi gộp. Gộp nhầm còn tệ hơn là viết hai lớp riêng.
> Và khi tách interface: **1 interface = 1 lý do tồn tại**, không phải "1 interface = 1 class".

---

## 22. PowerShell: dùng biến trước khi khai báo, và hậu tố thời gian gọi nhiều lần

**Ngày:** 29/09/2026
**Sai ở đâu (2 lỗi cùng lúc, đều làm ca kiểm thử tự vô hiệu mà không nhận ra):**

1. Khai báo `$EMAIL = "buoc5kt$HAU_TO@gmail.com"` ở **trên** dòng `$HAU_TO = ...`. PowerShell chạy tuần tự từ trên xuống nên `$HAU_TO` rỗng → email thành `buoc5kt@gmail.com` → trùng tài khoản đã có → `409` ở kịch bản happy path.
2. Gọi `$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())` ở **từng dòng**. Ca "đăng ký email HOA CHU phải trùng với bản chữ thường" lấy hậu tố ở hai chỗ khác nhau vài giây → hai email **khác nhau** → luôn `201` → ca kiểm tra đó im lặng biến thành vô nghĩa.

**Vì sao nguy hiểm:** cả hai đều cho kết quả "hợp lý" (409 hoặc 201 đều là mã lỗi thật). Không có ca nào báo đỏ. Chỉ lúc **đọc kỹ từng dòng mới thấy** ca kiểm tra không còn kiểm tra được điều cần kiểm tra.

**Đã sửa:** tính `$HAU_TO` **một lần** ở đầu script, khai báo **trước** chỗ dùng.

**Lần sau tránh gì:**
> 1. Mỗi dòng `<dấu>----- <mã ca> -----` trong script kiểm thử phải có **mã riêng để đối chiếu**. Không có mã thì không biết ca nào hỏng.
> 2. Script kiểm thử phải **chạy lại được nhiều lần** — sinh dữ liệu duy nhất mỗi lần chạy, và **tự dọn dữ liệu về trạng thái ban đầu** ở cuối.
> 3. Khi một ca kiểm thử trả kết quả "đúng như mong đợi" mà mình vẫn thấy nghi ngờ, hãy in ra **giá trị thật** (email đã dùng, timestamp) rồi so sánh bằng mắt — đừng tin vào tên ca kiểm thử.

---

## 23. Phân biệt lỗi tầng form binding với lỗi do DTO tự đặt — bằng KEY của ModelState

**Ngày:** 29/09/2026
**Sai ở đâu:** `InvalidModelStateResponseFactory` mặc định của ASP.NET trả `ProblemDetails` kèm lỗi kỹ thuật của .NET ra ngoài, ví dụ:
```
"'d' is an invalid start of a value. Path: $ | LineNumber: 0 | BytePositionInLine: 0"
```
Client hiển thị lỗi này cho người dùng — vi phạm `AGENTS.md` mục 6.5. Nhưng nếu đổi thành trả thông báo chung luôn thì lại nuốt mất thông báo tiếng Việt đã soạn sẵn trong DTO.

**Vì sao phân biệt được:** đọc log chẩn đoán (in ra `ModelState` tạm thời rồi xoá) cho thấy:

| Nguồn lỗi | Key trong `ModelState` | `ErrorMessage` |
|---|---|---|
| Lỗi đọc body (JSON hỏng, body là mảng, sai kiểu) | `"$"` hoặc `"$.email"` | chuỗi kỹ thuật của .NET |
| Lỗi do attribute trong DTO đặt ra | tên trường: `FullName`, `Password`… | thông báo tiếng Việt đã soạn |

Cả hai loại đều có `Exception = null`, nên **không** phân biệt được bằng `Exception` — buộc phải dựa vào key.

**Đã sửa:**
```csharp
bool coLoiDinhDang = context.ModelState.Keys
    .Any(khoa => khoa == JsonInputFormatterErrorKeyPrefix
        || khoa.StartsWith(JsonInputFormatterErrorKeyPrefix + ".", StringComparison.Ordinal));

if (coLoiDinhDang)   // lỗi định dạng → thông báo chung, không lộ kỹ thuật
{ ... }
string thongBao = /* lấy ErrorMessage tiếng Việt đầu tiên */ ;
```

**Lần sau tránh gì:**
> Khi cần biết framework xử lý thế nào thì **cứ log ra xem, đoán là tốn thời gian hơn**. Bật log chẩn đoán tạm thời, chạy vài request, đọc log, rồi **xoá đoạn chẩn đoán** — quên xoá là nợ kỹ thuật.

---

## 24. `git rm --cached` + `git rebase` = mất file secret khỏi ổ đĩa

**Ngày:** 30/09/2026

**Sai ở đâu:** Muốn đưa `appsettings.Development.json` (chứa khoá ký JWT thật) ra khỏi git:

```
1. Thêm vào .gitignore          -> file VẪN còn trong git, vì file đã được track từ trước
2. git rm --cached <file>       -> index bỏ theo dõi, file VẪN còn trên ổ đĩa  (đúng ý)
3. git add -A && git commit     -> commit ghi lại "xoá file"
4. git push                     -> BỊ TỪ CHỐI, vì trên GitHub có commit bạn tự sửa README từ trước
5. git rebase origin/main       -> checkout lại cây mới
```

Sau bước 5, **file secret bi xoá khỏi ổ đĩa** — vì commit của mình ghi "file này không tồn tại", nên `rebase` checkout cây đó là mất file. Chạy `dotnet run` thì sập:

```
Unhandled exception. System.InvalidOperationException: Thiếu khối cấu hình 'Jwt' trong appsettings
   at Program.<Main>$(String[] args) in ...\Program.cs:line 118
```

**Vì sao nguy hiểm:** `git status` vẫn sạch, `git push` thành công, không có gì báo sai. Mất file chỉ lộ ra khi chạy app. Và file đó là **secret** — mất nó thì phải sinh lại, mà sinh lại thì mọi token đang có cũng hỏng.

**Đã sửa:** tạo lại file từ bản commit gần nhất có nó (`git show <commit>:<path>`), ghi khoá cũ vào lại.

**Lần sau tránh gì:**
> 1. `.gitignore` **chỉ có tác dụng với file chưa từng được track**. Muốn gỡ file đã track thì bắt buộc `git rm --cached`.
> 2. Sau `git rm --cached`, **kiểm tra lại bằng `git status`** — trước khi commit, phải thấy đúng 1 dòng `D` cho file đó, và **phải chạy app thử lại** trước khi push.
> 3. **Đừng rebase khi đang dở dang việc dùng file local.** Nếu buộc phải rebase, làm nó **trước** khi commit, hoặc chuẩn bị sẵn bản sao file secret ra chỗ khác (`$env:TEMP`).
> 4. Khi app không khởi động được, **đọc dòng lỗi đầu tiên** trước. Ở đây lỗi nói thẳng "Thiếu khối cấu hình 'Jwt'" — đủ để biết ngay là thiếu file cấu hình, không cần đoán.
> 5. Lưu khoá bí mật ra **nhiều nơi hơn một** chỗ, và biết cách sinh lại (xem `appsettings.Development.example.json` có sẵn lệnh sinh chuỗi ngẫu nhiên).

## 25. Hàm bóc dữ liệu dùng chung cho cả endpoint có data và không có data

**Sai ở đâu:** `bocDuLieu()` trong `authService.ts` viết để bóc `ApiResponse<T>` cho
endpoint **có** trả về dữ liệu, nhưng lại dùng luôn cho mọi endpoint:

```ts
function bocDuLieu<T>(response: ApiResponse<T>): T {
  if (!response.success || response.data === null) {
    throw new Error(response.message)
  }
  return response.data
}
```

**Biểu hiện:** bấm "Đổi mật khẩu" với mật khẩu đúng, hoặc bấm "Đăng xuất" — giao diện
báo "Đã xảy ra lỗi. Vui lòng thử lại." và **không chuyển trang**. Log server lại cho thấy
`UPDATE Users SET PasswordHash = ...` đã chạy thành công, không có exception nào.

**Vì sao sai:** `POST /auth/logout` và `PUT /auth/change-password` trả
`ApiResponse<object>.Success("...")` — **không gán `data`**, nên `data` là `null`
**cả khi thành công**. Điều kiện `response.data === null` viết để bắt lỗi "máy chủ trả
về rỗng", nhưng lại dính vào một trường hợp hoàn toàn bình thường rồi ném lỗi.

**Đã sửa:** tách hai hàm, mỗi hàm một việc (nguyên lý SRP):

```ts
// Endpoint không mang dữ liệu: chỉ kiểm success, không có ý "data là gì"
function kiemTraThanhCong(response: ApiResponse<unknown>): void {
  if (!response.success) { throw new Error(response.message) }
}

// Endpoint có mang dữ liệu: bóc thêm, và báo lỗi nếu rỗng
function bocDuLieu<T>(response: ApiResponse<T>): T {
  kiemTraThanhCong(response)
  if (response.data === null) { throw new Error('Máy chủ trả về dữ liệu rỗng...') }
  return response.data
}
```

Kèm theo, sửa `layThongBaoLoi()` cho trả `error.message` khi lỗi do chính tầng service
ném ra. Trước đó hàm này chỉ biết `AxiosError`, nên mọi lỗi nội bộ đều bị quang về
một câu chung chung — mất nguyên nhân thật đúng lúc cần tìm lỗi.

**Bài học rút ra — "sai ở đâu":**

> 1. **Một hàm được viết để giải một bài toán, nhưng bị dùng cho bài toán khác** là
>    nguồn của lỗi. Khi viết hàm phải hỏi: "hết tham số này thì còn dùng được không?
>    Có biến nào là **thuộc tính bắt buộc có mặt** không?" Nếu có trường hợp hợp lệ
>    mà hàm lại coi là lỗi, hàm đó viết sai chính nó.
> 2. **Khai báo kiểu `T` không bao giờ đảm bảo hình thức.** `ApiResponse<T>` cho phép
>    `data` là `null` ngay cả khi `T` là `object`. Xem `ApiResponse<object>.Success(...)`
>    trong controller để biết endpoint nào thật sự có data.
> 3. **Khi UI báo lỗi chung chung "Đã xảy ra lỗi" mà log server không sai — đó là lỗi
>    phía giao diện chưa đọc log.** Đọc log trước đã đúng ở đây: máy chạy hết, database
>    cập nhật đúng, chỉ có lỗi ở lớp gọi API của client.
> 4. **51 ca kiểm thử tay phía API không bắt được lỗi này** vì lỗi nằm ở tầng client,
>    không nằm trong request/response. Chỉ mở trình duyệt thao tác thật mới thấy — đó là
>    lý do AGENTS.md yêu cầu 3 kịch bản cho mỗi chức năng.

## 26. File .ps1 lưu UTF-8 KHÔNG BOM sẽ bị PowerShell 5.1 đọc sai

**Sai ở đâu:** viết file `.ps1` có chứa chữ tiếng Việt, rồi chạy `& file.ps1` — PowerShell
báo lỗi parse:

```
Unexpected token '45' in expression or statement.
```

trong khi `Số 45` có gốc là dữ liệu hợp lệ. Lỗi nào là đọc **sai mã chữ** nên thông báo
về dấu chấm/số lại trỏ lên chỗ không liên quan.

**Nguyên nhân:** Windows PowerShell 5.1 đọc file script theo mã ANSI (cp1252) khi file
không có BOM, trong khi UTF-8 không BOM bị hiểu sai từng byte. Riêng **Windows
PowerShell 7+** luôn đọc UTF-8 nên không dính lỗi này — cùng một file, hai kết quả
khác nhau tuỳ phiên bản.

**Đã sửa:** thêm BOM trước khi chạy (làm 1 lần, dùng lại được):

```powershell
$p = "C:\temp\script.ps1"
$noiDung = [System.IO.File]::ReadAllText($p, [System.Text.Encoding]::UTF8)
[System.IO.File]::WriteAllText($p, $noiDung, (New-Object System.Text.UTF8Encoding($true)))
```

**Lần sau tránh thế nào:**

> 1. **Mọi file `.ps1` có tiếng Việt đều phải có BOM** khi chạy bằng Windows
>    PowerShell 5.1 (PowerShell 7+ thì không cần).
> 2. **Muốn chắc chắn thì đừng gõ tiếng Việt vào script** — đưa dữ liệu vào biến tại
>    chỗ khác, hoặc dùng `here-string` rồi ghi ra file cho chạy.
> 3. **Khi báo lỗi parse mà nhìn không liên quan giới hạn dòng đang có lỗi** (ví dụ lỗi
>    ở dòng 35 lại trỏ vào số 35) — do đọc sai mã chữ, dừng lại đọc lại. Đây là dấu hiệu
>    nhận biết nhanh nhất.
> 4. File Markdown/JSON nên để **không BOM** — công cụ đọc file đúng BOM sẽ tính ký tự
>    BOM là ký tự lạ ở đầu file và làm hỏng dòng đầu tiên.

## 27. Cổng 5173 bị chiếm bởi app khác chạy dưới pm2

**Sai ở đâu:** cấu hình Vite chạy ở cổng 5173 (chuẩn của Vite). Chạy `npm run dev` thì
báo "ready" nhưng gọi `/api/auth/login` qua cổng 5173 trả **404 rỗng**. Gọi trực tiếp
`http://localhost:5080/api/auth/login` thì trả **200 bình thường** — server ASP.NET Core
không có vấn đề gì.

**Nguyên nhân:** cổng 5173 đã bị một ứng dụng khác trên máy chiếm trước. Tìm process:

```powershell
$ket = Get-NetTCPConnection -LocalPort 5173 -State Listen
Get-CimInstance Win32_Process -Filter "ProcessId = $($ket[0].OwningProcess)" |
  Select-Object -ExpandProperty CommandLine
```

kết quả là `pm2\lib\ProcessContainerFork.js` — một project khác do pm2 quản lý. App đó
không phải Vite của dự án này nên nó trả 404 cho mọi đường dẫn lạ.

**Đã sửa:** chuyển Vite sang **5174** kèm `strictPort: true` (báo lỗi sớm nếu cổng bị
chiếm thay vì tự nhảy sang 5175), và thêm `localhost:5174` vào danh sách CORS bên server.
CORS chỉ là dự phòng — request đi qua proxy nên cùng origin, thực tế luồng dev không cần
CORS.

**Lần sau tránh thế nào:**

> 1. **Khi gọi API qua cổng của Vite mà nhận 404 rỗng, đừng nghi do server ASP.NET Core.**
>    Log server không có dòng nào, response rỗng không có body là ký hiệu Vite/SPA
>    fallback trả về chứ không phải API trả về.
> 2. **Trước khi chạy dự án, kiểm tra cổng đã bị chiếm chưa:**
>    `Get-NetTCPConnection -LocalPort <cổng> -State Listen`.
> 3. **Không tự tắt process lạ không rõ của ai** — process đang chạy là của người dùng,
>    tắt nhầm sẽ làm hỏng việc khác của họ. Phải đổi cổng cho dự án mình.
> 4. **`strictPort: true`** là mặc định đáng bật cho mọi dự án Vite: mặc định Vite tự
>    nhảy cổng khi cổng bị chiếm, người khác thấy app chạy ở 5175 sẽ tưởng lỗi code.
## 28. Repo từng public: khoá bí mật nằm trong lịch sử git, phải ĐỔI KHOÁ chứ không chỉ `git rm --cached`

**Bối cảnh:** Bước 2 khởi tạo project đã commit `appsettings.Development.json` (chứa
khoá JWT). Sang Bước 5 mới phát hiện và `git rm --cached` + thêm `.gitignore`. Nhưng
người dùng nhớ lại **repo từng là public** — tức khoá đó đã bị ai đó tải về.

**Sai ở đâu:** tưởng `git rm --cached` là đủ. Thực tế:

```powershell
git log --all --oneline -- server/HomeStay/appsettings.Development.json
# 18245ab feat: them chuc nang tai khoan ...
# 947ebde chore: khoi tao khung du an HomeStay (Moc 1)
# 2ba48b8 chore: khoi tao khung du an HomeStay (Moc 1)
```

Ba commit vẫn chứa đầy đủ khoá. Bất kỳ ai cũng lấy được bằng
`git show 2ba48b8:server/HomeStay/appsettings.Development.json`.

**Đã sửa — 3 việc, theo đúng thứ tự:**

1. **Sinh khoá mới bằng CSPRNG**, không dùng `[guid]::NewGuid()` hay `Get-Random`:

   ```powershell
   $bytes = New-Object byte[] 48
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   $rng.Dispose()
   $secret = -join ($bytes | ForEach-Object { $_.ToString('x2') })
   ```

   48 byte = 96 ký tự hex. `Guid` chỉ 122 bit lấy từ đồng hồ hệ thống và có 6 bit cố
   định ở đuôi — đoán được nếu biết thời điểm tạo. `Get-Random` không tạo được khóa
   mật mã, chỉ phù hợp để chọn số ngẫu nhiên.

2. **Ghi đè `Secret` trong `appsettings.Development.json`** (file này gitignore nên
   thay đổi không vào commit) rồi **khởi động lại API** — `IOptions` chỉ đọc cấu hình
   lúc khởi động, sửa file mà không restart thì vẫn dùng khoá cũ.

3. **Kiểm chứng token cũ thực sự chết**, không chỉ "đăng nhập được":

   | Ca | Kỳ vọng | Kết quả |
   |----|---------|---------|
   | Token ký bằng khoá mới gọi `/api/auth/me` | 200 | 200 |
   | Sửa 1 ký tự cuối chữ ký (mô phỏng token cũ) | 401 | 401 |
   | Không gửi token | 401 | 401 |
   | Sai mật khẩu | 401 | 401 |
   | `logout` trả `success=true`, `data=null` | đúng | đúng |

**Kèm theo — dọn nốt bí mật còn sót trong file đang được commit:**

`appsettings.json` (file NÀY được commit) chứa
`Password=homestay***` của MySQL trong Docker. Đã chuyển cả chuỗi kết nối sang
`appsettings.Development.json`, để lại trong `appsettings.json` một dòng chú thích
hướng dẫn, và thêm giá trị mẫu vào `appsettings.Development.example.json`.

**Lần sau tránh thế nào:**

> 1. **`.gitignore` chỉ có tác dụng với file chưa từng được track.** Muốn gỡ file đã
>    commit thì `git rm --cached` + thêm `.gitignore` (đã học ở mục 24).
> 2. **Bí mật đã lọt ra ngoài thì phải ĐỔI giá trị bí mật, không chỉ gỡ file.** Xoá
>    hậu quả của việc xoá (token cũ, mật khẩu cũ), giữ nguyên hậu quả của việc lọt.
> 3. **Cấu hình có mật khẩu nên nằm ở tên file có `Development`** — file đó gitignore
>    sẵn theo quy ước của chính ASP.NET Core, không phải nhớ thêm `.gitignore`.
> 4. **Đặt file bí mật ngoài git ngay từ commit đầu tiên**, đừng làm ở Bước 2 rồi xử
>    lý lại ở Bước 5. Chi phí 1 dòng `.gitignore` lúc tạo repo rẻ hơn nhiều lần
>    phải đổi khoá giữa chừng.
> 5. **Không dùng `git log` hiển thị nội dung bí mật.** Xem danh sách file từng bị
>    commit bằng `git log --oneline -- <đường dẫn>` — lệnh này chỉ in tên file, không
>    in nội dung.

## 29. Script kiểm chứng báo FAIL thì phải nghi ngờ chính script, không nghi ngờ app

**Bối cảnh:** chạy kiểm chứng sau khi đổi khoá JWT, 1 trong 5 ca báo `FAIL` dù
đọc log server thì rõ ràng server trả 401 đúng như mong đợi.

**Biểu hiện:**

```
PASS   | Token moi (chua khoa moi) goi /me            | ky vong 200 | thuc te 200
FAIL   | Token chu ky sai (mo phong token cu)         | ky vong 401 | thuc te 401
```

**Vì sao sai:** trong script có đoạn sửa 1 ký tự cuối chữ ký JWT:

```powershell
$kyDoi = $kyCu.Substring(0, $kyCu.Length - 1) + $(if ($kyCu[-1] -eq 'A') { 'B' } else { 'A' })
```

`$kyCu[-1]` là **chỉ số âm trên kiểu `String`**, PowerShell 5.1 **không hỗ trợ** và trả
`$null`. Vì vậy nhánh `if` luôn rơi vào `'A'`. Ở lần chạy đó ký tự cuối vốn đã là
`'w'`, nên chữ ký **bị sửa đúng một ký tự** — token thực sự hỏng. Nhưng ở lần chạy
sau, ký tự cuối lại **trùng `'A'`**, nên `Substring` cộng `'A'` cho ra y hệt chữ ký
cũ: token **không hỏng**, server trả 200, và ca đó báo FAIL.

Đã sửa thành `$kyCu[$kyCu.Length - 1]` (tính thủ công, đúng trên mọi phiên bản).

**Bài học rút ra:**

> 1. **Khi ca kiểm thử FAIL mà log server lại đúng, dừng lại và soi script trước.**
>    Đây là lần thứ hai trong dự án (lần đầu là script test tay tự vô hiệi vì hậu tố
>    timestamp gọi ở từng dòng). Script kiểm thử là **mã nguồn** — nó cũng có bug.
> 2. **Kịch bản kiểm thử phải "hỏng theo đúng cách mình cố ý tạo ra".** Sửa 1 ký tự
>    cuối là cách hỏng có kiểm soát. Nếu dùng cách hỏng phụ thuộc giá trị ngẫu nhiên
>    thì đôi khi ca kiểm thử lại **tự vô hiệu** mà không ai nhận ra — giống hệt
>    trường hợp "email trùng" luôn trả 201.
> 3. **In giá trị thật ra, đừng in lại giá trị kỳ vọng.** Bảng log trên cột "thực tế"
>    lại in đúng giá trị kỳ vọng nên nhìn tưởng đã đạt. Script kiểm thử mà hiển thị sai
>    thông tin thì tệ hơn không có script.
> 4. **PowerShell 5.1 không hỗ trợ chỉ số âm trên `String`** (`$s[-1]` trả `$null`), chỉ
>    hỗ trợ trên mảng. PowerShell 7 thì có — cùng một dòng code, hai kết quả khác
>    nhau tuỳ phiên bản.
## 30. `vi.mock` bị nâng lên đầu file, nên không được tham chiếu biến cấp module

**Biểu hiện:** test viết đúng ý, chạy thì báo:

```
Error: [vitest] There was an error when mocking a module. If you are using
"vi.mock" factory, make sure there are no top level variables inside, since this
call is hoisted to top of the file.
Caused by: ReferenceError: Cannot access 'mockPost' before initialization
```

**Vì sao sai:** `vi.mock(...)` được Vitest **nâng (hoist) lên trước cả các `import`**
để đảm bảo mock kịp sẵn sàng trước khi module được nạp. Hệ quả là hàm trả về
(factory) của nó chạy ở vị trí đó, nên không nhìn thấy `const mockPost = vi.fn()`
khai báo ở giữa file — biến chưa khởi tạo.

**Đã sửa:** bọc các biến trong `vi.hoisted`, hàm này tạo chúng **ở đúng vị trí được
nâng lên**:

```ts
const { mockPost, mockGet, mockPut } = vi.hoisted(() => ({
  mockPost: vi.fn(),
  mockGet: vi.fn(),
  mockPut: vi.fn(),
}))

vi.mock('../api/client', () => ({
  apiClient: { post: mockPost, get: mockGet, put: mockPut },
}))
```

**Lần sau tránh thế nào:**

> 1. **Gặp lỗi "before initialization" trong test là do `vi.mock`**, không phải do
>    vòng lặp import. Kiểm tra ngay: biến có nằm trong factory không.
> 2. **`vi.hoisted` là lời giải chuẩn** cho mọi biến mà factory cần dùng.
> 3. Cách còn lại là định nghĩa mock ngay trong factory, nhưng khi đó test không
>    truy cập được vào chúng để `expect(...).toHaveBeenCalled()`. Với mock cần
>    kiểm tra thì `vi.hoisted` là lựa chọn đúng.

## 31. Chặn mạng bằng `adapter` của axios, đừng gọi tay hàm xử lý lỗi

**Bài toán:** test phải chứng minh "401 thì tự làm mới token rồi thử lại request".

**Cách làm sai:** lấy trực tiếp hàm xử lý lỗi trong interceptor rồi gọi tay
(`apiClient.interceptors.response.handlers[0].rejected(loiGia)`).

**Vì sao không nên:** cách đó bỏ qua chính xác thứ mình muốn kiểm. Lỗi "không gắn
cờ đã thử lại" chỉ xảy ra khi request thật sự đi qua `apiClient(config)` một lần
nữa — gọi tay hàm thì không có vòng đi qua lại đó, nên code có vòng lặp vô hạn
vẫn xanh.

**Cách đúng:** thay tầng thực thi của axios, giữ nguyên toàn bộ chuỗi interceptor:

```ts
const adapterGoc = apiClient.defaults.adapter   // nhớ giữ lại để trả sau mỗi test

apiClient.defaults.adapter = async (config) => {
  throw loiTuMayChu(config, 401, null)          // giả lập token hết hạn
}
```

**Bài học:**

> 1. **Test tầng trung gian thì thay tầng dưới, đừng gọi tay tầng giữa.** Thay
>    `adapter` giữ được cả request-interceptor lẫn response-interceptor, và cả
>    đường thử lại qua `apiClient(config)`.
> 2. **Phải trả lại `apiClient.defaults.adapter` gốc sau mỗi test** (`afterEach`),
>    nếu không test này để lại adapter giả và test sau chạy trên nền giả — loại
>    rò trạng thái âm thầm khó nhất.
> 3. **Kiểu của adapter phải lấy từ axios**: `AxiosAdapter` và
>    `Parameters<AxiosAdapter>[0]`. Tự khai `config: { headers?: ... }` sẽ hỏng
>    `tsc` vì `config.headers` của axios là bắt buộc, không phải tuỳ chọn.
> 4. Thông báo tiếng Việt của server nằm ở **`error.response.data.message`**, KHÔNG
>    phải ở `error.message`. Dùng `await expect(...).rejects.toThrow('thông báo')`
>    sẽ **luôn đỏ dù code đúng** — phải bắt lỗi ra rồi tự kiểm
>    `(loi as AxiosError<T>).response?.data.message`.

## 32. `noUnusedLocals` bắt được code chết ngay lúc viết test

**Biểu hiện:** `tsc -b` báo

```
src/api/client.interceptor.test.ts(71,10): error TS6133: 'adapterThanhCong' is
declared but its value is never read.
```

**Vì sao xảy ra:** viết helper `adapterThanhCong()` xong thấy hai chỗ gọi đều cần
ghi thêm thao tác (bắt header vào biến) nên tạm viết inline, quên xoá helper.

**Đã sửa:** xoá hẳn, không giữ "có thể dùng sau này" — `AGENTS.md` 3.4 cấm code
thừa cho tương lai, và `noUnusedLocals` trong `tsconfig.app.json` là công cụ bắt
việc này. Cùng lúc đó `npm run lint` cũng báo `no-unused-vars` — hai cổng kiểm
trùng nhau là cố ý.

**Bài học:**

> 1. **Hai cổng kiểm (TypeScript + ESLint) cùng báo một lỗi là bình thường** —
>    không phải cấu hình thừa. Xem lỗi của cả hai, sửa một lần.
> 2. **Test file cũng phải qua `tsc -b` và `eslint`** vì chúng nằm trong `src`.
>    Đây là lợi thế của việc đặt test cạnh file được kiểm thử: không phải cấu
>    hình thêm gì, quy tắc cũ áp dụng luôn.
> 3. **Viết xong test phải chạy cả ba lệnh**: `npm test`, `npm run build`,
>    `npm run lint`. Chỉ chạy `npm test` thì lọt các lỗi kiểu và biến thừa.

## 33. Test phát hiện lỗi thật: nhánh `return false` mà quên dọn trạng thái

**Biểu hiện:** test `KhongCoRefreshToken_KhongGoiApi_RejectVaXoaPhien` đỏ:

```
AssertionError: expected 'token-het-han' to be null
```

**Nguyên nhân gốc:** trong `lamMoiToken()` của `api/client.ts`:

```ts
if (!refreshToken) {
  return false          // ← quên gọi xoaPhien()
}
```

Nhánh `catch` bên dưới thì có gọi `xoaPhien()`, còn nhánh này thì không. Hậu quả:
`accessToken` đã hết hạn vẫn còn trong store, nên `daDangNhap` vẫn `true`,
`ProtectedRoute` vẫn cho khách vào trang — nhưng mọi request sau đó đều 401.
Người dùng bị **kẹt ở một trang không dùng được mà không hiểu vì sao**, thay vì
được đưa về trang đăng nhập.

**Đã sửa:** thêm `xoaPhien()` vào nhánh đó.

**Bài học:**

> 1. **Khi một hàm có nhiều nhánh "thất bại", mỗi nhánh phải dọn trạng thái như
>    nhau.** Nhánh nào quên là nhánh đó để lại dữ liệu nửa vời.
> 2. **Trạng thái "đã đăng nhập" được suy ra từ `accessToken`**, nên giữ lại token
>    chết tệ hơn xoá hẳn. Khi đã hết cách gia hạn thì cách duy nhất đúng là
>    coi như chưa đăng nhập.
> 3. **Lỗi này 147 unit test backend không bắt được vì nằm ở tầng client**, và
>    kiểm thử tay cũng khó bắt vì cần tạo ra trạng thái "có access token nhưng
>    không có refresh token" — điều mà bình thường không xảy ra. Test tạo được
>    trạng thái đó trong 5 dòng.
> 4. Đây là ca thứ hai cho thấy **kiểm thử tay không thay thế được unit test**:
>    lần trước là `bocDuLieu`, lần này là `lamMoiToken`.
## 34. Unit test ở SAI TẦNG cho xanh giả — bài học đắt nhất của đợt quét code

**Bối cảnh:** quét code tìm thấy lỗi này trong `AuthService.cs`:

```csharp
if (matKhau.Length > AuthRules.MaxPasswordLength)
{
    throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.MatKhauQuaNgan);
    //                                                     ^^^^^^^^^^^^^^
    //  "Mật khẩu phải có ít nhất 6 ký tự" — báo cho người dùng nhập 150 ký tự
}
```

Người dùng nhập mật khẩu 150 ký tự sẽ đọc "Mật khẩu phải có ít nhất 6 ký tự", rút
xuống 6 ký tự, rồi lại thấy vẫn lỗi. Rõ ràng là sai.

**Cách sửa — và cách sửa sai:**

1. **Sửa trong Service** (đúng một phần): tách thông báo "quá ngắn" và "quá dài".
2. **Viết unit test gọi thẳng Service** → **3/3 test xanh**.
3. **Gọi API thật** → **vẫn trả thông báo CŨ**.

**Vì sao?** Với `[ApiController]`, ASP.NET Core kiểm tra ModelState **trước khi** gọi
tầng Service:

```
Request → ModelBinding + DataAnnotations → [ApiController] chặn 400 → Controller → Service
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                              LỖI NẰM Ở ĐÂY
```

DTO khai:

```csharp
[StringLength(100, MinimumLength = 6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
```

`StringLength` mang **một** thông báo cho **cả hai** ràng buộc. Mật khẩu 150 ký tự vi
phạm ràng buộc dài → framework in ra đúng thông báo "ít nhất 6 ký tự". Code trong
Service **không bao giờ chạy**, nên sửa ở đó vô hiệu.

**Đã sửa thật** — tách hai attribute, mỗi ràng buộc một thông báo:

```csharp
[MinLength(AuthRules.MinPasswordLength, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự")]
[StringLength(AuthRules.MaxPasswordLength, ErrorMessage = "Mật khẩu không được vượt quá 100 ký tự")]
```

`MinLength` chỉ fail khi ngắn, `StringLength` chỉ fail khi dài → mỗi nhánh báo đúng
thông báo của nó.

**Và thêm test ở đúng tầng** — gọi đúng thứ framework gọi:

```csharp
ValidationContext context = new(duLieu);
List<ValidationResult> ketQua = new();
Validator.TryValidateObject(duLieu, context, ketQua, validateAllProperties: true);
```

**Bài học:**

> 1. **Test xanh KHÔNG chứng minh là đúng — phải hỏi "test này gọi tới tầng nào".**
>    Test gọi Service thì không đụng tới ModelState. Test cả hai thì mới phủ hết.
> 2. **Mỗi tầng có bộ quy tắc riêng. Sửa một tầng mà tầng trên chặn trước thì sửa
>    vô hiệu.** Trước khi sửa, hỏi: "request này có tới được chỗ tôi sửa không?"
> 3. **Luôn kiểm chứng lại bằng cách gọi thật sau khi unit test xanh.** Ở đây chính
>    việc gọi API mới phát hiện ra test xanh giả. Nếu tin test là đủ thì lỗi này sẽ
>    lên tới bảo vệ.
> 4. **`[StringLength(n, MinimumLength = m, ErrorMessage = "...")]` là cái bẫy**:
>    một thông báo cho hai ràng buộc trái chiều. Tách `[MinLength]` và `[StringLength]`
>    khi hai ràng buộc cần hai thông báo khác nhau.
> 5. **Test mới phải trả lời được "nó bắt được lỗi gì"**. `AuthDtoValidationTests`
>    có ca tên rõ ràng: `RegisterRequest_MatKhauQuaDai_BaoDungThongBaoQuaDai`.

## 35. `TokenValidationParameters` viết lặp 2 nơi — lỗi âm thầm đắt nhất

**Biểu hiện:** khối cấu hình kiểm token (8 thuộc tính) bị viết giống nhau ở hai chỗ:

- `Program.cs` — cho `AddJwtBearer`, dùng khi **kiểm** token đến
- `JwtTokenService.TaoThamSoKiemTra()` — dùng khi **tự đọc** token

**Vì sao nguy hiểm:** không phải vì dài, mà vì hai chỗ phải khớp nhau **luôn**. Khi token
được ký bằng cấu hình mới (đổi khoá, đổi issuer) mà chỗ kiểm vẫn dùng cấu hình cũ
thì **mọi token đều bị từ chối**, log chỉ hiện "token không hợp lệ", không ai đoán ra
lý do. Sửa một chỗ mà quên chỗ kia là kiểu lỗi dễ gây nhất.

Ngoài ra `ClockSkew = TimeSpan.FromSeconds(30)` còn là magic number lặp 2 nơi.

**Đã sửa:** tách `TokenValidationFactory.Tao(JwtOptions)` — một chỗ duy nhất, kèm
hằng số `DoLechPhepTinhGiay = 30`. Cả hai nơi gọi chung.

**Bài học:**

> 1. **Cấu hình kiểm chữ ký phải có MỘT nguồn.** Hai chỗ dùng chung một bản sao là
>    chờ một lần sai.
> 2. **Khi gặp khối cấu hình bị lặp, hỏi "có chỗ nào phải LUÔN khớp với nó không?"**
>    Nếu có → tìm nơi sinh nó thay vì chép lại. Nếu không → có thể để riêng.
> 3. **Magic number lặp 2 nơi cũng nên gộp**, kể cả khi giá trị hiện tại vô hại.
>    "Vô hại lúc này" là lý do của hầu hết lỗi tương lai.

## 36. Cột CSDL và claim "ghi mà không ai đọc" — đừng vội xoá, cũng đừng để gây hiểu nhầm

Khi quét code, phát hiện:

| Phát hiện | Xử lý đúng |
|-----------|-------------|
| `User.RefreshTokenExpiresAt` — ghi 3 chỗ, **đọc 0 chỗ** (hết hạn thật do claim `exp` trong JWT quyết định) | **Giữ**, nhưng sửa comment. Cột này hữu ích khi cần tra cứu mà không muốn giải mã token. Comment cũ ghi *"Thời điểm refresh token hiện hành hết hạn"* khiến người đọc tưởng sửa ở đây là sửa được luật hết hạn → ghi rõ "không tham gia quyết định" |
| `JwtTokenService.RoleClaimType` — ký claim quyền vào access token, **chưa nơi nào đọc** | **Giữ**. Sẽ dùng cho `[Authorize(Roles = ...)]` ở Bước 14. Xoá bây giờ thì Bước 14 phải làm lại |
| `BookingRules.CleaningHoursAfterCheckout` — khai báo, **không ai dùng, kể cả test** | **Xoá**. `AGENTS.md` 3.4 cấm code thừa cho tương lai. Ghi chú trong file rằng sẽ thêm lại ở Bước 10 kèm unit test |
| `AuthRules.RefreshTokenHashLength` — khai báo, **không ai dùng** (`HomeStayDbContext` viết thẳng `100`) | **Xoá** |
| `Common/ErrorCodes.cs` — 30 dòng, **0 tham chiếu** | **Xoá cả file**. Quy tắc 400 vs 409 mà nó ghi lại đã nằm ở `AGENTS.md` mục 6.5 — giữ hai bản sao là tự tạo nguồn sự thật thứ hai |

**Bài học — phân biệt ba loại "không ai dùng":**

> 1. **Chết vì quên** → xoá (`ErrorCodes`, `CleaningHoursAfterCheckout`,
>    `RefreshTokenHashLength`).
> 2. **Chết vì chưa tới lúc** → giữ, ghi chú lý do (`RoleClaimType` chờ Bước 14).
> 3. **Không dùng để quyết định, nhưng hữu ích khi tra cứu** → giữ, **sửa comment cho
>    đúng** (`RefreshTokenExpiresAt`).
>
> Xoá nhầm loại 2 là mất công làm lại; xoá nhầm loại 3 là mất một cột tra cứu. Cả hai
> đều tệ hơn việc comment nói rõ. Xoá cả loại 1 mới là đúng, và phải xoá kèm cập
> nhật tài liệu có nhắc tới nó (`todo.md` có dòng liệt kê `ErrorCodes.cs`).

## 37. Bốn lần lặp `if (user is null) throw NotFound` — gộp thành 2 hàm

**Biểu hiện:** trong `AuthService` có 4 chỗ:

```csharp
User? user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);

if (user is null)
{
    throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayNguoiDung);
}
```

Khác biệt duy nhất là 3 chỗ dùng truy vấn có theo dõi thay đổi (để rồi sửa) và 1 chỗ
dùng `AsNoTracking()` (chỉ đọc).

**Đã sửa:** 2 hàm riêng tư, tên nói rõ dùng để làm gì:

```csharp
private async Task<User> TaiTaiKhoanDeGhiAsync(int userId, CancellationToken ct)   // có theo dõi
private async Task<User> TaiTaiKhoanDeDocAsync(int userId, CancellationToken ct)  // AsNoTracking
private static void VoHieuHoaPhien(User user)                                   // xoá 2 trường token
```

Gọi còn một dòng: `User user = await TaiTaiKhoanDeGhiAsync(userId, ct);`

**Bài học:**

> 1. **Sau khi gộp 4 chỗ thành 1 dòng, mỗi hàm nghiệp vụ ngắn hơn vàng** — `DangKyAsync`
>    vốn đã sát ngưỡng 40 dòng của `AGENTS.md` 3.1.
> 2. **Đặt tên hai bản sao cho khác nhau** (`DeGhi` / `DeDoc`) để người đọc biết chỗ
>    nào được sửa, chỗ nào không. Đây là lý do không gộp thành một hàm có tham số
>    `bool theoDoi` — tham số bool làm mất thông tin quan trọng ngay tại chỗ gọi.
> 3. **`?? throw` rút gọn 4 dòng thành 1**, nhưng dùng khi **loại trả về đã biết là
>    non-null sau khi kiểm** — đừng dùng để bịt lỗi null ở nơi chưa kiểm tra.

## 38. Access token không đổi sau khi làm mới — đặc tính chuẩn của JWT, KHÔNG phải lỗi

**Phát hiện khi kiểm chứng:** làm mới phiên ngay sau đăng nhập thì access token **giống
hệt** token cũ, và token cũ vẫn dùng được sau khi đăng xuất.

**Điều tra:**

- Refresh token **có** claim `jti` (`Guid.NewGuid()`) → mỗi lần phát hành đều khác nhau,
  nên làm mới phiên luôn đổi được refresh token. Đây là chủ ý, xem `lessons.md` mục 21.
- Access token **không có** `jti`; nội dung nó chỉ gồm `(userId, email, role, exp)`, mà
  `exp` tính theo **giây**. Hai lần phát hành trong cùng một giây cho ra hai chuỗi
  **giống hệt nhau**.

**Kết luận: đây là đặc tính của JWT, không phải lỗi.** Thêm `jti` vào access token
cũng không giúp ích về mặt thu hồi, vì không có danh sách chặn để đối chiếu — token bị
đánh cắp vẫn dùng được tới hết hạn dù có `jti` hay không.

Điểm cần nói rõ khi bảo vệ: **đăng xuất thu hồi được refresh token, không thu hồi được
access token đang cầm trong tay** (tối đa 1 giờ). Đây là đánh đổi tiêu chuẩn của token
tự chứa, đã ghi ở mục giới hạn trong báo cáo. Muốn thu hồi được thì phải lưu token vào
CSDL và kiểm tra mỗi request — tốn một truy vấn cho mọi API, quá đắt ở phạm vi đồ án.

**Bài học:**

> 1. **Khi kiểm chứng ra kết quả lạ, dừng lại điều tra trước khi kết luận là lỗi.**
>    Hai dòng script kiểm thử báo "SAI" nhưng cả hai đều là **tiêu chí của script viết
>    sai**, không phải hành vi sai của ứng dụng.
> 2. **Cần phân biệt "kết quả lạ" với "lỗi".** Lạ = chưa giải thích được. Lỗi = đã
>    giải thích và trách nhiệm rõ ràng. Sửa nhầm chỗ không lỗi là gây hại lớn nhất.
> 3. **Tiêu chí kiểm thử phải viết ra lý do.** Script của tôi giả định "token phải đổi"
>    mà không ghi lý do — nên khi đọc lại thấy "SAI" mà tưởng code hỏng.
## 39. Điều hướng chi tiết bằng chỉ số khi response không được lộ `Id`

**Bài toán:** `AGENTS.md` 6.3 cấm danh sách trả `Id`, nhưng trang chi tiết cần biết
hiện địa điểm nào. Ba phương án đã cân nhắc:

| Phương án | Vì sao loại / chọn |
|-----------|-------------------|
| List trả `Id` để link `/locations/{id}` | Vi phạm quy tắc bất biến — loại ngay |
| Thêm cột `Slug`/`Code` rồi link theo slug | Phải migration + seed lại + đồng bộ cách sinh slug hai ngôn ngữ — quá đắt cho 3 địa điểm |
| **Nhúng phòng tóm tắt vào response list, điều hướng bằng chỉ số** (`/locations/0`) | **Chọn.** Dữ liệu nhỏ (3 địa điểm, 10 phòng). Không endpoint chết (YAGNI). Chi tiết đọc từ cache TanStack Query của list. STT = chỉ số + 1 khớp luôn quy tắc hiển thị |

**Điều kiện để phương án này đúng** (ghi rõ để Bước 8 tự kiểm lại, không áp dụng mù):

1. Dữ liệu NHỎ — nhúng toàn bộ vào list vẫn nhẹ.
2. Thứ tự ỔN ĐỊNH — `OrderBy Id` giống nhau trên MySQL và InMemory (sắp theo tên thì
   collation hai nơi khác nhau, test chập chờn mà không ai hiểu vì sao).
3. Chỉ số SAI phải có trang báo lỗi — `/locations/99` hiện "Không tìm thấy", không
   trắng màn. Test có ca `it.each(['/locations/99', '/locations/-1', '/locations/abc'])`.

**Bài học:**

> 1. **Khi quy tắc chặn đường thẳng, liệt kê phương án ra rồi loại dần bằng chính
>    các nguyên tắc trong AGENTS.md** (6.3, YAGNI, test được) — không đoán, không
>    phá quy tắc lén.
> 2. **Quyết định kiến trúc phải ghi vào `todo.md` TRƯỚC khi code** (mục "Quyết định
>    đã chốt"), kèm điều kiện đúng để bước sau tự kiểm lại.
> 3. Phương án này KHÔNG dùng được khi dữ liệu lớn hoặc cần chia sẻ link ổn định
>    lâu dài (thêm/xoá địa điểm làm lệch chỉ số) — lúc đó phải quay lại phương án
>    slug. Ghi rõ giới hạn để người sau không áp dụng mù.

## 40. Viết test sai rồi mới biết mình hiểu sai trang — lỗi ở test, không phải code

**Biểu hiện:** test `DiaDiemKhongPhong_KhongHienGia` đỏ:

```
expected document not to contain element, found <span ...>Từ 900.000 ₫/ngày</span>
```

**Vì sao sai:** trang có HAI địa điểm, địa điểm đầu CÓ phòng nên dòng giá tồn tại
trên trang là đúng. Assert `queryByText` toàn trang là assert sai phạm vi — muốn
chứng minh "thẻ Đà Lạt không hiện giá" mà lại kiểm cả trang.

**Đã sửa:** đổi thành đếm — chỉ có đúng 1 dòng giá trên toàn trang
(`getAllByText(...).toHaveLength(1)`), vì chỉ 1/2 địa điểm có phòng.

**Bài học:**

> 1. **Test đỏ thì đọc kỹ thông báo trước khi đụng vào code.** Ở đây thông báo nói
>    rõ span tồn tại — tức trang đúng, test sai. Sửa code theo test sai là gây lỗi
>    thật (ẩn giá của địa điểm có phòng).
> 2. **Assert phạm vi hẹp đúng chỗ cần kiểm.** Kiểm thẻ nào thì tìm trong thẻ đó
>    (hoặc đếm toàn trang khi số lượng đã biết trước), đừng `queryByText` toàn
>    `document` rồi kết luận về một phần tử.
> 3. Đây là lần thứ ba "test báo FAIL mà app đúng" (sau mục 29) — thành quy luật:
>    **nghi ngờ script kiểm thử trước khi nghi ngờ code**, nhưng phải đọc bằng
>    chứng rồi mới kết luận bên nào sai.
## 41. `z.coerce.number('')` cho ra `0` — ô lọc để trống thành lọc "từ 0"

**Biểu hiện:** test `OTrong_ChuyenThanhNull_KhongBaoLoi` đỏ. Ô giá để trống phải
nghĩa là "không giới hạn", nhưng schema ép thành `0` rồi gửi `minPrice=0` lên —
kết quả vẫn đúng (giá nào cũng ≥ 0) nhưng sai ý: URL thừa tham số, và với ô "số
khách" thì `0` lại **báo lỗi** (số khách phải ≥ 1) dù người dùng chỉ xoá ô.

**Nguyên nhân:** `Number('') === 0` trong JavaScript, nên `z.coerce.number()`
không bao giờ thấy chuỗi rỗng. Phải tiền xử lý trước khi ép kiểu:

```ts
z.preprocess(
  (giaTri) => (giaTri === '' || giaTri === null || giaTri === undefined ? null : giaTri),
  z.coerce.number().min(...).max(...).nullable(),
)
```

**Bài học:**

> 1. **Ô nhập số trong form LỌC khác ô nhập số trong form ĐĂNG KÝ.** Form đăng ký:
>    trống là lỗi. Form lọc: trống là "không giới hạn". Cùng một component `Input`
>    nhưng hai ngữ nghĩa — schema phải nói rõ bằng `nullable()`.
> 2. **Không tin直觉 về ép kiểu JavaScript.** `Number('')` ra `0`, không ra `NaN`.
>    Chỗ nào ép kiểu thì viết test cho đầu vào rỗng trước tiên.
> 3. Test này bắt được lỗi mà kiểm thử tay khó thấy: gửi `minPrice=0` thừa vẫn cho
>    kết quả đúng, nên bấm tay không bao giờ phát hiện — chỉ đọc URL hoặc test
>    mới thấy.

## 42. Quên `beforeEach(mockReset)` — `mock.calls[0]` của test sau là cuộc gọi cũ

**Biểu hiện:** test `CoBoLoc_GuiDuThamSoCoGiaTri` đỏ với `expected null to be
'Hạnh Phúc'`. URL không có `keyword` vì đọc nhầm cuộc gọi của test trước
(test "không lọc" không gửi keyword).

**Đã sửa:** thêm `beforeEach(() => mockGet.mockReset())`. Đây là lần thứ hai mắc
đúng lỗi này trong dự án (lần đầu ở `ProtectedRoute.test.tsx`).

**Bài học:**

> 1. **Mọi file test dùng mock function đều phải có `beforeEach(mockReset)`** —
>    không ngoại lệ. Viết mock là viết kèm reset, như viết `IDisposable` là phải
>    `Dispose`.
> 2. Khi test assert trên `mock.calls[N]` mà ra giá trị lạ, kiểm tra đầu tiên là
>    "đây có phải cuộc gọi của test này không" — in `mock.calls.length` ra là
>    thấy ngay.
## 43. Mở rộng response có sẵn thay vì thêm endpoint mới

**Bài toán:** trang chi tiết phòng cần mô tả + ảnh + tiện nghi + đánh giá, nhưng
`AGENTS.md` cấm `Id` trong response nên không gọi `/rooms/{id}` được.

**Đã chọn:** thêm 4 trường vào `RoomDetailDto` trong response `GET /api/locations`
đang có, thay vì tạo endpoint mới. Ba lý do:

1. Dữ liệu nhỏ (10 phòng) — response to thêm vài KB, không đáng kể.
2. Không endpoint chết: trang chi tiết đọc từ cache của list (YAGNI).
3. Không phá quy tắc `Id`: `RoomReviewDto` chỉ có tên người viết, quét JSON sạch
   cả `userId`/`bookingId`.

**Điều kiện để cách này đúng** (ghi để bước sau không áp dụng mù): dữ liệu phải
NHỎ và đọc KÉM thay đổi. Khi nào danh sách lớn hoặc chi tiết đắt (video, lịch sử
dài) thì phải tách endpoint riêng có phân trang.

## 44. Khung chọn ngày tách riêng để Bước 10 dùng lại, chưa có nút đặt

**Bài toán:** kế hoạch Bước 8 ghi "khung chọn ngày" nhưng nút "Đặt phòng" thuộc
Bước 10. Ba phương án:

| Phương án | Vì sao loại / chọn |
|-----------|-------------------|
| Làm luôn nút đặt gọi API tạm | API chưa có — nút gọi vào khoảng trống |
| Nút mờ ghi "sắp có" | UI chết nhưng có lý do — vẫn là UI chết |
| **Khung chỉ chọn + ước tính, không nút** | **Chọn.** Tách `RoomDateFrame.tsx` để Bước 10 import lại. Không có gì thừa, không có gì chết |

**Bài học:**

> 1. **Ranh giới bước phải cắt ở chỗ không để lại UI chết.** Khung chọn ngày là
>    phần dùng chung được — tách component từ bây giờ, Bước 10 chỉ việc thêm nút.
> 2. **Giá tạm tính ghi rõ "tạm tính".** Công thức sao đúng `BookingCalculator`
>    (có test hai bên), nhưng số cuối cùng do backend tính khi tạo đơn — nói rõ
>    để người dùng không kiện khi hai số lệch nhau vì quy tắc đổi sau này.
## 45. Thứ tự kiểm tra: lỗi hình thức trước, 404 sau

**Biểu hiện:** 2 test đỏ — `DatGapDuoi2Gio` và `TheoGioDuoi3Gio` đều kỳ vọng 400
nhưng nhận 404. Test dựng DB rỗng (không có phòng nào) rồi gọi với ngày sai.

**Nguyên nhân:** service tìm phòng TRƯỚC khi kiểm ngày. DB rỗng → 404 phủ mất lỗi
ngày mà test muốn kiểm.

**Đã sửa:** chuyển kiểm hình thức (thiếu ngày, trả ≤ nhận, đặt gấp, dưới 3 giờ)
lên trước, tìm phòng sau. Quy tắc: **lỗi hình thức của request báo trước, lỗi
tài nguyên (404) báo sau** — request sai hình thức thì phòng nào cũng sai, không
cần tốn truy vấn tìm phòng.

**Bài học:**

> 1. **Thứ tự kiểm tra trong service là một quyết định, không phải ngẫu nhiên.**
>    Hình thức → tồn tại → nghiệp vụ → xung đột. Viết thứ tự này vào comment để
>    người sau không đảo lại.
> 2. **Test đỏ không phải lúc nào cũng sai test.** Ở đây test đúng (ngày sai phải
>    400 dù phòng có tồn tại hay không), code sai thứ tự. Đọc kỹ trước khi sửa
>    bên nào — ngược với mục 40.

## 46. "Bận" là kết quả, không phải lỗi — endpoint truy vấn trả 200 + cờ

**Bài toán:** phòng trùng đơn thì API trả gì — 409 như khi tạo đơn, hay 200 kèm
`isAvailable: false`?

**Đã chọn 200 + cờ.** Vì đây là TRUY VẤN (hỏi), không phải LỆNH (làm). "Bận" là
câu trả lời hợp lệ, giống "còn 0 phòng". Chỉ tham số sai hình thức (400) và
phòng không tồn tại (404) mới là lỗi. Khi TẠO đơn trùng ở Bước 10 thì mới 409 —
đó mới là xung đột nghiệp vụ thật (AGENTS.md 6.5).

**Bài học:**

> 1. **Phân biệt truy vấn và lệnh khi chọn mã lỗi.** GET mà trả 4xx cho kết quả
>    "không" thì client phải `try/catch` để đọc một câu trả lời bình thường —
>    sai ngữ nghĩa HTTP.
> 2. Quyết định này phải ghi vào `todo.md` TRƯỚC khi code (bảng quyết định #3),
>    vì người đọc code sẽ thắc mắc "sao trùng mà không 409" — câu trả lời nằm ở
>    kế hoạch, không nằm trong code.
## 47. InMemory ném lỗi khi `BeginTransaction` — sửa ở factory test

**Biểu hiện:** toàn bộ 12 test `BookingServiceTests` đỏ với:

```
System.InvalidOperationException: An error was generated for warning
'...TransactionIgnoredWarning': Transactions are not supported by the
in-memory store.
```

**Nguyên nhân:** provider InMemory không thực thi transaction thật, và mặc định
cấu hình "cảnh báo thành lỗi" nên `BeginTransactionAsync` ném exception thay vì
chạy tiếp.

**Đã sửa** trong `TestDbContextFactory.Create()` (chỉ chạm test, không đụng
production):

```csharp
.ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
```

**Giới hạn phải nhớ (đã ghi trong comment của factory):** bỏ qua cảnh báo thì test
chạy được, nhưng chống trùng ĐỒNG THỜI không chứng minh được bằng InMemory —
hai transaction song song trong InMemory không khoá nhau như MySQL. Phần này
chứng minh bằng test tay 2 tab trên DB thật (TAB1 201 + TAB2 409).

**Bài học:**

> 1. **Test infra cũng là code sản phẩm** — sửa factory một chỗ, 12 test xanh lại
>    mà không phải đụng vào logic nào. Đừng sửa từng test để né lỗi hạ tầng.
> 2. **Khi bỏ qua một cảnh báo, ghi rõ cái gì KHÔNG còn được bảo vệ.** Bỏ qua
>    `TransactionIgnoredWarning` mà không ghi chú thì người sau tưởng transaction
>    đã được test.
> 3. **Mỗi tầng kiểm chứng có giới hạn riêng:** unit test chứng minh logic đúng
>    từng bước; đồng thời chứng minh bằng tay trên môi trường thật. Không tầng
>    nào thay được tầng nào.

## 48. Schema Zod đóng băng giá trị lúc mount — kiểm động lúc submit

**Biểu hiện:** 3 test `Booking.test.tsx` đỏ — bấm submit mà form im lặng, không
lỗi, không gọi API. Điều tra: `zodResolver(schemaDatPhong(phong?.capacity ?? 1))`
dựng MỘT LẦN lúc mount, khi phòng còn chưa tải xong nên `max` đóng băng ở 1.
Nhập 2 khách (đúng) cũng bị loại, mà lỗi hiện dưới ô nên test tìm "không thấy gì".

**Đã sửa:** schema chỉ giữ phần TĨNH (`guestCount ≥ 1`, ghi chú ≤ 500); sức chứa
kiểm lúc submit trong `Booking.tsx` khi phòng chắc chắn đã có:

```ts
if (duLieu.guestCount > phong.capacity) {
  setError('guestCount', { message: `Phòng chỉ chứa tối đa ${phong.capacity} khách` })
  return
}
```

**Bài học:**

> 1. **Giá trị động (tải sau) không được đóng băng trong schema dựng lúc mount.**
>    Quy tắc: cái gì có sẵn lúc mount thì cho vào schema; cái gì đến sau thì kiểm
>    lúc submit. Vi phạm là người dùng nhập đúng vẫn bị chặn mà không hiểu vì sao.
> 2. **Form im lặng sau khi bấm submit là dấu hiệu validation chặn mà lỗi không
>    hiện.** Kiểm tra ngay: lỗi có render không, hay resolver nuốt mất.
> 3. Đây là lỗi THẬT do test phát hiện (lần thứ ba trong dự án) — kiểm thử tay khó
>    thấy vì tester thường nhập đúng sức chứa, không nhập thừa để thử.

## 49. Nút submit `disabled` đến khi kiểm trống xong — test bấm quá sớm

**Biểu hiện:** test bấm "Xác nhận đặt phòng" mà không có gì xảy ra. Vì nút
`disabled={!duocDat}` — `duocDat` chỉ true khi query kiểm trống xong. Test bấm
ngay khi tiêu đề hiện (query chưa về) nên bấm vào nút khoá.

**Đã sửa:** đợi `findByText('Phòng còn trống trong khoảng đã chọn')` rồi mới bấm.
Đây là hành vi ĐÚNG của app (không cho đặt khi chưa biết trống/bận), test phải
tôn trọng chứ không được bỏ `disabled` để test cho dễ.

**Bài học:**

> 1. **Test phải đợi app sẵn sàng như người dùng đợi.** Người dùng nhìn thấy nút
>    mở mới bấm; test cũng phải đợi tín hiệu đó. Bấm sớm là test sai thực tế.
> 2. **Đừng sửa app để test dễ hơn** (ví dụ bỏ `disabled`). Chiều đúng là sửa
>    test cho giống người dùng thật.
> 3. Nút khoá khi chưa đủ điều kiện là mẫu tốt cho mọi form phụ thuộc API:
>    chặn được cả bấm đúp gửi 2 request.

---

## 50. `useMutation` cua TanStack Query goi `mutationFn` BAT DONG BO

**Bieu hien (Buoc 13):** 3 test "bam nut -> kiem tra service duoc goi" deu fail
voi `expected "spy" to be called with arguments: [ 'HS-01' ]` / `Number of calls: 0`,
du tren trinh duyet bam nut chay hoan hao.

**Vi sao:** `mutate()` khong goi `mutationFn` ngay. No di qua `MutationObserver`
-> `Mutation.execute()` trong mot chuoi promise, nen `mutationFn` chay o
**microtask ke tiep**. Kha nhin dong bo ngay sau `fireEvent.click` se luon fail
du code dung hoan toan.

**Da sua:** boc `await waitFor(() => expect(mock).toHaveBeenCalledWith(...))`.

**Lien quan — `not.toHaveBeenCalled()` cung vo nghia theo ly do do:** muon chung
minh API *khong* duoc goi thi phai `await waitFor(...)` mot cai gi do truoc
(chang han doi bang render lai), roi moi kha nhin `not.toHaveBeenCalled()`.

**Bai hoc:**

> Test do KHONG dong nghia code sai. Truoc khi sua app, hoi: "cai ma test dang
> kha nhin co dung khong?" — o day cach kha nhin sai (thieu `await`), khong phai
> hanh vi app sai.

---

## 51. `getByText` khop CHINH XAC, ke ca dau cham cuoi cau

**Bieu hien (Buoc 13):** test tim `'Khong co don nao khop bo loc hien tai'` bao
`Unable to find an element with the text`, **trong khi `<p>` do co that trong
DOM** (da kiem bang cach dump DOM tho).

**Vi sao:** `getByText('chuoi')` so khop **bang toan bo** text da chuan hoa cua
phan tu, khong phai "co chua". Component viet `...hien tai.` (co dau cham) con
test viet khong co dau cham -> khong khop.

**Da sua:** them dau cham vao chuoi trong test.

**Bai hoc:**

> 1. Muon so khop mot phan thi dung `regex`, dung dua vao viec bo dau cham.
> 2. Khi test bao "khong tim thay" ma ban tin chac phan tu co that, **in DOM tho ra
>    xem** (`vitest` in `<body>` trong phan loi) truoc khi doan nguyen nhan.

---

## 52. Nhan trung nhau giua `<option>` loc va the hien thi — phai khoanh vung truy van

**Bieu hien (Buoc 13):** `getByText('Da xac nhan')` bao `Found multiple elements`
— vi "Da xac nhan" vua la `<option>` trong o loc trang thai, vua la the trang
thai trong bang.

**Da sua:** dung `within(screen.getByRole('table')).getByText(...)` de chi tra
trong bang. Ap dung cho ca chu "ma don" khi form chi tiet dang mo (ma hien o ca
tieu de form lan dong bang).

**Bai hoc:**

> Khi mot nhan duoc dung o nhieu noi tren cung trang, truy van bang chuoi tran
> la khong dang tin. `within(container)` la cong cu chuan de thu hop pham vi.

---

## 53. Cot bang Admin qua rong — "Thao tac" bi day khoi man hinh

**Bieu hien (Buoc 13):** bang don co 9 cot, cot "Thao tac" nam ngoai vung nhin
o man 1440px, ma do la cot quan trong nhat.

**Da sua (3 viec, deu deu nhau):**

1. Them `whitespace-nowrap` cho ma don / tien / thoi gian — truoc do ma don
   `HS-261003-0014` bi vo thanh 3 dong lam dong bang cao gap rut.
2. Gop cot "So khach" vao cot "Phong" (`{co so} · {n} khach`) de giam 1 cot.
3. Ha `min-w` tu 1000px xuong 880px.

**Bai hoc:**

> Khi bang qua rong, **dung cu them cot** — hay gop thong tin phu vao dong thu hai
> cua mot o da co. Cot quan trong (thao tac) phai nam trong man hinh, khong phai
> cot du lieu bi hy sinh.

---

## 54. Test dùng dữ liệu `00:00` giấu bug cắt cụt phần giờ — Bước 15

**Sai ở đâu:** `DemSoNgayTrongKhoang` trả `(den - tu).Days`.
Đơn nhận phòng **14:00 ngày 09**, trả phòng **12:00 ngày 11** = 46 giờ.
`(den - tu).Days` cắt cụt phần thập phân nên ra **1**, nhưng khách đã ở **2 đêm**
(đêm 09 và đêm 10). Tỷ lệ lấp đầy ra `2/300` thay vì `4/300`.

**Vì sao sai:** vì **toàn bộ test** của mình dùng `DateTime.Now.Date.AddDays(-10)` —
tức **00:00:00**. Không test nào có phần giờ, nên phần giờ bị cắt cụt không bao giờ
lộ. Chỉ khi đối chiếu với dữ liệu seed thật (giờ nhận 14:00, giờ trả 12:00) thì lỗi mới
hiện ra. Lỗi này **không bao giờ** xảy ra nếu mình chỉ tin test.

**Cách sửa:** cắt về ngày trước rồi mới trừ — `(den.Date - tu.Date).Days`.
Đã thêm test `DemSoNgayTrongKhoang_GioNhan14hGioTra12h_TinhDungSoDem` với đúng
`14:00` / `12:00`.

> **Quy tắc:** khi nghiệp vụ có quy định thời gian cố định (giờ nhận 14:00, giờ trả
> 12:00, giờ check-in 22:00…), **test phải dùng đúng giờ đó**, không dùng `.Date`
> cho tiện. Dữ liệu test "tiện lợi" là nơi bug ẩn nhiều nhất.

---

## 55. Số liệu thống kê phải đối chiếu SQL, không tin unit test là đủ — Bước 15

Unit test chỉ chứng minh **code đúng với dữ liệu mình tự dựng**. Còn dữ liệu thật
(seed, khách gõ thật) có những đặc điểm mà dữ liệu tự dựng không có.

Lần này đối chiếu SQL phát hiện 2 điều mà 21 unit test không bắt được:

1. **Sai số** — đếm đêm thiếu 1 đêm mỗi đơn (xem mục 54).
2. **Đúng nhưng không đáng tin** — nếu đã tính cả đơn chưa xác nhận, doanh thu tháng 9
   ra `4.500.000` thay vì `2.700.000`. Không có test nào "sai", nhưng con số hiển thị
   trên dashboard lại là tiền khách **còn có thể huỷ**.

Cách chặn cho lần sau: thêm **1 truy vấn SQL đối chứng có chủ ý khác kết quả**, ghi
rõ trong bảng kiểm thử là dòng nào "cố tình khác để chứng minh định nghĩa".

> **Quy tắc:** báo cáo có mục "thống kê" thì **bắt buộc** chạy SQL đối chiếu ít nhất
> 2 số liệu, và phải chạy cả phiên bản "nếu tính sai thì ra sao" để chứng minh
> bộ lọc hoạt động.

---

## 56. `recharts` mặc định vẽ có animation — ảnh chụp rơi vào giữa chừng thì tưởng biểu đồ vỡ

**Sai ở đâu:** biểu đồ tròn bị cắt mất nửa dưới. Đo `getBoundingClientRect` ra
`.recharts-pie` rộng **138px** × cao **80px** trong khung 440×256.

**Vì sao tôi chẩn đoán sai:** Tôi đoán do `<Legend height={32}>` của recharts chiếm
chỗ trong khung vẽ làm lệch tâm `PieChart`, rồi sửa lại thành legend tự vẽ — và vẫn
thấy vỡ. Tôi đã đi sai đường rất xa và sửa 3 lần liên tiếp.

**Nguyên nhân thật:** `isAnimationActive` mặc định là `true`; recharts quét góc vòng
tròn trong **1,5 giây**. Ảnh chụp màn hình rơi vào khoảng 30% animation nên chỉ thấy
một phần vòng cung. Nhiều lần chụp liên tiếp đều trúng, nên tưởng lỗi thật.

**Cách sửa:** `isAnimationActive={false}` cho mọi biểu đồ của dashboard.

> **Quy tắc 1:** khi nghi ngờ lỗi hiển thị mà "tải lại vẫn còn", **đo kích thước thật**
> (`getBoundingClientRect`) và so với khung chứa. Sai số hình học (138×80 thay vì
> 160×160) là bằng chứng, suy đoán bằng mắt trên ảnh chụp thì không phải.
>
> **Quy tắc 2:** ảnh chụp màn hình là ảnh của **một thời điểm**, mọi animation đều có
> thể làm nó nói dối. Muốn ảnh chụp phản ánh trạng thái cuối thì tắt animation.
> Dashboard cũng không nên vẽ lại mỗi lần bấm "Làm mới" — tắt animation là đúng về
> cả UX lẫn kiểm thử.
>
> **Quy tắc 3:** sửa 1 chỗ mà lỗi không đổi thì **dừng sửa** và đo lại, đừng sửa tiếp
> theo giả thuyết mới. Mình đã sửa 3 lần trên cùng một triệu chứng.

---

## 57. `edit` tool hay rơi tham số `path` khi payload dài — chuyển sang PowerShell + file tạm

`edit` với `newString`/`oldString` dài vài nghìn ký tự thỉnh thoảng báo
`Invalid arguments for tool "edit": path: Missing key`.

**Cách làm ổn định:**

1. `write` nội dung cần chèn vào `.openchamber/tmp-xxx.md` (thư mục đã gitignore).
2. PowerShell đọc file đó bằng `[System.IO.File]::ReadAllLines(path, [Text.Encoding]::UTF8)`.
3. Ghép vào file đích bằng `ReadAllLines` + `WriteAllLines`.

**Không** dùng `Set-Content` / `Add-Content` — chúng phá UTF-8 tiếng Việt.

> **Quy tắc:** payload > 2.000 ký tự thì đừng thử `edit` lần đầu, và **tuyệt đối không
> xoá dòng trong `todo.md`/`docs/` trước khi đã đọc được file tạm** — lần đầu mình
> xoá 4 dòng rồi mới chèn, mất trắng mục Bước 15 phải làm lại từ đầu.
---

## 58. PowerShell: `$lines[-1]` trả phần tử CUỐI, không phải phần tử "không có" — lần này xoá sạch 1 file

**Sai ở đâu:** muốn tìm dòng đánh dấu trong file để chèn nội dung, tôi viết:

```powershell
$idx = -1
for (...) { if (khop) { $idx = $i; break } }
$out = @()
for ($i = 0; $i -lt $idx; $i++) { $out += $lines[$i] }
```

Khi không tìm thấy, `$idx = -1`, vòng `for ($i = 0; $i -lt -1; ...)` **không chạy lần nào** → `$out` rỗng → `WriteAllLines` ghi đè file còn **0 dòng**.
Mất trắng toàn bộ `ReviewDtos.cs`, phải viết lại từ đầu.

**Vì sao dễ rơi vào:** PowerShell cho phép chỉ số âm, nên `$lines[-1]` hợp lệ và trả **phần tử cuối cùng** chứ **không** ném lỗi. Script in ra `$lines[$idx]` là in ra dấu `}` cuối file — trông như "tìm thấy chỗ nào đó" thay vì "không tìm thấy gì".

**Ngay trước đó mình đã mất một lần theo kiểu gần giống** (xoá 4 dòng `todo.md` rồi mới chèn, phải làm lại mục Bước 15). Lần thứ hai là do quên bài học lần đầu.

**Cách sửa / quy tắc:**
- Dùng `[array]::IndexOf()` hoặc `break` + kiểm tra: `if ($idx -lt 0) { Write-Output "SAO: khong tim thay"; exit 1 }` **trước khi** ghi file.
- Luôn **đọc lại và đối chiếu số dòng** trước khi `WriteAllLines`:
  `if ($lines[N].Trim() -ne "dòng-mong-đợi") { exit 1 }` — lệnh này chặn được cả ghi đè nhầm lẫn xoá nhầm.
- `Select-String -Pattern 'X' -like 'X*'` cũng bẫy: `-like` hiểu `[ ]` là **ký tự lớp**, nên `'### [ ] BƯỚC 16*'` không khớp `### [ ] BƯỚC 16`. Dùng `.StartsWith()`.

---

## 59. Grep phân biệt hoa thường mà quên `-i`, rồi kết luận sai về code của chính mình

**Sai ở đâu:** khi khảo sát trước Bước 16, tôi grep `Reviews|ratingAvg|ratingCount` rồi kết luận: *"giao diện mới chỉ hiện điểm trung bình, **chưa hiện danh sách đánh giá**"* — và viết kết luận đó vào `todo.md`.

**Sự thật:** trang chi tiết phòng **đã có** danh sách đánh giá từ Bước 8, dùng `phong.reviews` (chữ thường). Tôi grep `Reviews` (chữ hoa) nên không thấy dòng `phong.reviews.map(...)`.

**Vì sao nguy hiểm:** đây không phải lỗi kỹ thuật mà là lỗi **kết luận**. Vì tin kết luận sai mà:
- suýt tạo thêm một component trùng chức năng với cái đã có,
- ghi vào `todo.md` một nhận định sai — mà báo cáo sẽ lấy từ đó.

**Quy tắc:**
1. Trước khi viết "cái này **chưa có**" vào tài liệu, **đọc thật file** (`read` / mở file), đừng kết luận từ kết quả grep.
2. Khi tìm tên khác hoa/thường: grep cả hai, hoặc dùng `-i`.
3. Câu hỏi tự kiểm: *"mình đã đọc code hay mình đoán?"* — ở đây mình đoán.
4. Nếu đã viết sai vào tài liệu thì **sửa ngay và ghi lại** để người đọc không tin nhầm.

---

## 60. Kiểu dữ liệu khai sai là nguyên nhân gốc của bug hiển thị — "tsc sạch" không bảo chứng có dữ liệu

**Bug:** trang chi tiết đơn hiện **"NaN ₫/giờ"** và **"NaN ₫/ngày"**.

**Vì sao `npm run build` không bắt được:**
`BookingDetail` ở TypeScript khai `pricePerHour: number` và `pricePerDay: number` là **bắt buộc**, nhưng `BookingDetailDto` của backend **không gửi** hai trường đó. Kiểu khai sai ⇒ giá trị chạy là `undefined` ⇒ `formatVnd(undefined)` = `NaN`.
`tsc` không đỏi vì khai sai cũng là khai hợp lệ về hình thức.

**Vì sao lỗi tồn tại lâu:** test cũ khẳng định `screen.getByText(/120\.000/)` — truyền **giá trị giả** vào `bookingService` mock. Test xanh vì dữ liệu mình bịa có đủ trường; dữ liệu thật thì không.

**Đã sửa (không vá chỗ hiển thị):**
1. Xoá 6 trường không thuộc chi tiết đơn khỏi kiểu (`pricePerHour`, `pricePerDay`, `description`, `ratingAvg`, `ratingCount`, `reviews`).
2. Thay bằng `totalAmount` — API có sẵn, đúng nghĩa với một đơn.
3. Thêm `roomNumber` + `capacity` vào DTO thật (giao diện đã cần mà thiếu), lấy trong 1 truy vấn.
4. Thêm test `expect(document.body.textContent).not.toContain('NaN')` — chốt chặn hồi quy.

> **Quy tắc 1:** kiểu dữ liệu phải khớp **API thật**. Khi một kiểu khai 15 trường nhưng API chỉ gửi 9, hãy xoá 6 trường đó — đừng để chúng nằm đó "cho đủ".
>
> **Quy tắc 2:** `tsc` sạch **không** chứng minh có dữ liệu đúng. Kiểm chứng điều đó là bằng **request thật** và nhìn màn hình.
>
> **Quy tắc 3:** mock trong test phải **sao chép** response thật. Trước khi viết mock, bọm response API vào rồi dùng luôn — nếu không tự tay thêm trường thì rất dễ thêm cả trường không có thật, và test sẽ bảo vệ cho một thứ không tồn tại.

---

## 61. Phải `SaveChanges` rồi mới đếm lại — truy vấn chưa thấy dữ liệu vừa `Add`

**Sai ở đâu:** `ReviewService.TaoDanhGiaAsync` làm `Add(danhGia)` → `TinhLaiAsync()` → `SaveChangesAsync()`.
`TinhLaiAsync` đếm bằng truy vấn `SUM/COUNT` nên đánh giá vừa `Add` **chưa có trong CSDL** ⇒ điểm phòng thiếu **đúng đánh giá mới nhất**. Test fail 4/25 với kỳ vọng rất dễ hiểu: `RatingCount` = 0 thay vì 1.
Y hệt vậy ở `XoaAsync`: `Remove()` rồi đếm ⇒ dòng vừa xoá vẫn còn trong kết quả ⇒ điểm không giảm.

**Cách sửa — thứ tự bắt buộc:**
```
1. Add / Remove / đổi IsHidden
2. SaveChangesAsync      ← ghi thay đổi vào giao dịch
3. TinhLaiAsync          ← lúc này truy vấn mới thấy dữ liệu mới
4. SaveChangesAsync      ← lưu điểm vừa tính
5. Commit
```

> **Quy tắc:** khi một thao tác **tính lại** số liệu từ dữ liệu vừa thay đổi bằng truy vấn, phải **ghi thay đổi trước, đọc sau**. Cùng nguyên tắc với mục 55: không được đọc CSDL rồi mới kịp ghi.
> Ngoài ra giữ cả 2 lần `SaveChanges` trong **cùng một transaction** — tách ra thì điểm phòng lệch với danh sách đánh giá trong khoảnh khắc giữa.
---

## 62. Đổi tên hàng loạt: quét theo **phần mở rộng file** thì sót — phải quét theo **nội dung**

**Sai ở đâu:** đổi `StayEasy` → `HomeStay` bằng vòng lặp chỉ nhận `.cs .ts .tsx .json .html .md .css .csproj .props .yml`.
Kết quả còn sót: **`logo.svg`** (chữ trong `aria-label` và comment), **`.http`** (file REST client của VS), và các file `.svg` địa điểm.

**Vì sao dễ sót:** danh sách phần mở rộng là do mình **tự nghĩ ra**, nên nó chỉ đúng với những loại file mình đang nghĩ tới. `.svg` thì có SVG (vector) nên không nghĩ tới.

**Cách sửa / quy tắc:**
- Quét theo **nội dung**, không theo tên: lấy tất cả file trừ `node_modules/ bin/ obj/ dist/ .git/`, rồi `Select-String`. Cách này bắt được mọi loại file kể cả loại mình chưa biết có.
- Chỉ dùng danh sách phần mở rộng khi cần **giữ nguyên** file nhị phân (`.jpg`, `.ico`) — trường hợp này thì kiểm tra lại bằng quét nội dung sau khi thay.
- Quét lại **không phân biệt hoa thường** trước khi commit. Lần này bắt được `STAYEASY` viết in hoa toàn bộ trong `JwtTokenServiceTests.cs` mà 2 vòng trước đều bỏ sót.

---

## 63. MySQL 8 **không có** `RENAME DATABASE` — và `RENAME USER` + `GRANT` làm hỏng đăng nhập

Hai lỗi liên tiếp khi đổi tên database trong dự án này.

**Lỗi 1 — cú pháp sai:**
```sql
RENAME DATABASE stayeasy TO homestay;   -- ERROR 1064
```
`RENAME DATABASE` là cú pháp của **MariaDB**, MySQL 8 không có. Cách đúng là tạo database mới rồi `RENAME TABLE db.cua TO db.moi.cua` cho từng bảng — nhanh, giữ nguyên dữ liệu, không cần dump/restore.

**Lỗi 2 — mất khả năng đăng nhập:**
```sql
RENAME USER 'stayeasy'@'%' TO 'homestay'@'%';
GRANT ALL PRIVILEGES ON homestay.* TO 'homestay'@'%';
```
Sau đó app báo `Access denied for user 'homestay'@'172.19.0.1'`. Cần thêm:
```sql
ALTER USER 'homestay'@'%' IDENTIFIED BY 'matkhau';
GRANT ALL PRIVILEGES ON homestay.* TO 'homestay'@'%';
```

> **Quy tắc:** đổi tên user/database trong MySQL thì **luôn kèm `ALTER USER ... IDENTIFIED BY`** và kiểm chứng bằng `mysql -u<TenMoi> -p<TMK Moi> -e "SELECT 1"` **trước khi** chạy app. Không kiểm thì lúc chạy app mới biết, mà lúc đó lỗi nằm ở tầng hạ tầng chứ không phải code.

---

## 64. Đừng kết luận "file không tồn tại" khi mới tìm ở **một** chỗ

**Sai ở đâu:** ở Bước 15 mình kết luận và ghi vào commit message rằng *"thư mục `server/` chưa có file `.sln`, nên `dotnet test` không chạy được"*. Thực tế `.sln` **có tồn tại**, nhưng nằm ở **gốc repo** chứ không phải trong `server/` — mình chỉ chạy `Get-ChildItem -Filter *.sln` trong `server/`.

Hậu quả: một ghi chú sai bị đưa vào lịch sử git và vào commit message — thứ mà người khác đọc lại sẽ tin.

**Đã sửa ở lượt này:** chuyển `HomeStay.sln` **vào** `server/` cho khớp sơ đồ ở `AGENTS.md` mục 5.1, và giờ `cd server; dotnet test` chạy đúng như tài liệu viết (đã kiểm: 361/361).

> **Quy tắc:** trước khi viết "cái này không có", tìm ở **tối thiểu 2 nơi** (thư mục con + gốc), hoặc dùng lệnh tìm toàn bộ repo. Và câu "không có" phải kèm bằng đường dẫn đã tìm — không thì không ai kiểm chứng được.
---

## 65. Phân biệt "lỗi hệ thống" với "dữ liệu rỗng" — gộp hai nhánh là báo sai nguyên nhân

**Sai ở đâu:** trang đặt phòng có:

```csharp
if (!phong || !ngayHopLe || !checkIn || !checkOut) {
  return <div>Không đặt được phòng này — Đường dẫn thiếu ngày thuê hoặc trỏ sai phòng</div>
}
```

Nhưng `phong` được suy ra từ `diaDiemList` — mà `diaDiemList` đến từ API.
Khi **API hỏng**, `diaDiemList` rỗng ⇒ `phong` cũng `undefined` ⇒ rơi vào đúng nhánh đó và hiện *"Đường dẫn trỏ sai phòng"*.

**Hậu quả:** người dùng nhìn thấy thông báo nói **mình** sai, trong khi hệ thống đang lỗi. Họ sẽ bấm lại 5 lần rồi bỏ đi, thay vì hiểu là chờ.

**Cách sửa:** kiểm `isError` **trước**, tách nhánh riêng:
```
API lỗi        → "Không tải được danh sách phòng / Hệ thống đang không phản hồi" + nút Thử lại
Dữ liệu rỗng   → "Không tìm thấy phòng nào / Thử nới rộng điều kiện lọc"
Sai đường dẫn  → "Đường dẫn thiếu ngày thuê hoặc trỏ sai phòng"
```

> **Quy tắc:** mỗi nhánh rỗng phải trả lời được câu **"tại sao rỗng"**. Ba nguyên nhân — chưa có dữ liệu, API lỗi, người dùng sai — cần **ba thông báo khác nhau**. Gộp chúng thì thông báo chỉ còn đúng 1/3 số lần, và sai 2/3 số lần thì nói sai nguyên nhân.
> Bước kiểm: tìm cách làm API hỏng rồi xem màn hình có nói đúng không. Bấm thử tự nhiên sẽ không bao giờ ra nhánh lỗi.

---

## 66. Menu dựng 2 bố cục (rộng + thu gọn) thì **khai danh sách 1 lần**, dựng ra 2 nơi

Khi làm responsive, `PageLayout` cần cùng một danh sách menu ở cả bản rộng (một hàng) và bản thu gọn (xếp dọc).

**Cách sai:** viết hai khối `<nav>` với danh sách link trong mỗi khối. Sau này thêm mục "Liên hệ" thì sửa một bên, quên bên kia — và **hai bên lệch nhau rất khó phát hiện bằng mắt**, vì bản còn lại vẫn "chạy bình thường".

**Cách đúng:** khai danh sách ở ngoài component, một hàm `veMenu(giaoDien)` dựng ra cả hai bản:

```tsx
const MENU_KHACH = [{ to: '/', nhan: 'Trang chủ' }, ...]
...
<nav className="hidden sm:flex">{veMenu('ro')}</nav>
{menuMo && <nav className="flex flex-col sm:hidden">{veMenu('dong')}</nav>}
```

> **Quy tắc:** mọi thứ xuất hiện ở nhiều chỗ, **khai 1 lần + dựng ra nhiều nơi** — đừng copy. Khai 2 lần thì lệch là chuyện thời gian, không phải chuyện may mắn.

---

## 67. Toast không có `role` thì trình đọc màn hình **im lặng**

Toast là thứ **tự xuất hiện** chứ không phải do người dùng bấm, nên nó cần khai vai trò riêng. Thiếu thì:
- người mù dùng trình đọc màn hình **không hề biết** thao tác đã thành công hay thất bại;
- người nhìn bằng phím tắt cũng không có gì để điều hướng tới.

Sửa:

```tsx
role={toast.type === 'error' ? 'alert' : 'status'}
aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
```

`alert` (lỗi) đọc ngay và cắt ngang những gì đang đọc; `status` (thành công) đọc sau, không chen ngang.

> **Quy tắc:** bất kỳ thông báo nào **tự xuất hiện** mà không do thao tác của người dùng — toast, lỗi mạng, cảnh báo — đều phải khai `role` + `aria-live`. Đây là kiểm tra 10 giây mà bắt buộc làm, vì không ai nhìn thấy lỗi bằng mắt thường.

---

## 68. jsdom không áp CSS Tailwind — đừng test "phần tử không tồn tại", hãy test **lớp**

Viết test cho `PageLayout` bị vấp 3 lần:

| Tôi viết | Chuyện thật |
|----------|-------------|
| `expect(queryByRole('button', {name:'Mở menu'})).not.toBeInTheDocument()` | Nút 3 gạch **luôn** có; chỉ *menu* mới ẩn. Test sai về mặt ý nghĩa |
| `expect(queryByText('Homestay')).not.toBeInTheDocument()` | Chữ có `hidden sm:block` — jsdom không áp CSS nên vẫn còn trong DOM |
| `getByRole('link', {name:'Địa điểm'})` | **Trùng 2 phần tử** vì cả bản menu rộng lẫn thu gọn đều render |

**Nguyên tắc khi test Tailwind trong jsdom:**
- Phần tử ẩn bằng CSS **vẫn xuất hiện** → kiểm **lớp** (`toHaveClass('hidden', 'sm:block')`), đừng kiểm mất chữ.
- Có nhiều bản cùng nội dung → dùng `getAllByRole` và **đếm số phần tử**. Ở đây đếm lại đúng thành phát biện: mở menu thu gọn là **thêm** một bản (1 → 2), không phải thay thế.

> **Quy tắc:** test phải kiểm **hành vi quan sát được**, không kiểm hệ quả của CSS. `hidden` không phải hành vi — "bản menu thu gọn chỉ tồn tại khi bấm nút" mới là hành vi.
---

## 69. Script chèn khối mới mà **không xoá khối cũ** — tài liệu thành trùng lặp

Muốn thay mục "Bước 17" trong `docs/KIEM_THU_TAY.md`. Tôi viết PowerShell: tìm dòng heading, **chèn** khối mới **trước** nó, rồi `WriteAllLines`.

Hai lỗi cùng lúc:

| Lỗi | Hậu quả |
|-----|---------|
| Chèn mà không xoá dòng cũ | File có **2 mục Bước 17**, một cái đầy kết quả, một cái rỗng |
| Vòng lặp tìm vị trí **ghi đè biến mỗi lần khớp** | Chọn **nhầm** mục `## 11.` thứ hai → xoá mất **toàn bộ** kết quả kiểm thử Bước 15 |

Đoạn lỗi:

```powershell
for (...) { if ($lines[$i] -match "^## 11\. ") { $start = $i } }   # ghi de moi lan -> lay dong CUOI
```

Sửa: dùng `break` ngay khi khớp, **và** xoá khoảng cũ trước khi chèn:

```powershell
for (...) { if ($lines[$i] -match "^## 11\. ") { $start = $i; break } }
# ... $out = lines[0..start) + blockMoi + lines[end..]
```

> **Quy tắc:** thay một đoạn trong file = **thay**, không phải **thêm trước**. Nếu viết bằng script thì phải có
> `break` khi tìm vị trí, và phải cắt khoảng cũ. Sau khi sửa xong **đếm lại số heading** và so với trước —
> đếm là bước 10 giây bắt được cả hai lỗi.
>
> Bài học này mở rộng ra: **sau mỗi lần script sửa file tài liệu, phải mở lại đọc**. Không có "sửa xong là xong".

---

## 70. Đánh dấu `[x]` trong `todo.md` mà bảng kiểm thử còn trống — bước đó **chưa** xong

Rà lại toàn bộ `KIEM_THU_TAY.md` để tìm mục nào còn dòng trống, phát hiện **mục 7 (Bước 11 — Quản lý đơn của tôi)**: cả cột *Thực tế* lẫn *Kết quả* đều trống, trong khi `todo.md` đánh dấu Bước 11 là `[x]` từ hôm trước.

Chạy thử mới thì lộ ra tính năng **chưa tồn tại**: `GET /api/bookings/my` chỉ nhận `page`/`pageSize`, không có tham số trạng thái; giao diện cũng không có ô lọc. Thử `?status=0..4,99` đều trả đủ 7 đơn.

**Vì sao lọt lưới:** bước đó được đóng khi *code đã chạy được*, chứ chưa đối chiếu với chính bảng kiểm thử. Bảng kiểm thử là **bằng chứng**, mà đã bỏ trống thì không có bằng chứng — tick `[x]` lúc đó là tick bằng cảm tính.

> **Quy tắc:** trước khi tick `[x]`, mở bảng kiểm thử của bước đó và kiểm **không còn dòng nào trống cột "Kết quả"**.
> Dòng trống = bước chưa kiểm. Tick `[x]` là khẳng định có bằng chứng, không phải khẳng định "code chạy được".
>
> Cách rà nhanh toàn bộ tài liệu:
> ```powershell
> $l = [IO.File]::ReadAllLines("docs\KIEM_THU_TAY.md", [Text.Encoding]::UTF8)
> for ($i=0; $i -lt $l.Length; $i++) {
>   if ($l[$i] -match '^\|\s*\d+(\.\d+)?[a-z]?\s*\|.*\|\s*\|\s*\|\s*$') { "dong $($i+1) chua dien ket qua" }
> }
> ```

---

## 71. Kỳ vọng ghi "403" nhưng hệ thống trả "404" — đôi khi **đừng sửa code, hãy sửa kỳ vọng

Mục 7 dòng 4 ghi: *"Khách khác sửa URL để xem đơn người khác → bị chặn **403**"*. Chạy thật ra **404**.

Tưởng lỗi. Nhưng Bước 16 đã chốt: trả 403 sẽ **lộ ra là đơn đó có thật** — chỉ cần đổi mã đơn là biết ngay. 404 không lộ gì. Vậy **404 mới đúng**, và tài liệu sai.

> **Quy tắc:** khi kỳ vọng trong bảng kiểm thử lệch với thực tế, **đừng mặc định sửa code**.
> Hỏi trước: thực tế có **cố ý** khác không? Ở đây là có — nó là quyết định bảo mật đã ghi ở Bước 16.
> Sửa nhầm code theo bảng kiểm thử là phá vỡ một quyết định đã chốt để "cho khớp giấy".
>
> Dấu hiệu nhận ra: sự lệch nằm ở **mã lỗi bảo mật** (403/404) — đó là chỗ hay có quyết định nghiệp vụ ẩn sau.
---

## 72. Ô lọc đặt **sau** `return` của nhánh rỗng → người dùng bị kẹt không đổi được bộ lọc

Viết xong tính năng "lọc đơn theo trạng thái", tôi đặt tiêu đề + `<select>` **sau** nhánh
`if (danhSach.length === 0) return ...`:

```
isPending → return
isError   → return
danhSach.length === 0 → return      ← ô lọc nằm SAU chỗ này
return (tiêu đề + select + danh sách)
```

Nhìn thì đúng là "không có dữ liệu thì đừng vẽ bộ lọc vô nghĩa". Nhưng thực tế thì ngược lại:

> Người dùng bấm "Đã hủy" → không có đơn nào ở trạng thái đó → **ô lọc biến mất**.
> Họ bị kẹt trên một màn hình không có cách đổi bộ lọc, chỉ còn nút "Xem tất cả đơn" nằm trong thẻ rỗng.

Unit test bắt được ngay (`findByLabelText('Lọc theo trạng thái')` không tìm thấy trong nhánh rỗng).
**Chạy thử tay thì không bắt được** — vì khi kiểm thử, tài khoản luôn có sẵn đơn ở mọi trạng thái,
nên nhánh rỗng không bao giờ xảy ra.

Sửa: tách phần tiêu đề + ô lọc thành biến JSX, dùng ở **cả hai** nhánh.

> **Quy tắc:** một **bộ điều khiển** (lọc, sắp xếp, tìm kiếm, chuyển trang) **không được nằm sau**
> `return` của nhánh "không có dữ liệu". Người dùng đến nhánh đó **vì chính bộ điều khiển đó**
> — mất nó nghĩa là mất lối thoát.
>
> Nghĩ ngược lại: nhánh rỗng chỉ nên thay **nội dung danh sách**, không thay cả **thanh điều khiển**.
>
> Và nhớ: test bắt được, mắt không bắt được — vì dữ liệu thật của người kiểm thử có đầy đủ dữ liệu.

---

## 73. `int?` + kiểm tra `> 0` sẽ **giết chính** giá trị 0

Bộ lọc trạng thái đơn: `PENDING` có giá trị **0**. Tham số là `int?` (`status`) nên có ba trạng thái:
`null` (không truyền), `0` (PENDING), `1..5` (còn lại).

| Cách viết | `null` | `0` | Hậu quả |
|-----------|--------|-----|---------|
| `if (status > 0)` | bỏ lọc | **bỏ lọc** | ❌ chọn "Chờ xác nhận" ra danh sách **tất cả** |
| `if (status != null)` | bỏ lọc | lọc PENDING | ✅ |
| `if (status is int v && ...)` | bỏ lọc | lọc PENDING | ✅ rõ ràng nhất |

Đã dùng `status is int maTrangThai && Enum.IsDefined(typeof(BookingStatus), maTrangThai)` —
vừa phân biệt được `null` với `0`, vừa loại được giá trị ngoài khoảng enum.

Có test riêng chặn đúng lỗi này (`LayCuaToiAsync_LocStatusKhong_ChonDungPENDING`), vì nó **không** làm
hỏng test cũ — chỉ làm sai hành vi khi người dùng chọn đúng trạng thái đó.

> **Quy tắc:** khi tham số là số **có thể bằng 0** (chỉ số mảng, enum bắt đầu từ 0, số lượng), tuyệt đối
> không kiểm `if (x > 0)` để biết "có truyền không". Dùng `x is not null` / `x.HasValue`.
>
> Dấu hiệu: enum hoặc ID bắt đầu từ 0 mà tham số lại là nullable. Hỏi "0 là giá trị hợp lệ không?"
> — nếu có, `> 0` là bug chờ người dùng báo.

---

## 74. Khi test đỏ, hỏi **"test sai hay code sai"** trước — rồi mới sửa

Viết test cho ô lọc, 5 test đỏ. Trong đó có **hai loại** nguyên nhân hoàn toàn khác nhau:

| Test đỏ vì | Ví dụ | Sửa ở đâu |
|-----------|-------|-----------|
| **Code sai** | `findByLabelText` không thấy ô lọc trong nhánh rỗng | Sửa **component** (mục 72) |
| **Test sai** | `getByText('Chờ xác nhận')` trùng 2 phần tử vì giờ có cả badge lẫn `<option>` | Sửa **test**, dùng `getAllByText` |
| **Test sai** | mock trả cùng dữ liệu cho mọi lần gọi nên đơn cũ không biến mất | Sửa **test**, dùng `mockResolvedValueOnce` |
| **Test sai** | `mockResolvedValueOnce` bị dùng mất ở lần gọi đầu (lúc mới vào trang, chưa lọc) | Sửa **test**, cần **3** lần gọi |

Nếu sửa hết theo hướng "làm cho test xanh" thì sẽ **xoá** luôn cái lỗi thật ở mục 72 — và mất bằng chứng
cho một bug người dùng gặp thật.

> **Quy tắc:** test đỏ là thông tin, không phải lệnh. Trước khi sửa, hỏi:
> 1. Test này đang khẳng định điều gì?
> 2. Thực tế có đúng là sai không, hay chỉ **khác cách diễn đạt**?
> 3. Sửa test hay sửa code — và **ghi lại lý do** trong comment.
>
> Dấu hiệu test sai: thông báo lỗi là *trùng phần tử*, *mock chưa khớp*, *chưa tìm thấy nhãn* —
> chứ không phải *giá trị thực tế lệch kỳ vọng*. Xem `lessons.md` mục 40 và 42.
---

## 75. Đọc `DbException.ErrorCode` cho lỗi MySQL — **luôn luôn sai** (bản sửa không có tác dụng)

Test chống đặt trùng của Bước 18 phát hiện: hai request đặt trùng chạy song song trả về
**`[500, 201]`** thay vì `[201, 409]`. Log cho biết nguyên nhân:

```
System.InvalidOperationException: ...transient failure...
 ---> DbUpdateException
  ---> MySqlConnector.MySqlException (0x80004005): Deadlock found when trying to get lock
```

Bản sửa đầu tiên của tôi:

```csharp
if (hienTai is DbException loiDb && loiDb.ErrorCode is 1213 or 1205 or 1062)
```

Sửa xong **vẫn 500**. Vì `0x80004005` trong log chính là **HResult**, không phải mã lỗi
MySQL. `DbException.ErrorCode` với MySqlConnector trả về đúng cái HResult đó ⇒ **không bao
giờ** bằng 1213.

Đúng phải đọc `MySqlException.Number`:

```csharp
if (hienTai is MySqlException loiMySql && LaMaLoiTranhChung(loiMySql.Number)) ...
```

> **Quy tắc:** mã lỗi của một hệ quản trị CSDL cụ thể phải đọc từ **lớp lỗi của hệ đó**,
> đừng đọc qua `DbException`. `DbException.ErrorCode` là điểm mở rộng của provider — mỗi
> provider trả một thứ khác nhau, và với MySqlConnector nó là HResult chứ không phải mã lỗi.
>
> **Dấu hiệu nhận ra:** so sánh `ErrorCode` với một con số mà tài liệu provider có nói thì
> **luôn phải khớp** — nếu test thật bảo hiện tại không khớp, hãy nghi ngờ bạn đang đọc
> sai thuộc tính chứ không phải hệ thống hỏng.
>
> Bài học nhỏ hơn, cũng đáng ghi: **đừng sửa theo phỏng đoán rồi tin là xong.** Lần này tôi
> sửa, build xanh, chạy lại vẫn 500 — phải đọc log mới thấy `0x80004005` là manh mối.

---

## 76. Package **không dùng** có thể phá chức năng của package khác

Trang `/swagger` báo *"Unable to render this definition / does not specify a valid version
field"*, dù `swagger.json` hợp lệ với `"openapi": "3.0.4"`.

Sau khi loại trừ dần (cache? sai endpoint? đọc nhầm file? swagger-ui quá cũ?), nguyên nhân
gốc hoá ra nằm ở **csproj**:

```xml
<PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.31" />
```

Gói đó kéo theo `Microsoft.OpenApi >= 1.6.30` — bản phát tài liệu `"openapi": "3.0.4"`,
trong khi swagger-ui đi kèm Swashbuckle 6.9.0 chỉ nhận `3.0.n`. Và gói này **hoàn toàn
không được dùng**: dự án không gọi `AddOpenApi`/`MapOpenApi`, tài liệu do Swashbuckle sinh.
Bỏ đi ⇒ Swashbuckle dùng đúng phiên bản tương thích ⇒ phát `3.0.1` ⇒ trang hiển thị bình thường.

Hai bài học:

1. **Một package thừa không chỉ thừa — nó còn kéo phiên bản của package khác**, và phiên bản
   đó có thể phá chức năng của package mình thật sự dùng. Package không dùng là **rủi ro**, không
   phải chuyện vô hại.
2. **Khi sửa lỗi, đừng nâng phiên bản ghim lên** (AGENTS 1.2). Ở đây lời giải đúng là **bỏ
   package thừa**, không phải nâng Swashbuckle.

Cách rà nhanh, đáng làm mỗi vài bước:

```powershell
# Package nào không được dùng trong code?
$csproj = Get-Content server\HomeStay\HomeStay.csproj -Raw
[regex]::Matches($csproj, 'Include="([\w\.]+)"') | ForEach-Object {
  $ten = $_.Groups[1].Value.Split('.')[0..2] -join '\.'
  $ dung = Select-String -Path server\HomeStay\*.cs,server\HomeStay\**\*.cs -Pattern $ten -Quiet
  if (-not $dung) { "  KHONG DUNG: $ten" }
}
```

---

## 77. Bộ test tích hợp mà **tự làm bẩn dữ liệu** thì không phải bộ test, nó là một thứ gây hại

Bộ test Postman của Bước 18 hỏng ngay ở lần chạy thứ hai. Nguyên nhân không nằm ở code:

- Mỗi lần chạy xác nhận 1 đơn ⇒ phòng chuyển `BOOKED`, rồi check-out ⇒ phòng chuyển `CLEANING`
  trong **2 giờ**. Chạy ~30 lần thì **hết sạch** phòng `AVAILABLE` ⇒ các test đặt phòng sau
  hỏng vì lý do không liên quan tới chúng.
- Mỗi lần chạy để lại 1 đơn `PENDING` (đơn thắng cuộc đua của test T3). Các đơn này tích luỹ
  trong dải ngày, và sau đủ lần chạy thì chặn lần chạy sau ⇒ `[409, 409]` thay vì `[201, 409]`.

Ba việc đã làm, đáng nhớ theo thứ tự:

1. **Nhóm "Chuẩn bị dữ liệu"** đặt lại trạng thái phòng về `AVAILABLE` trước khi chạy tiếp.
2. **Nhóm "Dọn dẹp"** huỷ chính đơn mà test T3 tạo ra, ngay sau nhóm đó.
3. **Tách dải ngày**: mỗi nhóm test một dải riêng rộng 1500 ngày, các dải cách nhau 2000 ngày,
   nên lần chạy sau không bao giờ đụng lần chạy trước.

Kết quả: **12/12 lần chạy liên tiếp đều trong** (trước đó hỏng ở lần thứ 2).

> **Quy tắc:** một bộ kiểm thử tích hợp phải **trả lại dữ liệu về trạng thái ban đầu**, nếu không
> nó chỉ chạy được đúng một lần — mà một bộ test chỉ chạy được một lần thì vô dụng.
>
> Bài học cụ thể hơn: khi bộ test của bạn **làm thay đổi trạng thái nghiệp vụ** (đặt phòng → phòng
> bận, gửi đơn → hộp thư có đơn), hãy hỏi *"lần chạy thứ 20 thì còn chạy được không?"*. Nếu câu trả
> lời là không, thì đó không phải bộ test, đó là kịch bản một lần.
>
> Và khi dữ liệu đã bị bẩn từ những lần chạy trước, phải **dọn có chọn lọc** (theo `Note`/`Code`
> của riêng test) chứ đừng `TRUNCATE` — nói thẳng là đã xoá bao nhiêu dòng của cái gì.
---

## 78. Nền trang bán trong suốt làm lộ "canvas" của trình duyệt — cả trang bị tối theo

Trang quản trị hiện ra **tối xám** trong khi trang khách vẫn sáng. Rất dễ quy chụp nhầm
cho lỗi chụp ảnh hoặc lỗi CSS.

| Bước kiểm tra | Kết quả |
|---------------|---------|
| Chụp lại lần nữa | Vẫn tối ⇒ không phải lỗi chụp |
| Chụp trang chủ | Vẫn sáng ⇒ cơ chế chụp ổn, vấn đề ở trang này |
| `browser.inspect` vào `html` | `opacity: 1`, không có overlay |
| …vào `div.min-h-screen` | `background-color: rgba(255, 251, 235, 0.4)` — CSS **đúng** |
| …vào `body` | `rgba(0, 0, 0, 0)` — trong suốt |

CSS đúng mà hình vẫn tối ⇒ chỉ còn một khả năng: **canvas của trình duyệt đang tối**, và
nó lọt lên vì nền trang bán trong suốt.

Đúng vậy. So sánh hai layout đã lộ ra khác biệt:

| Layout | Nền | Kết quả |
|--------|-----|---------|
| `PageLayout` (khách) | `bg-gray-50` — **đục** | Phủ kín canvas, không sao |
| `AdminLayout` (quản trị) | `bg-amber-50/**40**` — 40% đục | Canvas lọt lên ⇒ cả trang tối |

Sửa: đổi thành `bg-amber-50` (đục). Trang sáng trở lại ngay.

> **Quy tắc:** nền trang **luôn phải đục**. Hậu tố `/40`, `/50` của Tailwind rất dễ dùng
> "cho nhẹ", nhưng nó biến trang thành lớp kính — màu hiển thị thành phối hợp giữa màu
> của mình với màu canvas **do thiết bị quyết định**, không do mình kiểm soát.
> Trên máy người dùng bật chế độ tối thì giao diện sáng sẽ bị méo màu.
>
> Kèm theo đó, khai báo `:root { color-scheme: light }` để canvas, thanh cuộn và các hộp
> thoại gốc của trình duyệt theo đúng chủ đề sáng. (Riêng dòng này **không** sửa được
> lỗi trên — canvas vẫn tối — nhưng nó vẫn đúng để có.)

**Bài học về cách tìm lỗi:** triệu chứng "giao diện tối" rất dễ đẩy tôi đoán CSS sai,
đoán lỗi chụp ảnh, thậm chí đoán chế độ tối của chính trang. Điều đưa đến đáp án là đo
`background-color` **tính toán** rồi so với ảnh chụp: CSS nói màu kem nhạt, ảnh nói xám
⇒ vấn đề nằm ngoài CSS. Có bằng chứng mới loại được phỏng đoán.

---

## 79. Chuỗi `*/` trong chú thích CSS làm hỏng cả bản build

Sửa xong lỗi nền ở mục 78, tôi viết chú thích giải thích nguyên nhân có ghi class Tailwind
bán trong suốt:

```css
/* … đừng để nền ở dạng bán trong suốt (`bg-*/40`) … */
```

`npm run build` **lỗi ngay**, nhưng thông báo lỗi không chỉ ra dòng nào:

```
error during build:
  at Root._error (…\postcss-selector-parser\dist\parser.js:134:16)
```

Lý do: chuỗi `*/` **kết thúc chú thích CSS sớm**. Phần text còn lại sau nó bị parser đọc
như CSS thật nên báo lỗi ở tận `postcss-selector-parser` — cách xa chỗ viết lắm.

> **Quy tắc:** trong chú thích CSS, **không bao giờ** ghi một mẫu có `*/` (kiểu
> `*/40`, `*/20`, `@*/`). Muốn nói "hậu tố pha trong suốt" thì viết bằng lời:
> *"hậu tố `/40`"*, *"pha 40%"*.
>
> Nói chung: khi thông báo lỗi chỉ tới tận thư viện chứ không chỉ tới dòng code của mình,
> hãy nghi ngờ cú pháp ở ngay **trước** chỗ đó — đặc biệt là chú thích.

---

## 80. 22 hình trong báo cáo: vẽ tay hay sinh bằng script?

Bước 19 đòi đủ 22 hình. Trong đó có **15 sơ đồ** (biểu đồ tác nhân, 6 use case, kiến
trúc, lớp, ERD, 5 tuần tự) và **7 ảnh giao diện**.

7 ảnh giao diện thì chụp thẳng. 15 sơ đồ thì không thể chụp — phải **vẽ**. Có hai cách:

| Cách | Đánh giá |
|------|----------|
| Vẽ tay bằng công cụ vẽ | Mỗi hình một kiểu, lệch nhau vài chỗ; code đổi thì phải vẽ lại từ đầu |
| **Sinh bằng script từ dữ liệu** | Đồng bộ kiểu vẽ; sửa nội dung là sửa dữ liệu rồi chạy lại |

Tôi chọn script, và viết nó theo kiểu **dữ liệu + vài hàm vẽ dùng chung**
(`hop`, `bauDuc`, `muiTen`, `veUseCase`, `veSequence`, `veErd`…). Mỗi sơ đồ chỉ cần khai
báo danh sách hộp / danh sách use case / danh sách thông điệp.

Kết quả: `docs/anh/so-do/*.svg` (15 file, ~5–12 KB mỗi file) — nhỏ, **đọc được bằng mắt
như code**, và sửa được khi lớp hay endpoint đổi.

> **Quy tắc:** với sơ đồ kiểu lặp đi lặp lại (nhiều hình cùng dạng), **sinh bằng script**
> thay vì vẽ tay — vừa đồng bộ, vừa sửa được.
>
> Điều chỉ quan trọng: sơ đồ phải lấy nội dung từ **dữ liệu thật của dự án** (tên lớp
> thật trong `BookingService.cs`, tên bảng thật trong `HomeStayDbContext`, tên endpoint thật
> trong controller). Sơ đồ vẽ theo trí nhớ thì sai, mà GV hỏi một câu là lộ.

**Ba lỗi hình ảnh đã phát hiện và sửa** (đều nhờ **xem lại ảnh sau khi chụp**, không phải
tin rằng script chạy xong là hình đẹp):

1. Biểu đồ tác nhân: nhãn chồng lên nhau, hộp đè lên hình người → dựng lại từ đầu theo trục dọc
2. Sơ đồ use case: chiều rộng **đặt cứng** 960 khi nội dung cần 1350 ⇒ cắt mất cột cuối và
   tác nhân bên phải → tính chiều rộng từ nội dung
3. Sơ đồ tuần tự: mũi tên dùng **chỉ số cột** thay vì toạ độ x ⇒ mọi mũi tên co về một điểm
   ⇒ hỏng hoàn toàn mà script vẫn chạy không lỗi

> **Quy tắc:** với ảnh sinh bằng code, **phải xem ảnh sau khi sinh**. Script chạy trơn tru
> chỉ chứng minh cú pháp đúng, không chứng minh hình đẹp và đúng — ba lỗi trên đều là
> script chạy sạch mà hình hỏng.
>
> Với sơ đồ có nét nối: **vẽ nét trước, hộp sau**. Hộp có nền đục sẽ che các đoạn nét chạy
> qua, nhờ vậy không có nét nào cắt ngang chữ bên trong hộp.

---

## 81. `toISOString()` trả giờ UTC — làm hỏng cơ chế chống đặt trùng

**Sai ở đâu:** giao diện gửi mốc thời gian lên API bằng `date.toISOString()`. Hàm này trả
giờ **UTC** kèm chữ `Z`. Máy ở múi giờ UTC+7 mà khách chọn 15:00 thì `toISOString()` cho ra
`08:00:00.000Z` — lệch 7 giờ.

**Vì sao sai:** cả hệ thống đều quy ước mốc giờ là **giờ địa phương**: dữ liệu mẫu nhận
phòng 14:00, trả phòng 12:00; API đọc chuỗi không ký `Z` đúng như giờ đó. Chỉ có giao diện
gửi lên là quy ước ngược lại.

**Hậu quả thật đã xảy ra:** khách chọn khung 15:00–19:00 vào một phòng **đã có đơn**
15:00–19:00. Hệ thống nhận 08:00–12:00 nên không thấy trùng, vẫn tạo đơn — trong khi màn
hình hiển thị đúng *"15:00 → 19:00"*. Giao diện nhìn hoàn hảo, dữ liệu thì sai. Đây là loại
lỗi tệ nhất: người dùng và người kiểm thử đều không có cách nào phát hiện bằng mắt.

**Đã sửa:** thêm `toLocalIsoString()` trong `client/src/utils/format.ts` định dạng mốc giờ
theo giờ địa phương, không gắn `Z`. Thay ở cả 3 chỗ gửi lên API. Test khoá lại bằng cách
khẳng định kết quả **không chứa `Z`** và **không bằng** `toISOString()` — chỉ khẳng định
"định dạng đúng" thì vẫn có thể lặp lại lỗi này lần sau.

**Quy tắc tránh lặp:** trước khi gửi mốc thời gian lên API, hỏi **hệ thống này quy ước
giờ nào** rồi viết lệnh khớp quy ước đó. Cụ thể ở đây: *gửi giờ địa phương, không ký `Z`*.
Và phải đối chiếu với dữ liệu thật trong CSDL, không tin rằng màn hình hiển thị đúng thì
dữ liệu đúng.

> Lỗi này lọt qua kiểm thử tự động 649 test và 12 lần chạy Postman vì cả hai đều gửi
> chuỗi **không ký `Z`** — giống hệt cách API mong đợi. Nó chỉ lộ ra khi người dùng thật
> bấm chuột. **Bài học: test phải mô phỏng cách người dùng thật sự thao tác, không chỉ
> cách mình tiện viết.**

---

## 82. Đoán tên tham số API thay vì đọc DTO — tự tạo ra "lỗi" không tồn tại

**Sai ở đâu:** kiểm tra `GET /api/rooms/availability?diaDiem=0&phong=2&loai=0&checkIn=...`
thì API trả `isAvailable = true` cho mọi phòng, kể cả phòng đang có đơn. Tưởng hệ thống
hỏng chống trùng.

**Vì sao:** DTO `AvailabilityRequest` khai báo thuộc tính `LocationIndex`, `RoomIndex`,
`Type` — tôi lại đoán tên tiếng Việt `diaDiem`, `phong`, `loai` như lúc đọc log SQL. Tên
không khớp thì ASP.NET **không báo lỗi**, nó lấy giá trị mặc định (`0`, `0`, `1`). Kết quả
là âm thầm kiểm tra phòng số 0 — phòng trống — nên luôn ra `true`.

**Đã làm đúng sau đó:** đọc thẳng file DTO, đổi sang `LocationIndex/RoomIndex/Type`, thì
mọi tình huống đều đúng: có đơn → `false`; nằm trong đơn → `false`; **chạm biên** (đơn kết
thúc 19:00, hỏi 19:00–22:00) → `true`. Đây mới là hành vi mong muốn.

**Quy tắc tránh lặp:** trước khi kết luận "code hỏng" từ một lần gọi API thất bại, hỏi
**lệnh gọi của mình có đúng không**. Kiểm tra lại tên tham số từ DTO hoặc từ Swagger —
`localhost:5080/swagger` liệt kê đúng tên và kiểu của từng tham số. Đặc biệt nguy hiểm với
tham số không bắt buộc: thiếu hoặc sai tên sẽ **không bao giờ báo lỗi**, chỉ cho kết quả sai.

---

## 83. Kiểm chứng lại dữ liệu trước khi chụp ảnh báo cáo

**Bài học:** khi chuẩn bị ảnh cho báo cáo, có 2 việc bắt buộc làm **trước**:

1. **Đưa dữ liệu về đúng trạng thái** muốn chụp (đủ đơn mỗi trạng thái, phòng `AVAILABLE`).
2. **Kiểm chứng số liệu trong ảnh khớp với CSDL** — đếm đơn, đếm phòng, đọc lại tên phòng.

Lần này cả 2 việc đều có giá trị: hình 4.5 chỉ ra được lỗi múi giờ (mục 81) chỉ vì trước đó
đã xác minh A201 thật sự có đơn `CHECKED_IN` 29/10 15:00–19:00. Nếu chụp đại, ảnh sẽ đẹp
và sai — đúng thứ tệ nhất trong báo cáo.

Sau khi chụp xong cũng phải **dọn dữ liệu trở lại** (đơn kiểm chứng, đơn tạo riêng để có
nút "Xác nhận") để CSDL khớp với số liệu nêu trong báo cáo và với các ảnh đã chụp trước đó.

---

## 84. Cảnh báo "bundle > 500 kB" của Vite là lỗi thật, không phải nhiễu

**Sai ở đâu:** nhiều lần chạy `npm run build` chỉ nhìn dòng `✓ built in`, bỏ qua cảnh báo
màu vàng phía trên. Đến khi yêu cầu "0 cảnh báo" mới phát hiện gói JavaScript gộp chung
~870 kB, vượt ngưỡng 500 kB.

**Vì sao đáng sửa:** người dùng phải tải trọn gói trước khi thấy được trang đầu tiên, và
mỗi lần sửa mã cũng phải tải lại toàn bộ.

**Đã sửa:** thêm `build.rollupOptions.output.manualChunks` tách 4 nhóm thư viện
(`nhan-react`, `nhan-du-lieu`, `nhan-bieu-mau`, `nhan-bieu-do`). Build còn **0 cảnh báo**,
lớn nhất còn 400 kB. Tách theo nhóm thay vì `import()` từng trang: màn hình Admin vốn đã
được bảo vệ phân quyền, thêm lazy loading chỉ là độ phức tạp không đổi lấy lợi ích rõ.

**Quy tắc tránh lặp:** khi kiểm tra "build sạch", phải **đọc cả dòng cảnh báo**, không chỉ
dòng thành công. Cách chắc chắn hơn: `npm run build 2>&1 | Select-String -Pattern "warn|error"`
thay vì chỉ `Select-String "built in"`.
---

## 85. Seed "bỏ qua nếu đã có dữ liệu" ⇒ sửa seeder không bao giờ tới được DB cũ

**Sai ở đâu:** trang chủ hiển thị *"★ 5,0 · **30 đánh giá**"* cho Phòng Hạnh Phúc, trong khi
cả hệ thống chỉ có **8** dánh giá và phòng đó có đúng **1**. Kiểm tra CSDL cho thấy cột
`Rooms.RatingCount` bị ghi sai: một phòng `30`/`2`, một phòng ghi `5.0` dù thật sự **không có**
đánh giá nào, một phòng ghi `5.0` dù đánh giá thật là `3`.

**Vì sao:** `SeedData.SeedAsync` kiểm tra `db.Users.AnyAsync()` rồi `return` sớm nếu đã có
dữ liệu. Đây là hàm seed tốt — chạy bao nhiêu lần cũng không nhân bản. Nhưng hậu quả là:
`DuLieuMau.TinhLaiDiemPhong()` (tính lại điểm từ bảng `Reviews`) được thêm vào ở **Bước 16**,
còn DB này đã seed từ **Bước 4**. Test `SeedAsync_DiemPhongChiTinhTuDanhGiaChuaAn` vẫn
xanh vì nó chạy trên DB InMemory **rỗng** rồi seed lại từ đầu — đúng nơi cần kiểm tra.

**Bài học phân biệt "code sai" với "dữ liệu cũ":** khi dữ liệu hiển thị sai, **đừng vội sửa
code**. Đã làm đúng thứ tự ở đây:

1. Đọc code: cả `ReviewScorer` (lúc chạy) và `TinhLaiDiemPhong` (lúc seed) đều loại trừ
   `IsHidden` và làm tròn 2 chữ số — **hai chỗ nhất quán, code đúng**.
2. Tìm test phủ đúng nghiệp vụ đó — đã có, và đang pass.
3. Kết luận: lỗi nằm ở dữ liệu đã nạp cũ, không phải logic.

**Đã sửa:** tính lại `RatingAvg`/`RatingCount` cho toàn bộ phòng theo đúng công thức của seed.
Kết quả khớp 10/10 phòng.

> **Quy tắc tránh lặp:** sau mỗi lần sửa `DuLieuMau`, phải **nạp lại dữ liệu mẫu từ đầu**
> (xoá volume `homestay-mysql-data` rồi `docker compose up -d`) để chắc DB khớp code —
> vì đơn vị kiểm thử của seeder là **DB sạch**, không phải DB đang chạy.

---

## 86. Dữ liệu hiển thị viết cứng trong JSX sẽ thành sai lệch âm thầm

**Sai ở đâu:** lưới "Phòng nổi bật" ở trang chủ viết cứng 3 thẻ phòng (~70 dòng JSX lặp lại).
Tên phòng, giá, ảnh và nhãn "Còn trống" đều nằm trong mã nguồn.

**Vì sao nguy hiểm hơn vẻ ngoài:** sửa giá phòng trong CSDL thì trang chủ **vẫn hiện giá cũ**;
xoá phòng trong CSDL thì trang chủ **vẫn còn thẻ đó**. Dữ liệu hiển thị có **hai nguồn**,
nên không có cách nào biết cái nào đúng khi chúng lệch nhau — đây là cùng nguyên nhân gốc
với `lessons.md` mục 20 (hai nơi giữ cùng một dữ liệu).

**Đã sửa:** gọi `GET /api/rooms/search?pageSize=3` qua TanStack Query, rồi vẽ ra từ kết quả.
Xoá được 80 dòng JSX lặp. Thêm đủ 3 trạng thái (đang tải / lỗi / không có dữ liệu) như
mọi danh sách khác.

**Quan sát đáng ghi lại:** lần mở trang đầu tiên sau khi sửa, màn hình hiện **HTTP 500** và
hiện đúng thông báo lỗi kèm nút "Thử lại". Nguyên nhân là tôi đã tắt tiến trình backend
để build nên Vite proxy không có gì để chuyển tiếp. Nghĩa là **trạng thái lỗi đã được
kiểm chứng bằng sự cố thật**, không phải bằng giả định.

> **Quy tắc tránh lặp:** mọi thứ hiển thị trên giao diện mà bản chất là dữ liệu nghiệp vụ
> (tên, giá, số lượng, trạng thái) thì lấy từ API. Chỉ giữ cứng những thứ thuần trình bày:
> câu chữ quy định, mô tả concept, nhãn nút. Và phải kiểm tra lại màn hình sau khi sửa bằng
> cách **đối chiếu số liệu hiển thị với CSDL** — chính việc đó đã phát hiện lỗi mục 85.
---

## 88. Word báo "tệp bị hỏng" mà không nói chỗ nào sai — vì OOXML bắt buộc thứ tự phần tử

**Sai ở đâu:** khi dựng file `.docx` bằng cách sinh trực tiếp `word/document.xml`, tôi xếp
các phần tử trong `w:pPr` và `w:rPr` theo thứ tự "trông hợp lý". Word báo *"The file appears to
be corrupted"* mà không chỉ ra vị trí. Tôi mất gần một giờ đoán.

**Vì sao sai:** OOXML quy định thứ tự phần tử cứng theo lược đồ, không phải thứ tự tuỳ ý:

| Thẻ | Thứ tự bắt buộc |
|-----|------------------|
| `w:pPr` | `pStyle` → `keepNext` → `numPr` → `pBdr` → `spacing` → `ind` → `jc` → `rPr` |
| `w:rPr` | `rFonts` → `b` → `i` → `color` → `sz` → `szCs` |
| `w:tcPr` | `tcW` → `shd` → `vAlign` |
| `w:tblPr` | `tblW` → `jc` → `tblBorders` → `tblLayout` |

Ngoài ra `w:jc` **không thuộc** `w:rPr` — canh chữ phải đặt trong `w:pPr`. Tôi đặt nó trong
`w:rPr` nên tài liệu hỏng.

**Cách sửa:** không ghép chuỗi `pPr` bằng tay. Hàm nhận **đối tượng tuỳ chọn** rồi tự xếp
đúng thứ tự:

```js
function doan(style, noiDung, { giu, truoc, sau, thu, thuDau, canh }) {
  const pPr = [
    style && `<w:pStyle w:val="${style}"/>`,
    giu && '<w:keepNext/>',
    (truoc || sau) && `<w:spacing .../>`,
    ind && `<w:ind .../>`,
    canh && `<w:jc w:val="${canh}"/>`,
  ].filter(Boolean).join('')
}
```

Cách này khiến sai thứ tự về mặt cấu trúc là không thể xảy ra.

> **Quy tắc tránh lặp:** khi sinh XML theo lược đồ, **không ghép thẻ bằng chuỗi tự do**. Nhận
> tuỳ chọn có tên rồi để hàm tự sắp thứ tự — rẻ hơn nhiều so với tìm lỗi thứ tự.

## 89. Ba lỗi "hỏng tệp" mà nguyên nhân nằm ngoài tài liệu

Cùng một triệu chứng *"tệp bị hỏng"* nhưng ba nguyên nhân hoàn toàn khác, đều không nằm trong
`document.xml`:

1. **Thiếu `_rels/.rels`** — mọi gói OOXML đều cần tệp này để trỏ tới `word/document.xml`.
   Không có nó thì Word không biết mở tệp nào.
2. **Sai URI quan hệ** — `core-properties` phải dùng nhóm `package/2006`, còn `officeDocument`
   và `extended-properties` dùng nhóm `officeDocument/2006`. Gộp thành một chuỗi là hỏng.
3. **Thiếu `Override` cho `docProps/*.xml`** trong `[Content_Types].xml`.

**Cách sửa và bài học:** đừng dựng lại gói từ đầu. Lấy nguyên gói của một tệp `.docx` làm
nền (đọc ra rồi giữ lại mọi tệp), chỉ thay `document.xml` và danh sách ảnh, rồi lọc bỏ quan hệ
ảnh cũ trong `document.xml.rels`. An toàn hơn hẳn việc tự viết `[Content_Types].xml` và
`_rels/.rels`.

## 90. Dấu `"` trong thuộc tính XML làm hỏng cả tài liệu

Trường mục lục Word viết là `w:instr=" TOC \o "1-3" "`. Nếu chỉ escape `&`, `<`, `>` mà quên
dấu nháy kép, XML sinh ra không đúng cấu trúc.

**Cách sửa:** tách hai hàm — `thoat()` cho nội dung văn bản, `thoatThuocTinh()` cho giá trị
thuộc tính (thêm escape `"`).

> **Quy tắc tránh lặp:** khi chèn giá trị vào thuộc tính XML, luôn dùng hàm escape riêng cho
> thuộc tính. Dùng chung hàm escape nội dung là nguồn lỗi rất dễ tái phát.

## 91. Bảng kiểm tra XML phải chạy **trước** khi đóng gói

Bốn lỗi ở mục 88, 89, 90 đều chỉ lộ ra khi mở bằng Word. Nếu kiểm tra ngay lúc sinh thì mỗi
lỗi được sửa trong một phút thay vì phải đoán.

Đã thêm hàm `kiemTraXml()` đếm thẻ mở và thẻ đóng của mọi phần tử trong mọi tệp `.xml` và
`.rels`; nếu phần tử nào lệch thì **dừng lại, không ghi tệp**.

```js
const loi = []
for (const ten of tep.keys()) {
  if (!ten.endsWith('.xml') && !ten.endsWith('.rels')) continue
  const dem = new Map()
  for (const m of x.matchAll(/<(\/?)([A-Za-z0-9_.:-]+)([^>]*?)(\/?)>/g)) { /* đếm mở / đóng */ }
  for (const [tenThe, { mo, dong }] of dem) if (mo !== dong) loi.push(`${ten}: <${tenThe}>`)
}
if (loi.length) throw new Error('Dừng lại — file sinh ra sẽ không mở được.')
```

> **Quy tắc tránh lặp:** định dạng nhị phân có nhiều quy tắc ẩn thì phải có **bước kiểm tra tự
> động chạy trong lúc sinh**, không đợi tới bước dùng cuối mới phát hiện. Chỉ cần vài chục
> dòng là tiết kiệm được hàng giờ đoán.

## 92. Biểu thức chính quy tạo vô hình trong JavaScript template literal

Bốn mục trên, có một mục khác: khi viết lệnh PowerShell **bên trong** template literal của
JavaScript, các ký tự `\` trong biểu thức chính quy biến mất.

```js
const ps = `... [regex]::Matches($sb.ToString(), '/Count\s+(\d+)') ...`
// PowerShell nhận được: '/Counts+(d+)'   ← sai!
```

Trong template literal không có tag, `\s` và `\d` không phải escape hợp lệ nên bị nuốt thành
` s` và ` d`. Script PowerShell sau đó báo *"Cannot index into a null array"* — thông báo hoàn
toàn không liên quan tới nguyên nhân thật.

**Cách sửa:** viết `\\s`, `\\d` khi cần truyền `\` sang ngôn ngữ khác. Tốt hơn: **đừng làm
regex trong PowerShell cả khi không cần** — đọc tệp PDF bằng Node (`readFileSync(pdf)
.toString('latin1')`) vừa nhanh hơn vừa khỏi lỗi.

> **Quy tắc tránh lặp:** khi sinh mã cho ngôn ngữ khác từ chuỗi của ngôn ngữ đang viết, kiểm
> tra lại từng ký tự `\` và `$`. Cách chắc chắn hơn: **lưu kết quả vào tệp rồi đọc lại xem
> đúng không** thay vì tin rằng chuỗi đã đúng.

## 93. Giết Word giữa chừng để lại trạng thái khôi phục, khiến mọi lần đo sau đó sai

Đây là mục tốn thời gian nhất trong buổi làm việc hôm nay.

**Triệu chứng:** dùng `Stop-Process -Name WINWORD` để đóng vưỡng Word, rồi chạy lại đo số
trang — Word **treo** hoặc trả kết quả sai (1 trang cho tài liệu dài 121 trang). Hai lần tôi
kết luận nhầm rằng tệp `.docx` sinh ra bị hỏng và bắt đầu sửa từng bảng, từng kiểu bề rộng
cột — trong khi tệp hoàn toàn bình thường.

**Vì sao sai:** khi bị giết giữa lúc đang mở tài liệu, Word ghi tệp khôi phục vào
`%APPDATA%\Microsoft\Word\*.asd` và ghi khoá `HKCU\Software\Microsoft\Office\16.0\Word\
Resiliency\DocumentRecovery`. Lần khởi động sau, Word hiện **bảng khôi phục tài liệu** — bảng
này chặn COM automation, nên tập lệnh treo hoặc đọc nhầm tài liệu đã khôi phục dở dang.

**Cách sửa:** trước khi đo lại bằng Word, phải dọn sạch:

```powershell
Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue
Remove-Item "HKCU:\Software\Microsoft\Office\16.0\Word\Resiliency\DocumentRecovery" -Recurse -Force
Get-ChildItem "$env:APPDATA\Microsoft\Word" -Include *.asd,*.lnk -Recurse -Force | Remove-Item -Force
Get-ChildItem . -Filter '~$*' -Force | Remove-Item -Force   # tệp khoá của Word
```

Sau khi dọn, tài liệu hiện ra là **bình thường, đủ 121 trang**.

> **Quy tắc tránh lặp:** **không bao giờ kết luận "file hỏng" chỉ từ một lần đo bằng công cụ
> bị nhiễu.** Kiểm tra chéo bằng cách thứ hai độc lập (ở đây là xuất PDF rồi đếm `/Count`
> trong tệp PDF) trước khi sửa mã nguồn. Sửa mã nguồn để "chữa" triệu chứng do công cụ gây ra
> là lãng phí thời gian tệ nhất.

## 94. `ComputeStatistics` của Word trả số trang chưa phân trang

Hỏi Word số trang bằng `$doc.ComputeStatistics(2)` khi Word chạy ẩn cho kết quả **không đáng
tin**: tài liệu 121 trang trả về 1. Word chỉ phân trang khi hiển thị hoặc khi được ép.

**Cách sửa:** ép Word xuất PDF rồi đếm `/Count N` trong tệp PDF — đó là kết quả sau khi phân
trang thật, và là con số người đọc sẽ thấy khi in ra.

> **Quy tắc tránh lặp:** khi lấy số liệu từ công cụ tự động, hãy hỏi **"con số này có phải
> thứ người dùng thực sự quan sát không?"**. Số trang phải đếm từ bản in, không đếm từ con
> số bộ nhớ đệm của công cụ.

## 95. PowerShell 5.1 đọc tệp `.ps1` theo mã ANSI, vỡ với tiếng Việt

**Triệu chứng:** tập lệnh PowerShell sinh ra từ Node báo *"tệp bị hỏng"* trong khi chạy tay
thì không sao. Nguyên nhân: PowerShell 5.1 đọc tệp `.ps1` không có BOM theo mã hệ thống
(ANSI, ở đây là windows-1258), nên đường dẫn có tiếng Việt bị cắt thành ký tự lạ và Word nhận
đường dẫn sai.

**Cách sửa:** chạy Word trên **bản sao ở đường dẫn chỉ gồm ký tự ASCII** rồi chép kết quả về.
Cách này chắc chắn hơn cả việc thêm BOM, vì không còn phụ thuộc cách trình duyệt tệp.

> **Quy tắc tránh lặp:** khi điều khiển công cụ cũ từ ngôn ngữ khác, **tránh đưa chuỗi có ký tự
> ngoài ASCII vào tệp trung gian**. Truyền qua đường dẫn ASCII hoặc qua luồng chuẩn.

## 96. Bề rộng cột chia đều làm bảng 6 cột khó đọc

Nhìn bảng 18 test case trong bản HTML thử, cột "Mục kiểm thử" chỉ vài chữ vẫn bị bẻ dòng liên
tục trong khi cột "Input / thao tác kiểm thử" bên cạnh còn dư chỗ trống.

**Cách sửa:** cấp phần bề rộng cho mỗi cột **theo độ dài chữ dài nhất của nó**, rồi ép tổng về
đúng bề rộng vùng nội dung, và cho cột cuối nhận phần dư để tổng khớp tuyệt đối (lệch vài twip
là lệch viền bảng).

```js
const doDai = hang[0].map((_, i) => Math.max(4, ...hang.map((r) => Math.min(60, hop(r[i]).length))))
```

> **Bài học:** script chạy sạch **không** bảo đảm kết quả đẹp. Phải **mở ra nhìn** — và khi
> xem thì xem thứ khó nhìn nhất (bảng nhiều cột), không phải thứ dễ nhìn nhất.

## 97. Vòng lặc chuyển markdown treo im lặng khi gặp dòng lạ

Thêm nhận diện chú thích bảng với biểu thức `/^\*\*Bảng\s+[\d.]+\.?\*\*/`. Biểu thức này yêu
cầu `**` nằm ngay sau phần số, nên dòng `**Bảng 1. Các chức năng đã triển khai**` **không**
khớp — trong khi biểu thức dừng vòng lặp thì lại khớp. Kết quả: nhánh đoạn văn không nhận
dòng nào và `i` không bao giờ tăng, script treo **không báo lỗi**.

**Cách sửa:** thêm lưới an toàn ở nhánh đoạn văn — nếu không thu được dòng nào thì bắt buộc
tăng `i`:

```js
if (van.length) { ra.push(doan('Nidung', cacDoanChay(van.join(' ')), { thuDau: 425 })) }
else { i++ }   // dòng lạ khớp biểu thức dừng: không tăng i thì quay vô hạn, treo luôn
```

> **Quy tắc tránh lặp:** mỗi nhánh xử lý dòng phải **tăng chỉ số ở mọi đường thoát**. Với
> nhánh cuối cùng ("gom các dòng còn lại"), luôn kèm `else { i++ }` để một dòng lạ không làm
> treo cả chương trình.
## 98. Kho anh stock khong bao gio co nhieu anh cua mot phong that

Yeu cau: 12 phong, moi phong 4 anh **cung mot phong** o cac goc khac nhau. Da thu 4 nguon
truoc khi ket luan:

| Nguon | Ket qua do that |
|-------|----------------|
| StockSnap.io | HTTP 403 — chan truy cap |
| Openverse (tu khoa `hotel room`) | Tim duoc nhieu anh le nhung khong co bo 4 anh cung phong |
| Wikimedia Commons | Duyet 35 danh muc anh phong khach san — **0** danh muc nao co tu 4 anh tro len |
| Booking / Airbnb | Co dung thu can nhung co ban quyen |

**Ly do:** kho anh stock luu **tung anh le**. Mot quan he "4 anh cung mot phong" khong ton
tai trong du lieu cua ho — no chi ton tai trong **album cua nguoi chup**. Khi gap yeu cau
"nhieu goc cua mot chu the", phai tim theo **nguoi chup / album**, khong tim theo tu khoa.

**Cach phat hien ra bo anh dung:** gom anh theo **ten chu the** tach tu tieu de (phan truoc
dau hai cham), vi du `"Cove Patrol Cabin: interior views"` + `"Cove Patrol Cabin: interior
views kitchen area"` la cung mot cabin. Chi dua vao khoang cach so anh se gop nham hai
phong khac nhau cua cung mot chuyen chup.

> **Quy tac tranh lap:** truoc khi cam ket "lay anh tu dau", kiem tra nguon co **cau truc
> nhom theo chu the** khong. Neu khong, tim nguon khac ngay — do la dau hieu nguoi thu
> thap hon la doc het danh sach phong.

## 99. Them mot ban ghi vao giua danh sach lam lech moi tham chieu theo chi so

Them 2 phong vao `DuLieuMau` de co 12 phong. Build van sach, test chay **10 loi**:
don mau van tham chieu phong bang **chi so** nen phan thoi gian viet sai phong.

```
Error: Don HS-260626-0003 dat 4 khach cho phong chi chua 2.
```

Chi so la thu **de bi doi** va **khong doc duoc**. Chi can them mot phong vao giua danh
sach la moi tham chieu phia sau lech — va loi khong lo ra khi xem code, chi lo ra khi
chay.

**Sua tap goc, khong sua con so:** doi `int SoPhong` thanh `string MaPhong` ("A101") va tra
bang `FirstOrDefault(p => p.RoomNumber == mau.MaPhong)`. Ma phong khong doi khi them, xoa
hay sap xep lai phong — loi nay khong quay lai duoc.

```csharp
Room phong = phongList.FirstOrDefault(p => p.RoomNumber == mau.MaPhong)
    ?? throw new InvalidOperationException($"Don mau tham chieu phong '{mau.MaPhong}' khong ton tai.");
```

> **Quy tac tranh lap:** du lieu mau **bao gio cung tham chieu bang khoa kinh doanh**
> (`RoomNumber`, `Email`), khong bao gio bang vi tri. Test bat loi ngay la day ro toi
> nhat — neu khong co test, loi nay se ra giao dien demo truoc GVHD.

## 100. Them anh moi phai doi ca du lieu mau, ca test, ca giao dien

Doi 12 anh cu (3 concept) sang 48 anh moi (12 phong x 4 anh) thi lan luot phai sua:
`DuLieuMau.cs` · `Home.tsx` (anh nen hero) · `SeedDataTests` · `RoomSearchTests` ·
`LocationServiceTests` · `NGUON_ANH.md`. Toan co so du lieu dung `so luong` viet cuung
nen moi doi la doi hang loat.

**Hai thu rut ra tu lan nay:**

1. Gom so lieu ky vong vao **hang so** o dau class test thay vi viet cuung rai rac:

   ```csharp
   private const int TongSoPhong = 12;
   Assert.Equal(SoPhong * SoAnhMoiPhong, await db.RoomImages.CountAsync());
   ```

2. Test khai bao kiem tra **dung thu muc anh** — chan dung loi "anh lech phong":

   ```csharp
   Assert.Single(x.Images.Select(i => /* thu muc */).Distinct());
   ```

> **Quy tac tranh lap:** khi doi du lieu mau, hay grep so luong cu truoc khi sua — `grep -rn
> "10 phong"`. Va them test bao ve **bat bien** (moi phong mot thu muc anh rieng), khong chi
> kiem tra so luong, de loi quay lai khong con duong lot.
