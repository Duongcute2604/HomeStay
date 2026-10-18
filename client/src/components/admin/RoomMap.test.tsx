import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import RoomMap, { MAU_TRANG_THAI } from './RoomMap'
import RoomMapModal from './RoomMapModal'
import type { AdminRoom } from '../../types/admin'
import { NHAN_TRANG_THAI_PHONG, RoomStatus, RoomType } from '../../types/location'

/**
 * Test Sơ đồ phòng Admin (Bước 26).
 *
 * Bốn quy tắc phải khoá lại:
 * 1. Phòng phải được gom theo cơ sở — mỗi cơ sở một khu riêng, đếm số phòng.
 * 2. Mỗi trạng thái một màu riêng (5 màu 5 trạng thái) — ô phải mang đúng
 *    màu theo `status`, không được đoán theo tên.
 * 3. Bấm ô phải gọi callback với đúng đối tượng phòng.
 * 4. Popup phải hiện ảnh + tiện nghi + giá, và nút đổi trạng thái gọi đúng
 *    mã trạng thái (cùng bộ mã với API).
 */

function taoPhong(boSung: Partial<AdminRoom> = {}): AdminRoom {
  return {
    id: 1,
    locationName: 'Hưng Yên Ven Biển',
    name: 'Phòng Hạnh Phúc',
    roomNumber: 'A101',
    roomType: RoomType.COZY,
    capacity: 2,
    area: 35,
    pricePerHour: 200000,
    pricePerDay: 550000,
    description: null,
    status: RoomStatus.AVAILABLE,
    images: ['/images/a.jpg', '/images/b.jpg'],
    amenityIds: [1, 9],
    amenityNames: ['WiFi miễn phí', 'Máy chiếu'],
    ...boSung,
  }
}

describe('RoomMap - so do phong theo co so', () => {
  it('NhomPhongTheoCoSo_HienTungKhuVungVaDemSoPhong', () => {
    render(
      <RoomMap
        danhSach={[
          taoPhong(),
          taoPhong({ id: 2, roomNumber: 'A102', name: 'Phòng Bình Minh' }),
          taoPhong({ id: 3, roomNumber: 'C101', name: 'Phòng Hoa Sen', locationName: 'Hội An Phố Cổ' }),
        ]}
        onChonPhong={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: /Hưng Yên Ven Biển/ })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Hội An Phố Cổ/ })).toBeInTheDocument()
    // 3 ô phòng — mỗi ô có số phòng của chính nó.
    expect(screen.getByRole('button', { name: 'Phòng A101 — Còn trống' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phòng A102 — Còn trống' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Phòng C101 — Còn trống' })).toBeInTheDocument()
  })

  it('MauO_TheoTrangThai_TungTrangThaiMotMauRieng', () => {
    render(
      <RoomMap
        danhSach={[
          taoPhong({ status: RoomStatus.AVAILABLE }),
          taoPhong({ id: 2, roomNumber: 'A201', status: RoomStatus.OCCUPIED }),
          taoPhong({ id: 3, roomNumber: 'A301', status: RoomStatus.CLEANING }),
          taoPhong({ id: 4, roomNumber: 'A401', status: RoomStatus.MAINTENANCE }),
        ]}
        onChonPhong={vi.fn()}
      />,
    )

    // Ô trạng thái nào phải mang đúng màu của trạng thái đó.
    expect(screen.getByRole('button', { name: /A101/ })).toHaveClass(
      MAU_TRANG_THAI[RoomStatus.AVAILABLE].vien,
    )
    expect(screen.getByRole('button', { name: /A201/ })).toHaveClass(
      MAU_TRANG_THAI[RoomStatus.OCCUPIED].vien,
    )
    expect(screen.getByRole('button', { name: /A301/ })).toHaveClass(
      MAU_TRANG_THAI[RoomStatus.CLEANING].vien,
    )
    expect(screen.getByRole('button', { name: /A401/ })).toHaveClass(
      MAU_TRANG_THAI[RoomStatus.MAINTENANCE].vien,
    )
    // 5 màu phải khác nhau tuyệt đối — trùng màu là mất ý nghĩa của sơ đồ.
    const danhSachMau = Object.values(MAU_TRANG_THAI).map((mau) => mau.vien)
    expect(new Set(danhSachMau).size).toBe(danhSachMau.length)
  })

  it('BamPhong_GoiCallbackVoiDungPhong', () => {
    const onChonPhong = vi.fn()
    const phongNhan = taoPhong({ id: 7, roomNumber: 'B201', status: RoomStatus.BOOKED })

    render(<RoomMap danhSach={[phongNhan]} onChonPhong={onChonPhong} />)

    fireEvent.click(screen.getByRole('button', { name: 'Phòng B201 — Đã được đặt' }))

    expect(onChonPhong).toHaveBeenCalledWith(phongNhan)
  })
})

describe('RoomMapModal - popup chi tiet phong', () => {
  function dungPopup(boSung: Partial<AdminRoom> = {}) {
    const cacHandler = {
      onDoiTrangThai: vi.fn(),
      onSua: vi.fn(),
      onDong: vi.fn(),
    }
    render(<RoomMapModal phong={taoPhong(boSung)} {...cacHandler} />)
    return cacHandler
  }

  it('HienAnhTienNghiVaGiaDungDinhDangVND', () => {
    dungPopup({ amenityNames: ['WiFi miễn phí', 'Máy chiếu'] })

    // Ảnh chính + hàng thumbnail (2 ảnh) — bấm thumbnail để đổi ảnh lớn.
    expect(screen.getByAltText('Ảnh phòng Phòng Hạnh Phúc')).toHaveAttribute(
      'src',
      '/images/a.jpg',
    )
    expect(screen.getByRole('button', { name: 'Xem ảnh 2' })).toBeInTheDocument()

    // Tiện nghi hiện thành thẻ, đúng tên từ dữ liệu.
    expect(screen.getByText(/WiFi miễn phí/)).toBeInTheDocument()
    expect(screen.getByText(/Máy chiếu/)).toBeInTheDocument()

    // Tiền đúng định dạng VND.
    expect(screen.getByText('200.000 ₫')).toBeInTheDocument()
    expect(screen.getByText('550.000 ₫')).toBeInTheDocument()
  })

  it('BamAnhPhu_DoiAnhLonDangXem', () => {
    dungPopup()

    fireEvent.click(screen.getByRole('button', { name: 'Xem ảnh 2' }))

    expect(screen.getByAltText('Ảnh phòng Phòng Hạnh Phúc')).toHaveAttribute(
      'src',
      '/images/b.jpg',
    )
  })

  it('BamDoiTrangThai_GoiCallbackDungMaTrangThai', () => {
    const handlers = dungPopup()

    // Trạng thái hiện tại (Còn trống) được đánh dấu aria-pressed.
    expect(screen.getByRole('button', { name: 'Còn trống' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    fireEvent.click(screen.getByRole('button', { name: 'Đang dọn dẹp' }))

    expect(handlers.onDoiTrangThai).toHaveBeenCalledWith(RoomStatus.CLEANING)
  })

  it('BamNenNgoaiPopup_GoiOnDong', () => {
    const handlers = dungPopup()

    fireEvent.click(screen.getByRole('dialog'))

    expect(handlers.onDong).toHaveBeenCalled()
  })

  it('HienDung5NhanTrangThai_KhongThieuNhanNa', () => {
    dungPopup()

    for (const nhan of Object.values(NHAN_TRANG_THAI_PHONG)) {
      expect(screen.getByRole('button', { name: nhan })).toBeInTheDocument()
    }
  })
})
