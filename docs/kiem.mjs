/** Kiểm tra nhanh báo cáo đã sinh: mục lục, danh mục, tiêu đề chương. */
import { docZip } from './tao-bao-cao.mjs'

const tep = docZip('10123234_NguyenHaiNam_Do_An_4_Tuan5.docx')
const x = tep.get('word/document.xml').toString('utf8')
const doan = x.match(/<w:p\b[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g) ?? []
console.log(`  Số đoạn: ${doan.length}`)

const batDau = doan.findIndex((d) => d.includes('TOC \\o'))
console.log(`  Trường mục lục ở đoạn ${batDau + 1}\n`)

let dem = 0
for (const d of doan.slice(batDau, batDau + 46)) {
  const chu = [...d.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join('')
  const st = /<w:pStyle w:val="([^"]+)"/.exec(d)?.[1] ?? ''
  if (!chu.trim()) continue
  dem++
  console.log(`   ${String(dem).padStart(3)} ${st.padEnd(8)} ${chu.slice(0, 74)}`)
}

console.log('\n=== Tiêu đề chương (Heading1) ===')
for (const d of doan) {
  const st = /<w:pStyle w:val="([^"]+)"/.exec(d)?.[1] ?? ''
  if (!st.startsWith('Heading')) continue
  const chu = [...d.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join('')
  const khongDanhSo = d.includes('w:numId w:val="0"') ? ' (không đánh số)' : ''
  console.log(`   ${st.padEnd(9)} ${chu.slice(0, 60)}${khongDanhSo}`)
}