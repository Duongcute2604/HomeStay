import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Rooms from './Rooms'
import { locationService } from '../services/locationService'
import { roomService } from '../services/roomService'
import { RoomStatus, RoomType } from '../types/location'
import type { PagedResult, RoomSearchItem } from '../types/room'

/**
 * Test cho trang tìm kiếm phòng.
 *
 * Mock cả hai service (không gọi mạng), giữ TanStack Query + Router + form thật.
 * Trọng tâm: STT liên tục qua các trang, phân trang, và 3 trạng thái bắt buộc.
 */

vi.mock('../services/roomService', () => ({
  roomService: { timKiem: vi.fn() },
}))

vi.mock('../services/locationService', () => ({
  locationService: { layDanhSach: vi.fn() },
}))

const timKiemMock = vi.mocked(roomService.timKiem)
const layDanhSachMock = vi.mocked(locationService.layDanhSach)

function phongMau(ten: string): RoomSearchItem {
  return {
    name: ten,
    roomNumber: 'P01',
    roomType: RoomType.STANDARD,
    capacity: 2,
    pricePerHour: 120000,
    pricePerDay: 900000,
    ratingAvg: 4.5,
    ratingCount: 3,
    status: RoomStatus.AVAILABLE,
    thumbnailUrl: null,
    locationName: 'Hưng Yên Ven Biển',
    locationIndex: 0,
    roomIndex: 0,
  }
}

function trangMau(danhSach: RoomSearchItem[], page = 1, totalPages = 1): PagedResult<RoomSearchItem> {
  return { items: danhSach, page, pageSize: 6, totalItems: danhSach.length, totalPages }
}

function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Rooms />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  timKiemMock.mockReset()
  layDanhSachMock.mockReset()
  layDanhSachMock.mockResolvedValue([])
})

describe('Rooms - trang thai', () => {
  it('DangTai_HienThongBaoDangTai', () => {
    timKiemMock.mockReturnValue(new Promise(() => {}))

    dungTrang()

    expect(screen.getByText('Đang tìm phòng...')).toBeInTheDocument()
  })

  it('Loi_HienThongBaoVaNutThuLai', async () => {
    timKiemMock.mockRejectedValue(new Error('Không kết nối được máy chủ'))

    dungTrang()

    expect(await screen.findByText('Không kết nối được máy chủ')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
  })

  it('KhongCoKetQua_HienEmptyState_CoHuongDan', async () => {
    timKiemMock.mockResolvedValue(trangMau([]))

    dungTrang()

    expect(await screen.findByText('Không tìm thấy phòng nào')).toBeInTheDocument()
    expect(screen.getByText(/Thử nới rộng khoảng giá/)).toBeInTheDocument()
  })
})

describe('Rooms - ket qua va STT', () => {
  it('HienKetQua_VoiSttBatDauTu1', async () => {
    timKiemMock.mockResolvedValue(trangMau([phongMau('Phòng Hạnh Phúc'), phongMau('Phòng Bình Minh')]))

    dungTrang()

    expect(await screen.findByText('Phòng Hạnh Phúc')).toBeInTheDocument()
    expect(screen.getByText('Tìm thấy 2 phòng')).toBeInTheDocument()
    // STT = (page-1)*pageSize + chỉ số + 1.
    expect(screen.getByText('1. Hưng Yên Ven Biển')).toBeInTheDocument()
    expect(screen.getByText('2. Hưng Yên Ven Biển')).toBeInTheDocument()
  })

  it('Trang2_SttTiepNoi_KhongDanhLaiTu1', async () => {
    timKiemMock.mockResolvedValue(trangMau([phongMau('Phòng Trang Hai')], 2, 2))

    dungTrang()

    expect(await screen.findByText('Phòng Trang Hai')).toBeInTheDocument()
    // Trang 2 với 6 phòng/trang: STT bắt đầu từ 7.
    expect(screen.getByText('7. Hưng Yên Ven Biển')).toBeInTheDocument()
    expect(screen.getByText('Trang 2/2')).toBeInTheDocument()
  })

  it('MotTrang_KhongHienPhanTrang', async () => {
    timKiemMock.mockResolvedValue(trangMau([phongMau('Phòng Hạnh Phúc')]))

    dungTrang()

    await screen.findByText('Phòng Hạnh Phúc')
    expect(screen.queryByText(/Trang \d+\/\d+/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Trang sau/ })).not.toBeInTheDocument()
  })

  it('BamTrangSau_GoiLaiApiVoiPage2', async () => {
    timKiemMock.mockResolvedValue(trangMau([phongMau('Phòng Một')], 1, 2))

    dungTrang()

    await screen.findByText('Phòng Một')
    fireEvent.click(screen.getByRole('button', { name: /Trang sau/ }))

    await waitFor(() => {
      const lanGoiCuoi = timKiemMock.mock.calls[timKiemMock.mock.calls.length - 1][0]
      expect(lanGoiCuoi.page).toBe(2)
    })
  })
})

describe('Rooms - bo loc', () => {
  it('BamTimKiem_GuiBoLocDaNhap', async () => {
    timKiemMock.mockResolvedValue(trangMau([]))

    dungTrang()

    await screen.findByText('Không tìm thấy phòng nào')

    fireEvent.change(screen.getByPlaceholderText('Ví dụ: Hạnh Phúc'), {
      target: { value: 'Hạnh Phúc' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))

    await waitFor(() => {
      expect(timKiemMock).toHaveBeenCalledTimes(2)
      const boLoc = timKiemMock.mock.calls[1][0]
      expect(boLoc.keyword).toBe('Hạnh Phúc')
      expect(boLoc.page).toBe(1)
    })
  })

  it('MinPriceLonHonMaxPrice_BaoLoiTaiForm_KhongGoiApi', async () => {
    timKiemMock.mockResolvedValue(trangMau([]))

    dungTrang()

    await screen.findByText('Không tìm thấy phòng nào')
    const soLanGoiBanDau = timKiemMock.mock.calls.length

    fireEvent.change(screen.getByPlaceholderText('Ví dụ: 500000'), {
      target: { value: '1000000' },
    })
    fireEvent.change(screen.getByPlaceholderText('Ví dụ: 1000000'), {
      target: { value: '500000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }))

    expect(
      await screen.findByText('Giá cao nhất phải lớn hơn hoặc bằng giá thấp nhất'),
    ).toBeInTheDocument()
    // Form báo lỗi thì không gửi request mới.
    expect(timKiemMock.mock.calls.length).toBe(soLanGoiBanDau)
  })
})
