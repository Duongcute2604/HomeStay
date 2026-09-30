/**
 * Server tĩnh nhỏ để xem các sơ đồ .svg trong trình duyệt khi chụp ảnh báo cáo.
 * Chỉ phục vụ thư mục `docs/`, chỉ đọc, không ghi gì.
 *
 * Chạy:  node docs/anh/xem-so-do.mjs
 * Xem:   http://localhost:5199/anh/so-do/3-10-so-do-erd.svg
 *
 * Riêng file `.svg` được bọc trong một trang HTML nền trắng: trình duyệt hiển thị
 * .svg trên nền tối mặc định nên ảnh chụp sẽ có viền đen, không dùng được.
 */

import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const goc = resolve(fileURLToPath(import.meta.url), '..', '..') // thư mục `docs`
const CONG = 5199

const KIEU = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.html': 'text/html; charset=utf-8',
}

/** Trang trắng bọc quanh nội dung SVG để ảnh chụp sạch. */
function trangTrang(svg) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Sơ đồ HomeStay</title>
  <style>
    html, body { margin: 0; padding: 0; background: #ffffff; }
    body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
  </style>
</head>
<body>${svg}</body>
</html>
`
}

const server = createServer((req, res) => {
  const duongDanYeuCau = decodeURIComponent((req.url ?? '/').split('?')[0])
  const dich = resolve(join(goc, normalize(duongDanYeuCau)))

  // Chặn truy cập ra ngoài thư mục `docs` (path traversal).
  if (!dich.startsWith(goc + sep) && dich !== goc) {
    res.writeHead(403).end('Forbidden')
    return
  }
  if (!existsSync(dich) || statSync(dich).isDirectory()) {
    res.writeHead(404).end('Not found')
    return
  }

  if (extname(dich) === '.svg') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(trangTrang(readFileSync(dich, 'utf8')))
    return
  }

  res.writeHead(200, { 'Content-Type': KIEU[extname(dich)] ?? 'application/octet-stream' })
  createReadStream(dich).pipe(res)
})

server.listen(CONG, () => {
  console.log(`Đang phục vụ ${goc} tại http://localhost:${CONG}/`)
})
