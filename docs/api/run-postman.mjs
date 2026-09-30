/**
 * Chạy collection Postman bằng Node — không cần cài Newman.
 *
 * Vì sao tự viết thay vì `newman`:
 *  - Newman là gói thêm vào dự án chỉ để chạy test (AGENTS 0.3: cấm thêm package
 *    không có lý do rõ). Một file Node không thêm dependency nào.
 *  - Runner này hiểu đúng những gì collection dùng, và **in bảng kết quả** để
 *    chụp vào báo cáo — đó là bằng chứng Bước 18 cần.
 *
 * Có hỗ trợ `x-runGroup`: các request cùng nhóm được gửi **song song**, dùng để
 * kiểm tra race condition chống đặt trùng (3 test bắt buộc của bước này).
 *
 * Chạy:  node docs/api/run-postman.mjs
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const duongDan = join(thuMuc, 'postman_collection.json')
const collection = JSON.parse(readFileSync(duongDan, 'utf8'))

/** Thay mọi {{bien}} bằng giá trị trong bien. */
function noiBien(chuoi, bien) {
  return String(chuoi).replace(/\{\{(\w+)\}\}/g, (match, ten) => {
    const giaTri = bien[ten]
    if (giaTri === undefined || giaTri === '') {
      throw new Error(`Biến "${ten}" chưa có giá trị (còn là "${match}")`)
    }
    return String(giaTri)
  })
}

/** Dựng `pm` giả — chỉ những gì collection thực sự dùng. */
function taoPm(response, bien, ketQua) {
  const pm = {
    test(ten, ham) {
      try {
        ham()
        ketQua.push({ ten, dat: true })
      } catch (loi) {
        ketQua.push({ ten, dat: false, loi: loi.message })
      }
    },
    response: {
      get code() {
        return response.status
      },
      json() {
        if (response.body === null) throw new Error('Response không phải JSON hợp lệ')
        return response.body
      },
      text() {
        return response.raw
      },
      to: {
        have: {
          status(mongDoi) {
            if (response.status !== mongDoi) {
              throw new Error(`Expected ${mongDoi}, got ${response.status}`)
            }
          },
        },
      },
    },
    collectionVariables: {
      set: (k, v) => {
        bien[k] = v
      },
      get: (k) => bien[k],
    },
    environment: {
      set: (k, v) => {
        bien[k] = v
      },
      get: (k) => bien[k],
    },
    info: { eventName: 'test' },
  }
  return pm
}

/** Gộp các dòng script của Postman thành một hàm chạy được. */
function chayScript(tenMoi, dong, bien) {
  const pm = taoPm({ status: 0, body: null, raw: '' }, bien, [])
  // eslint-disable-next-line no-new-func
  const ham = new Function('pm', 'console', dong)
  ham(pm, { log() {} })
  return pm
}

async function chayPrerequest(request, bien) {
  const suKien = (request.event ?? []).find((e) => e.listen === 'prerequest')
  if (!suKien) return
  const dong = suKien.script.exec.join('\n')
  chayScript('prerequest', dong, bien)
}

function chayTest(request, bien, response) {
  const ketQua = []
  const suKien = (request.event ?? []).find((e) => e.listen === 'test')
  if (!suKien) return ketQua
  const pm = taoPm(response, bien, ketQua)
  // eslint-disable-next-line no-new-func
  const ham = new Function('pm', 'console', suKien.script.exec.join('\n'))
  ham(pm, { log() {} })
  return ketQua
}

function taoRequest(request, bien) {
  const method = request.request.method
  let duongDanYeuCau = noiBien(request.request.url.raw, bien)
  const headers = {}
  for (const h of request.request.header ?? []) {
    headers[noiBien(h.key, bien)] = noiBien(h.value, bien)
  }

  let body
  const raw = request.request.body?.raw
  if (raw) {
    body = noiBien(raw, bien)
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json'
  }

  return { method, duongDanYeuCau, headers, body }
}

async function guiRequest(req) {
  const options = { method: req.method, headers: req.headers }
  if (req.body) options.body = req.body

  const response = await fetch(req.duongDanYeuCau, options)
  const raw = await response.text()
  let body = null
  try {
    body = JSON.parse(raw)
  } catch {
    body = null
  }
  return { status: response.status, body, raw }
}

/** Dọn tất cả request ra một mảng phẳng, giữ nguyên thứ tự thư mục. */
function lamPhang(items, thuMucHienTai = '') {
  const ra = []
  for (const item of items ?? []) {
    if (item.item) {
      ra.push(...lamPhang(item.item, item.name))
    } else {
      ra.push({ ...item, thuMuc: thuMucHienTai })
    }
  }
  return ra
}

// ---------------------------------------------------------------- chạy chính

const bien = {}
for (const v of collection.variable ?? []) bien[v.key] = v.value

const tatCa = lamPhang(collection.item)
const nhomDaChay = new Set()
const baoCao = []

console.log('='.repeat(78))
console.log(`COLLECTION: ${collection.info.name}`)
console.log(`Tổng số request: ${tatCa.length}`)
console.log('='.repeat(78))

for (const item of tatCa) {
  const nhom = item['x-runGroup']
  if (nhom) {
    if (nhomDaChay.has(nhom)) continue
    nhomDaChay.add(nhom)

    const thanhVien = tatCa.filter((r) => r['x-runGroup'] === nhom)
    console.log(`\n>> NHÓM SONG SONG "${nhom}": ${thanhVien.length} request gửi cùng lúc`)

    const maTrangThai = await Promise.all(
      thanhVien.map(async (r) => {
        await chayPrerequest(r, bien)
        const req = taoRequest(r, bien)
        return guiRequest(req)
      }),
    )

    // Ghi kết quả của nhóm để script của từng thành viên tự kiểm chứng.
    bien['ketQuaRace'] = maTrangThai.map((r) => r.status)

    thanhVien.forEach((r, i) => {
      const ketQua = chayTest(r, bien, maTrangThai[i])
      baoCao.push({ ten: r.name, thuMuc: r.thuMuc, nhom, ketQua, status: maTrangThai[i].status })
      const dau = ketQua.every((k) => k.dat) ? 'PASS' : 'FAIL'
      console.log(`   [${dau}] ${r.name}  (HTTP ${maTrangThai[i].status})`)
    })
    continue
  }

  await chayPrerequest(item, bien)
  let req
  try {
    req = taoRequest(item, bien)
  } catch (loi) {
    // Thiếu biến = request trước đó đã hỏng và không ghi được biến. Báo lỗi rồi đi
    // tiếp, KHÔNG crash — crash làm mất thông tin request nào đã hỏng.
    baoCao.push({
      ten: item.name,
      thuMuc: item.thuMuc,
      ketQua: [{ ten: 'Chuẩn bị request', dat: false, loi: loi.message }],
    })
    console.log(`\n[FAIL] ${item.thuMuc} › ${item.name}\n       ${loi.message}`)
    continue
  }

  let response
  try {
    response = await guiRequest(req)
  } catch (loi) {
    baoCao.push({ ten: item.name, thuMuc: item.thuMuc, ketQua: [{ ten: 'Gửi request', dat: false, loi: loi.message }] })
    console.log(`\n[FAIL] ${item.name}\n       ${loi.message}`)
    continue
  }

  const ketQua = chayTest(item, bien, response)
  baoCao.push({ ten: item.name, thuMuc: item.thuMuc, ketQua, status: response.status })
  const dau = ketQua.length > 0 && ketQua.every((k) => k.dat) ? 'PASS' : 'FAIL'
  console.log(`\n[${dau}] ${item.thuMuc} › ${item.name}  (HTTP ${response.status})`)
  for (const k of ketQua) {
    console.log(`       ${k.dat ? 'v' : 'x'} ${k.ten}${k.loi ? ` — ${k.loi}` : ''}`)
  }
}

// ---------------------------------------------------------------- tổng kết

const tongKienChuc = baoCao.reduce((a, r) => a + r.ketQua.length, 0)
const soRequestDat = baoCao.filter((r) => r.ketQua.length > 0 && r.ketQua.every((k) => k.dat)).length
const soRequestHong = baoCao.length - soRequestDat
const soKienChucDat = baoCao.reduce((a, r) => a + r.ketQua.filter((k) => k.dat).length, 0)

console.log('\n' + '='.repeat(78))
console.log('TỔNG KẾT')
console.log('='.repeat(78))
console.log(`Request trong collection : ${tatCa.length}`)
console.log(`Request đã chạy          : ${baoCao.length}`)
console.log(`Request đạt              : ${soRequestDat}`)
console.log(`Request hỏng             : ${soRequestHong}`)
console.log(`Kiểm chứng               : ${soKienChucDat}/${tongKienChuc}`)
console.log('='.repeat(78))

if (soRequestHong > 0) {
  console.log('\nREQUEST HỎNG:')
  for (const r of baoCao.filter((x) => !x.ketQua.every((k) => k.dat))) {
    console.log(`  - ${r.thuMuc} › ${r.ten}`)
    for (const k of r.ketQua.filter((x) => !x.dat)) console.log(`      ${k.ten}: ${k.loi}`)
  }
}

process.exit(soRequestHong > 0 ? 1 : 0)
