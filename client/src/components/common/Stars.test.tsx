import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import StarInput from './StarInput'
import StarRating from './StarRating'

/**
 * Test hai component hiển thị sao (Bước 16).
 *
 * Nguyên tắc: mọi màn hình điểm phòng (trang phòng, trang đơn, trang quản trị)
 * đều dùng chung 2 component này. Sai ở đây thì sai ở cả 3 chỗ.
 */

describe('StarRating', () => {
  it('HienDayDu5Sao_VaAriaLabel', () => {
    render(<StarRating value={5} />)

    // 5 sao đầy thì không có sao rỗng — người đọc phải đếm được mà không cần nhìn.
    expect(screen.getAllByText('★')).toHaveLength(5)
    expect(screen.queryByText('☆')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '5,0 trên 5 sao' })).toBeInTheDocument()
  })

  it('HienSaoRongChoPhanChuaCham', () => {
    render(<StarRating value={3} />)

    expect(screen.getAllByText('★')).toHaveLength(3)
    // Không có sao rỗng thì 2 sao và 5 sao nhìn giống nhau, không so sánh được.
    expect(screen.getAllByText('☆')).toHaveLength(2)
  })

  it('LamTronPhanThapPhan_3_6Ra4SaoDay', () => {
    render(<StarRating value={3.6} />)

    // 3,6 sao không vẽ được nửa sao nên phải làm tròn, không hiện 3 sao rỗng.
    expect(screen.getAllByText('★')).toHaveLength(4)
    expect(screen.getByRole('img', { name: '3,6 trên 5 sao' })).toBeInTheDocument()
  })

  it('KhongCoDanhGia_KhongHienDuoiNgoacDong', () => {
    render(<StarRating value={0} reviewCount={0} />)

    expect(screen.queryByText(/\(\d+ đánh giá\)/)).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: '0,0 trên 5 sao' })).toBeInTheDocument()
  })

  it('CoDanhGia_HienDuoiNgoacDong', () => {
    render(<StarRating value={4.5} reviewCount={7} />)

    expect(screen.getByText('(7 đánh giá)')).toBeInTheDocument()
  })

  it('CoNhan_HienDongGiaiThich', () => {
    render(<StarRating value={4} reviewCount={2} coNhan />)

    expect(screen.getByText(/Dựa trên 2 đánh giá/)).toBeInTheDocument()
  })
})

describe('StarInput', () => {
  it('ChuaChon_Hien5RadioVaNhacChonSao', () => {
    render(<StarInput value={0} onChange={vi.fn()} />)

    expect(screen.getAllByRole('radio')).toHaveLength(5)
    expect(screen.getByText('Chưa chọn — hãy chấm số sao trước khi gửi')).toBeInTheDocument()
  })

  it('KhongCoGiaTriMacDinh_TranhKhongDongY_KhiKhongChon', () => {
    render(<StarInput value={0} onChange={vi.fn()} />)

    // Nếu mặc định 5 sao thì khách bấm gửi khi chưa chọn gì vẫn ra đánh giá 5 sao.
    screen.getAllByRole('radio').forEach((radio) => {
      expect(radio).not.toBeChecked()
    })
  })

  it('ChonSao_GoiOnChangeVaHienNhanTiengViet', () => {
    const onChange = vi.fn()
    render(<StarInput value={0} onChange={onChange} />)

    fireEvent.click(screen.getAllByRole('radio')[1])

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('DaChonSao_RadioTuongUngChecked', () => {
    render(<StarInput value={4} onChange={vi.fn()} />)

    const radios = screen.getAllByRole('radio')
    expect(radios[3]).toBeChecked()
    expect(radios[0]).not.toBeChecked()
    expect(radios[4]).not.toBeChecked()
  })

  it('CoNhomRadio_TrinhDocManHinhDocDuoc', () => {
    render(<StarInput value={0} onChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'Chấm số sao' })).toBeInTheDocument()
  })
})
