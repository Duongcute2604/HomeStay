import axios from 'axios'
import { describe, expect, it } from 'vitest'

import { layThongBaoLoi } from './client'

/**
 * Test cho hàm bóc thông báo lỗi tiếng Việt.
 *
 * Vì sao hàm này đáng test: 51 ca kiểm thử tay phía API đều **không** bắt được
 * lỗi "Đã xảy ra lỗi" mà người dùng thấy — vì lỗi nằm ở tầng client, nằm ngoài
 * request/response. Mọi lỗi ở giao diện cuối cùng đều đi qua đúng hàm này, nên
 * đây là chỗ rẻ nhất để bảo vệ thông báo mà người dùng thực sự nhìn thấy.
 */

/** Dựng một lỗi axios giống hệt thứ axios ném ra khi server trả về mã lỗi. */
function loiCoBody(status: number, message?: string): unknown {
  return new axios.AxiosError(
    'Yêu cầu thất bại',
    'ERR_BAD_REQUEST',
    undefined,
    undefined,
    {
      status,
      statusText: '',
      headers: {},
      config: { headers: {} },
      data: message === undefined ? null : { success: false, message, data: null },
    } as never,
  )
}

/** Lỗi axios khi request không tới được server: không có `response`. */
function loiKhongCoResponse(): unknown {
  return new axios.AxiosError(
    'Network Error',
    'ERR_NETWORK',
    undefined,
    undefined,
    undefined,
  )
}

describe('layThongBaoLoi - co response tu may chu', () => {
  it('BodyCoMessage_TraDungThongBaoTiengVietCuaServer', () => {
    const loi = loiCoBody(409, 'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác')

    expect(layThongBaoLoi(loi)).toBe(
      'Email này đã được đăng ký. Vui lòng đăng nhập hoặc dùng email khác',
    )
  })

  it('BodyRong_TrảThongBaoKemMaLoi_ViKhongCoGiDeNoi', () => {
    // Trường hợp này xảy ra khi endpoint trả lỗi kiểu không phải ApiResponse
    // (ví dụ proxy hoặc server lỗi). Không có message thì phải nói rõ mã lỗi
    // để khi báo lỗi còn biết tra log server.
    const loi = loiCoBody(500)

    expect(layThongBaoLoi(loi)).toBe('Yêu cầu thất bại (mã 500). Vui lòng thử lại.')
  })
})

describe('layThongBaoLoi - khong co response', () => {
  it('MatKetNoi_BaoRiengChoNguoiDung_ViKhacLoiHoanToan', () => {
    // "Không kết nối được máy chủ" và "Sai mật khẩu" là hai lỗi khác hẳn nhau.
    // Gộp chung thành "Đã xảy ra lỗi" thì người dùng tưởng server hỏng.
    expect(layThongBaoLoi(loiKhongCoResponse())).toBe(
      'Không kết nối được máy chủ. Vui lòng kiểm tra mạng rồi thử lại.',
    )
  })
})

describe('layThongBaoLoi - loi khong phai tu axios', () => {
  it('LoiDoChinhTangServiceNemRa_TraDungMessage', () => {
    // Đây chính là lỗi đã gặp ở Bước 5: `bocDuLieu` ném `Error` với thông báo
    // cụ thể, nhưng hàm chỉ biết AxiosError nên nuốt mất thành câu chung chung.
    // Nhánh này giữ lại nguyên nhân thật.
    expect(layThongBaoLoi(new Error('Máy chủ trả về dữ liệu rỗng. Vui lòng thử lại.'))).toBe(
      'Máy chủ trả về dữ liệu rỗng. Vui lòng thử lại.',
    )
  })

  it('LoiKhongPhaiError_TraThongBaoChungChung', () => {
    // Chuỗi, null, undefined... không có thông báo nào để hiện.
    expect(layThongBaoLoi('một chuỗi bất kỳ')).toBe('Đã xảy ra lỗi. Vui lòng thử lại.')
    expect(layThongBaoLoi(null)).toBe('Đã xảy ra lỗi. Vui lòng thử lại.')
    expect(layThongBaoLoi(undefined)).toBe('Đã xảy ra lỗi. Vui lòng thử lại.')
  })

  it('KhongBaoLoiNaThatBai_ChoMoiDinh dang', () => {
    // `Error` rỗng vẫn là `Error`, nên phải trả về chuỗi rỗng chứ không phải
    // `undefined` — trang dùng kết quả này để render, `undefined` sẽ làm vỡ.
    expect(typeof layThongBaoLoi(new Error(''))).toBe('string')
  })
})
