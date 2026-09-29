import { Link } from 'react-router-dom'

/**
 * Trang 404 — hiện khi gõ sai địa chỉ URL.
 *
 * Không phải trang trang trí: gõ nhầm đường dẫn là việc rất hay xảy ra khi đang
 * thử hệ thống, và trả về trang trắng sẽ khiến người dùng tưởng ứng dụng hỏng.
 */
export default function NotFound(): JSX.Element {
  return (
    <div className="card mx-auto mt-10 max-w-md p-6 text-center">
      <h1 className="text-2xl font-bold text-gray-900">404</h1>
      <p className="mt-2 text-sm text-gray-600">
        Không tìm thấy trang bạn yêu cầu. Đường dẫn có thể đã bị đổi hoặc bị gõ sai.
      </p>

      <Link to="/" className="btn-primary mt-5 inline-flex">
        Về trang chủ
      </Link>
    </div>
  )
}
