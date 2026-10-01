/**
 * Sinh 16 sơ đồ cho Chương 3 (Hình 3.1 – 3.16) dưới dạng SVG.
 *
 * Vì sao tự sinh bằng script thay vì vẽ tay:
 * - Nội dung sơ đồ lấy từ **code thật** của dự án (endpoint, entity, luồng nghiệp vụ),
 *   nên phải cập nhật được khi code đổi. Vẽ tay thì không.
 * - 16 hình cùng một bộ quy ước (màu, cỡ chữ, bo góc) — sinh bằng script thì đồng bộ,
 *   vẽ tay thì mỗi hình lệch nhau một chút.
 *
 * Cách dùng:
 *   node docs/anh/ve-so-do.mjs        → ghi 16 file .svg vào docs/anh/so-do/
 *
 * Ảnh .png cho báo cáo được dựng từ chính các file .svg này bằng `svg-2-png.mjs`.
 *
 * Thứ tự đánh số Hình trong báo cáo:
 *   3.1 – 3.8 use case · 3.9 lớp thực thi · 3.10 ERD · 3.11 – 3.16 tuần tự
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const noiDung = join(thuMuc, 'so-do')
mkdirSync(noiDung, { recursive: true })

/* ------------------------------------------------------------------ quy ước */

const MAU = {
  nen: '#ffffff',
  chu: '#1f2937',
  chuNho: '#6b7280',
  vung: '#fffbeb', // nền hộp nghiệp vụ — hợp tông thương hiệu
  vungBien: '#d97706', // viền hộp nghiệp vụ (amber-600)
  heThong: '#eff6ff',
  heThongBien: '#2563eb',
  coSoDuLieu: '#f0fdf4',
  coSoDuLieuBien: '#16a34a',
  tacNhan: '#f5f3ff',
  tacNhanBien: '#7c3aed',
  duong: '#374151',
}

const CHU = "'Segoe UI', 'Noto Sans', Arial, sans-serif"

/**
 * Bọc nội dung thành file SVG hoàn chỉnh.
 *
 * `tenHinh` được ghi thành thẻ `<title>` — vừa để trình đọc màn hình đọc được tên
 * hình, vừa để `index.html` lấy đúng tiêu đề mà không phải viết thêm bảng tên ở nơi
 * khác (bảng riêng dễ lệch với hình khi thêm sơ đồ mới).
 */
function svg(rong, cao, thanh, noiDung, tenHinh = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${rong}" height="${cao}" viewBox="0 0 ${rong} ${cao}" font-family="${CHU}" role="img">
${tenHinh === '' ? '' : `<title>${esc(tenHinh)}</title>`}
<rect width="${rong}" height="${cao}" fill="${MAU.nen}"/>
${thanh}
${noiDung}
</svg>
`
}

/** Chữ nhãn 1 dòng. */
function chu(x, y, s, { size = 13, an = 'middle', mau = MAU.chu, dam = 400 } = {}) {
  return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${an}" fill="${mau}" font-weight="${dam}">${esc(s)}</text>`
}

/** Chữ nhãn nhiều dòng, tự xuống dòng theo độ rộng cho trước. */
function chuNhieuDong(x, y, s, doRong, { size = 12, an = 'middle', mau = MAU.chu, dam = 400, khoang = 15 } = {}) {
  // Tôn trọng xuống dòng thủ công (`\n`) trước, rồi mới tự xuống dòng theo bề rộng.
  const doan = String(s).split('\n')
  const lines = []
  for (const doanMot of doan) {
    let hienTai = ''
    for (const tu of doanMot.split(' ')) {
      if (hienTai === '') hienTai = tu
      else if ((hienTai + ' ' + tu).length * (size * 0.53) <= doRong) hienTai += ' ' + tu
      else {
        lines.push(hienTai)
        hienTai = tu
      }
    }
    lines.push(hienTai)
  }
  return lines
    .map((ln, i) => chu(x, y + i * khoang, ln, { size, an, mau, dam }))
    .join('\n')
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Hộp chữ nhật có bo góc, nhãn căn giữa cả hai chiều. */
function hop(x, y, w, h, t, { fill = MAU.vung, bien = MAU.vungBien, size = 12, dam = 500 } = {}) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fill}" stroke="${bien}" stroke-width="1.5"/>
${chuNhieuDong(x + w / 2, y + h / 2 + 4, t, w - 12, { size, dam })}`
}

/** Hình bầu dục — dùng cho tác nhân và use case. */
function bauDuc(cx, cy, rx, ry, t, { fill = MAU.tacNhan, bien = MAU.tacNhanBien, size = 12 } = {}) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${bien}" stroke-width="1.5"/>
${chuNhieuDong(cx, cy + 4, t, rx * 1.7, { size })}`
}

/** Đường thẳng. */
function duong(x1, y1, x2, y2, { mau = MAU.duong, rong = 1.4, gach = '' } = {}) {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${mau}" stroke-width="${rong}"${gach ? ` stroke-dasharray="${gach}"` : ''}/>`
}

/** Mũi tên (đường + đầu tên tam giác). */
function muiTen(x1, y1, x2, y2, { mau = MAU.duong, rong = 1.4, dau = 7, gach = '', nhan = '', nhanLen = '' } = {}) {
  const goc = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI
  const c1 = x2 - dau * Math.cos(((goc - 25) * Math.PI) / 180)
  const s1 = y2 - dau * Math.sin(((goc - 25) * Math.PI) / 180)
  const c2 = x2 - dau * Math.cos(((goc + 25) * Math.PI) / 180)
  const s2 = y2 - dau * Math.sin(((goc + 25) * Math.PI) / 180)
  let nhanSvg = ''
  if (nhan !== '') {
    const an = nhanLen === 'trai' ? 'end' : 'start'
    const mx = (x1 + x2) / 2 + (nhanLen === 'trai' ? -6 : 6)
    const my = (y1 + y2) / 2 - 5
    // Nền trắng sau chữ: thông điệp đi qua nhiều cột thì nhãn nằm đúng lên đường
    // đời, chữ bị cắt là hình nhìn thấy ngay trong báo cáo.
    const rongNhan = nhan.length * 6.1 + 4
    const xNhan = an === 'end' ? mx - rongNhan : mx
    nhanSvg = `\n<rect x="${xNhan}" y="${my - 10}" width="${rongNhan}" height="14" fill="${MAU.nen}"/>\n${chu(mx, my, nhan, { size: 11, an, mau: MAU.chuNho })}`
  }
  return `${duong(x1, y1, x2, y2, { mau, rong, gach })}
<polygon points="${x2},${y2} ${c1.toFixed(1)},${s1.toFixed(1)} ${c2.toFixed(1)},${s2.toFixed(1)}" fill="${mau}"/>${nhanSvg}`
}

/** Hình người — ký hiệu tác nhân trong biểu đồ hoạt động. */
function nguoi(x, y, ten, mau = MAU.tacNhanBien) {
  return `<circle cx="${x}" cy="${y - 26}" r="7" fill="none" stroke="${mau}" stroke-width="1.8"/>
<path d="M ${x} ${y - 19} L ${x} ${y + 4} M ${x - 12} ${y - 10} L ${x} ${y - 6} L ${x + 12} ${y - 10}
         M ${x} ${y + 4} L ${x - 10} ${y + 22} M ${x} ${y + 4} L ${x + 10} ${y + 22}"
      fill="none" stroke="${mau}" stroke-width="1.8" stroke-linecap="round"/>
${chu(x, y + 40, ten, { size: 12, dam: 600 })}`
}

/**
 * Ký hiệu tác nhân **máy** (hệ thống tự sinh thông báo, người dùng tự đặt đơn).
 *
 * Cố ý không dùng hình người: tác nhân ở đây không phải ai cả, vẽ người thì giảng viên
 * hỏi "ai là người này" và không trả lời được. Hộp có nhãn là ký hiệu quy ước cho tác
 * nhân hệ thống.
 */
function mayTinh(x, y, ten, mau = MAU.tacNhanBien) {
  const w = 92
  const h = 58
  return `<rect x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="8" fill="${MAU.tacNhan}" stroke="${mau}" stroke-width="1.8"/>
${chu(x, y + 5, '⚙', { size: 22, mau })}
${chu(x, y + 42, ten, { size: 12, dam: 600 })}`
}

/* ------------------------------------------------- sơ đồ dùng chung: use case */

/**
 * Sơ đồ use case: khung hệ thống + tác nhân bên ngoài + các bầu dục use case.
 * @param {{ten:string, tacNhan:Array, uc:Array, ghiChu?:Array}} d
 */
/**
 * Sơ đồ use case theo kiểu chuẩn: **mỗi use case một dòng, xếp dọc**, tác nhân bên
 * trái, khung hệ thống bao quanh, quan hệ `«include»` vẽ sang cột phải.
 *
 * Vì sao xếp dọc chứ không xếp lưới: sơ đồ xếp lưới 3 cột khi có hơn mười use case
 * thì nét nối từ tác nhân phải vòng qua mấy hàng, đọc lưỡng lự ngay chỗ giao nhau.
 * Xếp một dòng một cái thì mọi quan hệ là đường ngang, không cắt nhau.
 *
 * @param {{ten:string, tacNhan:Array, uc:Array, include?:Array, ghiChu?:Array}} d
 *        `include` = [{tu, den}] — use case `tu` luôn kéo theo `den`.
 */
function veUseCase(d) {
  const khungX = 190
  const khungY = 20
  const ucRong = 250
  const ucCao = 52 // cao đủ cho nhãn hai dòng, không tràn ra ngoài bầu dục
  const buocY = 66
  const kheCot = 200 // khoảng hở giữa hai cột, chừa chỗ cho nhãn «include»
  const y0 = khungY + 62

  /* ---- Sắp xếp hàng: mỗi use case chính một hàng, các use case «include» của nó
     nằm ở cột phải. Use case đầu tiên của một nhóm đi kèm hàng chính, những cái
     sau mỗi cái một hàng riêng — nhờ vậy không có hai nhóm tranh nhau một hàng nên
     nét nối gần như luôn là đường ngang, không cắt qua bầu dục khác. ---- */
  const hang = []
  for (const chinh of d.uc) {
    const nhom = (d.include ?? []).filter((q) => q.tu === chinh)
    // Use case «include» đầu tiên đi kèm ngay hàng của use case chính. Các cái sau
    // (ít gặp) mỗi cái một hàng riêng, cột chính để trống — giống cách PlantUML dựng.
    hang.push({ chinh, include: nhom[0]?.den ?? null })
    for (const q of nhom.slice(1)) {
      hang.push({ chinh: null, include: q.den })
    }
  }

  const soHang = hang.length
  const khungCao = 62 + soHang * buocY + 16
  const W = khungX + 26 + ucRong + kheCot + ucRong + 30
  const H = khungY + khungCao + 34 + (d.ghiChu?.length ?? 0) * 17

  const xChinh = khungX + 26 + ucRong / 2
  const xPhu = khungX + 26 + ucRong + kheCot + ucRong / 2
  const viTri = new Map()
  hang.forEach((r, i) => {
    if (r.chinh !== null) viTri.set(r.chinh, { x: xChinh, y: y0 + i * buocY })
    if (r.include !== null) viTri.set(r.include, { x: xPhu, y: y0 + i * buocY })
  })

  for (const q of d.include ?? []) {
    // Ném lỗi thay vì bỏ qua: sai tên làm quan hệ biến mất lặng lẽ, người đọc báo
    // cáo thấy sơ đồ thiếu mà không biết vì sao.
    if (viTri.get(q.tu) === undefined || viTri.get(q.den) === undefined) {
      throw new Error(`«include» nhắc tới use case không có trong danh sách: "${q.tu}" → "${q.den}"`)
    }
  }
  for (const t of d.tacNhan) {
    for (const u of t.dung) {
      if (viTri.get(u) === undefined) {
        throw new Error(`Tác nhân "${t.ten}" nối tới use case không có: "${u}"`)
      }
    }
  }

  let s = ''
  s += `<rect x="${khungX}" y="${khungY}" width="${W - khungX}" height="${khungCao}" rx="4" fill="#ffffff" stroke="#1f2937" stroke-width="1.4"/>`
  s += chu(khungX + (W - khungX) / 2, khungY + 28, d.ten, { size: 15, dam: 700 })

  // Nét vẽ TRƯỚC bầu dục: bầu dục có nền sẽ che nét chạy qua.
  for (const q of d.include ?? []) {
    const a = viTri.get(q.tu)
    const b = viTri.get(q.den)
    s += muiTen(a.x + ucRong / 2, a.y, b.x - ucRong / 2, b.y, { gach: '5 4', mau: '#1f2937', nhan: '«include»' })
  }
  for (const t of d.tacNhan) {
    const xa = khungX - 95
    const ya = khungY + khungCao / 2 - ((d.tacNhan.length - 1) * 118) / 2 + d.tacNhan.indexOf(t) * 118
    for (const u of t.dung) {
      const p = viTri.get(u)
      const dich = p.x - ucRong / 2
      const g = `M ${xa + 20} ${ya - 20} C ${khungX - 45} ${ya - 20}, ${dich - 55} ${p.y}, ${dich} ${p.y}`
      s += `<path d="${g}" fill="none" stroke="#1f2937" stroke-width="1.2"/>`
      s += `<polygon points="${dich},${p.y} ${dich - 8},${p.y - 3.4} ${dich - 8},${p.y + 3.4}" fill="#1f2937"/>`
    }
  }

  // Tác nhân vẽ sau nét để nét không đè lên người.
  for (const t of d.tacNhan) {
    const xa = khungX - 95
    const ya = khungY + khungCao / 2 - ((d.tacNhan.length - 1) * 118) / 2 + d.tacNhan.indexOf(t) * 118
    // `loai: 'may'` vẽ hộp thay vì hình người: hệ thống tự sinh thông báo thì không
    // phải là ai cả, vẽ người là sai ngữ nghĩa.
    s += t.loai === 'may' ? mayTinh(xa, ya, t.ten, '#1f2937') : nguoi(xa, ya, t.ten, '#1f2937')
  }

  for (const [ten, p] of viTri) {
    s += bauDuc(p.x, p.y, ucRong / 2, ucCao / 2, ten, { fill: '#fbf7d5', bien: '#1f2937', size: 12.5 })
  }

  ;(d.ghiChu ?? []).forEach((g, i) => {
    s += chu(24, H - 16 - ((d.ghiChu?.length ?? 1) - 1 - i) * 17, g, { size: 11.5, an: 'start', mau: MAU.chuNho })
  })
  return svg(W, H, '', s, d.ten)
}

/* ----------------------------------------------- sơ đồ dùng chung: sequence */

/**
 * Sơ đồ tuần tự: các cột tham gia + đường đời + mũi tên thông điệp.
 * @param {{ten:string, cot:Array<{ten:string, he?:boolean}>, moc:Array}} d
 *        `moc` = {tu, den, nhan, kieu?:'goi'|'traVe'|'tha'} — chỉ số cột (0..n-1)
 */
/** Bảng màu riêng cho sơ đồ tuần tự — khác bảng màu chung để hình đúng kiểu PlantUML. */
const MAU_UT = {
  nen: '#ffffff',
  bieuTuong: '#1f9bd7', // xanh lam vòng tròn đầu người / biểu tượng ranh giới
  kichHoat: '#b3e0f5', // nền thanh kích hoạt
  kichHoatBien: '#1f9bd7',
  duong: '#374151',
  chu: '#1f2937',
}

/**
 * Sơ đồ tuần tự kiểu PlantUML.
 *
 * <para>
 * Bốn thứ làm nên kiểu này:
 * </para>
 * <list type="bullet">
 * <item>**Biểu tượng đầy màu**: tác nhân là hình người xanh, thành phần bên trong là
 * vòng tròn xanh đặt trên một đường ngang (ký hiệu ranh giới).</item>
 * <item>**Thanh kích hoạt** dọc theo đường đời: cho biết đối tượng nào đang "bận" —
 * không có nó thì không đọc được luồng với sơ đồ nhiều lời gọi lồng nhau.</item>
 * <item>**Đánh số phân cấp** `1`, `1.1`, `1.1.1`: sinh tự động theo chiều sâu lồng nhau,
 * nên không phải đánh tay và không sợ sai thứ tự.</item>
 * <item>**Khối `alt`** cho nhánh rẽ điều kiện — phần lớn sơ đồ tuần tự thực tế đều có.</item>
 * </list>
 *
 * @param {{ten:string, cot:Array<{ten:string, loai?:string}>, moc:Array, alt?:Array}} d
 */
function veSequence(d) {
  const cotRong = 200
  const x0 = cotRong / 2 + 40
  const dau = 30
  const buoc = 54
  const yDau = dau + 96
  const W = x0 + (d.cot.length - 1) * cotRong + cotRong / 2 + 60
  const cx = (i) => x0 + i * cotRong

  /*
   * Đánh số phân cấp `1` · `1.1` · `1.1.1` — sinh tự động, không viết tay.
   *
   * Nguyên tắc: giữ một ngăn xếp các khung đang "bận". Xử lý thông điệp A → B:
   * - B **đã có** trong ngăn xếp thì quay về đúng khung đó, cắt các khung sâu hơn. Đây
   *   chính là lúc lời gọi trước kết thúc và đối tượng gọi lại nhận quyền điều khiển.
   *   Không cắt thì mỗi lời gọi tới MySQL lại chồng một khung mới, số thứ tự thành
   *   `1.1.1.1.1.1.1` — đúng nhưng vô nghĩa.
   * - B **chưa có** thì mở khung mới và đánh số con theo khung đang mở.
   */
  const moc = d.moc.map((m, i) => ({ ...m, y: yDau + i * buoc }))
  const khung = [{ cot: d.cot[0].ten, so: '', dem: 0, yDau: 0, yCuoi: 0 }]
  // Thanh kích hoạt phải gom vào danh sách riêng: `khung` là ngăn xếp **hiện tại**, bị
  // cắt khi quay lại khung trên, nên đọc lại nó ở cuối sẽ chỉ còn vài khung cuối.
  const thanh = []

  for (const m of moc) {
    let viTri = -1
    for (let i = khung.length - 1; i >= 0; i--) {
      if (khung[i].cot === d.cot[m.den].ten) { viTri = i; break }
    }
    if (viTri < 0) {
      khung.push({ cot: d.cot[m.den].ten, so: '', dem: 0, yDau: m.y - 22, yCuoi: m.y + 16 })
      viTri = khung.length - 1
      thanh.push(khung[viTri])
    }
    khung.length = viTri + 1

    const dinh = khung[viTri]
    dinh.dem++
    m.so = dinh.so === '' ? String(dinh.dem) : `${dinh.so}.${dinh.dem}`

    // Khung vừa mở nhận số của chính thông điệp này làm tiền tố cho thông điệp con.
    // Thiếu đoạn này thì mọi khung con có tiền tố rỗng, số thứ tự chỉ còn 1, 2, 3…
    // chứ không phân cấp theo chiều sâu lồng nhau.
    for (const f of khung.slice(viTri + 1)) {
      f.so = m.so
      f.dem = 0
    }

    for (const f of khung.slice(0, viTri + 1)) {
      if (f.yDau === 0) f.yDau = m.y - 22
      f.yCuoi = m.y + 16
    }
  }

  const H = yDau + (moc.length - 1) * buoc + 76

  /* --- Khối `alt`: khung hình chữ nhật, tab nhãn ở mép trái, điều kiện bên trong. --- */
  let s = ''
  for (const a of d.alt ?? []) {
    const y1 = moc[a.tu].y - 38
    const y2 = moc[a.den].y + 30
    const xa = cx(0) - cotRong / 2 + 8
    const xb = cx(d.cot.length - 1) + cotRong / 2 - 8
    s += `<rect x="${xa}" y="${y1}" width="${xb - xa}" height="${y2 - y1}" fill="none" stroke="#374151" stroke-width="1"/>`
    const rongTab = a.ten.length * 8 + 12
    s += `<rect x="${xa - 4}" y="${y1 - 9}" width="${rongTab}" height="18" fill="#ffffff" stroke="#374151" stroke-width="1"/>`
    s += chu(xa - 4 + rongTab / 2, y1 + 4, a.ten, { size: 11 })
    a.dieuKien.forEach((dk, i) => {
      s += chu(xa + 30, y1 + 22 + i * 15, dk, { size: 10.5, an: 'start', mau: MAU_UT.chu })
    })
  }

  /* --- Đường đời + biểu tượng đầu cột. --- */
  d.cot.forEach((c, i) => {
    const x = cx(i)
    s += c.loai === 'nguoi' ? bieuTuongNguoi(x, dau + 4) : bieuTuongRanhGioi(x, dau + 8)
    s += chu(x, dau + 58, c.ten, { size: 12, dam: 600 })
    s += duong(x, dau + 66, x, H - 38, { mau: '#9ca3af', rong: 1.1, gach: '5 4' })
  })

  /* --- Thanh kích hoạt, vẽ trước mũi tên để mũi tên nằm trên. --- */
  for (const f of thanh) {
    const x = cx(d.cot.findIndex((c) => c.ten === f.cot))
    s += `<rect x="${x - 6}" y="${f.yDau}" width="12" height="${f.yCuoi - f.yDau}" fill="${MAU_UT.kichHoat}" stroke="${MAU_UT.kichHoatBien}" stroke-width="1"/>`
  }

  /* --- Mũi tên. Trả về vẽ nét đứt; tự gọi vẽ khung hộp nhỏ. --- */
  for (const m of moc) {
    const traVe = m.kieu === 'traVe'
    const nhan = `${m.so}: ${m.nhan}`

    if (m.tu === m.den) {
      const x = cx(m.tu)
      s += `<path d="M ${x + 6} ${m.y} L ${x + 34} ${m.y} L ${x + 34} ${m.y + 20} L ${x + 6} ${m.y + 20}" fill="none" stroke="${MAU_UT.duong}" stroke-width="1.1"${traVe ? ' stroke-dasharray="5 3"' : ''}/>`
      s += `<polygon points="${x + 6},${m.y + 20} ${x + 13},${m.y + 17} ${x + 13},${m.y + 23}" fill="${MAU_UT.duong}"/>`
      s += nhanCuaNen(nhan, x + 40, m.y - 6, 'start')
      continue
    }

    const x1 = cx(m.tu)
    const x2 = cx(m.den)
    s += duong(x1, m.y, x2, m.y, { mau: MAU_UT.duong, rong: 1.2, gach: traVe ? '6 4' : '' })
    const dauT = 8
    const goc = x2 > x1 ? 0 : 180
    const c1 = x2 - dauT * Math.cos(((goc - 22) * Math.PI) / 180)
    const c2 = x2 - dauT * Math.cos(((goc + 22) * Math.PI) / 180)
    s += `<polygon points="${x2},${m.y} ${c1.toFixed(1)},${(m.y - 3.4).toFixed(1)} ${c2.toFixed(1)},${(m.y + 3.4).toFixed(1)}" fill="${MAU_UT.duong}"/>`
    s += nhanCuaNen(nhan, (x1 + x2) / 2, m.y - 4, 'middle')
  }

  s += chu(20, H - 14, 'Mũi tên liền = lời gọi · nét đứt = trả về · thanh xanh dọc đường đời = đối tượng đang xử lý.', {
    size: 11,
    an: 'start',
    mau: MAU_UT.chu,
  })
  return svg(W, H, '', s, d.ten)
}

/** Nhãn thông điệp có nền trắng, để không bị nét khác cắt qua chữ. */
function nhanCuaNen(nhan, x, y, an) {
  const doRong = nhan.length * 5.6 + 8
  const xNhan = an === 'middle' ? x - doRong / 2 : an === 'end' ? x - doRong : x
  return `<rect x="${xNhan.toFixed(1)}" y="${y - 10}" width="${doRong.toFixed(1)}" height="14" fill="${MAU_UT.nen}"/>`
    + chu(x, y, nhan, { size: 11, an, mau: MAU_UT.chu })
}

/** Tác nhân: hình người xanh, đầu là hình tròn đặc. */
function bieuTuongNguoi(x, y) {
  const m = MAU_UT.bieuTuong
  return `<circle cx="${x}" cy="${y + 6}" r="7" fill="${m}"/>
<path d="M ${x} ${y + 14} L ${x} ${y + 34} M ${x - 9} ${y + 20} L ${x} ${y + 26} L ${x + 9} ${y + 20}
         M ${x} ${y + 34} L ${x - 7} ${y + 48} M ${x} ${y + 34} L ${x + 7} ${y + 48}"
      fill="none" stroke="${m}" stroke-width="2" stroke-linecap="round"/>`
}

/** Thành phần bên trong: vòng tròn xanh đặt trên một đường ngang (ký hiệu ranh giới). */
function bieuTuongRanhGioi(x, y) {
  const m = MAU_UT.bieuTuong
  return `<line x1="${x - 20}" y1="${y + 20}" x2="${x + 20}" y2="${y + 20}" stroke="#1f2937" stroke-width="1.4"/>
<circle cx="${x}" cy="${y + 8}" r="12" fill="${m}" stroke="#1f2937" stroke-width="1.4"/>`
}

/**
 * Sơ đồ ERD: mỗi bảng là một hộp, cột bên trong, khóa chính gạch chân,
 * khóa ngoại có tiền tố "FK". Sử dụng chung `cotTheoTen`.
 */
/**
 * Sơ đồ ERD: mỗi bảng là một hộp, cột bên trong, khóa chính gạch chân,
 * khóa ngoại có tiều tố "FK".
 *
 * Số hàng, chiều cao hộp và số cột hiển thị đều tính từ dữ liệu, không viết cứng:
 * thêm bảng mới mà để kích thước cứng thì hộp tràn ra ngoài khung và hàng cuối bị cắt.
 */
function veErd(d) {
  const hang = 4
  const bangRong = 250
  const kheX = 60
  const kheY = 40
  const soCotHienThi = 5
  const dong = 19

  const x0 = (d.bang.length % hang) * ((bangRong + kheX) / 2) + 20
  const cotCount = Math.ceil(d.bang.length / hang)
  const W = x0 + cotCount * bangRong + (cotCount - 1) * kheX + 20
  // Hộp cao vừa số cột hiển thị: 28 đầu bảng + 19 mỗi dòng + 24 dưới cùng.
  const bangCao = 52 + soCotHienThi * dong
  const H = 60 + hang * bangCao + (hang - 1) * kheY + 44

  let s = chu(W / 2, 32, d.ten, { size: 17, dam: 700 })
  d.bang.forEach((b, i) => {
    const c = i % cotCount
    const r = Math.floor(i / cotCount)
    const x = x0 + c * (bangRong + kheX)
    const y = 60 + r * (bangCao + kheY)
    s += `<rect x="${x}" y="${y}" width="${bangRong}" height="${bangCao}" rx="6" fill="#ffffff" stroke="${MAU.coSoDuLieuBien}" stroke-width="1.6"/>`
    s += `<rect x="${x}" y="${y}" width="${bangRong}" height="28" rx="6" fill="${MAU.coSoDuLieu}"/>`
    s += `<rect x="${x}" y="${y + 18}" width="${bangRong}" height="10" fill="${MAU.coSoDuLieu}"/>`
    s += `<line x1="${x}" y1="${y + 28}" x2="${x + bangRong}" y2="${y + 28}" stroke="${MAU.coSoDuLieuBien}" stroke-width="1.2"/>`
    s += chu(x + bangRong / 2, y + 19, b.ten, { size: 13, dam: 700, mau: MAU.coSoDuLieuBien })

    b.cot.slice(0, soCotHienThi).forEach((col, j) => {
      const yy = y + 48 + j * dong
      s += `<text x="${x + 10}" y="${yy}" font-size="12" fill="${MAU.chu}">${esc(col.ten)}</text>`
      if (col.pk === true) {
        s += `<line x1="${x + 10}" y1="${yy + 3}" x2="${x + 10 + col.ten.length * 6.3}" y2="${yy + 3}" stroke="${MAU.chu}" stroke-width="0.8"/>`
      }
      // Khóa ngoại ghi kèm tên bảng cha ngay trong hộp.
      s += chu(x + bangRong - 10, yy, col.fk ? `FK → ${col.cha ?? '?'}` : col.kieu, {
        size: 11,
        an: 'end',
        mau: col.fk ? MAU.coSoDuLieuBien : MAU.chuNho,
      })
    })

    if (b.cot.length > soCotHienThi) {
      s += chu(x + 10, y + 48 + soCotHienThi * dong, `+${b.cot.length - soCotHienThi} cột khác`, {
        size: 11,
        an: 'start',
        mau: MAU.chuNho,
      })
    }
  })

  s += chu(20, H - 14, 'PK = khóa chính (gạch chân) · FK = khóa ngoại, mũi tên chỉ bảng cha · mỗi dòng dưới đầu bảng là một cột.', {
    size: 12,
    an: 'start',
    mau: MAU.chuNho,
  })
  return svg(W, H, '', s, erd.ten)
}

/* --------------------------------------------------------- 3.1 hoạt động */

function veHoatDong() {
  const W = 880
  const H = 730
  const cxH = 470 // trục chính của luồng hệ thống
  const rong = 330 // bề rộng hộp bước
  const xH = cxH - rong / 2
  const cao = 40
  const buoc = 66 // khoảng cách giữa hai bước
  const y0 = 150 // bước đầu tiên

  let s = ''
  // Hai làn: khách và hệ thống
  s += `<rect x="40" y="46" width="${W - 80}" height="${H - 110}" rx="8" fill="#ffffff" stroke="#9ca3af" stroke-width="1.4"/>`
  s += duong(240, 46, 240, H - 64, { mau: '#9ca3af', rong: 1.2, gach: '6 4' })
  s += chu(140, 34, 'Khách', { size: 13, dam: 700 })
  s += chu(560, 34, 'Hệ thống HomeStay', { size: 13, dam: 700 })

  // Tác nhân đứng ở làn khách
  s += nguoi(140, y0 + 20, 'Khách')

  const y = (i) => y0 + i * buoc
  const oViTri = [
    'Chọn địa điểm, ngày nhận / trả, số khách',
    'Kiểm tra phòng còn trống',
    null, // chỗ dành cho ô quyết định
    'Chọn cách thuê: theo giờ hoặc theo ngày',
    'Nhập số khách + ghi chú',
    'Tính tổng tiền theo bảng giá',
    'Tạo đơn PENDING, ghi lịch sử, phòng chuyển BOOKED',
  ]

  // Mũi tên xuống giữa các bước
  for (let i = 1; i < oViTri.length; i++) {
    if (oViTri[i] === null) continue
    s += muiTen(cxH, y(i - 1) + cao, cxH, y(i), {})
  }

  // Ô quyết định, vẽ sau các hộp để nằm đúng chỗ trống
  const yqd = y(2)
  s += hop(xH, y(0), rong, cao, oViTri[0])
  s += hop(xH, y(1), rong, cao, oViTri[1])
  s += `<polygon points="${cxH},${yqd - 34} ${cxH + 120},${yqd} ${cxH},${yqd + 34} ${cxH - 120},${yqd}" fill="${MAU.vung}" stroke="${MAU.vungBien}" stroke-width="1.5"/>`
  s += chu(cxH, yqd + 4, 'Phòng còn trống?', { size: 12, dam: 600 })

  oViTri.slice(3).forEach((nhan, i) => {
    s += hop(xH, y(i + 3), rong, cao, nhan)
  })

  // Nhánh "không" sang bên phải
  const x409 = 700
  s += `<rect x="${x409}" y="${yqd - 22}" width="164" height="44" rx="6" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>`
  s += chu(x409 + 82, yqd - 4, 'Phòng đã có', { size: 11.5, dam: 600, mau: '#b91c1c' })
  s += chu(x409 + 82, yqd + 12, 'người đặt (409)', { size: 11.5, dam: 600, mau: '#b91c1c' })
  s += muiTen(cxH + 120, yqd, x409, yqd, { nhan: 'không' })
  s += muiTen(cxH, yqd + 34, cxH, y(3), { nhan: 'còn trống' })

  // Mũi tên qua lại với làn khách
  s += muiTen(cxH - rong / 2, y(0) + 20, 300, y(0) + 20, { nhan: 'chọn', nhanLen: 'trai' })
  s += muiTen(300, y(3) + 20, cxH - rong / 2, y(3) + 20, { nhan: 'chọn cách thuê', nhanLen: 'trai' })
  s += muiTen(cxH - rong / 2, y(4) + 20, 300, y(4) + 20, { nhan: 'nhập', nhanLen: 'trai' })
  s += muiTen(cxH - rong / 2, y(6) + 20, 300, y(6) + 20, { nhan: 'mã đơn HS-…', nhanLen: 'trai' })

  s += chu(40, H - 30, 'Sau khi khách đặt, Admin nhận đơn và xác nhận hoặc từ chối; khách theo dõi tại trang "Đơn của tôi".', {
    size: 11,
    an: 'start',
    mau: MAU.chuNho,
  })
  s += chu(40, H - 12, 'Mỗi lần Admin chuyển trạng thái, hệ thống sinh thêm một thông báo cho khách — xem Hình 3.8.', {
    size: 11,
    an: 'start',
    mau: MAU.chuNho,
  })
  return svg(W, H, '', s, 'Biểu đồ hoạt động của hệ thống HomeStay')
}

/* ------------------------------------------------------------ 3.8 kiến trúc */

function veKienTruc() {
  const W = 900
  const H = 742
  let s = chu(W / 2, 28, 'Kiến trúc 3 tầng của hệ thống HomeStay', { size: 16, dam: 700 })

  // Tác nhân đứng TRÊN các tầng, không đặt chồng lên tầng nào.
  s += nguoi(150, 78, 'Khách', MAU.tacNhanBien)
  s += nguoi(W - 150, 78, 'Admin', MAU.tacNhanBien)
  s += chu(W / 2, 138, 'giao tiếp qua HTTP / JSON — có xác thực bằng JWT Bearer', {
    size: 11.5,
    mau: MAU.chuNho,
  })

  const tang = (y, h, ten, mau, bien, noiDung) => {
    let t = `<rect x="50" y="${y}" width="${W - 100}" height="${h}" rx="8" fill="${mau}" stroke="${bien}" stroke-width="1.6"/>`
    t += chu(70, y + 24, ten, { size: 13, an: 'start', dam: 700, mau: bien })
    const n = noiDung.length
    const bw = (W - 140) / n - 16
    noiDung.forEach((c, i) => {
      const x = 80 + i * (bw + 16)
      t += hop(x, y + 36, bw, h - 56, c, { fill: '#ffffff', bien, size: 11, dam: 500 })
    })
    return t
  }

  s += muiTen(150, 100, 150, 152, {})
  s += muiTen(W - 150, 100, W - 150, 152, {})

  s += tang(156, 156, 'Tầng trình bày — React 18 + TypeScript + Vite + TailwindCSS', '#f5f3ff', MAU.tacNhanBien, [
    'Trang công khai: Trang chủ, Địa điểm, Tìm phòng, Chi tiết phòng',
    'Trang khách: Đặt phòng, Đơn của tôi, Thanh toán, Thông báo, Hồ sơ',
    'Trang quản trị: Thống kê, Đơn, Thanh toán, Cơ sở, Đánh giá, Phòng, Khách',
    'Dùng chung: PageLayout, chuông thông báo, Toast, phân trang, 3 trạng thái',
  ])

  s += muiTen(150, 318, 150, 372, { nhan: 'EF Core' })
  s += muiTen(W - 150, 318, W - 150, 372, {})

  s += tang(376, 170, 'Tầng nghiệp vụ — ASP.NET Core Web API 8.0 (C#)', MAU.heThong, MAU.heThongBien, [
    'AuthService · RoomService · BookingService\nReviewService · PaymentService\nNotificationService',
    'AdminBookingService · AdminRoomService\nAdminCustomerService · AdminDashboardService\nAdminPaymentService',
    'ExceptionMiddleware\nJwtBearer · phân quyền\ntheo vai trò',
    'Swagger tại /swagger\nmô tả 47 endpoint',
  ])

  s += muiTen(150, 552, 150, 606, { nhan: 'truy vấn' })
  s += muiTen(W - 150, 552, W - 150, 606, {})

  s += tang(610, 112, 'Tầng dữ liệu — Entity Framework Core 8 + Pomelo.MySql', '#f0fdf4', MAU.coSoDuLieuBien, [
    '11 bảng nghiệp vụ: Users · Locations · Rooms · Amenities · RoomAmenities\nRoomImages · Bookings · BookingStatusHistory · Reviews\nPayments · Notifications',
    'MySQL 8.0 chạy trong Docker (cổng 3307)',
  ])

  return svg(W, H, '', s, 'Kiến trúc 3 tầng của hệ thống HomeStay')
}

/* ------------------------------------------------------- 3.11 lớp thực thi */

/** Chiều cao một hộp lớp: 26 (tên) + 15 mỗi dòng + 26 (đáy). */
const caoLop = (t, p) => 26 + (t + p) * 15 + 26

/**
 * Biểu đồ lớp thực thi (rút gọn): service · thành phần dùng chung · controller.
 *
 * Toạ độ nét nối **tính tự động** từ vị trí hộp thay vì viết tay: viết tay thì thêm
 * hay bớt một hộp là các nét cũ lệch, và không ai nhớ đường nào còn đúng. Ở đây mỗi
 * quan hệ chỉ cần nêu `từ → đến`; mép hộp và tâm theo chiều dọc được suy ra.
 */
/**
 * Chiều cao một khối lớp: 30 (đầu khối) + 18 mỗi dòng thuộc tính
 * + 8 và 18 mỗi dòng phương thức + 12 (đáy). Lớp trừu tượng thêm 10 cho dòng `«abstract»`.
 */
const caoKhoi = (soThuocTinh, soPhuongThuc, truuTượng = false) =>
  30 + (truuTượng ? 10 : 0) + soThuocTinh * 18 + (soPhuongThuc > 0 ? 8 + soPhuongThuc * 18 : 0) + 12

/**
 * Biểu đồ lớp thực thể (Hình 3.11) — lớp miền bài toán, đúng kiểu UML.
 *
 * Vì sao không vẽ lớp Service / Controller ở đây: những lớp đó thuộc **kiến trúc** đã
 * có sơ đồ riêng (Hình 3.10). Sơ đồ lớp phải trả lời "dữ liệu nghiệp vụ quan hệ với
 * nhau thế nào" — đó là câu hỏi của giảng viên khi nhìn sơ đồ lớp.
 *
 * Ký hiệu chuẩn UML: `+` công khai, `-` riêng tư, `«abstract»` cho lớp trừu tượng,
 * tam giác rỗng ở đầu quan hệ kế thừa, số lượng nhiều ở hai đầu đường liên kết.
 */
function veLopThucThi() {
  const khung = { trang: '#fffbe6', vien: '#1f2937' }

  /* --- Khối lớp. `truong` = (vị trí cột, danh sách thuộc tính, danh sách phương thức). --- */
  const lop = [
    { ten: 'NguoiDung', truuTượng: true, cot: 1, hang: 0,
      thuocTinh: ['- id: int', '- hoTen: Chuoi · không rỗng', '- email: Chuoi · duy nhất', '- matKhauHash: Chuoi · BCrypt', '- vaiTro: VaiTro · CUSTOMER | ADMIN', '- trangThai: TrangTaiKhoan'],
      phuongThuc: [] },
    { ten: 'KhachHang', keThua: 'NguoiDung', cot: 0, hang: 0,
      thuocTinh: ['- soDienThoai: Chuoi · duy nhất', '- diaChi: Chuoi'],
      phuongThuc: ['+ capNhatHoSo(hoSo): Bo'] },
    { ten: 'QuanTri', keThua: 'NguoiDung', cot: 2, hang: 0, thuocTinh: [], phuongThuc: [] },
    { ten: 'ThongBao', cot: 0, hang: 1,
      thuocTinh: ['- id: int', '- tieuDe: Chuoi · ≤ 200', '- noiDung: Chuoi · ≤ 500', '- daDoc: bool', '- thoiDiemTao: NgayGio'],
      phuongThuc: [] },
    { ten: 'DonDatPhong', cot: 1, hang: 1,
      thuocTinh: ['- id: int', '- maDon: Chuoi · duy nhất', '- loai: LoaiThue · GIO | NGAY', '- trangThai: TrangThaiDon', '- vaoLuc: NgayGio', '- raLuc: NgayGio', '- soKhach: int · > 0', '- tongTien: ThapHien(18,2)', '- ghiChu: Chuoi'],
      phuongThuc: ['+ tinhTien(): ThapHien'] },
    { ten: 'LichSuTrangThai', cot: 1, hang: 2,
      thuocTinh: ['- id: int', '- tuTrangThai: TrangThaiDon?', '- denTrangThai: TrangThaiDon', '- nguoiThucHien: NguoiDung', '- ghiChu: Chuoi', '- thoiDiem: NgayGio'],
      phuongThuc: [] },
    { ten: 'PhieuThu', cot: 2, hang: 2,
      thuocTinh: ['- id: int', '- soTien: ThapHien(18,2) · > 0', '- phuongThuc: PhuongThuc', '- trangThai: TrangThaiThanhToan', '- thoiDiemThu: NgayGio?', '- ghiChu: Chuoi'],
      phuongThuc: [] },
    { ten: 'DanhGia', cot: 0, hang: 2,
      thuocTinh: ['- id: int', '- soSao: int · 1..5', '- nhanXet: Chuoi · ≤ 500', '- biAn: bool'],
      phuongThuc: [] },
    { ten: 'CoSo', cot: 3, hang: 0,
      thuocTinh: ['- id: int', '- ten: Chuoi · duy nhất', '- diaChi: Chuoi', '- moTa: Chuoi', '- hoatDong: bool'],
      phuongThuc: ['+ timPhong(bộ lọc): Tap[Phong]'] },
    { ten: 'Phong', cot: 3, hang: 1,
      thuocTinh: ['- id: int', '- maPhong: Chuoi · duy nhất trong cơ sở', '- ten: Chuoi', '- giaGio: ThapHien(18,2)', '- giaNgay: ThapHien(18,2)', '- soNguoiToiDa: int', '- trangThai: TrangThaiPhong', '- diemTrungBinh: ThapHien(3,2)', '- soDanhGia: int'],
      phuongThuc: ['+ conTrong(khoang): bool'] },
    { ten: 'AnhPhong', cot: 3, hang: 2,
      thuocTinh: ['- id: int', '- duongDan: Chuoi', '- chinh: bool'],
      phuongThuc: [] },
    { ten: 'PhongTienNghi', cot: 4, hang: 2,
      thuocTinh: ['- phong: Phong', '- tienNghi: TienNghi'],
      phuongThuc: [] },
    { ten: 'TienNghi', cot: 4, hang: 1,
      thuocTinh: ['- id: int', '- ten: Chuoi · duy nhất', '- bieuTuong: Chuoi'],
      phuongThuc: [] },
  ]

  /* Quan hệ: [lớp A, lớp B, nhãn, số lượng ở A, số lượng ở B] */
  const lienKet = [
    ['KhachHang', 'DonDatPhong', 'đặt', '1', '0..*'],
    ['KhachHang', 'ThongBao', 'nhận', '1', '0..*'],
    ['DonDatPhong', 'LichSuTrangThai', 'ghi nhận', '1', '0..*'],
    ['DonDatPhong', 'PhieuThu', 'có phiếu thu', '1', '0..1'],
    ['DonDatPhong', 'DanhGia', 'được đánh giá', '1', '0..1'],
    ['DonDatPhong', 'Phong', 'thuê', '0..*', '1'],
    ['CoSo', 'Phong', 'chứa', '1', '0..*'],
    ['Phong', 'AnhPhong', 'có ảnh', '1', '0..*'],
    ['PhongTienNghi', 'Phong', 'gắn', '*', '1'],
    ['PhongTienNghi', 'TienNghi', 'gồm', '*', '1'],
    ['QuanTri', 'DonDatPhong', 'xử lý', '1', '0..*'],
    ['QuanTri', 'PhieuThu', 'xác nhận thu', '1', '0..*'],
  ]

  /* --- Sắp xếp khối theo cột; mỗi cột xếp dọc, chiều cao tính từ nội dung. --- */
  const rong = 268
  const kheCot = 66
  const kheHang = 34
  const soCot = 5
  const xCot = (c) => 26 + c * (rong + kheCot)

  const o = new Map()
  let maxY = 0

  // Tính cao từng cột bằng cách cộng dồn, theo thứ tự `hang` trong từng cột.
  for (let c = 0; c < soCot; c++) {
    let y = 46
    for (const l of lop.filter((k) => k.cot === c).sort((a, b) => a.hang - b.hang)) {
      const h = caoKhoi(l.thuocTinh.length, l.phuongThuc.length, l.truuTượng)
      o.set(l.ten, { x: xCot(c), y, w: rong, h, tamY: y + h / 2, lop: l })
      y += h + kheHang
    }
    maxY = Math.max(maxY, y)
  }

  const W = xCot(soCot - 1) + rong + 40
  const H = maxY + 46

  /* Điểm giao giữa hai khối trên cùng một đường thẳng — dùng chung cho mọi liên kết
     nên không phải tính tay từng cái. */
  function canh(a, b) {
    const A = o.get(a)
    const B = o.get(b)
    if (A === undefined || B === undefined) throw new Error(`Lớp không có trong sơ đồ: ${a} / ${b}`)
    const g = (p, q) => ({ x: p.x + p.w / 2, y: p.y + p.h / 2 })
    const P = g(A)
    const Q = g(B)
    const dx = Q.x - P.x
    const dy = Q.y - P.y
    // Cắt đường nối tâm–tâm với mép hình chữ nhật.
    const tx = dx === 0 ? Infinity : A.w / 2 / Math.abs(dx)
    const ty = dy === 0 ? Infinity : A.h / 2 / Math.abs(dy)
    const t = Math.min(tx, ty)
    return {
      x1: P.x + dx * t, y1: P.y + dy * t,
      x2: Q.x - dx * t, y2: Q.y - dy * t,
      goc: (Math.atan2(dy, dx) * 180) / Math.PI,
    }
  }

  let s = chu(W / 2, 26, 'Biểu đồ lớp thực thể — 13 lớp, 5 kiểu enum', { size: 17, dam: 700 })

  /* Liên kết vẽ TRƯỚC khối: khối có nền che nét chạy qua. */
  for (const [a, b, nhan, soA, soB] of lienKet) {
    const c = canh(a, b)
    s += muiTen(c.x1, c.y1, c.x2, c.y2, { mau: '#1f2937', rong: 1.2 })

    // Nền trắng sau nhãn: đường liên kết đi qua nhãn của quan hệ khác thì chữ bị cắt,
    // nhìn vào không biết nhãn viết gì.
    const cx = (c.x1 + c.x2) / 2
    const cy = (c.y1 + c.y2) / 2 - 6
    s += `<rect x="${(cx - nhan.length * 2.9).toFixed(1)}" y="${cy - 10}" width="${nhan.length * 5.8}" height="13" fill="#ffffff"/>`
    s += chu(cx, cy, nhan, { size: 10.5, mau: MAU.chuNho })

    const gocRad = (c.goc * Math.PI) / 180
    s += chu(c.x1 - Math.cos(gocRad) * 16, c.y1 - Math.sin(gocRad) * 16 + 4, soA, { size: 10, mau: MAU.chuNho })
    s += chu(c.x2 + Math.cos(gocRad) * 18, c.y2 + Math.sin(gocRad) * 18 + 4, soB, { size: 10, mau: MAU.chuNho })
  }

  /* Kế thừa: tam giác rỗng ở lớp cha, đúng ký hiệu UML. */
  for (const l of lop.filter((k) => k.keThua !== undefined)) {
    const c = canh(l.ten, l.keThua)
    const gocRad = (c.goc * Math.PI) / 180
    s += duong(c.x1, c.y1, c.x2, c.y2, { mau: '#1f2937', rong: 1.4 })
    const L = 15
    const bx = c.x2
    const by = c.y2
    const p1 = [bx - L * Math.cos(gocRad) + L * 0.45 * Math.sin(gocRad), by - L * Math.sin(gocRad) - L * 0.45 * Math.cos(gocRad)]
    const p2 = [bx - L * Math.cos(gocRad) - L * 0.45 * Math.sin(gocRad), by - L * Math.sin(gocRad) + L * 0.45 * Math.cos(gocRad)]
    s += `<polygon points="${bx.toFixed(1)},${by.toFixed(1)} ${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}" fill="#ffffff" stroke="#1f2937" stroke-width="1.4"/>`
  }

  /* Khối lớp. */
  for (const l of lop) {
    const b = o.get(l.ten)
    s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4" fill="#ffffff" stroke="${khung.vien}" stroke-width="1.4"/>`
    s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="30" rx="4" fill="${khung.trang}"/>`
    s += `<rect x="${b.x}" y="${b.y + 20}" width="${b.w}" height="10" fill="${khung.trang}"/>`
    s += `<line x1="${b.x}" y1="${b.y + 30}" x2="${b.x + b.w}" y2="${b.y + 30}" stroke="${khung.vien}" stroke-width="1"/>`
    s += chu(b.x + b.w / 2, b.y + 20, l.ten, { size: 12.5, dam: 700 })
    // Lớp trừu tượng có thêm một dòng `«abstract»`, nên danh sách thuộc tính phải
    // lùi xuống — vẽ cùng toạ độ là chữ đè lên nhau.
    const yThuocTinh = l.truuTượng ? b.y + 56 : b.y + 46
    if (l.truuTượng) {
      s += chu(b.x + b.w / 2, b.y + 44, '«abstract»', { size: 10, mau: MAU.chuNho })
    }
    l.thuocTinh.forEach((v, i) => s += chu(b.x + 9, yThuocTinh + i * 18, v, { size: 10.5, an: 'start', mau: MAU.chu }))
    if (l.phuongThuc.length > 0) {
      const y2 = yThuocTinh + l.thuocTinh.length * 18
      s += `<line x1="${b.x}" y1="${y2}" x2="${b.x + b.w}" y2="${y2}" stroke="${khung.vien}" stroke-width="1"/>`
      l.phuongThuc.forEach((v, i) => s += chu(b.x + 9, y2 + 16 + i * 18, v, { size: 10.5, an: 'start', mau: MAU.chu }))
    }
  }

  s += chu(20, H - 12, '+ công khai · - riêng tư · «abstract» lớp trừu tượng · tam giác rỗng = kế thừa · số lượng nhiều ghi ở hai đầu quan hệ.', {
    size: 11,
    an: 'start',
    mau: MAU.chuNho,
  })
  return svg(W, H, '', s, 'Biểu đồ lớp thực thể — 13 lớp, 5 kiểu enum')
}


function duoyDep(x1, y1, x2, y2, rong = 1.1) {
  const duongTam = x1 + (x2 - x1) / 2
  return `<path d="M ${x1} ${y1} C ${duongTam} ${y1}, ${duongTam} ${y2}, ${x2} ${y2}" fill="none" stroke="${MAU.chuNho}" stroke-width="${rong}" stroke-dasharray="4 3"/>`
}

/* ------------------------------------------------------------------ dữ liệu */

/**
 * Dữ liệu 8 sơ đồ use case (Hình 3.2 – 3.9).
 *
 * `include` là quan hệ «include» thật, không phải để cho có: mỗi phần tử là một cặp
 * [use case gọi, use case bị kéo theo]. Xem `docs/CHUONG_4.md` để biết vì sao mỗi
 * quan hệ nằm ở đúng chỗ đó — khi giảng viên hỏi "vì sao lại include", câu trả lời
 * phải có trong tài liệu chứ không phải trong đầu.
 */
const useCases = {
  '3-01-use-case-tong-quat': {
    ten: 'Hệ thống HomeStay',
    tacNhan: [
      {
        ten: 'Khách',
        dung: ['Xem địa điểm', 'Tìm kiếm phòng', 'Xem chi tiết phòng', 'Đặt phòng', 'Huỷ đơn', 'Xem đơn của tôi', 'Đánh giá phòng', 'Xem thanh toán', 'Chọn phương thức thanh toán', 'Xem thông báo', 'Quản lý hồ sơ'],
      },
      {
        ten: 'Admin',
        dung: ['Thống kê doanh thu', 'Quản lý đơn đặt phòng', 'Quản lý phòng', 'Quản lý cơ sở', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khách hàng'],
      },
    ],
    uc: [
      'Xem địa điểm', 'Tìm kiếm phòng', 'Xem chi tiết phòng', 'Đặt phòng',
      'Huỷ đơn', 'Xem đơn của tôi', 'Đánh giá phòng', 'Xem thanh toán',
      'Chọn phương thức thanh toán', 'Xem thông báo', 'Quản lý hồ sơ',
      'Thống kê doanh thu', 'Quản lý đơn đặt phòng', 'Quản lý phòng',
      'Quản lý cơ sở', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khách hàng',
    ],
    include: [
      { tu: 'Tìm kiếm phòng', den: 'Lọc và sắp xếp kết quả' },
      { tu: 'Đặt phòng', den: 'Kiểm tra phòng còn trống' },
      { tu: 'Đặt phòng', den: 'Tính tổng tiền' },
      { tu: 'Xem chi tiết phòng', den: 'Xem ảnh và tiện nghi' },
      { tu: 'Xem đơn của tôi', den: 'Xem lịch sử trạng thái đơn' },
      { tu: 'Đánh giá phòng', den: 'Kiểm tra đơn đã hoàn thành' },
      { tu: 'Quản lý đơn đặt phòng', den: 'Ghi lịch sử chuyển trạng thái' },
      { tu: 'Thống kê doanh thu', den: 'Tổng hợp phiếu thu đã thu' },
      { tu: 'Quản lý thanh toán', den: 'Đối chiếu số tiền với đơn' },
      { tu: 'Quản lý phòng', den: 'Cập nhật điểm đánh giá phòng' },
    ],
    ghiChu: [
      'Hai tác nhân duy nhất của hệ thống: Khách (CUSTOMER) và Admin (ADMIN).',
      'Mọi chức năng vận hành — xác nhận đơn, check-in, check-out, đổi trạng thái phòng, xác nhận đã thu tiền — thuộc Admin.',
      'Ranh giới đã chốt: hệ thống chỉ ghi nhận phương thức thanh toán, KHÔNG nối API cổng thanh toán; thông báo chỉ hiển thị trong hệ thống, không gửi email/SMS.',
    ],
  },
  '3-02-use-case-quan-ly-tai-khoan': {
    ten: 'Quản lý tài khoản',
    tacNhan: [
      { ten: 'Khách', dung: ['Đăng ký tài khoản', 'Đăng nhập', 'Xem hồ sơ', 'Cập nhật hồ sơ', 'Đổi mật khẩu', 'Đăng xuất'] },
      { ten: 'Admin', dung: ['Khoá / mở khoá tài khoản'] },
    ],
    uc: ['Đăng ký tài khoản', 'Đăng nhập', 'Xem hồ sơ', 'Cập nhật hồ sơ', 'Đổi mật khẩu', 'Đăng xuất', 'Khoá / mở khoá tài khoản'],
    include: [
      { tu: 'Đăng ký tài khoản', den: 'Kiểm tra định dạng email' },
      { tu: 'Đăng ký tài khoản', den: 'Kiểm tra email trùng' },
      { tu: 'Đăng nhập', den: 'Cấp phiên an toàn' },
      { tu: 'Đăng nhập', den: 'Kiểm tra tài khoản có bị khoá' },
      { tu: 'Đổi mật khẩu', den: 'Xác nhận mật khẩu cũ' },
      { tu: 'Cập nhật hồ sơ', den: 'Kiểm tra dữ liệu hợp lệ' },
    ],
    ghiChu: [
      'Đăng ký không cho tự chọn quyền — mọi tài khoản tự đăng ký đều là CUSTOMER.',
      'Mật khẩu lưu dạng BCrypt hash, không bao giờ lưu dạng thô.',
    ],
  },
  '3-03-use-case-tim-kiem-va-dat-phong': {
    ten: 'Tìm kiếm & đặt phòng',
    tacNhan: [{ ten: 'Khách', dung: ['Chọn địa điểm', 'Đặt nhu cầu lọc', 'Xem kết quả tìm kiếm', 'Chọn phòng', 'Đặt phòng'] }],
    uc: ['Chọn địa điểm', 'Đặt nhu cầu lọc', 'Xem kết quả tìm kiếm', 'Chọn phòng', 'Đặt phòng'],
    include: [
      { tu: 'Đặt nhu cầu lọc', den: 'Kiểm tra ngày nhận / trả hợp lệ' },
      { tu: 'Xem kết quả tìm kiếm', den: 'Phân trang kết quả' },
      { tu: 'Chọn phòng', den: 'Xem chi tiết và ảnh phòng' },
      { tu: 'Đặt phòng', den: 'Kiểm tra phòng còn trống' },
      { tu: 'Đặt phòng', den: 'Tính tổng tiền theo bảng giá' },
      { tu: 'Đặt phòng', den: 'Ghi mã đơn và trả về khách' },
    ],
    ghiChu: [
      'Quy tắc nghiệp vụ: đặt theo giờ tối thiểu 3 giờ; đặt theo ngày nhận phòng 14:00, trả phòng 12:00 hôm sau; phải đặt trước ít nhất 2 giờ.',
      'Kiểm tra phòng trống chạy trong transaction mức SERIALIZABLE nên hai khách cùng đặt một khung giờ chỉ có một đơn được tạo.',
    ],
  },
  '3-04-use-case-quan-ly-dat-phong': {
    ten: 'Quản lý đặt phòng',
    tacNhan: [
      { ten: 'Khách', dung: ['Xem đơn của tôi', 'Lọc đơn theo trạng thái', 'Xem chi tiết & lịch sử đơn', 'Huỷ đơn', 'Đánh giá sau khi hoàn thành'] },
      { ten: 'Admin', dung: ['Xem danh sách đơn', 'Lọc & tìm đơn', 'Xác nhận đơn', 'Từ chối đơn', 'Check-in', 'Check-out'] },
    ],
    uc: ['Xem danh sách đơn', 'Lọc & tìm đơn', 'Xem đơn của tôi', 'Lọc đơn theo trạng thái', 'Xem chi tiết & lịch sử đơn', 'Xác nhận đơn', 'Từ chối đơn', 'Huỷ đơn', 'Check-in', 'Check-out', 'Đánh giá sau khi hoàn thành'],
    include: [
      { tu: 'Lọc & tìm đơn', den: 'Phân trang danh sách đơn' },
      { tu: 'Xem chi tiết & lịch sử đơn', den: 'Tải dòng lịch sử chuyển trạng thái' },
      { tu: 'Xác nhận đơn', den: 'Kiểm tra trạng thái đơn hợp lệ' },
      { tu: 'Từ chối đơn', den: 'Bắt buộc nhập lý do từ chối' },
      { tu: 'Check-in', den: 'Chuyển phòng sang đang ở' },
      { tu: 'Check-out', den: 'Mở phiếu thu cho đơn' },
      { tu: 'Đánh giá sau khi hoàn thành', den: 'Chỉ cho đánh giá đơn COMPLETED' },
    ],
    ghiChu: [
      'Vòng đời đơn: PENDING → CONFIRMED → CHECKED_IN → COMPLETED; nhánh phụ CANCELLED (khách huỷ) và REJECTED (Admin từ chối).',
      'Mỗi lần đổi trạng thái đều ghi thêm một dòng vào bảng lịch sử, kèm người thực hiện và thời điểm.',
      'Khi đơn chuyển sang COMPLETED, hệ thống mở phiếu thu và sinh thông báo cho khách — xem Hình 3.7 và 3.8.',
    ],
  },
  '3-05-use-case-quan-ly-phong': {
    ten: 'Quản lý phòng',
    tacNhan: [
      { ten: 'Admin', dung: ['Thêm phòng', 'Sửa phòng', 'Đổi trạng thái phòng', 'Xoá phòng', 'Gán tiện nghi', 'Quản lý cơ sở'] },
    ],
    uc: ['Thêm phòng', 'Sửa phòng', 'Đổi trạng thái phòng', 'Xoá phòng', 'Gán tiện nghi', 'Quản lý cơ sở'],
    include: [
      { tu: 'Thêm phòng', den: 'Kiểm tra số phòng trùng trong cơ sở' },
      { tu: 'Thêm phòng', den: 'Chọn ảnh đại diện' },
      { tu: 'Sửa phòng', den: 'Kiểm tra dữ liệu hợp lệ' },
      { tu: 'Xoá phòng', den: 'Chặn xoá khi còn đơn' },
      { tu: 'Đổi trạng thái phòng', den: 'Cập nhật điểm đánh giá phòng' },
    ],
    ghiChu: [
      'Năm trạng thái phòng: AVAILABLE, BOOKED, OCCUPIED, CLEANING, MAINTENANCE.',
      'Sau check-out, phòng chuyển sang CLEANING; chỉ coi là trống khi đủ số giờ vệ sinh. Không xoá được phòng đang có đơn.',
    ],
  },
  '3-06-use-case-thanh-toan': {
    ten: 'Thanh toán',
    tacNhan: [
      { ten: 'Khách', dung: ['Xem lịch sử thanh toán', 'Chọn phương thức thanh toán'] },
      { ten: 'Admin', dung: ['Lọc phiếu thu theo trạng thái', 'Xác nhận đã thu tiền', 'Đánh dấu thanh toán thất bại'] },
    ],
    uc: ['Xem lịch sử thanh toán', 'Chọn phương thức thanh toán', 'Lọc phiếu thu theo trạng thái', 'Xác nhận đã thu tiền', 'Đánh dấu thanh toán thất bại'],
    include: [
      { tu: 'Chọn phương thức thanh toán', den: 'Kiểm tra đơn đã hoàn thành' },
      { tu: 'Chọn phương thức thanh toán', den: 'Chặn đổi khi phiếu đã thu tiền' },
      { tu: 'Xác nhận đã thu tiền', den: 'Đối chiếu số tiền với đơn' },
      { tu: 'Xác nhận đã thu tiền', den: 'Ghi thời điểm thu tiền' },
      { tu: 'Lọc phiếu thu theo trạng thái', den: 'Phân trang danh sách phiếu thu' },
    ],
    ghiChu: [
      'Ranh giới đã chốt: hệ thống chỉ GHI NHẬN phương thức khách chọn, không nối API cổng thanh toán nào. Không có màn hình quét mã hay trang cổng.',
      'Ba trạng thái phiếu thu: chờ thanh toán, đã thanh toán, thanh toán thất bại.',
      'Phiếu thu mở khi đơn chuyển COMPLETED, không phải lúc khách đặt — khách chưa trả tiền thì chưa có giao dịch.',
      'Một đơn có đúng một phiếu thu (ràng buộc UNIQUE trên BookingId); thu hai lần sẽ bị từ chối với mã 409.',
    ],
  },
  '3-07-use-case-thong-bao': {
    ten: 'Thông báo',
    tacNhan: [
      { ten: 'Hệ thống', loai: 'may', dung: ['Sinh thông báo khi đổi trạng thái đơn'] },
      { ten: 'Khách', dung: ['Xem thông báo', 'Đánh dấu đã đọc', 'Đánh dấu đã đọc tất cả'] },
    ],
    uc: ['Sinh thông báo khi đổi trạng thái đơn', 'Xem thông báo', 'Đánh dấu đã đọc', 'Đánh dấu đã đọc tất cả'],
    include: [
      { tu: 'Sinh thông báo khi đổi trạng thái đơn', den: 'Sinh câu chữ theo trạng thái đơn' },
      { tu: 'Xem thông báo', den: 'Đếm số thông báo chưa đọc' },
      { tu: 'Đánh dấu đã đọc tất cả', den: 'Đánh dấu từng thông báo đã đọc' },
    ],
    ghiChu: [
      'Thông báo CHỈ hiển thị trong hệ thống (in-app), không gửi email/SMS — không có dịch vụ gửi tin nào trong dự án.',
      'Sinh thông báo cho 4 sự kiện: đơn được xác nhận, nhận phòng, trả phòng, bị từ chối (kèm lý do).',
      'Mỗi thông báo luôn chứa mã đơn để khách tra cứu được ngay.',
      'Khách tự huỷ đơn thì không sinh thông báo — chính họ biết, gửi thêm chỉ làm nhiễu.',
    ],
  },
  '3-08-use-case-quan-tri-he-thong': {
    ten: 'Quản trị hệ thống',
    tacNhan: [
      { ten: 'Admin', dung: ['Xem thống kê', 'Doanh thu theo tháng', 'Tỷ lệ lấp đầy', 'Doanh thu theo phòng', 'Ẩn / hiện đánh giá', 'Khoá khách hàng'] },
    ],
    uc: ['Xem thống kê', 'Doanh thu theo tháng', 'Số đơn theo tháng', 'Tỷ lệ lấp đầy', 'Trạng thái phòng', 'Doanh thu theo phòng', 'Ẩn / hiện đánh giá', 'Xoá đánh giá', 'Khoá khách hàng'],
    include: [
      { tu: 'Doanh thu theo tháng', den: 'Tổng hợp phiếu thu đã thu' },
      { tu: 'Số đơn theo tháng', den: 'Đếm đơn theo tháng đặt' },
      { tu: 'Tỷ lệ lấp đầy', den: 'Đếm số đêm đã bán' },
      { tu: 'Doanh thu theo phòng', den: 'Gom doanh thu theo từng phòng' },
    ],
    ghiChu: [
      'Doanh thu tính từ phiếu thu đã đánh dấu ĐÃ THU, không lấy từ tổng tiền của đơn — đơn hoàn thành mà khách chưa trả thì chưa phải doanh thu.',
      'Tháng không có dữ liệu vẫn giữ cột 0 để biểu đồ không bị lệch trục thời gian.',
    ],
  },
}

/**
 * Dữ liệu 6 sơ đồ tuần tự (Hình 3.11 – 3.16).
 *
 * Số thứ tự thông điệp **không viết tay** — `veSequence` tự sinh theo chiều sâu lồng
 * nhau. Vì vậy ở đây chỉ cần đúng thứ tự các dòng và đúng cột nguồn/đích, không sợ
 * đánh số lệch với nhau khi thêm bước mới.
 *
 * `kieu: 'traVe'` = trả về (nét đứt). `tu === den` = gọi lại chính đối tượng đó.
 * `alt` khoá theo chỉ số trong `moc` — 0 là dòng đầu tiên.
 */
const sequences = {
  '3-11-sequence-dang-nhap': {
    ten: 'Đăng nhập',
    cot: [
      { ten: 'Khách', loai: 'nguoi' },
      { ten: 'AuthController' },
      { ten: 'AuthService' },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/auth/login (email, matKhau)' },
      { tu: 1, den: 2, nhan: 'DangNhapAsync(email, matKhau)' },
      { tu: 2, den: 2, nhan: 'Kiểm tra email có định dạng hợp lệ' },
      { tu: 2, den: 3, nhan: 'Users.Where(email)' },
      { tu: 3, den: 4, nhan: 'SELECT Id, FullName, PasswordHash, Role, Status FROM Users' },
      { tu: 4, den: 3, nhan: 'return 1 dòng hoặc rỗng', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'return User hoặc null', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'BCrypt.Verify(matKhau, PasswordHash)' },
      { tu: 2, den: 2, nhan: 'Kiểm tra Status = ACTIVE' },
      { tu: 2, den: 2, nhan: 'Tạo accessToken (15 phút) và refreshToken (7 ngày)' },
      { tu: 2, den: 2, nhan: 'Ghi lần đăng nhập vào nhật ký' },
      { tu: 2, den: 1, nhan: 'return TokenResponse', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK + token', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 7, den: 10, dieuKien: ['[bốn bước kiểm tra — một bước sai là ném AppException → 401]', '[cả bốn bước đúng thì đi tiếp tới tạo token]'] },
    ],
  },
  '3-12-sequence-tim-kiem-phong': {
    ten: 'Tìm kiếm phòng',
    cot: [
      { ten: 'Khách', loai: 'nguoi' },
      { ten: 'RoomsController' },
      { ten: 'RoomService' },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'GET /api/rooms/search?coSo&vaoLuc&raLuc&soKhach&page' },
      { tu: 1, den: 2, nhan: 'TimPhongAsync(bộ lọc, page, pageSize)' },
      { tu: 2, den: 3, nhan: 'Rooms JOIN Locations' },
      { tu: 3, den: 4, nhan: 'SELECT … WHERE trạng thái & thời gian & giá' },
      { tu: 4, den: 3, nhan: 'return danh sách dòng', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'return IQueryable<Phong>', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'Sắp xếp: giá ↑ hoặc điểm đánh giá ↓' },
      { tu: 2, den: 4, nhan: 'SELECT COUNT(*) để biết tổng số trang' },
      { tu: 4, den: 2, nhan: 'return tổng số bản ghi', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'Cắt trang: Skip((page-1)*size).Take(size)' },
      { tu: 2, den: 1, nhan: 'return PagedResult<RoomSearchDto>', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK — không kèm khoá Id', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 2, den: 10, dieuKien: ['[bộ lọc hợp lệ]', '[đếm tổng số rồi mới cắt trang]'] },
    ],
  },
  '3-13-sequence-dat-phong': {
    ten: 'Đặt phòng',
    cot: [
      { ten: 'Khách', loai: 'nguoi' },
      { ten: 'BookingsController' },
      { ten: 'BookingService' },
      { ten: 'RoomService' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/bookings' },
      { tu: 1, den: 2, nhan: 'TaoDonAsync(userId, yeuCau)' },
      { tu: 2, den: 4, nhan: 'BEGIN — mức SERIALIZABLE' },
      { tu: 2, den: 3, nhan: 'KiemTraTrongAsync(maPhong, vaoLuc, raLuc)' },
      { tu: 3, den: 4, nhan: 'SELECT EXISTS — đơn có chồng lịch không' },
      { tu: 4, den: 3, nhan: 'return true = còn trống', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'return isAvailable', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'Kiểm tra thời gian: ≥ 3 giờ nếu thuê theo giờ' },
      { tu: 2, den: 2, nhan: 'BookingCalculator.TinhTien(loại, giá giờ, giá ngày)' },
      { tu: 2, den: 2, nhan: 'Sinh mã đơn HS-yyMMdd-xxxx' },
      { tu: 2, den: 4, nhan: 'INSERT Bookings (PENDING)' },
      { tu: 2, den: 4, nhan: 'INSERT BookingStatusHistory' },
      { tu: 2, den: 4, nhan: 'UPDATE Rooms SET trangThai = BOOKED' },
      { tu: 4, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT' },
      { tu: 2, den: 1, nhan: 'return 201 Created + mã đơn', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 201 OK', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 4, den: 6, dieuKien: ['[phòng còn trống]', '[tiếp tục tạo đơn]'] },
      { ten: 'alt', tu: 7, den: 8, dieuKien: ['[lỗi bất kỳ: ROLLBACK rồi trả mã lỗi]', '[409 khi trùng lịch · 400 khi sai quy tắc · 404 khi không có phòng]'] },
    ],
  },
  '3-14-sequence-check-in-check-out': {
    ten: 'Check-in / Check-out kèm sinh thông báo và mở phiếu thu',
    cot: [
      { ten: 'Admin', loai: 'nguoi' },
      { ten: 'AdminBookingController' },
      { ten: 'AdminBookingService' },
      { ten: 'NotificationTemplates' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'PATCH /api/admin/bookings/{ma}/check-in' },
      { tu: 1, den: 2, nhan: 'CheckInAsync(maDon, adminId)' },
      { tu: 2, den: 4, nhan: 'BEGIN — mức SERIALIZABLE' },
      { tu: 2, den: 2, nhan: 'Kiểm tra đơn đang CONFIRMED' },
      { tu: 2, den: 4, nhan: 'UPDATE Bookings SET trangThai = CHECKED_IN' },
      { tu: 2, den: 4, nhan: 'UPDATE Rooms SET trangThai = OCCUPIED' },
      { tu: 2, den: 4, nhan: 'INSERT BookingStatusHistory' },
      { tu: 2, den: 3, nhan: 'Tao(don, CHECKED_IN)' },
      { tu: 3, den: 2, nhan: 'return tiêu đề + nội dung', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'INSERT Notifications (daDoc = 0)' },
      { tu: 4, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT' },
      { tu: 2, den: 1, nhan: 'return AdminBookingDto', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'PATCH /api/admin/bookings/{ma}/check-out' },
      { tu: 2, den: 4, nhan: 'UPDATE Bookings SET trangThai = COMPLETED' },
      { tu: 2, den: 4, nhan: 'UPDATE Rooms SET trangThai = CLEANING' },
      { tu: 2, den: 4, nhan: 'INSERT Payments (chờ thu, tiền mặt)' },
      { tu: 2, den: 3, nhan: 'Tao(don, COMPLETED)' },
      { tu: 2, den: 4, nhan: 'INSERT Notifications — báo mở phiếu thu' },
      { tu: 4, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT' },
      { tu: 2, den: 1, nhan: 'return AdminBookingDto', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK — khách thấy 1 thông báo + 1 phiếu thu', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 2, den: 10, dieuKien: ['[đơn đang CONFIRMED]', '[nhận phòng: đổi trạng thái, ghi lịch sử, sinh thông báo]'] },
      { ten: 'alt', tu: 14, den: 22, dieuKien: ['[đơn đang CHECKED_IN]', '[trả phòng: đổi trạng thái, MỞ PHIẾU THU rồi sinh thông báo]'] },
    ],
  },
  '3-15-sequence-quan-ly-phong': {
    ten: 'Quản lý phòng',
    cot: [
      { ten: 'Admin', loai: 'nguoi' },
      { ten: 'AdminRoomsController' },
      { ten: 'AdminRoomService' },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/admin/rooms' },
      { tu: 1, den: 2, nhan: 'TaoPhongAsync(yeuCau)' },
      { tu: 2, den: 2, nhan: 'Kiểm tra mã phòng chưa có trong cơ sở' },
      { tu: 2, den: 3, nhan: 'Rooms.Add(phong)' },
      { tu: 2, den: 3, nhan: 'RoomAmenities.Add(liên kết tiện nghi)' },
      { tu: 2, den: 3, nhan: 'RoomImages.Add(ảnh)' },
      { tu: 3, den: 4, nhan: 'INSERT Rooms, tiện nghi, ảnh' },
      { tu: 4, den: 3, nhan: 'return khoá mới', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'return số bản ghi', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'SaveChangesAsync()' },
      { tu: 4, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'return 201 Created', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'PATCH /api/admin/rooms/{id}/status' },
      { tu: 2, den: 4, nhan: 'UPDATE Rooms SET trangThai' },
      { tu: 4, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'return 200 OK', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'DELETE /api/admin/rooms/{id}' },
      { tu: 2, den: 4, nhan: 'Kiểm tra còn đơn chưa hoàn thành không' },
      { tu: 4, den: 2, nhan: 'return còn đơn hoặc không', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'return 200 OK hoặc 400 "còn đơn"', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 16, den: 18, dieuKien: ['[phòng còn đơn]', '[từ chối xoá, trả 400]'] },
    ],
  },
  '3-16-sequence-thanh-toan': {
    ten: 'Chọn phương thức thanh toán và xác nhận đã thu',
    cot: [
      { ten: 'Khách', loai: 'nguoi' },
      { ten: 'PaymentsController' },
      { ten: 'PaymentService' },
      { ten: 'Admin', loai: 'nguoi' },
      { ten: 'AdminPaymentsController' },
      { ten: 'AdminPaymentService' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'GET /api/payments/my' },
      { tu: 1, den: 2, nhan: 'LayCuaToiAsync(userId)' },
      { tu: 2, den: 6, nhan: 'SELECT Payments JOIN Bookings WHERE UserId' },
      { tu: 6, den: 2, nhan: 'return danh sách phiếu thu', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'return List<PaymentDto>', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK + tổng đã thanh toán', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'POST /api/payments/booking/{maDon}' },
      { tu: 1, den: 2, nhan: 'ChonPhuongThucAsync(userId, maDon, yeuCau)' },
      { tu: 2, den: 6, nhan: 'Đơn phải COMPLETED và thuộc đúng khách' },
      { tu: 6, den: 2, nhan: 'return phiếu thu hiện có', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'Kiểm tra phiếu chưa đánh dấu đã thu' },
      { tu: 2, den: 6, nhan: 'INSERT Payments hoặc UPDATE phuongThuc' },
      { tu: 6, den: 2, nhan: 'return OK', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'return PaymentDto', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: 'return 200 OK — ghi nhận lựa chọn của khách', kieu: 'traVe' },
      { tu: 3, den: 4, nhan: 'GET /api/admin/payments?trangThai&page' },
      { tu: 4, den: 5, nhan: 'LayDanhSachAsync(trangThai, page, pageSize)' },
      { tu: 5, den: 6, nhan: 'SELECT … phân trang' },
      { tu: 6, den: 5, nhan: 'return danh sách + tổng số trang', kieu: 'traVe' },
      { tu: 5, den: 4, nhan: 'return PagedResult<PaymentDto>', kieu: 'traVe' },
      { tu: 4, den: 3, nhan: 'return 200 OK — bảng phiếu thu', kieu: 'traVe' },
      { tu: 3, den: 4, nhan: 'PATCH /api/admin/payments/{id}/paid' },
      { tu: 4, den: 5, nhan: 'DanhDauDaThuAsync(id, phuongThuc, ghiChu)' },
      { tu: 5, den: 6, nhan: 'Đối chiếu số tiền với tổng tiền của đơn' },
      { tu: 6, den: 5, nhan: 'return khớp hoặc lệch', kieu: 'traVe' },
      { tu: 5, den: 4, nhan: 'return 400 "số tiền không khớp đơn"', kieu: 'traVe' },
      { tu: 5, den: 6, nhan: 'UPDATE Payments SET trangThai = DA_THU, thoiDiemThu' },
      { tu: 6, den: 5, nhan: 'return OK', kieu: 'traVe' },
      { tu: 5, den: 4, nhan: 'return PaymentDto', kieu: 'traVe' },
      { tu: 4, den: 3, nhan: 'return 200 OK — doanh thu tăng tương ứng', kieu: 'traVe' },
    ],
    alt: [
      { ten: 'alt', tu: 23, den: 25, dieuKien: ['[số tiền không khớp tổng tiền của đơn]', '[trả 400, không ghi nhận đã thu]'] },
    ],
  },
}
const erd = {
  ten: 'Sơ đồ quan hệ thực thể (ERD) — 11 bảng',
  bang: [
    { ten: 'Users', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'FullName', kieu: 'nvarchar' }, { ten: 'Email', kieu: 'nvarchar' }, { ten: 'PasswordHash', kieu: 'nvarchar' }, { ten: 'Role', kieu: 'enum' }, { ten: 'Status', kieu: 'enum' }] },
    { ten: 'Locations', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'Name', kieu: 'nvarchar' }, { ten: 'Address', kieu: 'nvarchar' }, { ten: 'IsActive', kieu: 'bool' }] },
    { ten: 'Rooms', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'LocationId', kieu: 'int', fk: true, cha: 'Locations' }, { ten: 'RoomNumber', kieu: 'nvarchar' }, { ten: 'Name', kieu: 'nvarchar' }, { ten: 'PricePerHour', kieu: 'decimal' }, { ten: 'PricePerDay', kieu: 'decimal' }, { ten: 'Status', kieu: 'enum' }] },
    { ten: 'Amenities', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'Name', kieu: 'nvarchar' }, { ten: 'Icon', kieu: 'nvarchar' }] },
    { ten: 'RoomAmenities', cot: [{ ten: 'RoomId', kieu: 'int', pk: true, fk: true, cha: 'Rooms' }, { ten: 'AmenityId', kieu: 'int', pk: true, fk: true, cha: 'Amenities' }] },
    { ten: 'Bookings', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'Code', kieu: 'char(20)' }, { ten: 'UserId', kieu: 'int', fk: true, cha: 'Users' }, { ten: 'RoomId', kieu: 'int', fk: true, cha: 'Rooms' }, { ten: 'BookingType', kieu: 'enum' }, { ten: 'Status', kieu: 'enum' }, { ten: 'CheckIn', kieu: 'datetime' }, { ten: 'CheckOut', kieu: 'datetime' }, { ten: 'TotalAmount', kieu: 'decimal' }] },
    { ten: 'BookingStatusHistory', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'BookingId', kieu: 'int', fk: true, cha: 'Bookings' }, { ten: 'FromStatus', kieu: 'enum' }, { ten: 'ToStatus', kieu: 'enum' }, { ten: 'ChangedByUserId', kieu: 'int', fk: true, cha: 'Users' }, { ten: 'ChangedAt', kieu: 'datetime' }] },
    { ten: 'Reviews', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'BookingId', kieu: 'int', fk: true, cha: 'Bookings' }, { ten: 'Rating', kieu: 'tinyint' }, { ten: 'Comment', kieu: 'nvarchar' }, { ten: 'IsHidden', kieu: 'bool' }] },
    { ten: 'Payments', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'BookingId', kieu: 'int', fk: true, cha: 'Bookings' }, { ten: 'Amount', kieu: 'decimal' }, { ten: 'Method', kieu: 'enum' }, { ten: 'Status', kieu: 'enum' }, { ten: 'PaidAt', kieu: 'datetime' }] },
    { ten: 'Notifications', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'UserId', kieu: 'int', fk: true, cha: 'Users' }, { ten: 'Title', kieu: 'nvarchar(200)' }, { ten: 'IsRead', kieu: 'bool' }, { ten: 'CreatedAt', kieu: 'datetime' }] },
    { ten: 'RoomImages', cot: [{ ten: 'Id', kieu: 'int', pk: true }, { ten: 'RoomId', kieu: 'int', fk: true, cha: 'Rooms' }, { ten: 'ImageUrl', kieu: 'nvarchar' }, { ten: 'IsPrimary', kieu: 'bool' }] },
  ],
}

/* ------------------------------------------------------------------- ghi file */

const tatCa = [
  ...Object.entries(useCases).map(([ten, d]) => [ten, veUseCase(d)]),
  ['3-09-bieu-do-lop-thuc-thi', veLopThucThi()],
  ['3-10-so-do-erd', veErd(erd)],
  ...Object.entries(sequences).map(([ten, d]) => [ten, veSequence(d)]),
]

for (const [ten, noiDungSvg] of tatCa) {
  const duongDan = join(noiDung, `${ten}.svg`)
  writeFileSync(duongDan, noiDungSvg, 'utf8')
  console.log(`  ${ten}.svg  (${(noiDungSvg.length / 1024).toFixed(1)} KB)`)
}
console.log(`\nTổng: ${tatCa.length} sơ đồ → docs/anh/so-do/`)

/* ------------------------------------------------------- trang xem nhanh */

/**
 * Trang HTML xem tất cả sơ đồ trong một trang, phục vụ xem nhanh khi cần.
 *
 * Tên hiển thị lấy từ chính nội dung sơ đồ chứ không viết thêm một bảng tên ở đây.
 * Lý do: có bảng tên riêng nghĩa là thêm sơ đồ phải sửa hai chỗ, quên một chỗ là
 * tiêu đề lệch với hình. Lấy tiêu đề nằm trong file SVG thì không thể lệch.
 */
function veTrangXem(tatCa) {
  const the = tatCa
    .map(([ten, svg]) => {
      const tieuDe = svg.match(/<title>([^<]+)<\/title>/)?.[1] ?? ten
      const soHinh = ten.match(/^3-(\d\d)-/)?.[1] ?? '00'
      // KHÔNG gọi `esc` lần nữa: giá trị đọc ra từ `<title>` đã được escape sẽ trong
      // SVG, chạy `esc` lần hai làm `Tìm kiếm & đặt phòng` thành `&amp;amp;` — tức là
      // trên trang hiện đúng chữ `&amp;` cho người đọc.
      return `  <figure>
    <img src="../${ten}.png" alt="${tieuDe}" loading="lazy">
    <figcaption><b>Hình 3.${Number(soHinh)}</b> — ${tieuDe}<br><code>${ten}.svg</code> → <code>${ten}.png</code></figcaption>
  </figure>`
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="utf-8">
<title>Sơ đồ HomeStay — Hình 3.1 đến 3.${tatCa.length}</title>
<style>
  body { margin: 0; padding: 28px; background: #f8fafc; color: #1f2937;
         font-family: 'Segoe UI', 'Noto Sans', Arial, sans-serif; }
  h1 { margin: 0 0 4px; font-size: 24px; }
  p.hu { margin: 0 0 24px; color: #6b7280; font-size: 14px; }
  .luoi { display: grid; gap: 26px; grid-template-columns: repeat(auto-fit, minmax(520px, 1fr)); }
  figure { margin: 0; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 12px; }
  img { width: 100%; height: auto; display: block; border-radius: 4px; }
  figcaption { margin-top: 10px; font-size: 13px; color: #374151; }
  code { font-size: 12px; color: #6b7280; }
</style>
</head>
<body>
<h1>Sơ đồ hệ thống HomeStay — ${tatCa.length} hình</h1>
<p class="hu">Sinh tự động từ <code>docs/anh/ve-so-do.mjs</code>. Bấm vào ảnh để xem kích thước thật.</p>
<div class="luoi">
${the}
</div>
</body>
</html>
`
}

writeFileSync(join(noiDung, 'index.html'), veTrangXem(tatCa), 'utf8')
console.log('Trang xem: docs/anh/so-do/index.html')
