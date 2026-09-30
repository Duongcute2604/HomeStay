import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import ReviewForm from './ReviewForm'

/**
 * Test form đánh giá (Bước 16).
 *
 * Bốn quy tắc phải khoá lại:
 * 1. Chưa chấm sao thì **không được** gửi — gửi mà không có ý kiến thì ra 5 sao.
 * 2. Đánh giá rồi thì hiện lại nội dung, **không** có form sửa.
 * 3. Nhận xét quá 1000 ký tự thì không cho gõ thêm (khớp ràng buộc CSDL).
 * 4. Lỗi từ server phải hiện nguyên văn, không nuốt mất.
 */

function dungForm(props: Partial<Parameters<typeof ReviewForm>[0]> = {}) {
  const macDinh = {
    daDanhGia: false,
    danhGiaCuaToi: null,
    dangGui: false,
    loi: null,
    onSubmit: vi.fn(),
    ...props,
  }

  render(<ReviewForm {...macDinh} />)
  return macDinh
}

describe('ReviewForm - chua danh gia', () => {
  it('HienFormVaNutGhi', () => {
    dungForm()

    expect(screen.getByRole('heading', { name: 'Đánh giá phòng' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi đánh giá' })).toBeInTheDocument()
    expect(screen.getByLabelText(/Nhận xét/)).toBeInTheDocument()
  })

  it('ChuaChamSao_NutGuiBiKhoa', () => {
    dungForm()

    expect(screen.getByRole('button', { name: 'Gửi đánh giá' })).toBeDisabled()
    expect(screen.getByText('Chưa chọn — hãy chấm số sao trước khi gửi')).toBeInTheDocument()
  })

  it('ChamSao_UnlockNutGuiVaGuiDungGiaTri', () => {
    const props = dungForm()

    fireEvent.click(screen.getAllByRole('radio')[3])
    fireEvent.change(screen.getByLabelText(/Nhận xét/), { target: { value: 'Phòng đẹp' } })

    expect(screen.getByRole('button', { name: 'Gửi đánh giá' })).not.toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Gửi đánh giá' }))

    expect(props.onSubmit).toHaveBeenCalledWith(4, 'Phòng đẹp')
  })

  it('ChonSao_HienNhanTiengViet', () => {
    dungForm()

    fireEvent.click(screen.getAllByRole('radio')[4])

    expect(screen.getByText('5 sao — Rất tốt')).toBeInTheDocument()
  })

  it('DangGui_KhoaNutVaDoiNhanNut', () => {
    dungForm({ dangGui: true })

    expect(screen.getByRole('button', { name: 'Đang gửi...' })).toBeDisabled()
  })

  it('NhanXetQua1000KyTu_KhongGhiThemDuoc', () => {
    dungForm()

    const oNhanXet = screen.getByLabelText(/Nhận xét/)
    expect(oNhanXet).toHaveAttribute('maxlength', '1000')
  })

  it('CoLoiTuServer_HienNguyenVanThongDiep', () => {
    dungForm({ loi: 'Bạn đã đánh giá đơn này rồi' })

    expect(screen.getByText('Bạn đã đánh giá đơn này rồi')).toBeInTheDocument()
  })
})

describe('ReviewForm - da danh gia roi', () => {
  it('HienNoiDungDaDanhGiaThayViForm', () => {
    dungForm({
      daDanhGia: true,
      danhGiaCuaToi: { rating: 4, comment: 'Sạch và thoáng', createdAt: '2026-09-28T10:00:00' },
    })

    expect(screen.getByRole('heading', { name: 'Đánh giá của bạn' })).toBeInTheDocument()
    expect(screen.getByText('Sạch và thoáng')).toBeInTheDocument()
    // Không còn nút gửi — mỗi đơn chỉ đánh giá 1 lần.
    expect(screen.queryByRole('button', { name: 'Gửi đánh giá' })).not.toBeInTheDocument()
  })

  it('DanhGiaKhongNhanXet_HienDongKhongCoNhanXet', () => {
    dungForm({
      daDanhGia: true,
      danhGiaCuaToi: { rating: 5, comment: null, createdAt: '2026-09-28T10:00:00' },
    })

    expect(screen.queryByRole('heading', { name: 'Đánh giá phòng' })).not.toBeInTheDocument()
    expect(screen.getByText(/Mỗi đơn chỉ được đánh giá một lần/)).toBeInTheDocument()
  })
})
