/**
 * Quét rộng Openverse: mọi ảnh nội thất, gom theo tài khoản + tên chủ thể.
 *
 * Các lần quét trước dùng từ khoá hẹp kiểu "hotel room" nên mỗi lần chỉ thấy
 * vài chục ảnh của mỗi tài khoản — không đủ để nhận ra một tài khoản có chụp
 * liên tục nhiều phòng. Lần này lấy **hết số trang** của các từ khoá chung
 * chung nhất, rồi mới gom nhóm. Nhóm nào có từ 4 ảnh trở lên cùng tên chủ thể
 * thì giữ lại.
 *
 * Cách dùng: node docs/anh/quet-rong.mjs
 */
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const SO_ANH = 4
const SO_TRANG_TOI_DA = 50

const TU_KHOA = ['interior', 'bedroom', 'guest room', 'room interior', 'cabin', 'homestay', 'hotel room', 'lodge', 'suite']

let lanGoiCuoi = 0
let biChan = 0
async function goi(url) {
  const cho = 1250 - (Date.now() - lanGoiCuoi)
  if (cho > 0) await new Promise((r) => setTimeout(r, cho))
  lanGoiCuoi = Date.now()
  for (let i = 0; i < 5; i++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
      if (r.status === 429) {
        biChan++
        await new Promise((x) => setTimeout(x, 8000 * (i + 1)))
        continue
      }
      if (!r.ok) return null
      return await r.json()
    } catch {
      await new Promise((x) => setTimeout(x, 2500))
    }
  }
  return null
}

const tachFlickr = (d) => {
  const m = /flickr\.com\/photos\/([^/]+)\/(\d+)/.exec(d ?? '')
  return m ? { nguoi: m[1], so: Number(m[2]) } : null
}
const tenChuThe = (t) =>
  (t ?? '').split(/[:—]/)[0].replace(/\s*\(?\d+\)?\s*$/, '').replace(/\s+/g, ' ').trim()

const gom = new Map()
let xem = 0

for (const tk of TU_KHOA) {
  let trang = 1
  let thay = 0
  while (trang <= SO_TRANG_TOI_DA) {
    const j = await goi(`https://api.openverse.org/v1/images/?q=${encodeURIComponent(tk)}&license=cc0,pdm&page_size=20&page=${trang}`)
    if (!j?.results?.length) break
    xem += j.results.length
    for (const a of j.results) {
      const f = tachFlickr(a.foreign_landing_url)
      const c = tenChuThe(a.title)
      if (!f || !c) continue
      const k = `${a.creator ?? '?'}|${c.toLowerCase()}`
      if (!gom.has(k)) gom.set(k, [])
      if (!gom.get(k).some((x) => x.so === f.so)) {
        gom.get(k).push({
          so: f.so,
          tieuDe: (a.title ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
          anhLon: a.url,
          banQuyen: a.license,
          tacGia: a.creator,
          goc: a.foreign_landing_url,
          chuThe: c,
        })
        thay++
      }
    }
    trang++
  }
  console.log(`  · ${tk.padEnd(16)} ${String(thay).padStart(4)} ảnh · ${trang - 1} trang`)
}

console.log(`\nXem ${xem} ảnh (${biChan} lần bị giới hạn) · ${gom.size} nhóm chủ thể`)

const bo = [...gom.values()]
  .filter((ds) => ds.length >= SO_ANH)
  .sort((a, b) => b.length - a.length)

console.log(`\n${bo.length} nhóm có từ ${SO_ANH} ảnh trở lên:\n`)
for (const [i, g] of bo.slice(0, 40).entries()) {
  const trong = g.filter((a) => /\b(interior|inside|bedroom|room|suite)\b/i.test(a.tieuDe)).length
  console.log(`${String(i + 1).padStart(2)}. [${g[0].banQuyen}] ${g[0].tacGia?.slice(0, 22).padEnd(22)} · ${g[0].chuThe.slice(0, 48)} (${g.length} ảnh, ${trong} trong)`)
  g.slice(0, 5).forEach((a) => console.log(`      ${a.tieuDe.slice(0, 74)}`))
}

writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'anh-quet-rong.json'), JSON.stringify(bo, null, 1), 'utf8')
console.log(`\nĐã lưu docs/anh/anh-quet-rong.json`)
