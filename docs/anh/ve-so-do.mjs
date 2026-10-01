/**
 * Sinh 18 sơ đồ cho Chương 3 (Hình 3.1 – 3.18) dưới dạng SVG.
 *
 * Vì sao tự sinh bằng script thay vì vẽ tay:
 * - Nội dung sơ đồ lấy từ **code thật** của dự án (endpoint, entity, luồng nghiệp vụ),
 *   nên phải cập nhật được khi code đổi. Vẽ tay thì không.
 * - 18 hình cùng một bộ quy ước (màu, cỡ chữ, bo góc) — sinh bằng script thì đồng bộ,
 *   vẽ tay thì mỗi hình lệch nhau một chút.
 *
 * Cách dùng:
 *   node docs/anh/ve-so-do.mjs        → ghi 18 file .svg vào docs/anh/so-do/
 *
 * Ảnh .jpg cho báo cáo được chụp từ chính các file .svg này (xem docs/anh/README.md).
 *
 * Thứ tự đánh số Hình trong báo cáo:
 *   3.1 biểu đồ tác nhân · 3.2 – 3.9 use case · 3.10 kiến trúc
 *   3.11 lớp thực thi · 3.12 ERD · 3.13 – 3.18 tuần tự
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

/** Bọc nội dung thành file SVG hoàn chỉnh. */
function svg(rong, cao, thanh, noiDung) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${rong}" height="${cao}" viewBox="0 0 ${rong} ${cao}" font-family="${CHU}">
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
function veUseCase(d) {
  const cot = 3
  const ucRong = 250
  const ucCao = 62
  const khoangX = 30
  const khoangY = 22
  const khungX = 250
  const khungY = 60
  const benRong = 230 // chừa chỗ cho tác nhân bên phải
  const soHang = Math.ceil(d.uc.length / cot)
  const khungRong = cot * ucRong + (cot - 1) * khoangX + 60
  const khungCao = soHang * ucCao + (soHang - 1) * khoangY + 70
  // Chiều rộng phải tính từ nội dung, không đặt cứng — nếu không khung sẽ tràn và
  // cắt mất cột cuối cùng.
  const W = khungX + khungRong + benRong
  const H = khungY + khungCao + 40 + (d.ghiChu?.length ?? 0) * 18
  const cxKhung = khungX + khungRong / 2

  let s = ''
  s += `<rect x="${khungX}" y="${khungY}" width="${khungRong}" height="${khungCao}" rx="10" fill="${MAU.heThong}" stroke="${MAU.heThongBien}" stroke-width="1.5"/>`
  s += chu(cxKhung, khungY + 28, d.ten, { size: 15, dam: 700, mau: MAU.heThongBien })

  const ucCua = (ten) => {
    const i = d.uc.indexOf(ten)
    if (i < 0) return null
    const c = i % cot
    const r = Math.floor(i / cot)
    return {
      x: khungX + 30 + ucRong / 2 + c * (ucRong + khoangX),
      y: khungY + 60 + ucCao / 2 + r * (ucCao + khoangY),
    }
  }
  const viTriNhan = (i) => {
    const c = i % cot
    const r = Math.floor(i / cot)
    return {
      x: khungX + 30 + ucRong / 2 + c * (ucRong + khoangX),
      y: khungY + 60 + ucCao / 2 + r * (ucCao + khoangY),
    }
  }

  // 1) Vẽ nét nối TRƯỚC. Bầu dục có nền trắng sẽ che các đoạn nét chạy qua, nhờ vậy
  // không có nét nào cắt ngang chữ trong bầu dục.
  const benTrai = d.tacNhan.filter((t) => t.viTri === 'trai')
  const benPhai = d.tacNhan.filter((t) => t.viTri !== 'trai')
  const noiToc = (t, ben) => {
    const y = khungY + khungCao / 2 - ((ben.length - 1) * 90) / 2 + ben.indexOf(t) * 90
    const xTac = ben === benTrai ? khungX - 100 : khungX + khungRong + 100
    // `mayTinh` vẽ hộp rộng 92 nên phải neo nét từ mép hộp, không neo từ tâm như
    // hình người (bán kính ~18) — nếu không nét sẽ bắt đầu bên trong hộp.
    const banKinh = t.loai === 'may' ? 46 : 18
    let noiDung = t.loai === 'may' ? mayTinh(xTac, y, t.ten) : nguoi(xTac, y, t.ten)
    for (const u of t.dung) {
      const p = ucCua(u)
      if (!p) continue
      const dich = ben === benTrai ? p.x - ucRong / 2 + 6 : p.x + ucRong / 2 - 6
      noiDung += duong(xTac + (ben === benTrai ? banKinh : -banKinh), y - 20, dich, p.y, { rong: 1.1 })
    }
    return noiDung
  }
  for (const t of benTrai) s += noiToc(t, benTrai)
  for (const t of benPhai) s += noiToc(t, benPhai)

  // 2) Vẽ bầu dục use case đè lên nét nối
  d.uc.forEach((u, i) => {
    const p = viTriNhan(i)
    s += bauDuc(p.x, p.y, ucRong / 2, ucCao / 2, u, { fill: '#ffffff', bien: MAU.heThongBien })
  })

  // Chú thích xếp chồng theo dòng, tính từ đáy hình lên để không đè lên khung.
  ;(d.ghiChu ?? []).forEach((g, i) => {
    s += chu(30, H - 20 - ((d.ghiChu?.length ?? 1) - 1 - i) * 18, g, {
      size: 11,
      an: 'start',
      mau: MAU.chuNho,
    })
  })
  return svg(W, H, '', s)
}

/* ----------------------------------------------- sơ đồ dùng chung: sequence */

/**
 * Sơ đồ tuần tự: các cột tham gia + đường đời + mũi tên thông điệp.
 * @param {{ten:string, cot:Array<{ten:string, he?:boolean}>, moc:Array}} d
 *        `moc` = {tu, den, nhan, kieu?:'goi'|'traVe'|'tha'} — chỉ số cột (0..n-1)
 */
function veSequence(d) {
  const cotRong = 190
  const x0 = cotRong / 2 + 20
  // 100 px hở bên phải: hộp tên rộng 164 nằm giữa cột, hẹp hơn sẽ bị cắt.
  const W = x0 + (d.cot.length - 1) * cotRong + 100
  const dau = 60
  const buoc = 56
  const H = dau + d.moc.length * buoc + 70
  const cx = (i) => x0 + i * cotRong

  let s = ''
  // Đầu cột: hộp tên + đường đời đứt đoạn
  d.cot.forEach((c, i) => {
    s += hop(cx(i) - 82, 14, 164, 34, c.ten, {
      fill: c.he ? MAU.vung : MAU.heThong,
      bien: c.he ? MAU.vungBien : MAU.heThongBien,
      size: 12,
      dam: 600,
    })
    s += duong(cx(i), 48, cx(i), H - 40, { mau: '#9ca3af', rong: 1.1, gach: '5 4' })
  })

  d.moc.forEach((m, i) => {
    const y = dau + 30 + i * buoc
    // `tu` / `den` là CHỈ SỐ CỘT, phải đổi sang toạ độ x qua `cx()`.
    const x1 = cx(m.tu)
    const x2 = cx(m.den)
    s += m.tho ? duong(x1, y, x2, y, { gach: '4 3' }) : muiTen(x1, y, x2, y, { nhan: m.nhan })
  })

  s += chu(20, H - 16, d.ten, { size: 13, an: 'start', dam: 600 })
  return svg(W, H, '', s)
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
  return svg(W, H, '', s)
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
  return svg(W, H, '', s)
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

  return svg(W, H, '', s)
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
function veLopThucThi() {
  const W = 1240
  const cotX = [40, 330, 720]
  const cotRong = [240, 260, 260]
  const kheY = 34
  const yDau = 62

  // Mỗi lớp: tên, thành viên, phương thức. Thứ tự trong mảng là thứ tự vẽ.
  const dinhNghia = [
    [
      ['AuthService', ['IAuthService'], ['DangNhapAsync(email, matKhau)']],
      ['RoomService', ['IRoomService'], ['KiemTraTrongAsync(req)', 'TimPhongAsync(bộ lọc)']],
      ['BookingService', ['IBookingService'], ['TaoDonAsync(userId, req)', 'HuyDonAsync(userId, code)']],
      ['PaymentService', ['IPaymentService'], ['ChonPhuongThucAsync(userId, code, req)', 'LayTheoDonAsync(userId, code)']],
      ['NotificationService', ['INotificationService'], ['LayDanhSachAsync(userId)', 'DanhDauDaDocAsync(id, userId)']],
    ],
    [
      ['BookingCalculator', ['(hàm tĩnh)'], ['TinhTien(loai, giaGio, giaNgay, vao, ra)']],
      ['BookingStateMachine', ['(hàm tĩnh)'], ['CoTheChuyen(from, to)', 'LaTrangThaiKetThuc(s)']],
      ['HomeStayDbContext', ['DbSet<Bookings>', 'DbSet<Payments>', '… 11 bảng'], ['SaveChangesAsync()']],
      ['PaymentRules', ['(hằng số)'], ['SoTienToiDa', 'PhuongThucChoPhep']],
      ['NotificationRules', ['(hằng số)'], ['DoDaiTieuDeToiDa', 'SoToiDaMoiTrang']],
      ['NotificationTemplates', ['(hàm tĩnh)'], ['Tao(don, trangThai, lyDo)', '→ tiêu đề + nội dung']],
      ['AppException', ['StatusCode', 'Message'], ['→ ExceptionMiddleware trả JSON thống nhất']],
    ],
    [
      ['BookingController', ['IBookingService'], ['POST /api/bookings', 'GET /api/bookings/my']],
      ['AdminBookingController', ['IAdminBookingService'], ['PATCH …/confirm · …/reject', 'PATCH …/check-in · …/check-out']],
      ['PaymentsController', ['IPaymentService'], ['GET /api/payments/my', 'POST /api/payments/booking/{code}']],
      ['AdminPaymentsController', ['IAdminPaymentService'], ['GET /api/admin/payments', 'PATCH …/{id}/paid · …/failed']],
      ['NotificationsController', ['INotificationService'], ['GET /api/notifications/my', 'PATCH …/{id}/read']],
    ],
  ]

  // Quan hệ "dùng" (composition): nguồn dùng đích.
  const quanHe = [
    ['BookingService', 'BookingCalculator'],
    ['BookingService', 'BookingStateMachine'],
    ['BookingService', 'HomeStayDbContext'],
    ['RoomService', 'HomeStayDbContext'],
    ['PaymentService', 'HomeStayDbContext'],
    ['NotificationService', 'HomeStayDbContext'],
    ['NotificationService', 'NotificationRules'],
    ['BookingController', 'BookingService'],
    ['AdminBookingController', 'BookingStateMachine'],
    ['PaymentsController', 'PaymentService'],
    ['AdminPaymentsController', 'HomeStayDbContext'],
    ['NotificationsController', 'NotificationService'],
    ['PaymentService', 'PaymentRules'],
    ['BookingController', 'AppException'],
    ['NotificationsController', 'AppException'],
    ['AdminPaymentsController', 'AppException'],
  ]

  /* --- 1) Tính vị trí từng hộp, không vẽ vội: cần biết mép trước khi nối nét. --- */
  const hop = new Map()
  let yMax = yDau
  dinhNghia.forEach((cot, ci) => {
    let y = yDau
    for (const [ten, tv, ph] of cot) {
      const h = caoLop(tv.length, ph.length)
      hop.set(ten, { x: cotX[ci], y, w: cotRong[ci], h, tam: y + h / 2 })
      y += h + kheY
    }
    yMax = Math.max(yMax, y - kheY)
  })
  const H = yMax + 44

  /* --- 2) Nét nối: neo ở MÉP hộp, không phải tâm, để không mọc ra từ giữa chữ. --- */
  const neo = (tu, den) => {
    const a = hop.get(tu)
    const b = hop.get(den)
    if (!a || !b) return ''
    const sangPhai = b.x > a.x
    const x1 = sangPhai ? a.x + a.w : a.x
    const x2 = sangPhai ? b.x : b.x + b.w
    return duoyDep(x1, a.tam, x2, b.tam)
  }

  let s = chu(W / 2, 30, 'Biểu đồ lớp thực thi (rút gọn)', { size: 16, dam: 700 })

  // Nét vẽ TRƯỚC: hộp có nền trắng sẽ che đoạn nét chạy qua, nhờ vậy không nét nào
  // cắt ngang chữ bên trong hộp.
  s += quanHe.map(([a, b]) => neo(a, b)).join('\n')

  /* --- 3) Vẽ hộp. --- */
  for (const [ten, tv, ph] of dinhNghia.flat()) {
    const b = hop.get(ten)
    s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="6" fill="#ffffff" stroke="${MAU.vungBien}" stroke-width="1.5"/>`
    s += `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="26" rx="6" fill="${MAU.vung}"/>`
    s += `<rect x="${b.x}" y="${b.y + 16}" width="${b.w}" height="10" fill="${MAU.vung}"/>`
    s += chu(b.x + b.w / 2, b.y + 18, ten, { size: 12, dam: 700, mau: MAU.vungBien })
    tv.forEach((v, i) => s += chu(b.x + 10, b.y + 42 + i * 15, v, { size: 10.5, an: 'start', mau: MAU.chuNho }))
    const y2 = b.y + 42 + tv.length * 15
    s += `<line x1="${b.x}" y1="${y2}" x2="${b.x + b.w}" y2="${y2}" stroke="${MAU.vungBien}" stroke-width="0.8"/>`
    ph.forEach((v, i) => s += chu(b.x + 10, y2 + 16 + i * 15, v, { size: 10.5, an: 'start', mau: MAU.chu }))
  }

  s += chu(20, H - 14, 'Đường đứt = quan hệ "dùng" (composition). Controller chỉ nhận dữ liệu và trả response, mọi quy tắc nghiệp vụ nằm ở Service.', {
    size: 11,
    an: 'start',
    mau: MAU.chuNho,
  })
  return svg(W, H, '', s)
}


function duoyDep(x1, y1, x2, y2, rong = 1.1) {
  const duongTam = x1 + (x2 - x1) / 2
  return `<path d="M ${x1} ${y1} C ${duongTam} ${y1}, ${duongTam} ${y2}, ${x2} ${y2}" fill="none" stroke="${MAU.chuNho}" stroke-width="${rong}" stroke-dasharray="4 3"/>`
}

/* ------------------------------------------------------------------ dữ liệu */

const useCases = {
  '3-02-use-case-tong-quat': {
    ten: 'Hệ thống HomeStay',
    tacNhan: [
      { ten: 'Khách', viTri: 'trai', dung: ['Xem địa điểm', 'Tìm kiếm phòng', 'Xem chi tiết phòng', 'Đặt phòng', 'Huỷ đơn', 'Xem đơn của tôi', 'Đánh giá phòng', 'Xem thanh toán', 'Chọn phương thức thanh toán', 'Xem thông báo', 'Quản lý hồ sơ'] },
      { ten: 'Admin', viTri: 'phai', dung: ['Thống kê doanh thu', 'Quản lý đơn đặt phòng', 'Quản lý phòng', 'Quản lý cơ sở', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khách hàng'] },
    ],
    uc: [
      'Xem địa điểm', 'Tìm kiếm phòng', 'Xem chi tiết phòng', 'Đặt phòng',
      'Huỷ đơn', 'Xem đơn của tôi', 'Đánh giá phòng', 'Xem thanh toán',
      'Chọn phương thức thanh toán', 'Xem thông báo', 'Quản lý hồ sơ',
      'Thống kê doanh thu', 'Quản lý đơn đặt phòng', 'Quản lý phòng',
      'Quản lý cơ sở', 'Quản lý thanh toán', 'Quản lý đánh giá', 'Quản lý khách hàng',
    ],
    ghiChu: ['Hai tác nhân duy nhất của hệ thống: Khách (CUSTOMER) và Admin (ADMIN).',
      'Mọi chức năng vận hành — xác nhận đơn, check-in, check-out, đổi trạng thái phòng, xác nhận đã thu tiền — thuộc Admin.',
      'Hệ thống chỉ ghi nhận phương thức thanh toán, KHÔNG nối API cổng thanh toán; thông báo chỉ hiển thị trong hệ thống, không gửi email/SMS.'],
  },
  '3-03-use-case-quan-ly-tai-khoan': {
    ten: 'Quản lý tài khoản',
    tacNhan: [
      { ten: 'Khách', viTri: 'trai', dung: ['Đăng ký tài khoản', 'Đăng nhập', 'Xem hồ sơ', 'Đổi mật khẩu', 'Đăng xuất'] },
      { ten: 'Admin', viTri: 'phai', dung: ['Khoá / mở khoá tài khoản'] },
    ],
    uc: ['Đăng ký tài khoản', 'Đăng nhập', 'Xem hồ sơ', 'Cập nhật hồ sơ', 'Đổi mật khẩu', 'Đăng xuất', 'Khoá / mở khoá tài khoản'],
    ghiChu: ['Đăng ký không cho tự chọn quyền — mọi tài khoản tự đăng ký đều là CUSTOMER.',
      'Mật khẩu lưu dạng BCrypt hash, không bao giờ lưu dạng thô.'],
  },
  '3-04-use-case-tim-kiem-va-dat-phong': {
    ten: 'Tìm kiếm & đặt phòng',
    tacNhan: [{ ten: 'Khách', viTri: 'trai', dung: ['Chọn địa điểm', 'Đặt nhu cầu lọc', 'Xem kết quả tìm kiếm', 'Chọn phòng', 'Đặt phòng'] }],
    uc: ['Chọn địa điểm', 'Đặt nhu cầu lọc', 'Xem kết quả tìm kiếm', 'Chọn phòng', 'Kiểm tra phòng trống', 'Đặt phòng theo giờ', 'Đặt phòng theo ngày', 'Nhận mã đơn'],
    ghiChu: ['Quy tắc nghiệp vụ: đặt theo giờ tối thiểu 3 giờ; đặt theo ngày nhận phòng 14:00, trả phòng 12:00 hôm sau; phải đặt trước ít nhất 2 giờ.'],
  },
  '3-05-use-case-quan-ly-dat-phong': {
    ten: 'Quản lý đặt phòng',
    tacNhan: [
      { ten: 'Khách', viTri: 'trai', dung: ['Xem đơn của tôi', 'Lọc đơn theo trạng thái', 'Xem chi tiết & lịch sử đơn', 'Huỷ đơn', 'Đánh giá sau khi hoàn thành'] },
      { ten: 'Admin', viTri: 'phai', dung: ['Xem danh sách đơn', 'Lọc & tìm đơn', 'Xác nhận đơn', 'Từ chối đơn', 'Check-in', 'Check-out'] },
    ],
    uc: ['Xem danh sách đơn', 'Lọc & tìm đơn', 'Xem đơn của tôi', 'Lọc đơn theo trạng thái', 'Xem chi tiết & lịch sử đơn', 'Xác nhận đơn', 'Từ chối đơn', 'Huỷ đơn', 'Check-in', 'Check-out', 'Đánh giá sau khi hoàn thành'],
    ghiChu: ['Vòng đời đơn: PENDING → CONFIRMED → CHECKED_IN → COMPLETED; nhánh phụ CANCELLED (khách huỷ) và REJECTED (Admin từ chối).',
      'Mỗi lần đổi trạng thái đều ghi thêm một dòng vào bảng lịch sử, kèm người thực hiện và thời điểm.',
      'Khi đơn chuyển sang COMPLETED, hệ thống mở phiếu thu và sinh thông báo cho khách — xem Hình 3.7 và 3.8.'],
  },
  '3-06-use-case-quan-ly-phong': {
    ten: 'Quản lý phòng',
    tacNhan: [
      { ten: 'Admin', viTri: 'phai', dung: ['Thêm phòng', 'Sửa phòng', 'Đổi trạng thái phòng', 'Xoá phòng', 'Gán tiện nghi', 'Quản lý cơ sở'] },
    ],
    uc: ['Thêm phòng', 'Sửa phòng', 'Đổi trạng thái phòng', 'Xoá phòng', 'Gán tiện nghi', 'Quản lý cơ sở'],
    ghiChu: ['Năm trạng thái phòng: AVAILABLE, BOOKED, OCCUPIED, CLEANING, MAINTENANCE.',
      'Sau check-out, phòng chuyển sang CLEANING; job nền tự đưa về AVAILABLE sau 2 giờ. Không xoá được phòng đang có đơn.'],
  },
  '3-07-use-case-thanh-toan': {
    ten: 'Thanh toán',
    tacNhan: [
      { ten: 'Khách', viTri: 'trai', dung: ['Xem lịch sử thanh toán', 'Chọn phương thức thanh toán'] },
      { ten: 'Admin', viTri: 'phai', dung: ['Lọc theo trạng thái', 'Xác nhận đã thu tiền', 'Đánh dấu thất bại'] },
    ],
    uc: ['Xem lịch sử thanh toán', 'Chọn phương thức thanh toán', 'Lọc phiếu thu theo trạng thái', 'Xác nhận đã thu tiền', 'Đánh dấu thanh toán thất bại'],
    ghiChu: ['Ranh giới đã chốt: hệ thống chỉ GHI NHẬN phương thức khách chọn, không nối API cổng thanh toán nào. Không có màn hình quét mã hay trang cổng.',
      'Ba trạng thái phiếu thu: chờ thanh toán, đã thanh toán, thanh toán thất bại.',
      'Phiếu thu mở khi đơn chuyển COMPLETED, không phải lúc khách đặt — khách chưa trả tiền thì chưa có giao dịch.',
      'Một đơn có đúng một phiếu thu (ràng buộc UNIQUE trên BookingId); thu hai lần sẽ bị từ chối với mã 409.'],
  },
  '3-08-use-case-thong-bao': {
    ten: 'Thông báo',
    tacNhan: [
      { ten: 'Hệ thống', viTri: 'trai', loai: 'may', dung: ['Sinh thông báo khi đổi trạng thái đơn'] },
      { ten: 'Khách', viTri: 'phai', dung: ['Xem thông báo', 'Đánh dấu đã đọc', 'Đánh dấu đã đọc tất cả'] },
    ],
    uc: ['Sinh thông báo khi đổi trạng thái đơn', 'Xem thông báo', 'Đánh dấu đã đọc', 'Đánh dấu đã đọc tất cả'],
    ghiChu: ['Thông báo CHỈ hiển thị trong hệ thống (in-app), không gửi email/SMS — không có dịch vụ gửi tin nào trong dự án.',
      'Sinh thông báo cho 4 sự kiện: đơn được xác nhận, nhận phòng, trả phòng, bị từ chối (kèm lý do).',
      'Mỗi thông báo luôn chứa mã đơn để khách tra cứu được ngay.',
      'Khách tự huỷ đơn thì không sinh thông báo — chính họ biết, gửi thêm chỉ làm nhiễu.'],
  },
  '3-09-use-case-quan-tri-he-thong': {
    ten: 'Quản trị hệ thống',
    tacNhan: [
      { ten: 'Admin', viTri: 'phai', dung: ['Xem thống kê', 'Doanh thu theo tháng', 'Tỷ lệ lấp đầy', 'Doanh thu theo phòng', 'Ẩn / hiện đánh giá', 'Khoá khách hàng'] },
    ],
    uc: ['Xem thống kê', 'Doanh thu theo tháng', 'Số đơn theo tháng', 'Tỷ lệ lấp đầy', 'Trạng thái phòng', 'Doanh thu theo phòng', 'Ẩn / hiện đánh giá', 'Xoá đánh giá', 'Khoá khách hàng'],
    ghiChu: ['Doanh thu tính từ phiếu thu đã đánh dấu ĐÃ THU, không lấy từ tổng tiền của đơn — đơn hoàn thành mà khách chưa trả thì chưa phải doanh thu.',
      'Tháng không có dữ liệu vẫn giữ cột 0 để biểu đồ không bị lệch trục thời gian.'],
  },
}

const sequences = {
  '3-13-sequence-dang-nhap': {
    ten: 'Đăng nhập',
    cot: [
      { ten: 'Khách' },
      { ten: 'AuthController', he: true },
      { ten: 'AuthService', he: true },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/auth/login' },
      { tu: 1, den: 2, nhan: 'DangNhapAsync(email, matKhau)' },
      { tu: 2, den: 3, nhan: 'Tìm User theo email' },
      { tu: 3, den: 4, nhan: 'SELECT … FROM Users' },
      { tu: 4, den: 3, nhan: '1 dòng + PasswordHash', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'User', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'BCrypt.Verify(mật khẩu, hash)', tho: true },
      { tu: 2, den: 1, nhan: 'TokenResponse', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: '200 OK + accessToken', kieu: 'traVe' },
    ],
  },
  '3-14-sequence-tim-kiem-phong': {
    ten: 'Tìm kiếm phòng',
    cot: [
      { ten: 'Khách' },
      { ten: 'RoomsController' },
      { ten: 'RoomService', he: true },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'GET /api/rooms/search?bộ lọc' },
      { tu: 1, den: 2, nhan: 'TimPhongAsync(bộ lọc, page, pageSize)' },
      { tu: 2, den: 3, nhan: 'Rooms JOIN Locations' },
      { tu: 3, den: 4, nhan: 'SELECT … WHERE … ORDER BY … LIMIT/OFFSET' },
      { tu: 4, den: 3, nhan: 'items + tổng số', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'Danh sách phòng', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'PagedResult<RoomSearchDto>', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: '200 OK — không kèm Id', kieu: 'traVe' },
    ],
  },
  '3-15-sequence-dat-phong': {
    ten: 'Đặt phòng',
    cot: [
      { ten: 'Khách' },
      { ten: 'BookingsController' },
      { ten: 'BookingService', he: true },
      { ten: 'RoomService', he: true },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/bookings' },
      { tu: 1, den: 2, nhan: 'TaoDonAsync(userId, req)' },
      { tu: 2, den: 4, nhan: 'BEGIN — mức SERIALIZABLE', tho: true },
      { tu: 2, den: 3, nhan: 'KiemTraTrongAsync()' },
      { tu: 3, den: 4, nhan: 'SELECT EXISTS — đơn có chồng lịch không' },
      { tu: 4, den: 3, nhan: 'false = còn trống', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'isAvailable = true', kieu: 'traVe' },
      { tu: 2, den: 2, nhan: 'Tính tiền + sinh mã HS-yyMMdd-xxxx', tho: true },
      { tu: 2, den: 4, nhan: 'INSERT Bookings + BookingStatusHistory' },
      { tu: 4, den: 2, nhan: 'OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT', tho: true },
      { tu: 2, den: 1, nhan: '201 Created + mã đơn', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: '201 OK', kieu: 'traVe' },
    ],
  },
  '3-16-sequence-check-in-check-out': {
    ten: 'Check-in / Check-out (kèm sinh thông báo và mở phiếu thu)',
    cot: [
      { ten: 'Admin' },
      { ten: 'AdminBookingController' },
      { ten: 'AdminBookingService', he: true },
      { ten: 'NotificationTemplates', he: true },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'PATCH /api/admin/bookings/{code}/check-in' },
      { tu: 1, den: 2, nhan: 'CheckInAsync(code, adminId)' },
      { tu: 2, den: 4, nhan: 'BEGIN — mức SERIALIZABLE', tho: true },
      { tu: 2, den: 2, nhan: 'Kiểm tra trạng thái đúng CONFIRMED', tho: true },
      { tu: 2, den: 4, nhan: 'UPDATE Bookings (CHECKED_IN) + Rooms (OCCUPIED) + lịch sử', tho: true },
      { tu: 2, den: 3, nhan: 'Tao(don, CHECKED_IN) → tiêu đề + nội dung', tho: true },
      { tu: 2, den: 4, nhan: 'INSERT Notifications (IsRead = 0)', tho: true },
      { tu: 4, den: 2, nhan: 'OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT', tho: true },
      { tu: 2, den: 1, nhan: 'AdminBookingDto', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'PATCH …/check-out' },
      { tu: 2, den: 4, nhan: 'UPDATE Bookings (COMPLETED) + Rooms (CLEANING)', tho: true },
      { tu: 2, den: 4, nhan: 'INSERT Payments (chờ thu, tiền mặt)', tho: true },
      { tu: 2, den: 3, nhan: 'Tao(don, COMPLETED)', tho: true },
      { tu: 2, den: 4, nhan: 'INSERT Notifications — mở phiếu thu', tho: true },
      { tu: 4, den: 2, nhan: 'OK', kieu: 'traVe' },
      { tu: 2, den: 4, nhan: 'COMMIT', tho: true },
      { tu: 1, den: 0, nhan: '200 OK — khách thấy 1 thông báo + 1 phiếu thu', kieu: 'traVe' },
    ],
  },
  '3-17-sequence-quan-ly-phong': {
    ten: 'Quản lý phòng',
    cot: [
      { ten: 'Admin' },
      { ten: 'AdminRoomsController' },
      { ten: 'AdminRoomService', he: true },
      { ten: 'HomeStayDbContext' },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'POST /api/admin/rooms' },
      { tu: 1, den: 2, nhan: 'TaoPhongAsync(req)' },
      { tu: 2, den: 3, nhan: 'Rooms.AddAsync()' },
      { tu: 3, den: 4, nhan: 'INSERT Rooms, tiện nghi, ảnh' },
      { tu: 4, den: 3, nhan: 'Id mới', kieu: 'traVe' },
      { tu: 3, den: 2, nhan: 'SaveChangesAsync()', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: '201 Created', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'PATCH /api/admin/rooms/{id}/status' },
      { tu: 2, den: 4, nhan: 'UPDATE Rooms SET Status', tho: true },
      { tu: 2, den: 1, nhan: '200 OK', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'DELETE /api/admin/rooms/{id}' },
      { tu: 2, den: 4, nhan: 'Kiểm tra còn đơn không → xoá', tho: true },
      { tu: 2, den: 1, nhan: '200 OK hoặc 400 "còn đơn"', kieu: 'traVe' },
    ],
  },
  '3-18-sequence-thanh-toan': {
    ten: 'Chọn phương thức thanh toán và xác nhận đã thu',
    // Cột xếp theo đúng thứ tự lời gọi để thông điệp của khách không cắt qua cột
    // của Admin và ngược lại. Cột MySQL đặt cuối như quy ước các sơ đồ khác.
    cot: [
      { ten: 'Khách' },
      { ten: 'PaymentsController' },
      { ten: 'PaymentService', he: true },
      { ten: 'Admin' },
      { ten: 'AdminPaymentsController' },
      { ten: 'AdminPaymentService', he: true },
      { ten: 'MySQL' },
    ],
    moc: [
      { tu: 0, den: 1, nhan: 'GET /api/payments/my' },
      { tu: 1, den: 2, nhan: 'LayCuaToiAsync(userId)' },
      { tu: 2, den: 6, nhan: 'SELECT Payments JOIN Bookings…', tho: true },
      { tu: 6, den: 2, nhan: 'Danh sách phiếu thu', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'List<PaymentDto>', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: '200 OK + tổng đã thanh toán', kieu: 'traVe' },
      { tu: 0, den: 1, nhan: 'POST /api/payments/booking/{code}' },
      { tu: 1, den: 2, nhan: 'ChonPhuongThucAsync(userId, code, req)' },
      { tu: 2, den: 6, nhan: 'Đơn phải COMPLETED; phiếu đã thu thì 409', tho: true },
      { tu: 2, den: 6, nhan: 'INSERT Payments hoặc UPDATE Method', tho: true },
      { tu: 6, den: 2, nhan: 'OK', kieu: 'traVe' },
      { tu: 2, den: 1, nhan: 'PaymentDto', kieu: 'traVe' },
      { tu: 1, den: 0, nhan: '200 OK — ghi nhận lựa chọn của khách', kieu: 'traVe' },
      { tu: 3, den: 4, nhan: 'GET /api/admin/payments?status=' },
      { tu: 4, den: 5, nhan: 'LayDanhSachAsync(status, page, size)' },
      { tu: 5, den: 6, nhan: 'SELECT … phân trang', tho: true },
      { tu: 6, den: 5, nhan: 'Danh sách + tổng số trang', kieu: 'traVe' },
      { tu: 5, den: 4, nhan: 'PagedResult<PaymentDto>', kieu: 'traVe' },
      { tu: 4, den: 3, nhan: '200 OK — bảng phiếu thu', kieu: 'traVe' },
      { tu: 3, den: 4, nhan: 'PATCH /api/admin/payments/{id}/paid' },
      { tu: 4, den: 5, nhan: 'DanhDauDaThuAsync(id, method, note)' },
      { tu: 5, den: 6, nhan: 'Số tiền phải khớp tổng tiền của đơn', tho: true },
      { tu: 5, den: 6, nhan: 'UPDATE Status = PAID, PaidAt = now', tho: true },
      { tu: 6, den: 5, nhan: 'OK', kieu: 'traVe' },
      { tu: 5, den: 4, nhan: 'PaymentDto', kieu: 'traVe' },
      { tu: 4, den: 3, nhan: '200 OK — doanh thu tăng tương ứng', kieu: 'traVe' },
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
  ['3-01-bieu-do-tac-nhan', veHoatDong()],
  ...Object.entries(useCases).map(([ten, d]) => [ten, veUseCase(d)]),
  ['3-10-kien-truc-he-thong', veKienTruc()],
  ['3-11-bieu-do-lop-thuc-thi', veLopThucThi()],
  ['3-12-so-do-erd', veErd(erd)],
  ...Object.entries(sequences).map(([ten, d]) => [ten, veSequence(d)]),
]

for (const [ten, noiDungSvg] of tatCa) {
  const duongDan = join(noiDung, `${ten}.svg`)
  writeFileSync(duongDan, noiDungSvg, 'utf8')
  console.log(`  ${ten}.svg  (${(noiDungSvg.length / 1024).toFixed(1)} KB)`)
}
console.log(`\nTổng: ${tatCa.length} sơ đồ → docs/anh/so-do/`)
