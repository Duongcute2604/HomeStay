using System.Net;
using StayEasy.Common;
using StayEasy.Data;
using StayEasy.Data.Seed;
using StayEasy.DTOs;
using StayEasy.Services.Rooms;
using StayEasy.Tests.Helpers;

namespace StayEasy.Tests.Services;

/// <summary>
/// Kiểm chứng tìm kiếm và lọc phòng: từng bộ lọc, sắp xếp, phân trang,
/// và các tham số không hợp lệ.
///
/// Mỗi test dựng database InMemory riêng (tên ngẫu nhiên) nên không ảnh hưởng
/// lẫn nhau và không cần bật MySQL.
/// </summary>
public class RoomSearchTests
{
    /// <summary>Dựng database đã seed đủ 3 địa điểm + 10 phòng như dữ liệu thật.</summary>
    private static async Task<StayEasyDbContext> TaoDbDaSeedAsync()
    {
        StayEasyDbContext db = TestDbContextFactory.Create();
        await SeedData.SeedAsync(db, CancellationToken.None);
        return db;
    }

    private static RoomService TaoService(StayEasyDbContext db)
    {
        return new RoomService(db);
    }

    private static RoomSearchRequest TaoYeuCau()
    {
        return new RoomSearchRequest { Page = 1, PageSize = 50 };
    }

    // ---------------- Bộ lọc ----------------

    [Fact]
    public async Task SearchAsync_KhongLoc_TraVeCa10Phong()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(TaoYeuCau(), CancellationToken.None);

        Assert.Equal(10, result.TotalItems);
        Assert.Equal(10, result.Items.Count);
        Assert.Equal(1, result.TotalPages);
    }

    [Fact]
    public async Task SearchAsync_LocTheoDiaDiem_ChiTraVePhongCuaDiaDiemDo()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        // Chỉ số 0 = Hưng Yên (cùng thứ tự OrderBy Id với GET /api/locations).
        RoomSearchRequest request = TaoYeuCau();
        request.LocationIndex = 0;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.Equal(4, result.TotalItems);
        Assert.All(result.Items, phong => Assert.Equal("Hưng Yên Ven Biển", phong.LocationName));
    }

    [Fact]
    public async Task SearchAsync_LocationIndexVuotPhamVi_TraVeRong_KhongBaoLoi()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest request = TaoYeuCau();
        request.RoomType = (int)StayEasy.Enums.RoomType.DELUXE;

        PagedResultDto<RoomSearchItemDto> result = await service.SearchAsync(request, CancellationToken.None);

        Assert.NotEmpty(result.Items);
        Assert.All(result.Items, phong => Assert.Equal(StayEasy.Enums.RoomType.DELUXE, phong.RoomType));
    }

    [Fact]
    public async Task SearchAsync_LocTheoKhoangGia_ChiTraVePhongTrongKhoang()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
        RoomService service = TaoService(db);

        RoomSearchRequest trang1 = TaoYeuCau();
        trang1.Page = 1;
        trang1.PageSize = 6;
        RoomSearchRequest trang2 = TaoYeuCau();
        trang2.Page = 2;
        trang2.PageSize = 6;

        PagedResultDto<RoomSearchItemDto> ketQua1 = await service.SearchAsync(trang1, CancellationToken.None);
        PagedResultDto<RoomSearchItemDto> ketQua2 = await service.SearchAsync(trang2, CancellationToken.None);

        Assert.Equal(10, ketQua1.TotalItems);
        Assert.Equal(2, ketQua1.TotalPages);
        Assert.Equal(6, ketQua1.Items.Count);
        Assert.Equal(4, ketQua2.Items.Count);
        // Hai trang không có phòng nào trùng nhau — STT giao diện mới liên tục được.
        Assert.Empty(ketQua1.Items.Select(p => p.Name).Intersect(ketQua2.Items.Select(p => p.Name)));
    }

    // ---------------- Tham số không hợp lệ ----------------

    [Fact]
    public async Task SearchAsync_MinPriceLonHonMaxPrice_ThroiAppException400()
    {
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
        await using StayEasyDbContext db = await TaoDbDaSeedAsync();
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
}
