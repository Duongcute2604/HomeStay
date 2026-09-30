import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import RoomDateFrame from './RoomDateFrame'

/**
 * Test cho khung chọn ngày thuê.
 *
 * Không gọi API — chỉ kiểm tương tác và tính toán hiển thị. Khung này Bước 10
 * dùng lại nên phải chắc từ bây giờ.
 */
describe('RoomDateFrame', () => {
  it('ChuaChon_HienHuongDan_KhongHienGia', () => {
    render(<RoomDateFrame giaTheoGio={90000} giaTheoNgay={550000} />)

    expect(screen.getByText('Vui lòng chọn giờ nhận và giờ trả phòng')).toBeInTheDocument()
    expect(screen.queryByText(/Tạm tính/)).not.toBeInTheDocument()
  })

  it('ChonHopLe_HienTamTinhDungCongThuc', () => {
    render(<RoomDateFrame giaTheoGio={90000} giaTheoNgay={550000} />)

    fireEvent.change(screen.getByLabelText('Giờ nhận phòng'), {
      target: { value: '2026-10-05T14:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ trả phòng'), {
      target: { value: '2026-10-07T12:00' },
    })

    // Mặc định theo ngày: 14:00 05/10 → 12:00 07/10 = 46 giờ → 2 ngày × 550.000.
    expect(screen.getByText(/Tạm tính: 2 ngày/)).toBeInTheDocument()
    expect(screen.getByText('1.100.000 ₫')).toBeInTheDocument()
  })

  it('DoiSangTheoGio_TinhLaiTheoDonGiaGio', () => {
    render(<RoomDateFrame giaTheoGio={90000} giaTheoNgay={550000} />)

    fireEvent.click(screen.getByRole('button', { name: 'Theo giờ' }))
    fireEvent.change(screen.getByLabelText('Giờ nhận phòng'), {
      target: { value: '2026-10-05T14:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ trả phòng'), {
      target: { value: '2026-10-05T17:00' },
    })

    // 3 giờ × 90.000.
    expect(screen.getByText(/Tạm tính: 3 giờ/)).toBeInTheDocument()
    expect(screen.getByText('270.000 ₫')).toBeInTheDocument()
  })

  it('TraTruocNhan_BaoLoi_KhongHienGia', () => {
    render(<RoomDateFrame giaTheoGio={90000} giaTheoNgay={550000} />)

    fireEvent.change(screen.getByLabelText('Giờ nhận phòng'), {
      target: { value: '2026-10-05T14:00' },
    })
    fireEvent.change(screen.getByLabelText('Giờ trả phòng'), {
      target: { value: '2026-10-05T12:00' },
    })

    expect(screen.getByText('Giờ trả phòng phải sau giờ nhận phòng')).toBeInTheDocument()
    expect(screen.queryByText(/Tạm tính/)).not.toBeInTheDocument()
  })
})
