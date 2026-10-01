/**
 * Dựng file báo cáo `.docx` Đồ án 4 từ các file markdown trong `docs/`.
 *
 * Khung tài liệu lấy từ bài "Phát triển ứng dụng mobile quản lý coffee" của chính tác
 * giả, vì bài đó có bộ style và cơ chế mục lục hoàn chỉnh hơn mẫu Đồ án:
 * - `Heading1/2/3` tự đánh số ("CHƯƠNG 1", "1.1", "1.1.1") nên không phải gõ số tay.
 * - Có sẵn hai style chú thích `hình` và `bảng`, dùng cho danh mục hình và danh mục bảng.
 * - Có sẵn đầy đủ header, footer đánh số trang và phông nhúng.
 * Chỉ giữ lại `styles.xml`, `numbering.xml`, `header/footer`, `fontTable`, `theme`; phần
 * thân tài liệu dựng lại hoàn toàn.
 *
 * Cách dùng:
 *   node docs/tao-bao-cao.mjs            → tạo file .docx (mục lục chờ cập nhật)
 *   node docs/tao-bao-cao.mjs --cap-nhat → mở bằng Word COM để điền mục lục rồi lưu
 */

import { readFileSync, writeFileSync, existsSync, rmSync, cpSync, mkdtempSync } from 'node:fs'
import { dirname, join, basename } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { deflateRawSync, inflateRawSync } from 'node:zlib'

const thuMucGoc = join(dirname(fileURLToPath(import.meta.url)), '..')
const KHUNG = join(thuMucGoc, '10123234_NguyenHaiNam_MobileCoBan.docx.docx')
const KET_QUA = join(thuMucGoc, '10123234_NguyenHaiNam_Do_An_4_Tuan5.docx')

/** Khổ giấy A4 của khung: rộng 11901 twip, lề trái 1701 + phải 1134 → nội dung 9066 twip. */
const RONG_NOI_DUNG_TWIP = 9066
const EMU_MOI_PIXEL = 9525

const TEN_DE_TAI = 'Xây dựng hệ thống đặt phòng và quản lý homestay'

/* ================================================================== */
/*  PHẦN 1 — ĐỌC / GHI FILE ZIP                                        */
/*  Node không có thư viện nén sẵn. Cấu trúc ZIP đủ đơn giản để tự  */
/*  làm: đọc central directory, giải nén từng mục bằng zlib.          */
/* ================================================================== */

const BANG_CRC = (() => {
  const b = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    b[i] = c
  }
  return b
})()

function crc32(duLieu) {
  let c = -1
  for (let i = 0; i < duLieu.length; i++) c = BANG_CRC[(c ^ duLieu[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

/** Đọc một file .docx thành Map<tên đường dẫn, Buffer>. */
function docZip(docxPath) {
  const buf = readFileSync(docxPath)

  let eocd = -1
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i
      break
    }
  }
  if (eocd < 0) throw new Error(`Không tìm thấy chữ ký ZIP trong ${basename(docxPath)}`)

  const soMuc = buf.readUInt16LE(eocd + 10)
  let p = buf.readUInt32LE(eocd + 16)
  const tep = new Map()

  for (let i = 0; i < soMuc; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('Central directory bị hỏng')
    const phuongThuc = buf.readUInt16LE(p + 10)
    const kichThuocNen = buf.readUInt32LE(p + 20)
    const daiTen = buf.readUInt16LE(p + 28)
    const daiPhu = buf.readUInt16LE(p + 30)
    const daiChuThich = buf.readUInt16LE(p + 32)
    const batDau = buf.readUInt32LE(p + 42)
    const ten = buf.toString('utf8', p + 46, p + 46 + daiTen)

    if (!ten.endsWith('/')) {
      const dauNoiDung = batDau + 30 + buf.readUInt16LE(batDau + 26) + buf.readUInt16LE(batDau + 28)
      tep.set(
        ten,
        phuongThuc === 0 ? Buffer.from(buf.subarray(dauNoiDung, dauNoiDung + kichThuocNen)) : inflateRawSync(buf.subarray(dauNoiDung, dauNoiDung + kichThuocNen)),
      )
    }
    p += 46 + daiTen + daiPhu + daiChuThich
  }
  return tep
}

/** Ghi Map<tên, Buffer> thành file ZIP. */
function ghiZip(duongDan, tep) {
  const phanDinh = []
  const phanChuTrung = []
  let lech = 0

  for (const [ten, duLieu] of tep) {
    const tenBuf = Buffer.from(ten, 'utf8')
    const nen = deflateRawSync(duLieu, { level: 9 })
    const crc = crc32(duLieu)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6) // tên đường dẫn UTF-8
    local.writeUInt16LE(8, 8) // deflate
    local.writeUInt16LE(0x2821, 12) // ngày sửa cố định → chạy lại cho kết quả giống nhau
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(nen.length, 18)
    local.writeUInt32LE(duLieu.length, 22)
    local.writeUInt16LE(tenBuf.length, 26)
    phanDinh.push(local, tenBuf, nen)

    const chu = Buffer.alloc(46)
    chu.writeUInt32LE(0x02014b50, 0)
    chu.writeUInt16LE(20, 4)
    chu.writeUInt16LE(20, 6)
    chu.writeUInt16LE(0x0800, 8)
    chu.writeUInt16LE(8, 10)
    chu.writeUInt16LE(0x2821, 14)
    chu.writeUInt32LE(crc, 16)
    chu.writeUInt32LE(nen.length, 20)
    chu.writeUInt32LE(duLieu.length, 24)
    chu.writeUInt16LE(tenBuf.length, 28)
    chu.writeUInt32LE(lech, 42)
    phanChuTrung.push(chu, tenBuf)

    lech += 30 + tenBuf.length + nen.length
  }

  const cd = Buffer.concat(phanChuTrung)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0)
  eocd.writeUInt16LE(tep.size, 8)
  eocd.writeUInt16LE(tep.size, 10)
  eocd.writeUInt32LE(cd.length, 12)
  eocd.writeUInt32LE(lech, 16)

  writeFileSync(duongDan, Buffer.concat([...phanDinh, cd, eocd]))
}

/* ================================================================== */
/*  PHẦN 2 — KÍCH THƯỚC ẢNH                                           */
/* ================================================================== */

function kichThuocAnh(duLieu) {
  if (duLieu.length > 24 && duLieu.readUInt32BE(0) === 0x89504e47) {
    return { rong: duLieu.readUInt32BE(16), cao: duLieu.readUInt32BE(20) }
  }
  let i = 2
  while (i < duLieu.length - 9) {
    if (duLieu[i] !== 0xff) {
      i++
      continue
    }
    const nhan = duLieu[i + 1]
    if (nhan >= 0xc0 && nhan <= 0xcf && nhan !== 0xc4 && nhan !== 0xc8 && nhan !== 0xcc) {
      return { cao: duLieu.readUInt16BE(i + 5), rong: duLieu.readUInt16BE(i + 7) }
    }
    i += 2 + duLieu.readUInt16BE(i + 2)
  }
  return null
}

/* ================================================================== */
/*  PHẦN 3 — DỰNG THẺ OOXML                                           */
/*  Thứ tự phần tử trong w:pPr và w:rPr là bắt buộc theo lược đồ.     */
/*  Đảo thứ tự thì Word báo "tệp bị hỏng" chứ không nói chỗ nào sai.*/
/* ================================================================== */

const thoat = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const thoatThuocTinh = (s) => thoat(s).replace(/"/g, '&quot;')

/**
 * Một đoạn chạy (w:r).
 *
 * Thứ tự phần tử trong `w:rPr` là bắt buộc theo lược đồ:
 * `rFonts` → `b` → `i` → `color` → `sz` → `szCs`.
 * `w:jc` **không** thuộc `w:rPr` — canh chữ phải đặt trong `w:pPr`.
 */
function run(chu, { dam = false, nghieng = false, mono = false, size = 0 } = {}) {
  if (!chu) return ''
  const rPr = [
    mono && '<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>',
    dam && '<w:b/>',
    nghieng && '<w:i/>',
    size && `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`,
  ]
    .filter(Boolean)
    .join('')
  const phan = chu
    .split('\n')
    .map((dong, i) => `${i > 0 ? '<w:br/>' : ''}<w:t xml:space="preserve">${thoat(dong)}</w:t>`)
    .join('')
  return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ''}${phan}</w:r>`
}

/** `**đậm**`, `*nghiêng*`, `` `mã` `` → các đoạn chạy có định dạng. */
function cacDoanChay(vanBan) {
  const ra = []
  const mau = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g
  let viTri = 0
  let kq
  while ((kq = mau.exec(vanBan)) !== null) {
    if (kq.index > viTri) ra.push(run(vanBan.slice(viTri, kq.index)))
    const con = kq[0]
    if (con.startsWith('**')) ra.push(run(con.slice(2, -2), { dam: true }))
    else if (con.startsWith('`')) ra.push(run(con.slice(1, -1), { mono: true }))
    else ra.push(run(con.slice(1, -1), { nghieng: true }))
    viTri = kq.index + con.length
  }
  if (viTri < vanBan.length) ra.push(run(vanBan.slice(viTri)))
  return ra.join('')
}

/**
 * Một đoạn văn. Thứ tự trong `w:pPr`:
 * `pStyle` → `keepNext` → `numPr` → `pBdr` → `spacing` → `ind` → `jc` → `rPr`.
 */
function doan(style, noiDung = '', { giu = false, khongDanhSo = false, truoc = '', sau = '', thu = 0, thuDau = 0, canh = '' } = {}) {
  const ind = thu ? ` w:left="${thu}" w:hanging="360"` : thuDau ? ` w:firstLine="${thuDau}"` : ''
  const pPr = [
    style && `<w:pStyle w:val="${style}"/>`,
    giu && '<w:keepNext/>',
    khongDanhSo && '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="0"/></w:numPr>',
    (truoc || sau) && `<w:spacing w:before="${truoc || 0}" w:after="${sau || 0}"/>`,
    ind && `<w:ind${ind}/>`,
    canh && `<w:jc w:val="${canh}"/>`,
  ]
    .filter(Boolean)
    .join('')
  return `<w:p><w:pPr>${pPr}</w:pPr>${noiDung}</w:p>`
}

const ngatTrang = () => '<w:p><w:r><w:br w:type="page"/></w:r></w:p>'

/** Trường Word. Mục lục và các danh mục đều để Word tự điền số trang. */
const truong = (chiDan) =>
  doan(
    'Nidung',
    `<w:fldSimple w:instr="${thoatThuocTinh(chiDan)}"><w:r><w:rPr><w:i/></w:rPr>` +
      `<w:t xml:space="preserve">Mở bằng Word, nhấn Ctrl+A rồi F9 để điền mục lục.</w:t>` +
      `</w:r></w:fldSimple>`,
  )

/** Nhúng ảnh, giữ tỉ lệ, thu nhỏ cho vừa chiều rộng vùng nội dung. */
function doanAnh(rid, kichThuoc, ten, maHinh) {
  if (!kichThuoc) {
    console.warn(`  ⚠ Không đọc được kích thước ảnh ${ten} — bỏ qua`)
    return ''
  }
  const cx = Math.round(kichThuoc.rong * EMU_MOI_PIXEL)
  const cy = Math.round(kichThuoc.cao * EMU_MOI_PIXEL)
  const tiLe = Math.min(1, (RONG_NOI_DUNG_TWIP * 635) / cx)
  const w = Math.round(cx * tiLe)
  const h = Math.round(cy * tiLe)

  return doan(
    'Nidung',
    `<w:r><w:rPr><w:noProof/></w:rPr><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
      `<wp:extent cx="${w}" cy="${h}"/><wp:effectExtent l="0" t="0" r="0" b="0"/>` +
      `<wp:docPr id="${maHinh}" name="Hinh ${maHinh}" descr="${thoatThuocTinh(ten)}"/>` +
      `<wp:cNvGraphicFramePr><a:graphicFrameLocks ` +
      `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>` +
      `</wp:cNvGraphicFramePr>` +
      `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
      `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
      `<pic:nvPicPr><pic:cNvPr id="0" name="Hinh ${maHinh}"/>` +
      `<pic:cNvPicPr><a:picLocks noChangeAspect="1" noChangeArrowheads="1"/></pic:cNvPicPr></pic:nvPicPr>` +
      `<pic:blipFill><a:blip r:embed="${rid}"/><a:srcRect/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
      `<pic:spPr bwMode="auto"><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm>` +
      `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><w:noFill/></a:ln>` +
      `</pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`,
    { giu: true, truoc: 120, canh: 'center' },
  )
}

const hop = (o) => String(o ?? '').replace(/\*\*/g, '').replace(/`/g, '').trim()

/**
 * Tính bề rộng cột theo độ dài nội dung.
 *
 * Chia đều mọi cột trông đẹp trên giấy nhưng rất khó đọc khi bảng có cột ngắn xen cột
 * dài: cột "Mục kiểm thử" chỉ vài chữ vẫn bị bẻ dòng nhiều lần trong khi cột bên cạnh
 * vẫn còn dư chỗ trống. Ở đây mỗi cột được cấp phần bề rộng theo độ dài chữ dài nhất
 * của nó, rồi ép tổng về đúng bề rộng vùng nội dung.
 */
function chiaRongCot(hang, tongRong) {
  const soCot = hang[0].length
  if (soCot === 0) return []

  const doDai = hang[0].map((_, i) => Math.max(4, ...hang.map((r) => Math.min(60, hop(r[i]).length))))
  // Cột STT chỉ chứa số nên không cần nhiều bề rộng.
  const rongSTT = Math.min(700, Math.round((doDai[0] / doDai.reduce((a, b) => a + b, 0)) * tongRong))
  const conLai = tongRong - rongSTT
  const tongConLai = doDai.slice(1).reduce((a, b) => a + b, 0) || 1

  const rong = [rongSTT]
  for (let i = 1; i < soCot; i++) rong.push(Math.round((doDai[i] / tongConLai) * conLai))
  // Cột cuối nhận phần dư để tổng khớp tuyệt đối, tránh lệch vài twip là lệch viền.
  rong[soCot - 1] += tongRong - rong.reduce((a, b) => a + b, 0)
  return rong
}

/** Số ở bên phải, chữ ở bên trái, ký hiệu ở giữa. */
function canhTheoChu(o) {
  const s = hop(o)
  if (/^[\d.,]+$/.test(s.replace(/[₫\s]/g, '')) && s !== '') return 'right'
  if (/^[✓✗×→←↔]/.test(s) || /^:.*:$/.test(s) || s === '—') return 'center'
  return 'left'
}

function bang(cotRong, hang) {
  const canh = hang[0].map((o, i) => (i === 0 ? 'center' : canhTheoChu(o)))

  let xml =
    `<w:tbl><w:tblPr><w:tblW w:w="${cotRong.reduce((a, b) => a + b, 0)}" w:type="dxa"/>` +
    `<w:jc w:val="center"/><w:tblBorders>` +
    ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']
      .map((c) => `<w:${c} w:val="single" w:sz="4" w:space="0" w:color="auto"/>`)
      .join('') +
    `</w:tblBorders><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid>` +
    cotRong.map((r) => `<w:gridCol w:w="${r}"/>`).join('') +
    `</w:tblGrid>`

  hang.forEach((hangHienTai, hangIndex) => {
    const tieuDe = hangIndex === 0
    xml += '<w:tr>'
    hangHienTai.forEach((o, cotIndex) => {
      xml +=
        `<w:tc><w:tcPr><w:tcW w:w="${cotRong[cotIndex]}" w:type="dxa"/>` +
        (tieuDe ? '<w:shd w:val="clear" w:color="auto" w:fill="C6D9F1"/>' : '') +
        `<w:vAlign w:val="center"/></w:tcPr>` +
        doan(tieuDe ? 'Hngtiubng' : 'Nidungtrongbng', cacDoanChay(hop(o)), { canh: canh[cotIndex] }) +
        `</w:tc>`
    })
    xml += '</w:tr>'
  })
  return `${xml}</w:tbl>`
}

/* ================================================================== */
/*  PHẦN 4 — CHUYỂN MARKDOWN                                          */
/* ================================================================== */

/** Thứ tự các tệp markdown được ghép vào báo cáo. */
const TEP_NOI_DUNG = ['CHUONG_1.md', 'CHUONG_2.md', 'CHUONG_3.md', 'CHUONG_4.md', 'KET_LUAN.md', 'TLTK.md']

/**
 * Bỏ số thứ tự đã gõ trong tiêu đề markdown.
 * Số do Word tự sinh từ style `Heading1/2/3`, gõ thêm sẽ ra "1.1 1.1 Lý do…".
 */
const boSoTieuDe = (chu) =>
  chu
    .replace(/^\s*CHƯƠNG\s+\d+\s*[:.]\s*/i, '')
    .replace(/^\s*\d+(?:\.\d+)*\.?\s+/, '')
    .trim()

class BoBaoCao {
  constructor(tep) {
    this.tep = tep
    this.rIdTiep = 900
    this.maAnh = 1000
    this.soAnh = 0
    this.quanHeAnh = []
    this.canhBao = []
    this.soBao = 0
    this.soHinh = 0
  }

  nhungAnh(duongDan) {
    const duLieu = readFileSync(duongDan)
    const duoi = /\.jpe?g$/i.test(duongDan) ? 'jpeg' : 'png'
    this.tep.set(`word/media/baocao-${this.soAnh}.${duoi}`, duLieu)
    const rid = `rId${this.rIdTiep++}`
    this.quanHeAnh.push(
      `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/baocao-${this.soAnh}.${duoi}"/>`,
    )
    this.soAnh++
    return rid
  }

  chuyen(md) {
    const dong = md.replace(/\r\n/g, '\n').split('\n')
    const ra = []
    let i = 0

    while (i < dong.length) {
      const d = dong[i]
      if (d.trim() === '') {
        i++
        continue
      }

      // Khối mã: giữ nguyên văn, không phân tích markdown bên trong.
      if (d.startsWith('```')) {
        const ma = []
        i++
        while (i < dong.length && !dong[i].startsWith('```')) {
          ma.push(dong[i])
          i++
        }
        i++
        ra.push(doan('Nidung', ma.map((x) => run(x || ' ', { mono: true })).join(''), { thu: 360 }))
        continue
      }

      // Bảng: các dòng `|` liên tiếp, dòng thứ hai là dấu phân cách cột.
      if (d.startsWith('|')) {
        const goc = []
        while (i < dong.length && dong[i].startsWith('|')) {
          goc.push(dong[i])
          i++
        }
        ra.push(...this.lamBang(goc))
        continue
      }

      // Chú thích bảng: dòng `**Bảng 3.1. …**` đứng ngay trước bảng.
      const chuThichBang = d.match(/^\*\*(Bảng\s+[\d.]+\.?\s+.*?)\*\*\s*$/)
      if (chuThichBang) {
        ra.push(doan('bng', run(hop(chuThichBang[1]))))
        i++
        continue
      }

      // Chú thích hình nằm trên dòng ảnh: `*Hình 3.1. …*`.
      const chuThich = d.match(/^\*\*(Hình\s+[\d.]+\.?\s*.*?)\*\*\s*$|^\*(Hình\s+[\d.]+\.?\s*.*?)\*\s*$/)
      if (chuThich) {
        const noiDung = hop(chuThich[1] ?? chuThich[2])
        const anh = /^!\[/.test(dong[i] ?? '') ? dong[i] : null
        if (anh) {
          const duongDan = join(thuMucGoc, 'docs', anh.match(/^!\[([^\]]*)\]\(([^)]+)\)/)[2])
          if (!existsSync(duongDan)) {
            this.canhBao.push(`Ảnh không tồn tại: ${duongDan}`)
          } else {
            this.maAnh++
            ra.push(doanAnh(this.nhungAnh(duongDan), kichThuocAnh(readFileSync(duongDan)), duongDan, this.maAnh))
          }
          i++
        }
        this.soHinh++
        ra.push(doan('hnh', run(noiDung)))
        i++
        continue
      }

      // Ảnh không có chú thích phía trên.
      const anh = d.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/)
      if (anh) {
        const duongDan = join(thuMucGoc, 'docs', anh[2])
        if (!existsSync(duongDan)) {
          this.canhBao.push(`Ảnh không tồn tại: ${duongDan}`)
        } else {
          this.maAnh++
          ra.push(doanAnh(this.nhungAnh(duongDan), kichThuocAnh(readFileSync(duongDan)), duongDan, this.maAnh))
        }
        i++
        continue
      }

      // Tiêu đề 1–4 → style Heading1..4, Word tự đánh số.
      const tieuDe = d.match(/^(#{1,4})\s+(.*)$/)
      if (tieuDe) {
        const cap = tieuDe[1].length
        ra.push(doan(`Heading${cap}`, run(boSoTieuDe(tieuDe[2]))))
        i++
        continue
      }

      // Danh sách đánh số.
      if (/^\d+[.)]\s+/.test(d)) {
        let n = 0
        while (i < dong.length && /^\d+[.)]\s+/.test(dong[i])) {
          n++
          ra.push(doan('Nidung', run(`${n}. `) + cacDoanChay(dong[i].replace(/^\d+[.)]\s+/, '')), { thu: 360 }))
          i++
        }
        continue
      }

      // Danh sách gạch đầu dòng.
      if (/^[-*]\s+/.test(d)) {
        while (i < dong.length && /^[-*]\s+/.test(dong[i])) {
          ra.push(doan('Nidung', run('• ') + cacDoanChay(dong[i].replace(/^[-*]\s+/, '')), { thu: 360 }))
          i++
        }
        continue
      }

      // Trích dẫn.
      if (d.startsWith('> ')) {
        const trich = []
        while (i < dong.length && dong[i].startsWith('> ')) {
          trich.push(dong[i].slice(2))
          i++
        }
        ra.push(doan('Nidung', cacDoanChay(trich.join(' ')), { thu: 720 }))
        continue
      }

      // Đoạn văn: gộp các dòng liên tiếp, thụt dòng đầu.
      const van = []
      while (
        i < dong.length &&
        dong[i].trim() !== '' &&
        !/^(#{1,4}\s|[-*>]\s|\d+[.)]\s|\||```|!\[|\*+\(?Hình|\*+\(?Bảng)/.test(dong[i])
      ) {
        van.push(dong[i].trim())
        i++
      }
      if (van.length) {
        ra.push(doan('Nidung', cacDoanChay(van.join(' ').replace(/\s{2,}/g, ' ')), { thuDau: 425 }))
      } else {
        /*
         * Dòng lạ mà khớp biểu thức dừng thì không nhánh nào ở trên bắt được. Nếu không
         * tăng `i` ở đây thì vòng lặc quay vô hạn — treo luôn, không có thông báo.
         */
        i++
      }
    }

    return ra.join('')
  }

  /** Dựng bảng. Chú thích "Bảng x.y. …" do dòng `**Bảng …**` phía trên đảm nhiệm. */
  lamBang(dongBang) {
    const tach = dongBang.map((d) =>
      d
        .split('|')
        .slice(1, -1)
        .map((o) => o.trim()),
    )
    const hang = tach.filter((_, i) => i !== 1)
    if (!hang.length) return []

    this.soBao++
    return [bang(chiaRongCot(hang, RONG_NOI_DUNG_TWIP), hang), doan('Nidung')]
  }
}

/* ================================================================== */
/*  PHẦN 5 — GHÉP TÀI LIỆU                                            */
/* ================================================================== */

/** Nội dung tối thiểu cho hai tệp thuộc tính tài liệu. */
function taoDocProps(ten) {
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z')
  if (ten === 'app.xml') {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" ' +
      'xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">' +
      `<Application>${ten}</Application><Company>Trường Đại học Sư phạm Kỹ thuật Hưng Yên</Company></Properties>`
    )
  }
  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" ' +
    'xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" ' +
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
    '<dc:title>Xây dựng hệ thống đặt phòng và quản lý homestay</dc:title>' +
    '<dc:creator>Nguyễn Hải Nam</dc:creator>' +
    `<dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created>` +
    `<dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified>` +
    '</cp:coreProperties>'
  )
}

/**
 * Quan hệ của `document.xml`.
 *
 * Giữ nguyên quan hệ tới style, numbering, phông, header/footer của khung; bỏ hết quan hệ
 * ảnh và liên kết cũ vì `document.xml` mới không dùng tới; cuối cùng nối ảnh mới vào.
 * Dựng lại từ đầu dễ sai vì phải nhớ đúng URI của từng loại quan hệ.
 */
function taoRels(khungRels, quanHeAnh) {
  const giu = [...khungRels.matchAll(/<Relationship [^>]*\/>/g)]
    .map((m) => m[0])
    .filter((x) => !x.includes('/relationships/image') && !x.includes('/relationships/hyperlink'))
  return khungRels
    .replace(/<Relationship [^>]*\/>/g, '')
    .replace('</Relationships>', `${giu.join('')}${quanHeAnh.join('')}</Relationships>`)
}

/* ------------------------------------------------------------------ */
/*  Phần bìa và phần đầu tài liệu                                      */
/* ------------------------------------------------------------------ */

/** Một dòng trên bìa: style `Ba` vốn đã canh giữa, chỉ cần đặt cỡ chữ và khoảng cách. */
const dongChu = (chu, { dam = false, size = 0, sau = 0, truoc = 0, canh = '' } = {}) =>
  doan('Ba', run(chu, { dam, size }), { truoc, sau, canh })

/** Bìa: khung `Ba` đã canh giữa và đặt cỡ chữ, chỉ cần khoảng trống bố trí. */
function trangBia() {
  const x = []
  x.push(dongChu('BỘ GIÁO DỤC VÀ ĐÀO TẠO', { dam: true, size: 26 }))
  x.push(dongChu('TRƯỜNG ĐẠI HỌC SƯ PHẠM KỸ THUẬT HƯNG YÊN', { dam: true, size: 26, sau: 240 }))
  x.push(dongChu('ĐỒ ÁN 4', { dam: true, size: 32, truoc: 240, sau: 120 }))
  x.push(dongChu('XÂY DỰNG HỆ THỐNG ĐẶT PHÒNG', { dam: true, size: 28 }))
  x.push(dongChu('VÀ QUẢN LÝ HOMESTAY', { dam: true, size: 28, sau: 240 }))
  x.push(dongChu('NGÀNH: KỸ THUẬT PHẦN MỀM', { size: 26, sau: 60 }))
  x.push(dongChu('CHUYÊN NGÀNH: PHÁT TRIỂN ỨNG DỤNG PHẦN MỀM', { size: 26, sau: 60 }))
  x.push(dongChu('HƯỚNG CHUYÊN SÂU: CÔNG NGHỆ WEB', { size: 26, sau: 240 }))
  x.push(dongChu('SINH VIÊN: NGUYỄN HẢI NAM', { dam: true, size: 26, sau: 60 }))
  x.push(dongChu('MÃ SINH VIÊN: 10123234', { size: 26, sau: 60 }))
  x.push(dongChu('MÃ LỚP: 12523W.1', { size: 26, sau: 60 }))
  x.push(dongChu('HƯỚNG DẪN: TS. HOÀNG QUỐC VIỆT', { dam: true, size: 26, sau: 1200 }))
  x.push(dongChu('HƯNG YÊN – 2026', { dam: true, size: 26 }))
  return x.join('')
}

const duongCham = () =>
  Array.from({ length: 20 }, () => doan('Ba', run('.......................................................................................................'))).join('')

/**
 * Tiêu đề các trang phía trước mục lục.
 *
 * Dùng định dạng trực tiếp chứ không dùng style `Tiu`, vì `Tiu` có `outlineLvl` nên
 * NHẬN XÉT / LỜI CAM ĐOAN / LỜI CẢM ƠN cũng bị lọt vào mục lục — mẫu gốc không có
 * chuyện này.
 */
const tieuDeDau = (chu) =>
  doan(
    'Nidung',
    run(chu, { dam: true, size: 28 }),
    { truoc: 240, sau: 360, canh: 'center' },
  )

function trangNhanXet() {
  return (
    tieuDeDau('NHẬN XÉT') +
    doan('Nidung', run('Nhận xét của giáo viên hướng dẫn:'), { truoc: 120 }) +
    duongCham() +
    doan('Nidung', run('GIẢNG VIÊN HƯỚNG DẪN'), { truoc: 240 }) +
    doan('Nidung', run('(Ký và ghi rõ họ tên)'))
  )
}

function trangCamDoan() {
  const p = (s) => doan('Nidung', cacDoanChay(s), { thuDau: 425, truoc: 60 })
  return (
    tieuDeDau('LỜI CAM ĐOAN') +
    p(
      'Em xin cam đoan đồ án **“Xây dựng hệ thống đặt phòng và quản lý homestay”** là kết quả thực hiện của bản thân em dưới sự hướng dẫn của TS. Hoàng Quốc Việt. Các số liệu và hình ảnh trong báo cáo đều do em tự thực hiện và chụp từ hệ thống đang chạy.',
    ) +
    p(
      'Những phần sử dụng tài liệu tham khảo trong đồ án đã được nêu rõ trong phần tài liệu tham khảo. Các kết quả trong báo cáo do em tự kiểm thử và đối chiếu, không sao chép từ bài của người khác.',
    ) +
    p('Nếu vi phạm lời cam đoan này, em xin chịu hoàn toàn trách nhiệm trước khoa và nhà trường.') +
    doan('Nidung', run('Hưng Yên, ngày … tháng … năm 202…'), { truoc: 240 }) +
    doan('Nidung', run('SINH VIÊN'), { canh: 'right' })
  )
}

function trangCamOn() {
  const p = (s) => doan('Nidung', cacDoanChay(s), { thuDau: 425, truoc: 60 })
  return (
    tieuDeDau('LỜI CẢM ƠN') +
    p(
      'Để có thể hoàn thành đồ án này, lời đầu tiên em xin phép gửi lời cảm ơn tới bộ môn Công nghệ phần mềm, Trường Đại học Sư phạm Kỹ thuật Hưng Yên đã trang bị cho em những kiến thức nền tảng về cơ sở dữ liệu, phân tích và thiết kế phần mềm.',
    ) +
    p(
      'Đặc biệt em xin chân thành cảm ơn thầy TS. Hoàng Quốc Việt đã rất tận tình hướng dẫn, chỉ bảo em trong suốt thời gian thực hiện đồ án. Những lần thầy nhận xét “đoạn này chưa giải thích vì sao” chính là lý do em hiểu rõ hơn về việc một đồ án không chỉ cần chạy được mà còn phải trả lời được câu hỏi “vì sao làm thế này”.',
    ) +
    p(
      'Em cũng xin chân thành cảm ơn toàn thể các Thầy, các Cô trong Trường đã tận tình giảng dạy và trang bị cho em những kiến thức và kinh nghiệm quý giá trong suốt những năm học. Em xin chân thành cảm ơn bạn bè đã hỗ trợ em trong quá trình học tập và thực hiện đồ án.',
    ) +
    p(
      'Mặc dù đã có cố gắng, nhưng với trình độ còn hạn chế, trong quá trình thực hiện đề tài không tránh khỏi những thiếu sót. Em mong nhận được những ý kiến đóng góp của thầy cô để em có thêm kinh nghiệm và hoàn thiện hơn trong các môn học sau này.',
    ) +
    doan('Nidung', run('Em xin trân trọng cảm ơn!'), { truoc: 120 })
  )
}

/* ------------------------------------------------------------------ */
/*  Danh mục từ viết tắt                                                */
/* ------------------------------------------------------------------ */

const TU_VIET_TAT = [
  ['STT', 'Từ viết tắt', 'Cụm từ tiếng Anh', 'Diễn giải'],
  ['1', 'API', 'Application Programming Interface', 'Giao diện lập trình cho phép các hệ thống giao tiếp với nhau'],
  ['2', 'JWT', 'JSON Web Token', 'Chuẩn mã hoá dùng để xác thực và phân quyền người dùng'],
  ['3', 'SQL', 'Structured Query Language', 'Ngôn ngữ truy vấn cơ sở dữ liệu quan hệ'],
  ['4', 'EF Core', 'Entity Framework Core', 'Bộ ánh xạ đối tượng sang bảng của cơ sở dữ liệu quan hệ'],
  ['5', 'UI', 'User Interface', 'Giao diện người dùng'],
  ['6', 'UX', 'User Experience', 'Trải nghiệm của người dùng khi thao tác với hệ thống'],
  ['7', 'CRUD', 'Create Read Update Delete', 'Bốn thao tác cơ bản trong quản lý dữ liệu'],
  ['8', 'SPA', 'Single Page Application', 'Ứng dụng web đơn trang, tải một lần và cập nhật nội dung động'],
  ['9', 'UML', 'Unified Modeling Language', 'Ngôn ngữ mô hình hoá thống nhất dùng trong phân tích và thiết kế hệ thống'],
  ['10', 'TS', 'TypeScript', 'Ngôn ngữ mở rộng của JavaScript, có kiểm tra kiểu dữ liệu'],
  ['11', 'REST', 'Representational State Transfer', 'Kiến trúc phần mềm cho các dịch vụ web'],
  ['12', 'UI/UX', 'User Interface / User Experience', 'Thiết kế và trải nghiệm người dùng'],
  ['13', 'CI', 'Continuous Integration', 'Tự động hoá việc kiểm tra mã nguồn mỗi khi có thay đổi'],
  ['14', 'CSV', 'Comma Separated Values', 'Định dạng tệp văn bản phân tách dữ liệu bằng dấu phẩy'],
]

/* ================================================================== */
/*  PHẦN 6 — HÀM DỰNG TÀI LIỆU                                       */
/* ================================================================== */

function lapTaiLieu({ thu = '' } = {}) {
  const khung = docZip(KHUNG)
  const khungXml = khung.get('word/document.xml').toString('utf8')
  const co = (ten) => !thu || thu.split(',').includes(ten)

  const tep = new Map()

  /*
   * 1. Lấy nguyên gói của khung làm nền, chỉ bỏ ảnh cũ.
   *
   * Dựng lại `[Content_Types].xml` và `_rels/.rels` từ đầu dễ sót mục và Word chỉ báo
   * "tệp bị hỏng" chứ không nói thiếu gì. Giữ nguyên rồi sửa chỗ cần sửa an toàn hơn nhiều.
   */
  for (const [ten, duLieu] of khung) {
    if (ten.startsWith('word/media/')) continue
    tep.set(ten, duLieu)
  }

  /*
   * 2. Sửa tên đề tài trong header.
   *
   * Header của khung chia tên đề tài thành nhiều đoạn chạy `<w:t>` khác nhau, nên thay
   * bằng biểu thức chính quy chỉ thay được đoạn đầu và để lại đuôi ("…lý coffee").
   * Cách chắc chắn là đặt đoạn đầu thành tên mới và xoá nội dung các đoạn còn lại.
   */
  for (const ten of ['word/header1.xml', 'word/header3.xml']) {
    const x = tep.get(ten)?.toString('utf8')
    if (!x) continue
    let daDung = false
    const xMoi = x.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g, (khoa, mo, noiDung, dong) => {
      if (!noiDung.trim()) return khoa
      if (!daDung) {
        daDung = true
        return `${mo}${thoat(TEN_DE_TAI)}${dong}`
      }
      return `${mo}${dong}`
    })
    tep.set(ten, Buffer.from(xMoi, 'utf8'))
  }

  /*
   * 2b. Thêm khoảng trắng sau số mục.
   *
   * Mẫu đặt `lvlText` là `%1.%2` không kèm dấu cách, nên tiêu đề hiện ra là
   * "1.1TRIỂN KHAI…" dính liền nhau, và mục lục cũng vậy. `w:suff` nằm ngay trước
   * `w:lvlText` trong lược đồ.
   */
  tep.set(
    'word/numbering.xml',
    Buffer.from(
      tep
        .get('word/numbering.xml')
        .toString('utf8')
        .replace(
          /(<w:lvl w:ilvl="[12]">[\s\S]*?)(<w:lvlText w:val="%1\.%2(?:\.%3)?"\/>)/g,
          '$1<w:suff w:val="space"/>$2',
        ),
      'utf8',
    ),
  )

  /* 3. Dựng phần thân. */
  const bo = new BoBaoCao(tep)
  const thanh = []

  if (co('bia')) thanh.push(trangBia(), ngatTrang())
  if (co('dau')) {
    thanh.push(trangNhanXet(), ngatTrang())
    thanh.push(trangCamDoan(), ngatTrang())
    thanh.push(trangCamOn(), ngatTrang())
  }

  /* Kết thúc section đầu: không đánh số trang. */
  const sectPhu =
    '<w:p><w:pPr><w:sectPr><w:pgSz w:w="11901" w:h="16840"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>' +
    '<w:cols w:space="720"/><w:titlePg/></w:sectPr></w:pPr></w:p>'

  if (co('mucLuc')) {
    thanh.push(doan('Tiu', run('MỤC LỤC')))
    thanh.push(truong(' TOC \\o "1-3" \\h \\z \\u '))
  }
  if (co('tuVietTat')) {
    thanh.push(doan('Heading1', run('DANH MỤC TỪ VIẾT TẮT'), { khongDanhSo: true }))
    thanh.push(bang([700, 1400, 2900, 4066], TU_VIET_TAT))
    thanh.push(doan('Nidung', ''))
  }
  if (co('dsBang')) {
    thanh.push(doan('Heading1', run('DANH MỤC BẢNG BIỂU'), { khongDanhSo: true }))
    thanh.push(truong(' TOC \\h \\z \\t "bảng,1" '))
  }
  if (co('dsHinh')) {
    thanh.push(doan('Heading1', run('DANH MỤC HÌNH ẢNH'), { khongDanhSo: true }))
    thanh.push(truong(' TOC \\h \\z \\t "hình,1" '))
  }

  /* --- Nội dung chính --- */
  for (const ten of TEP_NOI_DUNG) {
    if (thu && !co(ten)) continue
    const duongDan = join(thuMucGoc, 'docs', ten)
    if (!existsSync(duongDan)) {
      console.warn(`  ⚠ Thiếu ${ten} — bỏ qua`)
      continue
    }
    const md = readFileSync(duongDan, 'utf8')
    const xml = bo.chuyen(md)
    thanh.push(ngatTrang(), xml)
    console.log(`  ${ten.padEnd(16)} ${String(md.length).padStart(6)} ký tự → ${(xml.length / 1024).toFixed(0)} KB XML`)
  }

  /* 4. Ghép `document.xml`, giữ nguyên phần khai báo namespace của khung. */
  const dau = khungXml.slice(0, khungXml.indexOf('<w:body>') + '<w:body>'.length)
  const cuoi =
    '<w:sectPr><w:headerReference w:type="default" r:id="rId14"/><w:footerReference w:type="default" r:id="rId16"/>' +
    '<w:pgSz w:w="11901" w:h="16840"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/>' +
    '<w:pgNumType w:start="1"/><w:cols w:space="720"/></w:sectPr></w:body></w:document>'

  tep.set('word/document.xml', Buffer.from(dau + sectPhu + thanh.join('') + cuoi, 'utf8'))
  tep.set('word/_rels/document.xml.rels', Buffer.from(taoRels(tep.get('word/_rels/document.xml.rels').toString('utf8'), bo.quanHeAnh), 'utf8'))
  tep.set('docProps/core.xml', Buffer.from(taoDocProps('core.xml'), 'utf8'))

  /* 5. Kiểm tra rồi ghi. */
  kiemTraXml(tep)
  ghiZip(KET_QUA, tep)

  console.log(`\n  Ảnh ${bo.soAnh} · chú thích hình ${bo.soHinh} · bảng ${bo.soBao}`)
  console.log(`  Cảnh báo: ${bo.canhBao.length === 0 ? 'không có' : bo.canhBao.join(', ')}`)
  console.log(`\n  Đã tạo: ${basename(KET_QUA)} (${(readFileSync(KET_QUA).length / 1048576).toFixed(1)} MB)`)
}

/**
 * Kiểm tra các tệp XML có cân bằng thẻ không.
 * Word chỉ báo "tệp bị hỏng" khi mở và không nói chỗ nào sai — kiểm tra ngay lúc sinh
 * giúp biết chính xác phần tử nào lệch.
 */
function kiemTraXml(tep) {
  const loi = []
  for (const ten of tep.keys()) {
    if (!ten.endsWith('.xml') && !ten.endsWith('.rels')) continue
    const x = tep.get(ten).toString('utf8')
    const dem = new Map()
    for (const m of x.matchAll(/<(\/?)([A-Za-z0-9_.:-]+)([^>]*?)(\/?)>/g)) {
      const [, dong, tenThe, , tuDong] = m
      const o = dem.get(tenThe) ?? { mo: 0, dong: 0 }
      if (dong === '/') o.dong++
      else if (!tuDong) o.mo++
      dem.set(tenThe, o)
    }
    for (const [tenThe, { mo, dong }] of dem) {
      if (mo !== dong) loi.push(`${ten}: <${tenThe}> mở ${mo} lần, đóng ${dong} lần`)
    }
  }
  if (loi.length) {
    console.error('\n  ✗ XML không cân bằng:')
    for (const l of loi.slice(0, 10)) console.error(`      ${l}`)
    throw new Error('Dừng lại — file sinh ra sẽ không mở được.')
  }
  console.log('  ✓ XML cân bằng')
}

/* ================================================================== */
/*  PHẦN 7 — CẬP NHẬT MỤC LỤC BẰNG WORD                               */
/*  Không có Word thì bỏ qua bước này; mở file lên nhấn Ctrl+A rồi F9. */
/* ================================================================== */

/**
 * Mở tệp bằng Word để cập nhật mọi trường rồi lưu lại.
 *
 * Không dùng bước "mở bản sao rồi chép ngược": sau `$word.Quit()` tiến trình WINWORD
 * vẫn giữ khoá tệp vài giây nên chép từ bên ngoài thường bị từ chối. Mở thẳng tệp đích
 * rồi `$doc.Save()` là xong — Word tự quản lý khoá của chính nó.
/**
 * Mở tài liệu bằng Word để cập nhật trường mục lục rồi lưu lại.
 *
 * Hai điều bất tiện của Word trên máy này, mỗi cái đều tốn thời gian nếu không biết:
 *
 * 1. PowerShell 5.1 đọc tệp `.ps1` theo mã ANSI, nên đường dẫn có tiếng Việt trong
 *    tệp sẽ vỡ và báo nhầm là "tệp hỏng". Cách tránh: chạy Word trên một bản sao ở
 *    đường dẫn chỉ gồm ký tự ASCII, rồi chép ngược kết quả về.
 * 2. Sau `$word.Quit()` tiến trình WINWORD vẫn giữ khoá tệp vài giây, nên phải thử
 *    chép lại nhiều lần thay vì chép một lần.
 */
function capNhatBangWord() {
  const thuMucTam = mkdtempSync(join(tmpdir(), 'baocao-'))
  const banLamViec = join(thuMucTam, 'bao-cao.docx')
  const pdf = join(thuMucTam, 'kiem-tra.pdf')
  try {
    cpSync(KET_QUA, banLamViec)

    const ps = `$ErrorActionPreference = 'Stop'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open('${banLamViec.replace(/'/g, "''")}')
foreach ($t in $doc.TablesOfContents) { $t.Update() }
foreach ($t in $doc.TablesOfFigures)  { $t.Update() }
$doc.Fields.Update() | Out-Null
$doc.Repaginate()
# Xuất PDF rồi đếm trang trong tệp. ComputeStatistics trả số trang chưa được phân
# trang khi Word chạy ẩn, nên hay cho kết quả sai: 1 trang dù tài liệu dài 121 trang.
$doc.SaveAs2('${pdf.replace(/'/g, "''")}', 17)
$soAnh = $doc.InlineShapes.Count
$soBang = $doc.Tables.Count
$doc.Save()
$doc.Close(0)
Write-Output ("  Word: " + $soAnh + " anh, " + $soBang + " bang")`

    const tepPs = join(thuMucTam, 'cap-nhat.ps1')
    writeFileSync(tepPs, ps, 'utf8')
    execFileSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tepPs], { stdio: 'inherit' })

    /*
     * Đếm số trang từ tệp PDF do Word xuất ra, thay vì hỏi `ComputeStatistics`:
     * hàm đó trả số trang chưa được phân trang khi Word chạy ẩn, nên hay cho kết quả
     * sai (1 trang dù tài liệu dài hơn 100 trang). Không đọc trong PowerShell vì
     * dựng chuỗi từ vài triệu byte của tệp PDF chậm tới mức treo.
     */
    const pdfText = readFileSync(pdf).toString('latin1')
    const demTrang = [...pdfText.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]))
    console.log(`  Word: ${Math.max(...demTrang)} trang`)

    /*
     * Chép kết quả về tệp đích.
     *
     * `$word.Quit()` trong tập lệnh chỉ yêu cầu Word đóng; tiến trình WINWORD vẫn
     * sống thêm vài giây để dọn dẹp rồi mới nhả khoá tệp. Vì vậy phải chờ tiến trình
     * kết thúc rồi mới chép — chép thử nhiều lần cũng không giúp vì khoá vẫn còn.
     */
    execFileSync(
      'powershell',
      ['-NoProfile', '-Command', 'for ($i = 0; $i -lt 40; $i++) { if (-not (Get-Process WINWORD -ErrorAction SilentlyContinue)) { break }; Start-Sleep -Milliseconds 500 }'],
      { stdio: 'ignore' },
    )
    try {
      // Ghi tệp thay vì `cpSync`: `fs.cp` trên Windows thêm tiền tố `\\?\` vào đường dẫn
      // có dấu chấm khiến thao tác ghi đè trên tệp đang tồn tại báo lỗi khó hiểu.
      writeFileSync(KET_QUA, readFileSync(banLamViec))
    } catch {
      // Vẫn khoá thì ép Word đóng rồi ghi lại lần nữa.
      execFileSync(
        'powershell',
        ['-NoProfile', '-Command', 'Stop-Process -Name WINWORD -Force -ErrorAction SilentlyContinue; Start-Sleep -Milliseconds 900'],
        { stdio: 'ignore' },
      )
      writeFileSync(KET_QUA, readFileSync(banLamViec))
    }
    console.log(`\n  Đã cập nhật mục lục bằng Word: ${basename(KET_QUA)}`)
  } catch (loi) {
    console.warn(`\n  ⚠ Không cập nhật được mục lục bằng Word: ${loi.message}`)
    console.warn('    Mở file bằng Word, nhấn Ctrl+A rồi F9 để điền số trang.')
  } finally {
    // Word còn giữ tệp tạm một lúc; xoá hỏng cũng không ảnh hưởng gì.
    try {
      rmSync(thuMucTam, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 })
    } catch {
      /* bỏ qua */
    }
  }
}

export { docZip, ghiZip, kichThuocAnh }

if (process.argv[1] && process.argv[1].endsWith('tao-bao-cao.mjs')) {
  console.log('Đang dựng báo cáo…\n')
  const thu = process.argv.find((a) => a.startsWith('--thu='))?.slice(6) ?? ''
  lapTaiLieu({ thu })
  if (process.argv.includes('--cap-nhat')) capNhatBangWord()
}
