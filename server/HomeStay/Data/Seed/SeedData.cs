using Microsoft.EntityFrameworkCore;
using HomeStay.Entities;

namespace HomeStay.Data.Seed;

/// <summary>
/// Nạp dữ liệu mẫu vào database ngay khi ứng dụng khởi động.
/// Hàm này chạy lại bao nhiêu lần cũng an toàn: đã có dữ liệu thì bỏ qua, không nhân bản.
/// </summary>
public static class SeedData
{
    /// <summary>
    /// Database đã có dữ liệu mẫu hay chưa.
    /// Dùng bảng Users làm chuẩn vì nó luôn được nạp đầu tiên — bảng này còn rỗng thì chắc chắn chưa seed.
    /// </summary>
    public static Task<bool> DaCoDuLieuAsync(HomeStayDbContext db, CancellationToken ct)
    {
        return db.Users.AnyAsync(ct);
    }

    /// <summary>
    /// Nạp toàn bộ dữ liệu mẫu.
    ///
    /// Tự kiểm tra dữ liệu đã có chưa ngay trong hàm này chứ không để nơi gọi tự kiểm,
    /// để mọi lần gọi đều an toàn — không thể vô tình nạp 2 lần gây trùng dữ liệu.
    ///
    /// Gắn tất cả vào DbContext rồi mới gọi MỘT lần SaveChanges, để EF tự sắp thứ tự chèn
    /// theo quan hệ (tài khoản trước đơn, phòng trước ảnh...). Gọi SaveChanges nhiều lần
    /// thì phải tự nhớ thứ tự, dễ quên một bước là sinh lỗi khoá ngoại.
    /// </summary>
    public static async Task SeedAsync(HomeStayDbContext db, CancellationToken ct)
    {
        if (await DaCoDuLieuAsync(db, ct))
        {
            return;
        }

        DateTime now = DateTime.Now;

        List<User> taiKhoanList = DuLieuMau.TaoTaiKhoan();
        List<Location> diaDiemList = DuLieuMau.TaoDiaDiem();
        List<Amenity> tienNghiList = DuLieuMau.TaoTienNghi();
        List<Room> phongList = DuLieuMau.TaoPhong(diaDiemList);
        List<RoomImage> anhList = DuLieuMau.TaoAnhPhong(phongList);
        List<RoomAmenity> lienKetList = DuLieuMau.TaoLienKetTienNghi(phongList, tienNghiList);
        List<Booking> donList = DuLieuMau.TaoDon(taiKhoanList, phongList, now);
        List<BookingStatusHistory> lichSuList = DuLieuMau.TaoLichSuTrangThai(donList, taiKhoanList);
        List<Review> danhGiaList = DuLieuMau.TaoDanhGia(donList);
        List<Payment> phieuThuList = DuLieuMau.TaoPhieuThu(donList, now);
        List<Notification> thongBaoList = DuLieuMau.TaoThongBao(donList, lichSuList);

        DuLieuMau.TinhLaiDiemPhong(phongList, danhGiaList);

        await db.Users.AddRangeAsync(taiKhoanList, ct);
        await db.Locations.AddRangeAsync(diaDiemList, ct);
        await db.Amenities.AddRangeAsync(tienNghiList, ct);
        await db.Rooms.AddRangeAsync(phongList, ct);
        await db.RoomImages.AddRangeAsync(anhList, ct);
        await db.RoomAmenities.AddRangeAsync(lienKetList, ct);
        await db.Bookings.AddRangeAsync(donList, ct);
        await db.BookingStatusHistory.AddRangeAsync(lichSuList, ct);
        await db.Reviews.AddRangeAsync(danhGiaList, ct);
        await db.Payments.AddRangeAsync(phieuThuList, ct);
        await db.Notifications.AddRangeAsync(thongBaoList, ct);

        await db.SaveChangesAsync(ct);
    }
}
