/** Kiểm tra ba danh mục trong báo cáo: mục lục, danh mục bảng, danh mục hình. */
import { docZip } from './tao-bao-cao.mjs'

const tep = docZip('10123234_NguyenHaiNam_Do_An_4_Tuan5.docx')
const x = tep.get('word/document.xml').toString('utf8')
const doan = x.match(/<w:p\b[\s\S]*?<\/w:p>|<w:p\b[^>]*\/>/g) ?? []

const styleCua = (d) => /<w:pStyle w:val="([^"]+)"/.exec(d)?.[1] ?? ''
const chuCua = (d) => [...d.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((m) => m[1]).join('')

/* Tìm vị trí ba trường TOC và in đoạn tĩnh ngay sau nó. */
const truong = [
  { ten: 'MỤC LỤC', chiDan: 'TOC \\o' },
  { ten: 'DANH MỤC BẢNG BIỂU', chiDan: 'bảng,1' },
  { ten: 'DANH MỤC HÌNH ẢNH', chiDan: 'hình,1' },
]

for (const t of truong) {
  const viTri = doan.findIndex((d) => d.includes(t.chiDan))
  console.log(`\n=== ${t.ten} (đoạn ${viTri + 1}) ===`)
  let dem = 0
  for (const d of doan.slice(viTri + 1, viTri + 200)) {
    const st = styleCua(d)
    if (!st.startsWith('TOC')) break
    dem++
    if (dem <= 8 || dem > 995) console.log(`  ${String(dem).padStart(3)} ${chuCua(d).slice(0, 78)}`)
    else if (dem === 9) console.log('   ...')
  }
  console.log(`  → tổng ${dem} mục`)
}

console.log('\n=== Đếm chú thích trong thân ===')
const hinh = doan.filter((d) => styleCua(d) === 'hnh').length
const bng = doan.filter((d) => styleCua(d) === 'bng').length
console.log(`  Chú thích hình (style hình): ${hinh}`)
console.log(`  Chú thích bảng (style bảng): ${bng}`)

const anh = (x.match(/<w:drawing>/g) ?? []).length
const tbl = (x.match(/<w:tbl>/g) ?? []).length
console.log(`  Số khối ảnh nhúng: ${anh}`)
console.log(`  Số bảng: ${tbl}`)