using System.Net;
using Microsoft.EntityFrameworkCore;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.DTOs;
using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Auth;

namespace HomeStay.Services.Admin;

/// <summary>
/// Quản lý khách hàng cho Admin.
///
/// Khách vi phạm thì KHOÁ chứ không xoá: lịch sử đơn của họ vẫn cần giữ để
/// Admin tra cứu giao dịch (AGENTS.md — UserStatus.LOCKED).
/// </summary>
public class AdminCustomerService : IAdminCustomerService
{
    private readonly HomeStayDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    /// <summary>Khởi tạo service với DbContext và bộ băm mật khẩu.</summary>
    public AdminCustomerService(HomeStayDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    /// <inheritdoc />
    public async Task<List<CustomerDto>> LayDanhSachAsync(CancellationToken ct)
    {
        // `Bookings.Count` được EF dịch thành subquery COUNT, không tạo N+1
        // (AGENTS.md 6.4). Không dùng AsNoTracking + đếm ở RAM vì `Bookings`
        // không được load, khi đó số đơn luôn ra 0.
        return await _db.Users
            .AsNoTracking()
            .Where(user => user.Role == UserRole.CUSTOMER)
            .OrderBy(user => user.Id)
            .Select(user => new CustomerDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                IsLocked = user.Status == UserStatus.LOCKED,
                CreatedAt = user.CreatedAt,
                TotalBookings = user.Bookings.Count
            })
            .ToListAsync(ct);
    }

    /// <inheritdoc />
    public async Task<CustomerDto> TaoAsync(CustomerCreateRequest request, CancellationToken ct)
    {
        string email = request.Email.Trim().ToLower();
        KiemTraDuLieu(request, email);

        bool daTonTai = await _db.Users.AnyAsync(user => user.Email == email, ct);
        if (daTonTai)
        {
            // 409 thay vì 400: email trùng là xung đột với dữ liệu đang có,
            // không phải dữ liệu sai định dạng (AGENTS.md 6.5).
            throw new AppException(HttpStatusCode.Conflict, ErrorMessages.EmailDaTonTai);
        }

        User khach = new()
        {
            FullName = request.FullName.Trim(),
            Email = email,
            PhoneNumber = request.PhoneNumber,
            PasswordHash = _passwordHasher.Hash(request.Password),
            Role = UserRole.CUSTOMER,
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        _db.Users.Add(khach);
        await _db.SaveChangesAsync(ct);

        return ChuyenDto(khach, soDon: 0);
    }

    /// <inheritdoc />
    public async Task<CustomerDto> DoiTrangThaiAsync(int id, CustomerStatusRequest request, CancellationToken ct)
    {
        User khach = await _db.Users.FindAsync(new object[] { id }, ct)
            ?? throw new AppException(HttpStatusCode.NotFound, ErrorMessages.KhongTimThayKhach);

        // Chặn ở tầng API: nếu không, Admin có thể khoá chính tài khoản đang
        // đăng nhập và tự khoá mình khỏi hệ thống.
        if (khach.Role != UserRole.CUSTOMER)
        {
            throw new AppException(HttpStatusCode.Forbidden, ErrorMessages.KhongDuQuyenThaoTac);
        }

        khach.Status = request.IsLocked ? UserStatus.LOCKED : UserStatus.ACTIVE;
        khach.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        return ChuyenDto(khach, soDon: await _db.Bookings.CountAsync(don => don.UserId == id, ct));
    }

    private static void KiemTraDuLieu(CustomerCreateRequest request, string email)
    {
        if (string.IsNullOrWhiteSpace(request.FullName)
            || request.FullName.Trim().Length > AuthRules.MaxFullNameLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.HoTenRong);
        }

        // Dùng chung EmailValidator với luồng đăng ký, không tự viết lại kiểm tra
        // `Contains('@')` — hai nơi luật khác nhau sẽ ra hai thông báo lỗi khác nhau.
        if (!EmailValidator.IsValid(email))
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.EmailKhongHopLe);
        }

        if (request.Password.Length < AuthRules.MinPasswordLength
            || request.Password.Length > AuthRules.MaxPasswordLength)
        {
            throw new AppException(HttpStatusCode.BadRequest, ErrorMessages.MatKhauQuaNgan);
        }
    }

    private static CustomerDto ChuyenDto(User khach, int soDon)
    {
        return new CustomerDto
        {
            Id = khach.Id,
            FullName = khach.FullName,
            Email = khach.Email,
            PhoneNumber = khach.PhoneNumber,
            IsLocked = khach.Status == UserStatus.LOCKED,
            CreatedAt = khach.CreatedAt,
            TotalBookings = soDon
        };
    }
}
