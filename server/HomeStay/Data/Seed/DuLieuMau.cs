using HomeStay.Entities;
using HomeStay.Enums;
using HomeStay.Services.Booking;
using HomeStay.Services.Notifications;

namespace HomeStay.Data.Seed;

/// <summary>
/// Bộ dữ liệu mẫu của dự án: 4 tài khoản · 3 địa điểm · 12 phòng · 8 tiện nghi · 15 đơn · 6 đánh giá.
/// Mỗi phòng có 4 ảnh chụp của chính căn phòng đó (nguồn ảnh: docs/NGUON_ANH.md).
///
/// Vì sao không nhập tay vào database: nhập tay thì mỗi lần xoá bảng là phải làm lại từ đầu,
/// và không ai kiểm tra được dữ liệu mẫu có đúng luật nghiệp vụ không (không trùng lịch, đủ sức chứa, đủ 6 trạng thái).
/// Để ở đây thì chạy 1 lệnh là có dữ liệu, và có thể kiểm chứng bằng unit test.
///
/// Mốc thời gian được tính TƯƠNG ĐỐI so với lúc chạy, không ghi cứng ngày tháng.
/// Lý do: nếu ghi cứng "15/09/2026" thì vài tuần sau nhìn lại toàn đơn đã nằm trong quá khứ,
/// dữ liệu trình diễn sẽ chết và biểu đồ doanh thu trống trơn.
/// </summary>
public static class DuLieuMau
{
    /// <summary>Mật khẩu chung cho mọi tài khoản mẫu — dùng để đăng nhập thử nhanh khi bảo vệ đồ án.</summary>
    public const string MatKhauChung = "123456";

    /// <summary>Độ khó BCrypt. 11 là mức cân bằng giữa an toàn và tốc độ đăng nhập.</summary>
    private const int DoKhoBcrypt = 11;

    /// <summary>
    /// 4 tài khoản: 1 Admin + 3 khách.
    /// Tài khoản cuối cố tình để trạng thái LOCKED để khi demo luồng đăng nhập sẽ thấy ngay
    /// thông báo "tài khoản đã bị khoá" chứ không phải báo sai mật khẩu.
    /// </summary>
    public static List<User> TaoTaiKhoan()
    {
        return
        [
            new User
            {
                FullName = "Nguyễn Minh Quân", Email = "admin@homestay.vn", PhoneNumber = "0901234567",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(MatKhauChung, DoKhoBcrypt), Role = UserRole.ADMIN,
                Address = "Số 12 Lý Thường Kiệt, phường Hưng Yên", Status = UserStatus.ACTIVE
            },
            new User
            {
                FullName = "Trần Thị Mai", Email = "khach1@gmail.com", PhoneNumber = "0912345678",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(MatKhauChung, DoKhoBcrypt), Role = UserRole.CUSTOMER,
                Address = "Số 45 Nguyễn Trãi, phường Hưng Yên", Status = UserStatus.ACTIVE
            },
            new User
            {
                FullName = "Lê Hoàng Nam", Email = "khach2@gmail.com", PhoneNumber = "0923456789",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(MatKhauChung, DoKhoBcrypt), Role = UserRole.CUSTOMER,
                Address = "Số 7 Trần Phú, phường Hưng Yên", Status = UserStatus.ACTIVE
            },
            new User
            {
                FullName = "Phạm Quốc Bảo", Email = "khach3@gmail.com", PhoneNumber = "0934567890",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(MatKhauChung, DoKhoBcrypt), Role = UserRole.CUSTOMER,
                Address = "Số 203 Điện Biên Phủ, phường Hưng Yên", Status = UserStatus.LOCKED
            }
        ];
    }

    /// <summary>3 địa điểm homestay. Thứ tự trong danh sách là thứ tự chỉ số dùng ở <see cref="TaoPhong"/>.</summary>
    public static List<Location> TaoDiaDiem()
    {
        return
        [
            new Location
            {
                Name = "Hưng Yên Ven Biển", City = "Hưng Yên", Province = "Hưng Yên",
                Address = "Đường Lê Văn Lương, phường Hưng Yên", ImageUrl = "/images/locations/hung-yen.svg",
                Description = "Homestay cách biển Hưng Yên 300 m, thích hợp nghỉ ngắn ngày cuối tuần."
            },
            new Location
            {
                Name = "Đà Lạt Đồi Thông", City = "Đà Lạt", Province = "Lâm Đồng",
                Address = "Đường Đặng Thùy Trâm, phường 3, thành phố Đà Lạt", ImageUrl = "/images/locations/da-lat.svg",
                Description = "Homestay trên đồi, không khí mát mẻ quanh năm, phù hợp tiệc cưới gia đình."
            },
            new Location
            {
                Name = "Hội An Phố Cổ", City = "Hội An", Province = "Quảng Nam",
                Address = "Phố cổ Hội An, phường Hội An", ImageUrl = "/images/locations/hoi-an.svg",
                Description = "Nhà cổ cách phố cổ 5 phút đi bộ, tiện tham quan chợ phiếu và ẩm thực."
            }
        ];
    }

    /// <summary>8 tiện nghi dùng chung — thứ tự là chỉ số trong <see cref="TaoLienKetTienNghi"/>.</summary>
    public static List<Amenity> TaoTienNghi()
    {
        return
        [
            new Amenity { Name = "WiFi miễn phí", Icon = "wifi", Description = "Không giới hạn thiết bị" },
            new Amenity { Name = "Máy lạnh", Icon = "air-conditioner", Description = "Điều hòa inverter" },
            new Amenity { Name = "Nhà tắm riêng", Icon = "bath", Description = "Vòi nước nóng trong phòng" },
            new Amenity { Name = "Giường king", Icon = "bed", Description = "Nệm 1m8, chăn gối mới" },
            new Amenity { Name = "Bồn tắm nước nóng", Icon = "hot-tub", Description = "Bồn tắm thư giã" },
            new Amenity { Name = "Bếp chung", Icon = "kitchen", Description = "Dụng cụ nấu ăn đầy đủ" },
            new Amenity { Name = "Bàn làm việc", Icon = "desk", Description = "Có ổ cắm và đèn học" },
            new Amenity { Name = "Chỗ đỗ xe máy", Icon = "parking", Description = "Đỗ xe miễn phí trong sân" }
        ];
    }

    /// <summary>
    /// Ghép 12 phòng từ 3 địa điểm, mỗi địa điểm 4 phòng. Chia theo địa điểm để mỗi hàm
    /// nằm gọn trong một nhóm phòng, dễ đối chiếu khi sửa giá hoặc thêm phòng mới.
    /// </summary>
    public static List<Room> TaoPhong(List<Location> diaDiemList)
    {
        if (diaDiemList.Count != 3)
        {
            throw new ArgumentException("Dữ liệu mẫu cần đúng 3 địa điểm.", nameof(diaDiemList));
        }

        List<Room> phongList = [];
        phongList.AddRange(TaoPhongVenBien(diaDiemList[0]));
        phongList.AddRange(TaoPhongDaLat(diaDiemList[1]));
        phongList.AddRange(TaoPhongPhoCo(diaDiemList[2]));

        return phongList;
    }

    private static List<Room> TaoPhongVenBien(Location diaDiem)
    {
        return
        [
            new Room
            {
                Location = diaDiem, Name = "Phòng Hạnh Phúc", RoomNumber = "A101", RoomType = RoomType.COZY,
                Capacity = 2, PricePerHour = 90_000m, PricePerDay = 550_000m, Status = RoomStatus.AVAILABLE,
                Description = "Ban công riêng hướng công viên, hợp khách đi dã ngoại."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Bình Minh", RoomNumber = "A102", RoomType = RoomType.COZY,
                Capacity = 2, PricePerHour = 85_000m, PricePerDay = 520_000m, Status = RoomStatus.CLEANING,
                Description = "Sau khi trả phòng cần 2 giờ vệ sinh trước khi nhận khách mới."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Hải Yến", RoomNumber = "A201", RoomType = RoomType.JAPANDI,
                Capacity = 3, PricePerHour = 130_000m, PricePerDay = 850_000m, Status = RoomStatus.AVAILABLE,
                Description = "Ban công hướng biển, thích hợp nhóm 3 người."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Xuân Hương", RoomNumber = "A301", RoomType = RoomType.SIGNATURE,
                Capacity = 5, PricePerHour = 180_000m, PricePerDay = 1_250_000m, Status = RoomStatus.AVAILABLE,
                Description = "Phòng lớn 2 giường, có khu sinh hoạt chung cho cả gia đình."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Gió Mùa", RoomNumber = "A401", RoomType = RoomType.COZY,
                Capacity = 2, PricePerHour = 80_000m, PricePerDay = 490_000m, Status = RoomStatus.AVAILABLE,
                Description = "Góc trên lầu, có giường tầng cho bạn bè đi chơi cùng."
            }
        ];
    }

    private static List<Room> TaoPhongDaLat(Location diaDiem)
    {
        return
        [
            new Room
            {
                Location = diaDiem, Name = "Phòng Sương Mù", RoomNumber = "B101", RoomType = RoomType.JAPANDI,
                Capacity = 2, PricePerHour = 150_000m, PricePerDay = 950_000m, Status = RoomStatus.BOOKED,
                Description = "Cửa sổ toàn cảnh thung lũng, yên tĩnh, hợp làm việc."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Hoa Tử Đài", RoomNumber = "B102", RoomType = RoomType.COZY,
                Capacity = 2, PricePerHour = 100_000m, PricePerDay = 600_000m, Status = RoomStatus.MAINTENANCE,
                Description = "Đang sửa điều hòa, tạm thời không nhận đặt phòng."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Đồi Thông", RoomNumber = "B201", RoomType = RoomType.SIGNATURE,
                Capacity = 4, PricePerHour = 200_000m, PricePerDay = 1_350_000m, Status = RoomStatus.AVAILABLE,
                Description = "Nhà 2 tầng, thích hợp tiệc cưới gia đình nhỏ."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Mộng Mơ", RoomNumber = "B301", RoomType = RoomType.JAPANDI,
                Capacity = 2, PricePerHour = 140_000m, PricePerDay = 880_000m, Status = RoomStatus.AVAILABLE,
                Description = "Sàn gỗ ấm, hợp khách muốn ngồi đọc sách cả buổi chiều."
            }
        ];
    }

    private static List<Room> TaoPhongPhoCo(Location diaDiem)
    {
        return
        [
            new Room
            {
                Location = diaDiem, Name = "Phòng Đèn Lồng", RoomNumber = "C101", RoomType = RoomType.COZY,
                Capacity = 2, PricePerHour = 95_000m, PricePerDay = 580_000m, Status = RoomStatus.OCCUPIED,
                Description = "Khách đang ở lại, không nhận đặt thêm trong lúc thuê."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Gốm Sứ", RoomNumber = "C102", RoomType = RoomType.JAPANDI,
                Capacity = 3, PricePerHour = 145_000m, PricePerDay = 900_000m, Status = RoomStatus.AVAILABLE,
                Description = "Trang trí theo phong cách gốm Hội An, tầng 2 có ban công."
            },
            new Room
            {
                Location = diaDiem, Name = "Phòng Chèo Xe", RoomNumber = "C201", RoomType = RoomType.SIGNATURE,
                Capacity = 4, PricePerHour = 250_000m, PricePerDay = 1_800_000m, Status = RoomStatus.BOOKED,
                Description = "Phòng hạng nhà, có phòng khách riêng và bồn tắm nước nóng."
            }
        ];
    }

    /// <summary>
    /// Bộ 4 ảnh của từng phòng, theo đúng thứ tự phòng trong <see cref="TaoPhong"/>.
    /// Mỗi dòng là 4 góc khác nhau **của cùng một phòng thật**, ảnh chụp bởi cơ quan
    /// nhà nước Hoa Kỳ hoặc khách sạn, giấy phép CC0 / public domain.
    /// Nguồn và nội dung từng bộ ghi ở <c>docs/NGUON_ANH.md</c>.
    ///
    /// Gắn ảnh theo từng phòng chứ không theo concept là để khách xem thấy đúng
    /// căn phòng mình sẽ ở: bấm vào phòng nào thì thấy chính phòng đó, không phải
    /// một căn tương tự. Ảnh đầu tiên của mỗi dòng là ảnh chính hiện ở danh sách.
    /// </summary>
    private static readonly string[][] DuongDanAnhTheoPhong =
    {
        ["/images/rooms/cove-patrol-cabin/cove-patrol-cabin-1.jpg",
         "/images/rooms/cove-patrol-cabin/cove-patrol-cabin-2.jpg",
         "/images/rooms/cove-patrol-cabin/cove-patrol-cabin-3.jpg",
         "/images/rooms/cove-patrol-cabin/cove-patrol-cabin-4.jpg"],
        ["/images/rooms/harebell-patrol-cabin/harebell-patrol-cabin-1.jpg",
         "/images/rooms/harebell-patrol-cabin/harebell-patrol-cabin-2.jpg",
         "/images/rooms/harebell-patrol-cabin/harebell-patrol-cabin-3.jpg",
         "/images/rooms/harebell-patrol-cabin/harebell-patrol-cabin-4.jpg"],
        ["/images/rooms/cache-creek-patrol-cabin/cache-creek-patrol-cabin-1.jpg",
         "/images/rooms/cache-creek-patrol-cabin/cache-creek-patrol-cabin-2.jpg",
         "/images/rooms/cache-creek-patrol-cabin/cache-creek-patrol-cabin-3.jpg",
         "/images/rooms/cache-creek-patrol-cabin/cache-creek-patrol-cabin-4.jpg"],
        ["/images/rooms/peale-island-cabin/peale-island-cabin-1.jpg",
         "/images/rooms/peale-island-cabin/peale-island-cabin-2.jpg",
         "/images/rooms/peale-island-cabin/peale-island-cabin-3.jpg",
         "/images/rooms/peale-island-cabin/peale-island-cabin-4.jpg"],
        ["/images/rooms/mary-lake-patrol-cabin/mary-lake-patrol-cabin-1.jpg",
         "/images/rooms/mary-lake-patrol-cabin/mary-lake-patrol-cabin-2.jpg",
         "/images/rooms/mary-lake-patrol-cabin/mary-lake-patrol-cabin-3.jpg",
         "/images/rooms/mary-lake-patrol-cabin/mary-lake-patrol-cabin-4.jpg"],
        ["/images/rooms/fox-creek-patrol-cabin/fox-creek-patrol-cabin-1.jpg",
         "/images/rooms/fox-creek-patrol-cabin/fox-creek-patrol-cabin-2.jpg",
         "/images/rooms/fox-creek-patrol-cabin/fox-creek-patrol-cabin-3.jpg",
         "/images/rooms/fox-creek-patrol-cabin/fox-creek-patrol-cabin-4.jpg"],
        ["/images/rooms/superior-1-bedroom-suite/superior-1-bedroom-suite-1.jpg",
         "/images/rooms/superior-1-bedroom-suite/superior-1-bedroom-suite-2.jpg",
         "/images/rooms/superior-1-bedroom-suite/superior-1-bedroom-suite-3.jpg",
         "/images/rooms/superior-1-bedroom-suite/superior-1-bedroom-suite-4.jpg"],
        ["/images/rooms/sportsman-lake-patrol-cabin/sportsman-lake-patrol-cabin-1.jpg",
         "/images/rooms/sportsman-lake-patrol-cabin/sportsman-lake-patrol-cabin-2.jpg",
         "/images/rooms/sportsman-lake-patrol-cabin/sportsman-lake-patrol-cabin-3.jpg",
         "/images/rooms/sportsman-lake-patrol-cabin/sportsman-lake-patrol-cabin-4.jpg"],
        ["/images/rooms/outlet-patrol-cabin/outlet-patrol-cabin-1.jpg",
         "/images/rooms/outlet-patrol-cabin/outlet-patrol-cabin-2.jpg",
         "/images/rooms/outlet-patrol-cabin/outlet-patrol-cabin-3.jpg",
         "/images/rooms/outlet-patrol-cabin/outlet-patrol-cabin-4.jpg"],
        ["/images/rooms/lower-blacktail-patrol-cabin/lower-blacktail-patrol-cabin-1.jpg",
         "/images/rooms/lower-blacktail-patrol-cabin/lower-blacktail-patrol-cabin-2.jpg",
         "/images/rooms/lower-blacktail-patrol-cabin/lower-blacktail-patrol-cabin-3.jpg",
         "/images/rooms/lower-blacktail-patrol-cabin/lower-blacktail-patrol-cabin-4.jpg"],
        ["/images/rooms/nha-o-hai-phong-ngu/nha-o-hai-phong-ngu-1.jpg",
         "/images/rooms/nha-o-hai-phong-ngu/nha-o-hai-phong-ngu-2.jpg",
         "/images/rooms/nha-o-hai-phong-ngu/nha-o-hai-phong-ngu-3.jpg",
         "/images/rooms/nha-o-hai-phong-ngu/nha-o-hai-phong-ngu-4.jpg"],
        ["/images/rooms/select-2-bedroom-suite/select-2-bedroom-suite-1.jpg",
         "/images/rooms/select-2-bedroom-suite/select-2-bedroom-suite-2.jpg",
         "/images/rooms/select-2-bedroom-suite/select-2-bedroom-suite-3.jpg",
         "/images/rooms/select-2-bedroom-suite/select-2-bedroom-suite-4.jpg"]
    };

    /// <summary>Mỗi phòng có 4 ảnh của chính phòng đó: 1 ảnh chính + 3 ảnh phụ.</summary>
    public static List<RoomImage> TaoAnhPhong(List<Room> phongList)
    {
        if (phongList.Count != DuongDanAnhTheoPhong.Length)
        {
            throw new ArgumentException(
                $"Bảng ảnh mô tả {DuongDanAnhTheoPhong.Length} phòng nhưng lại có {phongList.Count} phòng.",
                nameof(phongList));
        }

        List<RoomImage> anhList = [];

        for (int i = 0; i < phongList.Count; i++)
        {
            Room phong = phongList[i];

            for (int j = 0; j < DuongDanAnhTheoPhong[i].Length; j++)
            {
                anhList.Add(new RoomImage
                {
                    Room = phong,
                    ImageUrl = DuongDanAnhTheoPhong[i][j],
                    IsPrimary = j == 0,
                    SortOrder = j
                });
            }
        }

        return anhList;
    }

    /// <summary>Số chỉ số tiện nghi của từng phòng, theo đúng thứ tự phòng trong <see cref="TaoPhong"/>.</summary>
    private static readonly int[][] TienNghiTheoPhong =
    [
        [1, 2, 3, 4, 8],
        [1, 2, 3, 4, 8],
        [1, 2, 3, 4, 5, 8],
        [1, 2, 3, 4, 6, 7, 8],
        [1, 2, 3, 4, 5, 8],
        [1, 2, 3, 4, 8],
        [1, 2, 3, 4, 6, 7, 8],
        [1, 2, 3, 4, 5, 7, 8],
        [1, 2, 3, 4, 8],
        [1, 2, 3, 4, 5, 7, 8],
        [1, 2, 3, 4, 6, 7, 8],
        [1, 2, 3, 4, 5, 7, 8]
    ];

    /// <summary>Nối phòng với tiện nghi. Mỗi phòng có tiện nghi chung và vài tiện nghi riêng theo loại phòng.</summary>
    public static List<RoomAmenity> TaoLienKetTienNghi(List<Room> phongList, List<Amenity> tienNghiList)
    {
        if (phongList.Count != TienNghiTheoPhong.Length)
        {
            throw new ArgumentException(
                $"Bảng tiện nghi mô tả {TienNghiTheoPhong.Length} phòng nhưng lại có {phongList.Count} phòng.",
                nameof(phongList));
        }

        List<RoomAmenity> lienKetList = [];

        for (int i = 0; i < phongList.Count; i++)
        {
            foreach (int soTienNghi in TienNghiTheoPhong[i])
            {
                lienKetList.Add(new RoomAmenity { Room = phongList[i], Amenity = tienNghiList[soTienNghi - 1] });
            }
        }

        return lienKetList;
    }

    /// <summary>
    /// Một dòng mô tả đơn đặt phòng mẫu. Dùng bản ghi này để khai báo cho gọn chữ,
    /// sau đó mới đổi thành entity <see cref="Booking"/> ở <see cref="TaoBooking"/>.
    ///
    /// Phòng được ghi bằng <c>MaPhong</c> ("A101") chứ không phải số thứ tự. Trước đây
    /// dùng chỉ số nên chỉ cần thêm một phòng vào giữa danh sách là mọi đơn phía sau
    /// trỏ nhầm sang phòng khác — đã xảy ra và test bắt được. Mã phòng không đổi khi
    /// thêm, xoá hay sắp xếp lại phòng.
    /// </summary>
    private sealed record DonMau(
        int SoTaiKhoan,
        string MaPhong,
        BookingType Loai,
        DateTime CheckIn,
        DateTime CheckOut,
        DateTime TaoDon,
        int SoKhach,
        BookingStatus TrangThai,
        string? GhiChu = null,
        string? LyDoHuy = null);

    /// <summary>Đường đi chuẩn của một đơn: PENDING → CONFIRMED → CHECKED_IN → COMPLETED.</summary>
    private static readonly BookingStatus[] DuongDiTrangThaiChuan =
        [BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED];

    /// <summary>9 đơn đã kết thúc: 7 hoàn thành, 1 khách huỷ, 1 Admin từ chối. Rải từ 4 tháng trở lại.</summary>
    private static List<DonMau> TaoDonDaKetThuc(DateTime now)
    {
        int nhanPhong = BookingRules.StandardCheckInHour;
        int traPhong = BookingRules.StandardCheckOutHour;
        DateTime Luc(int soNgay, int gio) => now.Date.AddDays(soNgay).AddHours(gio);

        return
        [
            new(2, "A101", BookingType.DAY, Luc(-119, nhanPhong), Luc(-117, traPhong), Luc(-121, 9), 2,
                BookingStatus.COMPLETED, "Đi cùng gia đình nghỉ cuối tuần"),
            new(3, "B101", BookingType.HOUR, Luc(-112, 15), Luc(-112, 20), Luc(-114, 10), 2,
                BookingStatus.COMPLETED, "Họp nhóm, cần phòng yên tĩnh để làm việc"),
            new(4, "B201", BookingType.DAY, Luc(-98, nhanPhong), Luc(-94, traPhong), Luc(-101, 9), 4,
                BookingStatus.COMPLETED, "Đi cắm trại rừng cả nhà"),
            new(2, "A201", BookingType.DAY, Luc(-84, nhanPhong), Luc(-81, traPhong), Luc(-88, 9), 2,
                BookingStatus.COMPLETED, "Đi biển cùng bạn bè"),
            new(3, "C102", BookingType.HOUR, Luc(-70, 14), Luc(-70, 19), Luc(-72, 10), 3,
                BookingStatus.COMPLETED, "Tham quan phố cổ lúc chiều tà"),
            new(4, "A102", BookingType.HOUR, now.AddHours(-5), now.AddHours(-1), Luc(-2, 8), 2,
                BookingStatus.COMPLETED, "Nghỉ ngắm biển vài tiếng giữa chuyến đi"),
            new(2, "B102", BookingType.DAY, Luc(-20, nhanPhong), Luc(-18, traPhong), Luc(-23, 9), 2,
                BookingStatus.COMPLETED, "Ngắm hoa Tử Đài"),
            new(2, "A301", BookingType.DAY, Luc(-35, nhanPhong), Luc(-33, traPhong), Luc(-37, 14), 5,
                BookingStatus.CANCELLED, "Gia đình đổi kế hoạch", "Khách báo đổi lịch, hẹn đặt lại lần sau"),
            new(4, "C201", BookingType.DAY, Luc(-28, nhanPhong), Luc(-26, traPhong), Luc(-30, 16), 2,
                BookingStatus.REJECTED, "Mong muốn mang theo chó cảnh", "Homestay không nhận thú cưng")
        ];
    }

    /// <summary>
    /// 6 đơn còn hiệu lực: 1 khách đang ở trong phòng, 2 đã xác nhận, 3 chờ Admin xác nhận.
    /// Trạng thái phòng tương ứng: C101 = OCCUPIED, B101 và C201 = BOOKED.
    /// </summary>
    private static List<DonMau> TaoDonDangXuLy(DateTime now)
    {
        int nhanPhong = BookingRules.StandardCheckInHour;
        int traPhong = BookingRules.StandardCheckOutHour;
        DateTime Luc(int soNgay, int gio) => now.Date.AddDays(soNgay).AddHours(gio);

        return
        [
            new(3, "C101", BookingType.DAY, Luc(-1, nhanPhong), Luc(1, traPhong), Luc(-3, 9), 2,
                BookingStatus.CHECKED_IN, "Ngắm phố cổ ban đêm"),
            new(2, "B101", BookingType.DAY, Luc(3, nhanPhong), Luc(5, traPhong), Luc(-2, 10), 2,
                BookingStatus.CONFIRMED, "Khách quen, thuê dài ngày"),
            new(4, "C201", BookingType.DAY, Luc(9, nhanPhong), Luc(11, traPhong), Luc(-1, 16), 4,
                BookingStatus.CONFIRMED, "Cả nhóm đi Hội An 4 ngày"),
            new(3, "A301", BookingType.HOUR, now.AddHours(6), now.AddHours(11), now.AddHours(-1), 4,
                BookingStatus.PENDING, "Đặt phòng theo giờ chờ tàu"),
            new(4, "A101", BookingType.DAY, Luc(4, nhanPhong), Luc(6, traPhong), now.AddHours(-3), 2,
                BookingStatus.PENDING, "Đặt trước cho chuyến đi sắp tới"),
            new(2, "A201", BookingType.HOUR, Luc(30, 15), Luc(30, 19), now.AddHours(-2), 2,
                BookingStatus.PENDING, "Đặt trước phòng cho ngày sinh nhật")
        ];
    }

    public static List<Booking> TaoDon(List<User> taiKhoanList, List<Room> phongList, DateTime now)
    {
        List<DonMau> danhSach = [.. TaoDonDaKetThuc(now), .. TaoDonDangXuLy(now)];

        return danhSach
            .Select((mau, chiSo) => TaoBooking(mau, taiKhoanList, phongList, chiSo + 1))
            .ToList();
    }

    /// <summary>
    /// Đổi một dòng mô tả thành đơn thật. Mã đơn sinh từ ngày nhận phòng và số thứ tự
    /// nên luôn duy nhất mà không cần đếm sẵn trong database.
    /// </summary>
    private static Booking TaoBooking(DonMau mau, List<User> taiKhoanList, List<Room> phongList, int soThu)
    {
        Room phong = phongList.FirstOrDefault(p => p.RoomNumber == mau.MaPhong)
            ?? throw new InvalidOperationException($"Đơn mẫu tham chiếu phòng '{mau.MaPhong}' không tồn tại.");
        User khach = taiKhoanList[mau.SoTaiKhoan - 1];

        return new Booking
        {
            Code = $"HS-{mau.CheckIn:yyMMdd}-{soThu:D4}", User = khach, Room = phong,
            BookingType = mau.Loai, CheckIn = mau.CheckIn, CheckOut = mau.CheckOut,
            GuestCount = mau.SoKhach, Status = mau.TrangThai, Note = mau.GhiChu, CancelReason = mau.LyDoHuy,
            PricePerHourSnapshot = phong.PricePerHour, PricePerDaySnapshot = phong.PricePerDay,
            TotalAmount = BookingCalculator.TinhTien(
                mau.Loai, phong.PricePerHour, phong.PricePerDay, mau.CheckIn, mau.CheckOut),
            CreatedAt = mau.TaoDon, UpdatedAt = mau.TaoDon
        };
    }

    /// <summary>Suy ra chuỗi trạng thái để một đơn đi từ PENDING tới trạng thái đích, khớp đúng luồng thật.</summary>
    private static List<(BookingStatus? Tu, BookingStatus Den)> LayDuongDiTrangThai(BookingStatus trangThaiDich)
    {
        // Huỷ và từ chối rẽ nhánh ngay từ PENDING, không đi qua bước xác nhận.
        if (trangThaiDich is BookingStatus.CANCELLED or BookingStatus.REJECTED)
        {
            return [(null, BookingStatus.PENDING), (BookingStatus.PENDING, trangThaiDich)];
        }

        int soBuoc = Array.IndexOf(DuongDiTrangThaiChuan, trangThaiDich) + 1;
        if (soBuoc == 0)
        {
            throw new ArgumentOutOfRangeException(nameof(trangThaiDich), trangThaiDich, "Trạng thái không hợp lệ.");
        }

        List<(BookingStatus? Tu, BookingStatus Den)> duongDi = [(null, BookingStatus.PENDING)];
        for (int buoc = 1; buoc < soBuoc; buoc++)
        {
            duongDi.Add((DuongDiTrangThaiChuan[buoc - 1], DuongDiTrangThaiChuan[buoc]));
        }

        return duongDi;
    }

    /// <summary>Admin thực hiện khi xác nhận, từ chối, nhận phòng, trả phòng; các bước còn lại là của khách.</summary>
    private static bool DoAdminThucHien(BookingStatus trangThai)
    {
        return trangThai is BookingStatus.CONFIRMED or BookingStatus.REJECTED
            or BookingStatus.CHECKED_IN or BookingStatus.COMPLETED;
    }

    /// <summary>Mô tả ai làm gì ở từng bước, để đọc lại lịch sử đơn là hiểu ngay không cần dựng vào sơ đồ.</summary>
    private static string GhiChuChuyenTrangThai(BookingStatus trangThai)
    {
        return trangThai switch
        {
            BookingStatus.PENDING => "Khách tạo đơn đặt phòng",
            BookingStatus.CONFIRMED => "Admin xác nhận đơn đặt phòng",
            BookingStatus.CHECKED_IN => "Khách nhận phòng",
            BookingStatus.COMPLETED => "Khách trả phòng, hoàn tất đơn",
            BookingStatus.CANCELLED => "Khách huỷ đơn đặt phòng",
            BookingStatus.REJECTED => "Admin từ chối đơn đặt phòng",
            _ => throw new ArgumentOutOfRangeException(nameof(trangThai), trangThai, "Trạng thái chưa có mô tả.")
        };
    }

    public static List<BookingStatusHistory> TaoLichSuTrangThai(List<Booking> donList, List<User> taiKhoanList)
    {
        User admin = taiKhoanList.First(x => x.Role == UserRole.ADMIN);
        List<BookingStatusHistory> lichSuList = [];

        foreach (Booking don in donList)
        {
            List<(BookingStatus? Tu, BookingStatus Den)> duongDi = LayDuongDiTrangThai(don.Status);

            for (int buoc = 0; buoc < duongDi.Count; buoc++)
            {
                BookingStatus denTrangThai = duongDi[buoc].Den;
                lichSuList.Add(new BookingStatusHistory
                {
                    Booking = don, FromStatus = duongDi[buoc].Tu, ToStatus = denTrangThai,
                    ChangedByUser = DoAdminThucHien(denTrangThai) ? admin : don.User,
                    Note = GhiChuChuyenTrangThai(denTrangThai), ChangedAt = don.CreatedAt.AddHours(3 * buoc)
                });
            }
        }

        return lichSuList;
    }

    /// <summary>6 đánh giá: 5 hiển thị và 1 bị Admin ẩn vì lời viết vi phạm.</summary>
    public static List<Review> TaoDanhGia(List<Booking> donList)
    {
        (int SoDon, int SoSao, string NoiDung, bool An)[] bang =
        [
            (1, 5, "Sạch sẽ, thoáng mát, nhân viên hỗ trợ rất nhiệt tình.", false),
            (2, 4, "Phòng ổn, chỉ hơi xa trung tâm một chút.", false),
            (3, 5, "Không gian yên tĩnh, hợp để cả gia đình nghỉ ngơi.", false),
            (4, 4, "Giá hợp lý so với chất lượng, sẽ quay lại.", false),
            (5, 3, "Phòng bị bẩn, nhân viên phản hồi chậm.", true),
            (7, 5, "Cảnh đẹp, giá rẻ, chắc chắn quay lại.", false)
        ];

        List<Review> danhGiaList = [];

        foreach ((int soDon, int soSao, string noiDung, bool an) in bang)
        {
            Booking don = donList[soDon - 1];

            // Chỉ đơn đã trả phòng mới được đánh giá. Chặn ở đây để dữ liệu mẫu không tạo ra
            // tình huống mà hệ thống thật sẽ không cho phép.
            if (don.Status != BookingStatus.COMPLETED)
            {
                continue;
            }

            danhGiaList.Add(new Review
            {
                Booking = don, User = don.User, Room = don.Room, Rating = soSao,
                Comment = noiDung, IsHidden = an, CreatedAt = don.CheckOut.AddHours(6)
            });
        }

        return danhGiaList;
    }

    /// <summary>
    /// Tính lại điểm trung bình cho từng phòng từ các đánh giá chưa bị ẩn.
    /// Đánh giá bị Admin ẩn thì không tính vào điểm, nhưng vẫn còn trong database để lưu vết.
    /// </summary>
    public static void TinhLaiDiemPhong(List<Room> phongList, List<Review> danhGiaList)
    {
        foreach (Room phong in phongList)
        {
            List<Review> cuaPhong = danhGiaList.Where(x => x.Room == phong && !x.IsHidden).ToList();

            phong.RatingCount = cuaPhong.Count;
            phong.RatingAvg = cuaPhong.Count == 0
                ? 0m
                : Math.Round(cuaPhong.Sum(x => x.Rating) / (decimal)cuaPhong.Count, 2);
        }
    }

    /// <summary>
    /// Tạo phiếu thu cho mỗi đơn đã hoàn thành.
    /// </summary>
    /// <remarks>
    /// Không tạo phiếu cho đơn chờ xác nhận / đang ở / đã hủy / bị từ chối — vì khách chưa
    /// trả tiền thì chưa có giao dịch, đúng như lúc chạy thật (phiếu mở khi đơn chuyển
    /// sang hoàn thành, xem `AdminBookingService.MoPhieuThu`).
    ///
    /// Cố ý để **một vài phiếu ở trạng thái chờ thu**: nếu tất cả đều đã thu thì trang quản
    /// lý phiếu thu không có gì để thao tác, biểu đồ doanh thu cũng chỉ có một kiểu dữ liệu.
    /// Phần lớn đánh dấu đã thu với ngày thu lệch ngày hoàn thành một chút cho khớp thực tế.
    /// </remarks>
    public static List<Payment> TaoPhieuThu(List<Booking> donList, DateTime now)
    {
        List<Payment> ketQua = [];
        int thuTu = 0;

        foreach (Booking don in donList.Where(x => x.Status == BookingStatus.COMPLETED)
                     .OrderBy(x => x.CheckOut))
        {
            thuTu++;
            // Cứ 4 phiếu thì chừa 1 phiếu chờ thu để trang quản lý có việc làm.
            bool conNo = thuTu % 4 == 0;
            DateTime ngayThu = don.CheckOut.Date;

            ketQua.Add(new Payment
            {
                Booking = don,
                Amount = don.TotalAmount,
                Method = PaymentMethod.CASH,
                Status = conNo ? PaymentStatus.PENDING : PaymentStatus.PAID,
                PaidAt = conNo ? null : ngayThu,
                CreatedAt = ngayThu,
                UpdatedAt = ngayThu,
            });
        }

        return ketQua;
    }

    /// <summary>
    /// Sinh thông báo cho các lần Admin chuyển trạng thái đơn.
    /// </summary>
    /// <remarks>
    /// Dựng lại đúng những thông báo mà hệ thống thật sẽ sinh: mỗi dòng lịch sử trạng
    /// thái do Admin thực hiện ứng với một thông báo. Nếu seed tự chế câu chữ riêng thì
    /// dữ liệu mẫu lệch với hành vi thật — và giáo viên bấm thử sẽ thấy không khớp.
    ///
    /// Cố ý để **vài thông báo chưa đọc**: badge trên icon chuông là thứ dễ nhất để
    /// chứng minh tính năng chạy thật, mà tất cả đều đã đọc thì badge luôn bằng 0.
    /// </remarks>
    public static List<Notification> TaoThongBao(
        List<Booking> donList,
        List<BookingStatusHistory> lichSuList)
    {
        // Chỉ những trạng thái mà Admin thao tác mới sinh thông báo (khớp với
        // `NotificationTemplates`). Khách tự huỷ đơn thì không sinh.
        BookingStatus[] trangThaiSinhThongBao =
        [
            BookingStatus.CONFIRMED,
            BookingStatus.CHECKED_IN,
            BookingStatus.COMPLETED,
            BookingStatus.REJECTED,
        ];

        List<Notification> thongBaoList = [];

        foreach (BookingStatusHistory buoc in lichSuList
                     .Where(x => trangThaiSinhThongBao.Contains(x.ToStatus))
                     .OrderBy(x => x.ChangedAt))
        {
            // Tra theo `Booking.Code` chứ không theo `BookingId`: trong lúc seed,
            // thuộc tính khoá ngoại chưa được sinh nên `BookingId` còn bằng 0.
            Booking don = donList.First(x => x.Code == buoc.Booking!.Code);
            (string tieuDe, string noiDung) = NotificationTemplates.Tao(don, buoc.ToStatus, don.CancelReason);

            thongBaoList.Add(new Notification
            {
                // Gắn navigation `User` chứ không điền `UserId`: lúc seed khoá ngoại
                // chưa được sinh nên `don.UserId` còn bằng 0 → MySQL báo lỗi khoá ngoại.
                // EF tự điền khoá từ navigation, giống cách `TaoPhieuThu` gắn `Booking`.
                User = don.User,
                Title = tieuDe,
                Content = noiDung,
                IsRead = false,
                CreatedAt = buoc.ChangedAt,
            });
        }

        // Mặc định coi như đã đọc, rồi chừa lại: cứ 3 cái một cái chưa đọc, cộng thêm
        // 3 thông báo mới nhất. Phải tách hai lượt vì "cái mới nhất" chỉ biết được sau
        // khi đã dựng xong danh sách.
        const int SoChuaDocDinhKy = 3;
        const int SoChuaDocMoiNhat = 3;

        for (int i = 0; i < thongBaoList.Count; i++)
        {
            thongBaoList[i].IsRead = i % SoChuaDocDinhKy != 0;
        }

        foreach (Notification thongBao in thongBaoList
                     .Skip(Math.Max(0, thongBaoList.Count - SoChuaDocMoiNhat)))
        {
            thongBao.IsRead = false;
        }

        return thongBaoList;
    }
}
