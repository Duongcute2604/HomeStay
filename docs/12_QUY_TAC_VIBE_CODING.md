# 12 QUY TẮC VIBE CODING — ÁP DỤNG CHO ĐỒ ÁN NÀY

> Danh sách ngắn để tra cứu nhanh. **Quy tắc đầy đủ nằm ở [`AGENTS.md`](../AGENTS.md).**
> Mỗi rule ở đây đều có dòng "Đã áp dụng ở đâu" — nghĩa là nó **không phải khẩu hiệu**, đã được ghi vào quy tắc và kiểm chứng được.

| # | Rule | Đã áp dụng ở đâu | Bằng chứng trong dự án này |
|---|------|-------------------|----------------------------|
| 1 | Bắt đầu bằng "vibe PMing" — đặc tả trước khi code | `KE_HOACH_TRIEN_KHAI*.md` (21 bước) | Bước 1–2 viết trước **3 ngày** code |
| 2 | Giữ hệ thống công nghệ đơn giản | `AGENTS.md` 1.3 Cấm thêm | Không có CDN, notification, payment, host/nhân viên |
| 3 | Cho AI quy tắc & tài liệu đúng | `AGENTS.md` + `README.md` + 3 file kế hoạch | Mỗi phiên mới dán lại 3 file: `AGENTS.md`, `todo.md`, `lessons.md` |
| 4 | **Yêu cầu AI KHÔNG code** — bắt AI trình bày kế hoạch trước | `AGENTS.md` 0.1 §1 | Chốt stack, chốt 5 mốc, chọn phiên bản — **đều hỏi trước khi làm** |
| 5 | Hỏi AI lựa chọn, **chọn cái đơn giản nhất** | Hỏi ở bước 2 | Chọn React 18 cũ 1 đời thay vì React 19 mới nhất |
| 6 | Chia nhỏ nhiệm vụ | `todo.md` 21 bước, 1 lượt = 1 chức năng | Mỗi lượt sửa vài file, không đụng 20 file |
| 7 | Đưa ảnh để AI có ngữ cảnh | ⚠️ **Không dùng được** — xem mục A | Chụp màn hình lỗi → mô tả bằng lời hoặc dán log |
| 8 | Kiểm tra tàn nhẫn sau mọi thay đổi | `AGENTS.md` 0 (6 bước) + mục 5 | Mỗi chức năng: 3 kịch bản tay + unit test |
| 9 | **Đừng ngần ngại hoàn trả lại** | `AGENTS.md` 8 (Git) | 2 commit/ngày → `git revert` là cứu mạng |
| 10 | Dùng GitHub quản lý phiên bản | `.gitignore` + quy tắc commit | **Chưa tạo repo GitHub — việc cần làm ngay** |
| 11 | Dùng giọng nói để cảm nhận năng lượng | Không áp dụng | Máy đang gõ bàn phím, không cần |
| 12 | **Yêu cầu AI giải thích code** | `AGENTS.md` 0.4 c | Sau mỗi chức năng, mình giải thích luồng chạy bằng lời |

---

## A. Rule 7 — Vấn đề thật: AI này không đọc được ảnh

Model đang chạy **không hỗ trợ đưa ảnh vào cuộc trò chuyện**. Gửi ảnh chụp màn hình sẽ báo lỗi.

**Cách thay thế — hiệu quả tương đương, làm ngay được:**

| Muốn truyền ảnh chụp | Làm thay bằng |
|---|---|
| Screenshot lỗi giao diện | Copy **text trong Console** của trình duyệt (F12 → Console) rồi dán vào đây |
| Screenshot Swagger | Copy **JSON response** từ trình duyệt rồi dán vào đây |
| Screenshot form bị lỗi validate | Chép nguyên thông báo lỗi + cho biết bấm nút gì thì bị |
| Screenshot trang giao diện | Mô tả bằng lời: "tiêu đề căn giữa, nút xanh nằm góc phải" |

> **Mẹo:** Console/Swagger thường cho **thông tin chính xác hơn ảnh chụp** — có số dòng, mã lỗi, stack trace. Chỉ ảnh mới cho biết vị trí/bố cục.

---

## B. Rule 8 — "Test ruthlessly" cụ thể hoá cho đồ án này

Không phải "test thử xem có chạy không", mà là 3 tầng bằng chứng:

```text
Tầng 1  BUILD        dotnet build 0 warning · npm run build không lỗi
Tầng 2  TEST TAY     3 kịch bản KHÁC NHAU mở trình duyệt thật
                     · happy path · edge case · bất thường
Tầng 3  UNIT TEST    dotnet test xanh 100% cho logic nghiệp vụ
```

| Tầng | Bắt buộc khi nào | Ghi vào đâu |
|------|-------------------|-------------|
| Tầng 1 | Mọi lần sửa code | Không cần ghi |
| Tầng 2 | Cuối mỗi chức năng | `docs/KIEM_THU_TAY.md` (78 kịch bản) |
| Tầng 3 | Cuối mỗi chức năng | `dotnet test` output ghi vào `todo.md` |

> **Không có đủ 3 tầng thì chưa được gọi là "xong".** Đây là điều GVHD sẽ hỏi khi bảo vệ.

---

## C. Rule 9 — Khi nào thì hoàn trả lại

`git revert` **an toàn hơn** sửa tay từng dòng, vì nó giữ lại lịch sử — thầy nhìn thấy bạn đã thử, đã sửa, không giấu lỗi.

```powershell
git log --oneline                    # xem đã commit gì
git diff HEAD~1                      # xem 1 commit vừa rồi đổi gì
git revert <mã-commit>               # hoàn tác 1 commit, giữ lịch sử
git reset --hard HEAD~1              # xoá hẳn commit (chỉ khi chưa đẩy lên GitHub)
```

**Dùng `reset --hard` chỉ khi commit đó CHƯA push lên GitHub.** Đã push rồi thì luôn dùng `revert`.

> **Đừng ngại hoàn trả lại.** Một giờ sửa lại code rác tốt hơn một đồ án không chạy được.

---

## D. Rule 10 — GitHub

| Việc | Trạng thái |
|------|-----------|
| `git init` trong `Homestay` | ✅ xong |
| Commit hằng ngày | ✅ đang thực hiện |
| Tạo repo private + push | ✅ **xong 29/09** → https://github.com/Duongcute2604/HomeStay |
| Tên/email commit trùng tài khoản GitHub | ✅ đã sửa cả 3 commit cũ, có kiểm chứng cây file không đổi |

**Cách đẩy từ giờ — chỉ 2 lệnh** (nhánh `main` đã làm mặc định):

```powershell
git add -A
git commit -m "feat: them chuc nang dat phong theo gio"
git push
```

> Lần sau không cần khai báo lại remote, không cần chỉ định `-u`.

**Trước mỗi lần push nhớ:** chạy `git status` xem có file lạ lọt vào không (xem `AGENTS.md` mục 0.3).
