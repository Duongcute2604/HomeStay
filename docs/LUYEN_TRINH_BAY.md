# KẾ HOẠCH LUYỆN TRÌNH BÀY

Đồ án 4 — Hệ thống đặt phòng & quản lý homestay HomeStay · Nguyễn Hải Nam — 12523W.1

---

## Nguyên tắc

Ba lần luyện phải **khác nhau**, nếu không thì cũng như luyện một lần:

| Lần | Cách luyện | Mục tiêu |
|-----|-----------|----------|
| **1** | Đọc theo slide, nhìn lời nói | Biết nói đủ ý, tìm chỗ dài |
| **2** | Nhìn slide thật, **không đọc lời nói** | Tập tự diễn đạt, quen không phụ thuộc giấy |
| **3** | **Không cả slide**, tay cầm bút chỉ vào màn hình | Tập giải thích bằng ngôn ngữ của mình |

Mỗi lần **bắt đầu bằng đồng hồ** và ghi lại kết quả. Mục tiêu **≤ 15 phút**.

---

## Mốc thời gian gợi ý

| Mốc | Việc | Ưu tiên |
|-----|------|---------|
| Hôm nay | Luyện lần 1 | Cao |
| Ngày mai | Luyện lần 2 | Cao |
| 2 ngày sau | Luyện lần 3 + chạy thử trên máy sạch | Rất cao |
| 1 ngày trước bảo vệ | Đọc lại `docs/DAU_HOI_GVHD.md`, **không sửa code** | Cao |

---

## Lần 1 — Đọc theo slide

**Cách làm:** mở PowerPoint, để chế độ trình chiếu, đọc lời nói trong `docs/SLIDE.md` phần
**Nói** của từng slide.

**Mục tiêu:** lần đầu em sẽ nói hơi 17–18 phút. **Đó là bình thường** — chuyện là cắt bớt
từ lần 2.

**Ghi lại vào bảng bên dưới:**
- Tổng thời gian: ____ phút ____ giây
- Slide nào nói lâu nhất: ____________________
- Câu nào nói bị rối: ____________________

**Sau lần 1, cắt ở đâu?**

| Dấu hiệu | Cắt gì |
|----------|--------|
| Slide 2 và 3 nói dài | Gộp lý do chọn đề tài với mục tiêu thành 1 slide |
| Slide 5 nói quá 1 phút 30 | Bỏ phần giải thích 3 tầng chi tiết, chỉ nói "3 tầng: giao diện, nghiệp vụ, cơ sở dữ liệu" |
| Slide 14 nói quá 1 phút | Bỏ chi tiết lỗi 1 và 2, chỉ kể lỗi múi giờ — đó là lỗi đáng nói nhất |

---

## Lần 2 — Nhìn slide, không đọc lời nói

**Cách làm:** đóng file `SLIDE.md`. Chỉ nhìn **tiêu đề** slide, tự nói tiếp.

**Mục tiêm:** lần này còn khoảng 15–16 phút. Cần cắt thêm.

**Chỗ hay bị lụng:** slide 5 (công thức chống trùng) và slide 14 (lỗi múi giờ) — hai chỗ
này nói bằng tay sẽ dài hơn nhiều so với đọc.

**Gợi ý xử lý:**

| Slide | Khi tự nói, dễ dài thành | Cắt bằng cách |
|-------|------------------------|---------------|
| 5 | Giải thích lại từng tầng chi tiết | Chỉ nói tầng nào chặn việc gì, một câu mỗi tầng |
| 7 | Kể cả 3 quy tắc kiến trúc | Chỉ nói quy tắc quan trọng nhất: không trả entity thô |
| 14 | Kể cả 3 lỗi chi tiết | Chỉ kể lỗi múi giờ, nhắc "hai lỗi nữa em đã sửa, ghi trong báo cáo" |
| 16 | Liệt kê hết 5 hướng phát triển | Nói 2 hướng đầu, rồi "các hướng còn lại em ghi trong báo cáo" |

---

## Lần 3 — Không cả slide

**Cách làm:** bỏ PowerPoint. Mở sẵn hệ thống. Cầm bút, chỉ vào màn hình khi nói tới phần nào.

**Đây là lần luyện quan trọng nhất** vì giảng viên sẽ hỏi đột xuất, em phải nói được ngay
mà không có slide nhắc.

**Chuẩn bị trước khi luyện:** ghi nhớ đủ 5 điểm này, không cần mở tài liệu:

| # | Điểm phải nhớ |
|---|--------------|
| 1 | **Chống đặt trùng**: công thức `c₁ < t₂ VÀ t₁ > c₂`, chặn ở 3 tầng, dùng `<` vì chạm biên không tính trùng |
| 2 | **Snapshot giá**: giá là thông tin tại thời điểm thỏa thuận; đổi giá phòng không được làm thay đổi lịch sử |
| 3 | **Lỗi múi giờ**: giao diện gửi giờ UTC, hệ thống hiểu giờ địa phương, lệch 7 giờ; màn hình hiển thị đúng nhưng dữ liệu sai; lọt qua 649 test |
| 4 | **Số liệu**: 17 chức năng · 11 bảng · 47 API · 22 màn hình · 414 + 287 test · 41 request · 267 kịch bản tay |
| 5 | **Phân quyền**: 2 tầng (API + route), `userId` lấy từ token không lấy từ client, đăng ký không tự chọn quyền |

**Gợi ý mở đầu khi không có slide:**

"Kính chào thầy, em báo cáo đồ án 4 — Hệ thống đặt phòng và quản lý homestay HomeStay. Em xin
phép đi lần lượt qua 5 phần: mục tiêu và phạm vi, công nghệ dùng, thiết kế hệ thống, phần
nghiệp vụ trọng tâm, và kết quả kiểm thử."

Rồi bắt đầu luôn — **không dừng lại đợi thầy gật đầu**.

---

## Bảng ghi kết quả

| Lần | Ngày | Tổng thời gian | ≤ 15 phút? | Slide nói lâu nhất | Sai sót cần sửa ở lần sau |
|-----|------|----------------|-----------|--------------------|----------------------------|
| 1 | ___/___ | ____ phút ____ giây | ⬜ Có · ⬜ Không | | |
| 2 | ___/___ | ____ phút ____ giây | ⬜ Có · ⬜ Không | | |
| 3 | ___/___ | ____ phút ____ giây | ⬜ Có · ⬜ Không | | |

---

## Nếu vẫn không kịp 15 phút — cắt theo thứ tự này

Cắt từ trên xuống, **đừng cắt bừa**. Mỗi ý bỏ đi vẫn phải còn mạch lạc.

| Thứ tự | Bỏ gì | Tiết kiệm | Lý do bỏ được |
|--------|-------|-----------|---------------|
| 1 | Slide 6 (tác nhân & use case) — nói chung, không cần hình | ~20 giây | Nội dung này thầy đã xem trong báo cáo |
| 2 | Slide 7 rút gọn: bỏ 2 quy tắc kiến trúc, chỉ giữ "không trả entity thô" | ~15 giây | Chỉ cần 1 ví dụ minh hoạ |
| 3 | Slide 14: bỏ lỗi 1 và 2, chỉ kể lỗi múi giờ | ~40 giây | Lỗi múi giờ đáng nói hơn |
| 4 | Slide 16: nói 2 hướng phát triển thay vì 5 | ~20 giây | Hướng đầu đã đủ thể hiện tư duy |
| 5 | Slide 3 phạm vi: nói nhanh, không liệt kê 17 chức năng | ~15 giây | Đếm đủ ở slide 16 rồi |

**Cái tuyệt đối không được cắt:** slide 5 (công thức chống trùng), slide 14 (lỗi múi giờ),
slide 15 (bảng kết quả kiểm thử). Đây là ba chỗ thể hiện **em hiểu bài toán**, không phải
em chỉ làm theo hướng dẫn.

---

## Trả lời câu hỏi phụ — luyện riêng 30 phút

Đọc `docs/DAU_HOI_GVHD.md` và **tự trả lời thành tiếng**, không đọc phần "Trả lời ngắn".

| Câu | Tự trả lời được không? |
|-----|----------------------|
| 1 — Vì sao chọn kiến trúc phân tầng? | ⬜ |
| 2 — Làm sao chống đặt trùng? | ⬜ |
| 3 — Vì sao lưu snapshot giá? | ⬜ |
| 4 — Phân quyền thế nào? | ⬜ |
| 5 — Hai người đặt cùng lúc thì sao? | ⬜ |
| 6 — Phần nào tốn thời gian nhất? | ⬜ |
| 7 — Dùng AI thế nào? | ⬜ |
| 8 — Phần chưa làm? | ⬜ |
| 9 — Đảm bảo chất lượng bằng cách nào? | ⬜ |
| 10 — Sẽ làm gì tiếp? | ⬜ |

**Câu nào trả lời ấp úng → ô đó là điểm phải học lại trước ngày bảo vệ.**

---

## Checklist trước buổi bảo vệ

| # | Việc | ✓ |
|---|------|---|
| 1 | Luyện đủ **3 lần**, mỗi lần có ghi thời gian | ⬜ |
| 2 | Lần gần nhất **≤ 15 phút** | ⬜ |
| 3 | Tự trả lời được ≥ **8/10** câu hỏi phụ | ⬜ |
| 4 | Chạy thử trên **máy sạch**: `docker compose up -d` → chạy API → chạy web | ⬜ |
| 5 | Mở được `localhost:5080/swagger` | ⬜ |
| 6 | Đăng nhập được `admin@homestay.vn` / `123456` | ⬜ |
| 7 | Mở sẵn 2 tab trình duyệt (khách + Admin) | ⬜ |
| 8 | Tắt thông báo trình duyệt và thông báo email | ⬜ |
| 9 | Báo cáo có đủ **46 hình** (23 hình Chương 3 + 23 hình Chương 4), không ô nào trống | ⬜ |
| 10 | Không có chỗ nào trong báo cáo ghi "nhân viên" | ⬜ |
| 11 | Đã đọc mục **Vibe Coding** trong báo cáo để trả lời câu hỏi về AI | ⬜ |
| 12 | Mang theo **USB hoặc in phụ** báo cáo và file slide | ⬜ |

**Mục 10 và 11 dễ bị bỏ sót nhưng rất dễ mất điểm** — mở báo cáo lần cuối và lướt qua
từng trang một, không chỉ mở đại ý.