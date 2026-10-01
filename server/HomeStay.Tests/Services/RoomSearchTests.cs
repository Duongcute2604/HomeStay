using System.Net;
using HomeStay.Common;
using HomeStay.Data;
using HomeStay.Data.Seed;
using HomeStay.DTOs;
using HomeStay.Services.Rooms;
using HomeStay.Tests.Helpers;

namespace HomeStay.Tests.Services;

/// <summary>
/// Kiểm chứng tìm kiếm và lọc phòng: từng bộ lọc, sắp xếp, phân trang,
/// và các tham số không hợp lệ.
///
/// Mỗi test dựng database InMemory riêng (tên ngẫu nhiên) nên không ảnh hưởng
/// lẫn nhau và không cần bật MySQL.
/// </summary>
public class RoomSearchTests
{
    /// <summary>
    /// Số phòng và cơ cấu phòng của dữ liệu mẫu. Gom vào hằng số để thêm hoặc bớt
    /// phòng trong <c>DuLieuMau</c> chỉ phải sửa một chỗ, thay vì rà lại mọi con số
    /// viết cứng rải khắp các test.
    /// </summary>
    private const int TongSoPhong = 12;
    private const int SoPhongDiaDiemDau = 5;   // Hưng Yên
    private const int SoPhongDiaDiemGiua = 4;  // Đà Lạt
    private const int SoPhongDiaDiemCuoi = 3;  // Hội An

    /// <summary>Dựng database đã seed đủ 3 địa điểm + 12 phòng như dữ liệu thật.</summary>
    private static async Task<HomeStayDbContext> TaoDbDaSeedAsync()
    {
        HomeStayDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);
        return db;
    }

    private static RoomService TaoService(HomeStayDbContext db)
    {
        return new RoomService(db);
    }

    private static RoomSearchRequest TaoYeuCau()
    {
        return new RoomSearchRequest { Page = 1, PageSize = 50 };
    }

    // ---------------- Bộ lọc ----------------

    [Fact]
    public async Task SearchAsync_KhongLoc_TraVeCa12Phong()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(TaoYeuCau(), CancellationToken.None);

        Assert.Equal(TongSoPhong, result.TotalItems);
        Assert.Equal(TongSoPhong, result.Items.Count);
        Assert.Equal(1, result.TotalPages);
        // 5 + 4 + 3 = 12: cơ cấu 3 địa điểm phải khớp với dữ liệu mẫu
        Assert.Equal(SoPhongDiaDiemDau + SoPhongDiaDiemGiua + SoPhongDiaDiemCuoi, result.TotalItems);
    }

    [Fact]
    public async Task SearchAsync_LocTheoDiaDiem_ChiTraVePhongCuaDiaDiemDo()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        // Chỉ số 0 = Hưng Yên (cùng thứ tự OrderBy Id với GET /api/locations).
        RoomSearchRequest request = TaoYeuCau();
        request.LocationIndex = 0;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.Equal(SoPhongDiaDiemDau, result.TotalItems);
        Assert.All(result.Items, phong => Assert.Equal("Hưng Yên Ven Biển", phong.LocationName));
    }

    [Fact]
    public async Task SearchAsync_LocationIndexVuotPhamVi_TraVeRong_KhongBaoLoi()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.LocationIndex = 99;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.Equal(0, result.TotalItems);
        Assert.Empty(result.Items);
        Assert.Equal(0, result.TotalPages);
    }

    [Fact]
    public async Task SearchAsync_LocTheoLoaiPhong_ChiTraVeLoaiDo()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.RoomType = (int)HomeStay.Enums.RoomType.JAPANDI;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.NotEmpty(result.Items);
        Assert.All(result.Items, phong => Assert.Equal(HomeStay.Enums.RoomType.JAPANDI, phong.RoomType));
    }

    [Fact]
    public async Task SearchAsync_LocTheoKhoangGia_ChiTraVePhongTrongKhoang()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.MinPrice = 900000;
        request.MaxPrice = 1000000;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.NotEmpty(result.Items);
        Assert.All(
            result.Items,
            phong => Assert.InRange(phong.PricePerDay, 900000, 1000000));
    }

    [Fact]
    public async Task SearchAsync_LocTheoSucChua_ChiTraVePhongChuaDu()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Capacity = 4;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.NotEmpty(result.Items);
        Assert.All(result.Items, phong => Assert.True(phong.Capacity >= 4));
    }

    [Fact]
    public async Task SearchAsync_TuKhoa_KhongPhanBietHoaThuong()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Keyword = "phòng hạnh phúc";

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        // Tên thật là "Phòng Hạnh Phúc" — gõ thường vẫn phải ra.
        Assert.Equal(1, result.TotalItems);
        Assert.Equal("Phòng Hạnh Phúc", result.Items[0].Name);
    }

    [Fact]
    public async Task SearchAsync_TuKhoaKhongCoKetQua_TraVeRong()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Keyword = "tu khoa khong bao gio co";

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.Equal(0, result.TotalItems);
        Assert.Empty(result.Items);
    }

    // ---------------- Sắp xếp ----------------

    [Fact]
    public async Task SearchAsync_SapXepGiaTangDan_DungThuTu()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Sort = RoomSortOptions.PriceAsc;

        List<decimal> gia = (await service.SearchAsync(request, CancellationToken.None))
            .Items.Select(phong => phong.PricePerDay)
            .ToList();

        Assert.Equal(gia.OrderBy(g => g).ToList(), gia);
    }

    [Fact]
    public async Task SearchAsync_SapXepGiaGiamDan_DungThuTu()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Sort = RoomSortOptions.PriceDesc;

        List<decimal> gia = (await service.SearchAsync(request, CancellationToken.None))
            .Items.Select(phong => phong.PricePerDay)
            .ToList();

        Assert.Equal(gia.OrderByDescending(g => g).ToList(), gia);
    }

    // ---------------- Phân trang ----------------

    [Fact]
    public async Task SearchAsync_PhanTrang_Trang2TiepNoiTrang1_KhongTrungNhau()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest trang1 = TaoYeuCau();
        trang1.Page = 1;
        trang1.PageSize = 6;
        RoomSearchRequest trang2 = TaoYeuCau();
        trang2.Page = 2;
        trang2.PageSize = 6;

        PagedResultDto<RoomSearchItemDto> ketQua1 = await service.SearchAsync(trang1, CancellationToken.None);
        PagedResultDto<RoomSearchItemDto> ketQua2 = await service.SearchAsync(trang2, CancellationToken.None);

        Assert.Equal(TongSoPhong, ketQua1.TotalItems);
        Assert.Equal(2, ketQua1.TotalPages);
        Assert.Equal(6, ketQua1.Items.Count);
        Assert.Equal(6, ketQua2.Items.Count);
        // Hai trang không có phòng nào trùng nhau — STT giao diện mới liên tục được.
        Assert.Empty(ketQua1.Items.Select(p => p.Name).Intersect(ketQua2.Items.Select(p => p.Name)));
    }

    // ---------------- Tham số không hợp lệ ----------------

    [Fact]
    public async Task SearchAsync_MinPriceLonHonMaxPrice_ThroiAppException400()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.MinPrice = 1000000;
        request.MaxPrice = 500000;

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.SearchAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task SearchAsync_LoaiPhongNgoaiKhoang_ThroiAppException400()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.RoomType = 99;

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.SearchAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public async Task SearchAsync_SortKhongHopLe_ThroiAppException400()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Sort = "cach sap xep khong co";

        AppException loi = await Assert.ThrowsAsync<AppException>(() =>
            service.SearchAsync(request, CancellationToken.None));

        Assert.Equal(HttpStatusCode.BadRequest, loi.StatusCode);
    }

    [Fact]
    public void SearchAsync_DtoKhongChuaId()
    {
        // Quy tắc bất biến AGENTS.md 6.3 — kiểm bằng reflection để ai thêm `Id`
        // vào DTO thì test đỏ ngay dù code vẫn biên dịch bình thường.
        // Không `async` vì không có gì để chờ — để `async` thừa là warning CS1998.
        Assert.Null(typeof(RoomSearchItemDto).GetProperty("Id"));
        Assert.Null(typeof(RoomSearchItemDto).GetProperty("RoomId"));
        Assert.Null(typeof(RoomSearchItemDto).GetProperty("LocationId"));
    }

    // ---------------- Chỉ số ổn định để link tới chi tiết ----------------

    [Fact]
    public async Task SearchAsync_TraVeChiSoDiaDiemVaPhong_DungThuTuLocations()
    {
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Sort = RoomSortOptions.PriceAsc;

        List<RoomSearchItemDto> items = (await service.SearchAsync(request, CancellationToken.None)).Items;

        // Dù sắp theo giá, chỉ số vẫn neo theo thứ tự OrderBy Id của locations:
        // Hưng Yên = 0 (5 phòng, roomIndex 0–4), Đà Lạt = 1, Hội An = 2.
        var hungYen = items.Where(p => p.LocationName == "Hưng Yên Ven Biển").ToList();
        Assert.Equal(SoPhongDiaDiemDau, hungYen.Count);
        Assert.All(hungYen, p => Assert.Equal(0, p.LocationIndex));
        Assert.Equal(
            Enumerable.Range(0, SoPhongDiaDiemDau).ToArray(),
            hungYen.Select(p => p.RoomIndex).OrderBy(i => i).ToArray());
    }

    [Fact]
    public async Task SearchAsync_ChiSoKhopVoiDanhSachDiaDiem()
    {
        // Trang tìm kiếm link `/locations/{locationIndex}/rooms/{roomIndex}` —
        // test này chứng minh chỉ số trỏ đúng phòng (không đoán bằng tên).
        await using HomeStayDbContext db = await TaoDbDaSeedAsync();
        RoomService roomService = TaoService(db);
        HomeStay.Services.Locations.LocationService locationService = new(db);

        RoomSearchRequest request = TaoYeuCau();
        request.Keyword = "chèo xe";

        RoomSearchItemDto phong = Assert.Single(
            (await roomService.SearchAsync(request, CancellationToken.None)).Items);

        List<LocationListItemDto> diaDiem =
            await locationService.LayDanhSachAsync(CancellationToken.None);

        Assert.Equal("Hội An Phố Cổ", diaDiem[phong.LocationIndex].Name);
        Assert.Equal(phong.Name, diaDiem[phong.LocationIndex].Rooms[phong.RoomIndex].Name);
    }
}
