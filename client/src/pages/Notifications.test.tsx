import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Notifications from './Notifications'
import { notificationService } from '../services/notificationService'
import type { Notification } from '../types/notification'

/**
 * Test cho trang danh sách thông báo.
 *
 * Trọng tâm ba điều dễ sai:
 * 1. **Chỉ thông báo chưa đọc** mới có nút "Đánh dấu đã đọc" — đã đọc rồi thì không
 *    hiện nút, không phải vì làm cho đẹp mà vì bấm lại sẽ là thao tác vô nghĩa.
 * 2. Nút "Đánh dấu đã đọc tất cả" chỉ hiện khi **còn** thông báo chưa đọc.
 * 3. Đủ ba trạng thái: đang tải, lỗi, không có dữ liệu.
 */

vi.mock('../services/notificationService', () => ({
  notificationService: {
    layCuaToi: vi.fn(),
    danhDauDaDoc: vi.fn(),
    danhDauDaDocTatCa: vi.fn(),
  },
}))

vi.mock('../store/toastStore', () => ({
  useToastStore: (selector: (s: { themToast: unknown }) => unknown) =>
    selector({ themToast: vi.fn() }),
}))

const layCuaToiMock = vi.mocked(notificationService.layCuaToi)
const danhDauDaDocMock = vi.mocked(notificationService.danhDauDaDoc)
const danhDauTatCaMock = vi.mocked(notificationService.danhDauDaDocTatCa)

function thongBaoMau(uaPhuong: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    title: 'Đơn HS-261029-0015 đã được xác nhận',
    content: 'Đơn đặt phòng Hạnh Phúc đã được xác nhận.',
    isRead: false,
    createdAt: '2026-09-30T14:00:00',
    ...uaPhuong,
  }
}

function dungTrang() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={['/notifications']}
      >
        <Routes>
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/bookings" element={<p>Trang đơn của tôi</p>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  layCuaToiMock.mockReset()
  danhDauDaDocMock.mockReset()
  danhDauTatCaMock.mockReset()
})

describe('Notifications - hien thi', () => {
  it('ChuaDoc_HienNutDanhDauDaDoc', async () => {
    layCuaToiMock.mockResolvedValue({
      items: [thongBaoMau()],
      soChuaDoc: 1,
    })

    dungTrang()

    expect(
      await screen.findByText('Đơn HS-261029-0015 đã được xác nhận'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đánh dấu đã đọc' })).toBeInTheDocument()
  })

  it('DaDoc_KhongHienNutDanhDauDaDoc', async () => {
    layCuaToiMock.mockResolvedValue({
      items: [thongBaoMau({ isRead: true })],
      soChuaDoc: 0,
    })

    dungTrang()

    await screen.findByText('Đơn HS-261029-0015 đã được xác nhận')
    // Đã đọc rồi thì không có nút — hiện nút nghĩa là bấm vào không làm gì.
    expect(screen.queryByRole('button', { name: 'Đánh dấu đã đọc' })).not.toBeInTheDocument()
  })

  it('KhongCoChuaDoc_KhongHienNutDanhDauTatCa', async () => {
    layCuaToiMock.mockResolvedValue({
      items: [
        thongBaoMau({ id: 1, isRead: true }),
        // Tiêu đề khác hẳn: hai dòng trùng tên làm `findByText` không biết phải
        // đợi dòng nào.
        thongBaoMau({ id: 2, isRead: true, title: 'Đơn HS-260911-0007: đã trả phòng' }),
      ],
      soChuaDoc: 0,
    })

    dungTrang()

    await screen.findByText('Đơn HS-261029-0015 đã được xác nhận')
    expect(
      screen.queryByRole('button', { name: /Đánh dấu đã đọc tất cả/ }),
    ).not.toBeInTheDocument()
  })

  it('CoChuaDoc_HienNutDanhDauTatCaKemSoLuong', async () => {
    layCuaToiMock.mockResolvedValue({
      items: [thongBaoMau(), thongBaoMau({ id: 2, isRead: false })],
      soChuaDoc: 2,
    })

    dungTrang()

    // Con số trên nút phải khớp badge, không phải số dòng trong danh sách.
    expect(
      await screen.findByRole('button', { name: 'Đánh dấu đã đọc tất cả (2)' }),
    ).toBeInTheDocument()
  })

  it('KhongHienKhoaThongBao', async () => {
    layCuaToiMock.mockResolvedValue({ items: [thongBaoMau()], soChuaDoc: 1 })

    dungTrang()

    await screen.findByText('Đơn HS-261029-0015 đã được xác nhận')
    // Khoá thông báo là thứ **không** được lộ ra giao diện (AGENTS.md 6.3).
    expect(screen.queryByText(/^\s*Id:\s*1\s*$/)).not.toBeInTheDocument()
  })
})

describe('Notifications - thao tac', () => {
  it('BamDanhDauDaDoc_GoiDungThongBao', async () => {
    layCuaToiMock.mockResolvedValue({ items: [thongBaoMau()], soChuaDoc: 1 })
    danhDauDaDocMock.mockResolvedValue(undefined)

    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc' }))

    await waitFor(() => {
      expect(danhDauDaDocMock).toHaveBeenCalledWith(1)
    })
  })

  it('BamDanhDauTatCa_GoiDungMotLan', async () => {
    layCuaToiMock.mockResolvedValue({ items: [thongBaoMau()], soChuaDoc: 1 })
    danhDauTatCaMock.mockResolvedValue(1)

    dungTrang()

    fireEvent.click(await screen.findByRole('button', { name: 'Đánh dấu đã đọc tất cả (1)' }))

    await waitFor(() => {
      expect(danhDauTatCaMock).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Notifications - trang thai', () => {
  it('ChuaTai_HienKhungXương', async () => {
    layCuaToiMock.mockReturnValue(new Promise(() => {}))

    const { container } = dungTrang()

    await waitFor(() => {
      expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(0)
    })
  })

  it('LoiApi_HienThongBaoVaNutThuLai', async () => {
    layCuaToiMock.mockRejectedValue(new Error('Khong ket noi duoc may chu'))

    dungTrang()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument()
    })
  })

  it('KhongCoDuLieu_HienHuongDan', async () => {
    layCuaToiMock.mockResolvedValue({ items: [], soChuaDoc: 0 })

    dungTrang()

    expect(await screen.findByText('Chưa có thông báo nào')).toBeInTheDocument()
  })
})
