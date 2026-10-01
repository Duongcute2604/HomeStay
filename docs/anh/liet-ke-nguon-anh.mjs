/**
 * Liệt kê 12 bộ ảnh phòng cùng tiêu đề gốc, phục vụ viết `docs/NGUON_ANH.md`.
 *
 * Ảnh không tự nói lên nội dung, nhưng tiêu đề gốc trên Flickr thì có. Ghi lại
 * cả hai để sau này đối chiếu được ảnh nào chụp gì, thay vì phải mở từng tệp.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const thuMuc = dirname(fileURLToPath(import.meta.url))

for (const ten of ['bo-anh-da-tai.json', 'ung-vien-da-tai.json']) {
  const p = join(thuMuc, ten)
  if (!existsSync(p)) continue
  console.log(`\n########## ${ten} ##########`)
  for (const b of JSON.parse(readFileSync(p, 'utf8'))) {
    console.log(`\n■ ${b.ma}   [${b.banQuyen}] ${b.tacGia ?? '?'}`)
    b.anh.forEach((a, i) => console.log(`   ${i + 1}. ${a.tieuDe}`))
  }
}
