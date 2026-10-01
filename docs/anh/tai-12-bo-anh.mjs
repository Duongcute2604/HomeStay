/**
 * Chọn 12 bộ ảnh phòng và tải về `client/public/images/rooms/`.
 *
 * Mỗi bộ là 4 ảnh **cùng một phòng** ở những góc khác nhau. Nguồn: Openverse quét
 * được ảnh CC0/PDM, chủ yếu từ Flickr. Bộ chỉ được chọn khi *tên chủ thể giống
 * nhau* trên cả 4 ảnh — ví dụ "Cove Patrol Cabin: interior views" và "Cove Patrol
 * Cabin: interior views sleeping area" là cùng một cabin. Chỉ dựa vào khoảng cách
 * số ảnh thì dễ gộp nhầm hai phòng khác nhau.
 *
 * Cách dùng: node docs/anh/tai-12-bo-anh.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const thuMucDich = join(thuMuc, '..', '..', 'client', 'public', 'images', 'rooms')
const CAN = 12
const SO_ANH_MOI_PHONG = 4

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

/* ---------- 1. Gom mọi ảnh đã thu thập ---------- */

const tenChuThe = (t) =>
  (t ?? '').split(/[:—]/)[0].replace(/\s*\(?\d+\)?\s*$/, '').replace(/\s+/g, ' ').trim()

const nhom = new Map() // "tacGia|chuThe" -> ảnh

function themAnh(a) {
  const chuThe = tenChuThe(a.tieuDe)
  if (!chuThe) return
  const khoa = `${a.tacGia ?? '?'}|${chuThe.toLowerCase()}`
  if (!nhom.has(khoa)) nhom.set(khoa, [])
  if (!nhom.get(khoa).some((x) => x.so === a.so)) nhom.get(khoa).push({ ...a, chuThe })
}

/*
 * Dữ liệu đầu vào là cache của `quet-rong.mjs` (`anh-quet-rong.json`). Chạy script
 * quét trước nếu tệp này chưa có — nó gọi API Openverse nên cần mạng.
 */
const gocQuet = join(thuMuc, 'anh-quet-rong.json')
if (!existsSync(gocQuet)) {
  console.error(`Thiếu ${gocQuet}. Chạy "node docs/anh/quet-rong.mjs" trước để tạo cache.`)
  process.exit(1)
}

/* `quet-rong.mjs` lưu mảng ảnh trực tiếp, không bọc trong "anh" như các đợt trước. */
for (const nhomAnh of JSON.parse(readFileSync(gocQuet, 'utf8'))) {
  for (const a of nhomAnh) themAnh(a)
}

console.log(`Gom được ${[...nhom.values()].reduce((s, d) => s + d.length, 0)} ảnh trong ${nhom.size} chủ thể`)

/* ---------- 2. Chọn 12 chủ thể có đủ 4 ảnh ---------- */

/*
 * Lọc chủ thể phải là *nơi lưu trú*, không phải bất kỳ tập ảnh nào có 4 ảnh liên tiếp.
 * Ba vòng quét trước lẫn vào tu viện, hội nghị chính trị và ảnh phụ trợ (biển báo,
 * nhà vệ sinh ngoài trời), nên cần lọc theo hai điều kiện: tên chủ thể gợi ý
 * chỗ ở, và phần lớn ảnh phải chụp bên trong.
 */
const TEN_NOI_O = /\b(cabin|homestay|hotel|lodge|suite|chalet|inn|guesthouse|pension|villa|resort|hostel|b&B|bed and breakfast)\b/i
const ANH_TRONG = /\b(interior|inside|bedroom|room|suite)\b/i

const ungVien = []
for (const ds of nhom.values()) {
  if (ds.length < SO_ANH_MOI_PHONG) continue
  if (!TEN_NOI_O.test(ds[0].chuThe)) continue
  const soTrong = ds.filter((a) => ANH_TRONG.test(a.tieuDe)).length
  if (soTrong < Math.ceil(SO_ANH_MOI_PHONG * 0.75)) continue
  // Ưu tiên bộ mà phần lớn ảnh đều là ảnh trong phòng, không phải ảnh ngoài trời.
  ds.__soTrong = soTrong
  ungVien.push(ds)
}

ungVien.sort((a, b) => b.__soTrong - a.__soTrong || b.length - a.length)

console.log(`\n${ungVien.length} chủ thể đủ 4 ảnh, không loại. Chọn ${CAN}:\n`)
for (const [i, ds] of ungVien.slice(0, CAN).entries()) {
  console.log(`${String(i + 1).padStart(2)}. [${ds[0].banQuyen}] ${ds[0].tacGia?.slice(0, 22).padEnd(22)} · ${ds[0].chuThe}`)
  ds.slice(0, SO_ANH_MOI_PHONG).forEach((a) => console.log(`      ${a.tieuDe.slice(0, 74)}`))
}

/* ---------- 3. Tải về ---------- */

/** Tên thư mục ngắn, không dấu, không khoảng trắng — dùng làm mã phòng. */
function tenMa(chuThe) {
  const chu = chuThe
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
  return chu.slice(0, 40) || 'phong'
}

/**
 * Flickr chặn hậu tố kích thước `_b` (đoán sai phải là bot), nhưng `_z` — cũng là
 * 1024 px — vẫn tải được. Đổi hậu tố trước khi tải, nếu không sẽ nhận về trang
 * lỗi HTML 919 byte thay vì ảnh.
 */
function suaDuongDanFlickr(u) {
  return u.replace(/_[a-z]\.jpg$/i, '_z.jpg')
}

async function tai(duongDan) {
  const u = suaDuongDanFlickr(duongDan)
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(u, { headers: { 'User-Agent': UA, Referer: 'https://www.flickr.com/' } })
      if (!r.ok) return null
      const b = Buffer.from(await r.arrayBuffer())
      // Kiểm tra chữ ký JPEG/PNG: ảnh quá nhỏ hoặc sai kiểu thường là trang lỗi HTML.
      if (b.length < 20_000) return null
      const chuKy = b.subarray(0, 3).toString('hex')
      if (chuKy !== 'ffd8ff' && chuKy !== '89504e') return null
      return b
    } catch {
      await new Promise((x) => setTimeout(x, 1200))
    }
  }
  return null
}

console.log('\n=== Tải ảnh ===')
const daTai = []
for (const [i, ds] of ungVien.slice(0, CAN).entries()) {
  const ma = tenMa(ds[0].chuThe)
  const thuMucPhong = join(thuMucDich, ma)
  rmSync(thuMucPhong, { recursive: true, force: true })
  mkdirSync(thuMucPhong, { recursive: true })

  let stt = 0
  for (const a of ds) {
    if (stt >= SO_ANH_MOI_PHONG) break
    const duLieu = await tai(a.anhLon)
    if (!duLieu) {
      console.log(`   ⚠ tải hỏng: ${a.tieuDe.slice(0, 50)}`)
      continue
    }
    stt++
    writeFileSync(join(thuMucPhong, `${ma}-${stt}.jpg`), duLieu)
  }
  if (stt === SO_ANH_MOI_PHONG) {
    daTai.push({ ma, chuThe: ds[0].chuThe, tacGia: ds[0].tacGia, banQuyen: ds[0].banQuyen, anh: ds.slice(0, stt) })
    console.log(`   ✔ ${ma} — ${stt} ảnh, ${(ds.slice(0, stt).reduce((s, a) => s + 0, 0), '')}${ds[0].banQuyen}`)
  } else {
    rmSync(thuMucPhong, { recursive: true, force: true })
    console.log(`   ✗ ${ma} — chỉ tải được ${stt}/4, bỏ`)
  }
}

writeFileSync(join(thuMuc, 'bo-anh-da-tai.json'), JSON.stringify(daTai, null, 1), 'utf8')
console.log(`\nĐủ ${daTai.length}/${CAN} phòng. Ghi nguồn ảnh vào docs/anh/bo-anh-da-tai.json`)