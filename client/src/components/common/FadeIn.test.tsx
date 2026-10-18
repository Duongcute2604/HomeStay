import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import FadeIn from './FadeIn'

/**
 * Test component FadeIn — phần reveal do IntersectionObserver điều khiển.
 *
 * jsdom không tự có IntersectionObserver nên mỗi test mô phỏng (mock) đúng
 * interface Observer để bắn callback như trình duyệt thật.
 */

type BoQuanSat = (cacMuc: Array<{ isIntersecting: boolean }>) => void

/** Callback của lần observer gần nhất — test dùng để "bắn" sự kiện vào màn hình. */
let callbackMoi: BoQuanSat | null = null
const disconnectMock = vi.fn()

class IntersectionObserverGia {
  public readonly observe = vi.fn()
  public readonly unobserve = vi.fn()
  public readonly disconnect = disconnectMock

  constructor(callback: BoQuanSat) {
    callbackMoi = callback
  }
}

/** Lấy thẻ bọc ngoài của FadeIn (cha trực tiếp của nội dung). */
function layKhung(): HTMLElement {
  const khung = screen.getByText('Nội dung trang').closest('div')
  if (khung === null) {
    throw new Error('Không tìm thấy thẻ bọc của FadeIn')
  }
  return khung
}

beforeEach(() => {
  callbackMoi = null
  disconnectMock.mockClear()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('FadeIn - hien ung vao man hinh', () => {
  it('VuaRender_CoObserver_ChuaThemClassVisible', () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverGia)

    render(
      <FadeIn>
        <p>Nội dung trang</p>
      </FadeIn>,
    )

    // Vừa gắn vào DOM chưa cuộn tới → còn ẩn, chờ observer báo vào màn hình.
    expect(layKhung()).toHaveClass('fade-in')
    expect(layKhung()).not.toHaveClass('visible')
  })

  it('CuonToiManHinh_ThemClassVisibleVaNgatQuanSat', () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverGia)

    render(
      <FadeIn delay={200}>
        <p>Nội dung trang</p>
      </FadeIn>,
    )

    // Trình duyệt báo phần tử đã vào màn hình.
    callbackMoi?.([{ isIntersecting: true }])

    expect(layKhung()).toHaveClass('visible')
    // delay stagger được dịch thành transitionDelay của CSS.
    expect(layKhung()).toHaveStyle({ transitionDelay: '200ms' })
    // Hiện xong là ngắt quan sát — không quan sát phần tử đã hiển thị vô hạn.
    expect(disconnectMock).toHaveBeenCalled()
  })

  it('ChuaVaoManHinh_KhongThemClassVisible', () => {
    vi.stubGlobal('IntersectionObserver', IntersectionObserverGia)

    render(
      <FadeIn>
        <p>Nội dung trang</p>
      </FadeIn>,
    )

    callbackMoi?.([{ isIntersecting: false }])

    expect(layKhung()).not.toHaveClass('visible')
  })

  it('KhongCoIntersectionObserver_VanHienNgay_KhongBiAnMai', () => {
    // jsdom không có IntersectionObserver (giống trình duyệt rất cũ) —
    // nội dung phải hiện ngay, không được ẩn vĩnh viễn vì thiếu API.
    expect(typeof IntersectionObserver).toBe('undefined')

    render(
      <FadeIn>
        <p>Nội dung trang</p>
      </FadeIn>,
    )

    expect(layKhung()).toHaveClass('visible')
  })
})
