using HomeStay.Enums;

namespace HomeStay.DTOs;

/// <summary>Dữ liệu tạo hoặc sửa một cơ sở.</summary>
public class FacilityRequest
{
    /// <summary>Tên cơ sở hiển thị cho khách.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Quận/Huyện hoặc khu vực nhỏ hơn.</summary>
    public string City { get; set; } = string.Empty;

    /// <summary>Tỉnh/Thành phố.</summary>
    public string Province { get; set; } = string.Empty;

    /// <summary>Địa chỉ đầy đủ.</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>Mô tả giới thiệu, không bắt buộc.</summary>
    public string? Description { get; set; }

    /// <summary>Đường dẫn ảnh đại diện, không bắt buộc.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Cơ sở còn hiển thị cho khách hay không.</summary>
    public bool IsActive { get; set; } = true;
}

/// <summary>Một cơ sở trả về cho trang quản trị.</summary>
/// <remarks>
/// Có `Id` vì Admin cần khoá để gọi API sửa/xoá. Giao diện KHÔNG hiển thị
/// trường này (AGENTS.md 6.3) — chỉ dùng nội bộ để gọi endpoint.
/// </remarks>
public class AdminLocationDto
{
    /// <summary>Khoá nội bộ, giao diện không hiển thị.</summary>
    public int Id { get; set; }

    /// <summary>Tên cơ sở.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Quận/Huyện.</summary>
    public string City { get; set; } = string.Empty;

    /// <summary>Tỉnh/Thành phố.</summary>
    public string Province { get; set; } = string.Empty;

    /// <summary>Địa chỉ đầy đủ.</summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>Mô tả giới thiệu, có thể null.</summary>
    public string? Description { get; set; }

    /// <summary>Đường dẫn ảnh đại diện, có thể null.</summary>
    public string? ImageUrl { get; set; }

    /// <summary>Cơ sở còn hoạt động hay không.</summary>
    public bool IsActive { get; set; }

    /// <summary>Tổng số phòng đang có tại cơ sở này.</summary>
    public int TotalRooms { get; set; }
}

/// <summary>Một tiện nghi trong danh mục, dùng cho checkbox ở form phòng.</summary>
public class AmenityDto
{
    /// <summary>Khoá tiện nghi, dùng để tick lại khi sửa phòng.</summary>
    public int Id { get; set; }

    /// <summary>Tên tiện nghi hiển thị cho Admin.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Tên icon, có thể null.</summary>
    public string? Icon { get; set; }
}

/// <summary>Dữ liệu tạo hoặc sửa một phòng.</summary>
public class RoomRequest
{
    /// <summary>Cơ sở chứa phòng.</summary>
    public int LocationId { get; set; }

    /// <summary>Tên phòng hiển thị cho khách.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số phòng để phân biện các phòng cùng tên.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Concept phòng (Cozy / Japandi / Signature).</summary>
    public RoomType RoomType { get; set; }

    /// <summary>Số khách tối đa.</summary>
    public int Capacity { get; set; }

    /// <summary>Giá 1 giờ (VNĐ).</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Giá 1 ngày (VNĐ).</summary>
    public decimal PricePerDay { get; set; }

    /// <summary>Mô tả phòng, không bắt buộc.</summary>
    public string? Description { get; set; }

    /// <summary>Đường dẫn ảnh, ảnh đầu tiên là ảnh chính.</summary>
    public List<string> ImageUrls { get; set; } = new();

    /// <summary>Danh sách khoá tiện nghi gắn vào phòng.</summary>
    public List<int> AmenityIds { get; set; } = new();
}

/// <summary>Một phòng trả về cho trang quản trị.</summary>
/// <remarks>Có `Id` để Admin gọi API sửa/xoá; giao diện không hiển thị.</remarks>
public class AdminRoomDto
{
    /// <summary>Khoá nội bộ, giao diện không hiển thị.</summary>
    public int Id { get; set; }

    /// <summary>Tên cơ sở chứa phòng, để Admin không phải tra cứu.</summary>
    public string LocationName { get; set; } = string.Empty;

    /// <summary>Tên phòng.</summary>
    public string Name { get; set; } = string.Empty;

    /// <summary>Số phòng.</summary>
    public string RoomNumber { get; set; } = string.Empty;

    /// <summary>Concept phòng, dạng số — giao diện tự gắn nhãn tiếng Việt.</summary>
    public RoomType RoomType { get; set; }

    /// <summary>Số khách tối đa.</summary>
    public int Capacity { get; set; }

    /// <summary>Giá 1 giờ (VNĐ).</summary>
    public decimal PricePerHour { get; set; }

    /// <summary>Giá 1 ngày (VNĐ).</summary>
    public decimal PricePerDay { get; set; }

    /// <summary>Mô tả phòng, có thể null.</summary>
    public string? Description { get; set; }

    /// <summary>Trạng thái phòng, dạng số — giao diện tự gắn nhãn tiếng Việt.</summary>
    public RoomStatus Status { get; set; }

    /// <summary>Toàn bộ ảnh, ảnh chính đứng đầu.</summary>
    public List<string> Images { get; set; } = new();

    /// <summary>Khoá tiện nghi đang gắn, để form sửa tick lại đúng.</summary>
    public List<int> AmenityIds { get; set; } = new();

    /// <summary>Tên tiện nghi để hiển thị thẻ chip.</summary>
    public List<string> AmenityNames { get; set; } = new();
}

/// <summary>Dữ liệu đổi trạng thái phòng (không sửa các trường khác).</summary>
public class RoomStatusRequest
{
    /// <summary>Trạng thái mới của phòng.</summary>
    public RoomStatus Status { get; set; }
}

/// <summary>Dữ liệu tạo tài khoản khách do Admin nhập tay.</summary>
public class CustomerCreateRequest
{
    /// <summary>Họ và tên.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Email dùng để đăng nhập.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Số điện thoại, không bắt buộc.</summary>
    public string? PhoneNumber { get; set; }

    /// <summary>Mật khẩu tạm, Admin tự đặt rồi báo lại khách.</summary>
    public string Password { get; set; } = string.Empty;
}

/// <summary>Dữ liệu khoá hoặc mở khoá tài khoản khách.</summary>
public class CustomerStatusRequest
{
    /// <summary>True = khoá tài khoản, False = mở khoá.</summary>
    public bool IsLocked { get; set; }
}

/// <summary>Một khách hàng trả về cho trang quản trị.</summary>
public class CustomerDto
{
    /// <summary>Khoá nội bộ, giao diện không hiển thị.</summary>
    public int Id { get; set; }

    /// <summary>Họ và tên.</summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>Email đăng nhập.</summary>
    public string Email { get; set; } = string.Empty;

    /// <summary>Số điện thoại, có thể null.</summary>
    public string? PhoneNumber { get; set; }

    /// <summary>Tài khoản đang bị khoá hay không (ngược của trạng thái).</summary>
    public bool IsLocked { get; set; }

    /// <summary>Thời điểm tạo tài khoản.</summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>Số đơn khách đã đặt, để Admin thấy khách có giao dịch hay không.</summary>
    public int TotalBookings { get; set; }
}
