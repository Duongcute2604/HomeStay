/**
 * Thông báo lỗi ở đầu form.
 *
 * Tách khỏi lỗi cạnh ô nhập là có chủ ý: lỗi do backend trả về (email đã
 * tồn tại, tài khoản bị khoá, sai mật khẩu) không gắn với một ô nào cụ thể,
 * nên không đặt được cạnh ô. Đưa tất cả vào `Input` sẽ bị bắt buộc chọn ra một
 * ô và báo sai chỗ.
 */
interface Props {
  loi?: string | null | undefined
}

export default function FormMessage({ loi }: Props): JSX.Element | null {
  if (!loi) {
    return null
  }

  return (
    <div
      role="alert"
      className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {loi}
    </div>
  )
}
