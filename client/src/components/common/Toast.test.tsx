import { act, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Toast from './Toast'
import { useToastStore } from '../../store/toastStore'

/**
 * Test Toast (Bước 17 — kịch bản 5 và 6).
 *
 * Đây là bằng chứng cho "thao tác thành công → toast xanh" và "thất bại →
 * toast đỏ", vì kiểm bằng mắt trên trình duyệt dễ bỏ sót (bấm nhanh quá thì
 * toast đã tự tắt). Ở đây dùng đồng hồ giả nên kiểm được cả thời điểm tự tắt.
 */
beforeEach(() => {
  // Store là singleton, phải dọn giữa các test hoặc toast cũ lọt sang test sau.
  act(() => {
    useToastStore.setState({ toasts: [] })
  })
})

describe('Toast - hien thi', () => {
  it('KhongCoToast_ThiKhongRenderGi', () => {
    const { container } = render(<Toast />)

    expect(container.innerHTML).toBe('')
  })

  it('ThanhCong_HienToastXanh', () => {
    act(() => {
      useToastStore.getState().themToast('Đã xác nhận đơn', 'success')
    })

    render(<Toast />)

    expect(screen.getByText('Đã xác nhận đơn')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveClass('toast-success')
  })

  it('ThatBai_HienToastDo', () => {
    act(() => {
      useToastStore.getState().themToast('Phòng đã có người đặt', 'error')
    })

    render(<Toast />)

    expect(screen.getByText('Phòng đã có người đặt')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('toast-error')
  })

  it('NhieuToast_CungLucHien', () => {
    act(() => {
      useToastStore.getState().themToast('Đã cập nhật', 'success')
      useToastStore.getState().themToast('Không tải được', 'error')
    })

    render(<Toast />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('KhaiBaoRoleDeTrinhDocManHinhThongBao', () => {
    act(() => {
      useToastStore.getState().themToast('Đã lưu', 'success')
    })

    render(<Toast />)

    // Không có role thì trình đọc màn hình đọc nguyên trang không báo gì — người
    // mù không biết thao tác đã thành công hay chưa.
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })
})

describe('Toast - tu tat', () => {
  it('SauMotKhongGiVanConHien', () => {
    vi.useFakeTimers()

    act(() => {
      useToastStore.getState().themToast('Đã gửi đánh giá', 'success')
    })
    render(<Toast />)
    expect(screen.getByText('Đã gửi đánh giá')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Đã gửi đánh giá')).not.toBeInTheDocument()
    vi.useRealTimers()
  })

  it('MotToastHetHanKhongXoaNhatPhaiKhac', () => {
    vi.useFakeTimers()

    act(() => {
      useToastStore.getState().themToast('Thành công', 'success')
      useToastStore.getState().themToast('Thất bại', 'error')
    })
    render(<Toast />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(screen.queryByText('Thành công')).not.toBeInTheDocument()
    // Hai toast cùng lúc phải tắt cùng nhau; nếu lọc sai thì toast thứ hai bị
    // mất oan khi toast thứ nhất hết hạn.
    expect(screen.queryByText('Thất bại')).not.toBeInTheDocument()
    vi.useRealTimers()
  })
})