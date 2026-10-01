/**
 * Chuyển 16 sơ đồ `.svg` sang `.png` để nhúng vào báo cáo Word.
 *
 * Vì sao không nhúng thẳng file `.svg`:
 * - Word chỉ hỗ trợ SVG từ bản 2016 trở lại, và khi chèn bằng script OOXML thì phần
 *   dự phòng (ảnh raster) phải tự dựng — dễ ra file hỏng.
 * - Sơ đồ có nhiều chữ nhỏ; PNG nén không mất dữ liệu nên chữ giữ nguyên, còn JPEG nhét
 *   artefact quanh nét chữ mảnh.
 *
 * Cách dùng:
 *   node docs/anh/svg-2-png.mjs
 *
 * Cần Google Chrome (dùng chính Chrome để dựng hình, không cài thêm phần mềm).
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const thuMucSoDo = join(thuMuc, 'so-do')

/** Ứng viên đường dẫn Chrome/Edge trên Windows, xét từ bản đặc biệt nhất. */
const TRINH_DUYET = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
]

const trinhDuyet = TRINH_DUYET.find((p) => existsSync(p))
if (trinhDuyet === undefined) {
  console.error('Không tìm thấy Chrome hoặc Edge. Cài Chrome rồi chạy lại.')
  process.exit(1)
}

/** Hệ số phóng để chữ trong sơ đồ không bị mờ khi in trên giấy A4. */
const HE_SO_PHONG = 2

/** Đọc kích thước khai báo ở thẻ `<svg>` để đặt cửa sổ chụp vừa khít. */
function kichThuocSvg(nhan) {
  const dau = readFileSync(join(thuMucSoDo, nhan), 'utf8').slice(0, 400)
  const khop = dau.match(/width="(\d+)"\s+height="(\d+)"/)
  if (khop === null) {
    throw new Error(`Không đọc được kích thước trong ${nhan}`)
  }
  return { rong: Number(khop[1]), cao: Number(khop[2]) }
}

const danhSach = readdirSync(thuMucSoDo).filter((f) => f.endsWith('.svg')).sort()
let tong = 0

for (const ten of danhSach) {
  const { rong, cao } = kichThuocSvg(ten)
  const ra = join(thuMuc, ten.replace(/\.svg$/, '.png'))
  if (existsSync(ra)) {
    unlinkSync(ra)
  }

  const duongDan = `file:///${join(thuMucSoDo, ten).replace(/\\/g, '/')}`
  execFileSync(
    trinhDuyet,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--force-device-scale-factor=${HE_SO_PHONG}`,
      `--screenshot=${ra}`,
      `--window-size=${rong},${cao}`,
      duongDan,
    ],
    { stdio: ['ignore', 'ignore', 'ignore'] },
  )

  const kb = statSync(ra).size / 1024
  tong++
  console.log(`  ${ten.replace(/\.svg$/, '.png').padEnd(44)} ${String(rong).padStart(5)} x ${String(cao).padEnd(5)}  ${kb.toFixed(0)} KB`)
}

console.log(`\nTổng: ${tong} ảnh PNG → docs/anh/`)
