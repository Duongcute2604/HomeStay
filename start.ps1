<#
    start.ps1 — Bật toàn bộ dự án HomeStay bằng MỘT lệnh

    Cách chạy (ở thư mục gốc dự án):
        .\start.ps1

    Script tự làm 5 việc, báo trạng thái từng bước:
      1. Bật MySQL bằng Docker, đợi tới khi trạng thái `healthy`
      2. Kiểm số bảng — nếu bảng mất thì chạy `dotnet ef database update`
      3. Build nếu DLL chưa có hoặc cũ hơn mã nguồn
      4. Bật backend rồi health-check `/api/rooms/search`
      5. Bật frontend rồi health-check cổng Vite

    Chạy lại bao nhiêu lần cũng được: dịch vụ nào đã sống thì bỏ qua.

    Ba điểm kỹ thuật đáng lưu ý:
    - ASPNETCORE_ENVIRONMENT bắt buộc phải là Development, vì chuỗi kết nối MySQL
      nằm trong appsettings.Development.json (file này không commit lên git). Bỏ
      qua là backend chết ngay với "Thiếu chuỗi kết nối".
    - Muốn dừng tiến trình thì dừng THEO CỔNG, không được kill theo tên
      `node`/`dotnet` — kill theo tên sẽ giết luôn dự án khác đang chạy trên máy.
    - $ErrorActionPreference phải giữ là Continue, không đặt thành Stop. Script
      này gọi nhiều lệnh native (docker, mysql, dotnet) và chúng ghi cảnh báo ra
      stderr; PowerShell 5.1 bọc stderr thành ErrorRecord, đặt Stop là script tự
      chết giữa chừng. Thay vào đó kiểm `$LASTEXITCODE` tường minh ở các bước then
      chốt (build, migration).

    PowerShell 5.1 bắt buộc đọc file này là UTF-8 CÓ BOM, nếu không ký tự tiếng
    Việt sẽ bị vỡ. Nếu thêm chữ tiếng Việt, nhớ giữ nguyên BOM.

    Tài khoản demo (mật khẩu 123456): admin@homestay.vn · khach1@gmail.com
#>

$ErrorActionPreference = 'Continue'

$Goc          = $PSScriptRoot
$ThuMucServer = Join-Path $Goc 'server'
$ThuMucClient = Join-Path $Goc 'client'
$DuongDanDll  = Join-Path $ThuMucServer 'HomeStay\bin\Debug\net8.0\HomeStay.dll'
$CongBackend  = 5080
$CongFrontend = 5174
$UrlApi       = "http://localhost:$CongBackend/api/rooms/search?page=1&pageSize=1"
$UrlWeb       = "http://localhost:$CongFrontend/"

# --------------------------------------------------------------- công cụ chung

function Bao {
    param([string]$Muc, [string]$TrangThai, [string]$ChiTiet = '')
    $dong = "  [{0,-8}] {1}" -f $TrangThai, $Muc
    if ($ChiTiet) { $dong += "  -  $ChiTiet" }
    Write-Host $dong
}

function CoDichVu {
    param([string]$Url)
    try {
        $null = Invoke-WebRequest -Uri $Url -TimeoutSec 4 -UseBasicParsing
        return $true
    }
    catch { return $false }
}

function ChoDichVu {
    param([string]$Url, [int]$LanToiDa = 40, [int]$GiayCho = 3)
    for ($i = 1; $i -le $LanToiDa; $i++) {
        if (CoDichVu $Url) { return $true }
        Start-Sleep -Seconds $GiayCho
    }
    return $false
}

function LayPidTheoCong {
    param([int]$Cong)
    $ket = Get-NetTCPConnection -LocalPort $Cong -State Listen -ErrorAction SilentlyContinue |
           Select-Object -First 1
    if ($ket) { return $ket.OwningProcess }
    return $null
}

# Dừng theo CỔNG chứ không theo tên tiến trình. $PID là biến hệ thống chỉ đọc
# nên phải đặt tên biến khác, gán thẳng vào $PID là PowerShell báo lỗi.
function DungTheoCong {
    param([int]$Cong, [string]$Ten)
    $maTienTrinh = LayPidTheoCong $Cong
    if ($maTienTrinh) {
        Stop-Process -Id $maTienTrinh -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Bao "$Ten (cổng $Cong)" 'DỪNG' "PID $maTienTrinh"
    }
}

# ------------------------------------------------------------------ 1. công cụ

$DanhSachThieu = @()
$dotnetExe = Join-Path $env:LOCALAPPDATA 'Microsoft\dotnet\dotnet.exe'
if (-not (Test-Path $dotnetExe)) {
    $tim = Get-Command dotnet -ErrorAction SilentlyContinue
    if ($tim) { $dotnetExe = $tim.Source } else { $DanhSachThieu += 'dotnet SDK' }
}
$npmCmd = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
if (-not (Test-Path $npmCmd)) {
    $tim = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($tim) { $npmCmd = $tim.Source } else { $DanhSachThieu += 'npm' }
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { $DanhSachThieu += 'docker' }

if ($DanhSachThieu.Count -gt 0) {
    Bao "Thiếu công cụ: $($DanhSachThieu -join ', ')" 'LỖI'
    exit 1
}

# Giữ đường dẫn để `dotnet` tìm được host đúng phiên bản.
$env:DOTNET_ROOT = Split-Path $dotnetExe -Parent
$env:PATH = "$($env:DOTNET_ROOT);$env:PATH"
$env:ASPNETCORE_ENVIRONMENT = 'Development'

# ------------------------------------------------------------------ 2. MySQL

Write-Host ''
Write-Host 'Khởi động dịch vụ:'

if ((docker inspect --format '{{.State.Running}}' homestay-mysql 2>$null) -ne 'true') {
    Push-Location $Goc
    docker compose up -d 2>&1 | Out-Null
    Pop-Location
}

$laHealthy = $false
for ($i = 1; $i -le 40; $i++) {
    if ((docker inspect --format '{{.State.Health.Status}}' homestay-mysql 2>$null) -eq 'healthy') {
        $laHealthy = $true
        break
    }
    Start-Sleep -Seconds 3
}
if (-not $laHealthy) {
    Bao 'MySQL không tới được trạng thái healthy' 'LỖI' 'docker compose logs mysql'
    exit 1
}
Bao 'MySQL (cổng 3307)' 'OK' 'healthy'

# ------------------------------------------------------------- 3a. database

# Docker chỉ tạo database lúc volume mới chạy lần đầu (biến MYSQL_DATABASE), nên
# bị xoá tay là nó không tự có lại. Phải dùng root vì tài khoản `homestay` chỉ
# được cấp `ALL PRIVILEGES ON homestay.*`, không có CREATE DATABASE.
$coDatabase = docker exec homestay-mysql mysql -uroot -proot123456 `
    -e "SHOW DATABASES LIKE 'homestay';" 2>$null
if ((($coDatabase -join ' ')) -notmatch 'homestay') {
    docker exec homestay-mysql mysql -uroot -proot123456 `
        -e "CREATE DATABASE homestay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>$null
    if ($LASTEXITCODE -ne 0) { Bao 'Tạo database homestay' 'LỖI' 'xem docker compose logs'; exit 1 }
    Bao 'Database homestay (đã bị xoá)' 'TẠO' 'dựng lại bằng root'
}
else {
    Bao 'Database homestay' 'OK' 'tồn tại'
}

# ------------------------------------------------------------------ 3b. bảng

# Dùng đúng tài khoản `homestay` như chuỗi kết nối, không dùng root.
$thongTin = docker exec homestay-mysql mysql -uhomestay -phomestay123 homestay `
    -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='homestay';" 2>$null
$soBang = 0
if ($thongTin) { [void][int]::TryParse(($thongTin | Select-Object -Last 1).Trim(), [ref]$soBang) }

if ($soBang -eq 0) {
    Bao 'Database trống — chạy migration' 'CHỜ'
    Push-Location $ThuMucServer
    & $dotnetExe ef database update --project HomeStay 2>&1 | Out-Null
    $maLenh = $LASTEXITCODE
    Pop-Location
    if ($maLenh -ne 0) { Bao 'dotnet ef database update' 'LỖI' "exit=$maLenh"; exit 1 }
    Bao 'Migration' 'OK' 'đã dựng bảng'
}
else {
    Bao "Database ($soBang bảng)" 'OK' 'đủ bảng'
}

# ------------------------------------------------------------------ 4. build

$canBuild = -not (Test-Path $DuongDanDll)
if (-not $canBuild) {
    $dongTep = Get-ChildItem -Path $ThuMucServer -Recurse -File -Include *.cs, *.csproj |
        Where-Object { $_.FullName -notmatch '\\(bin|obj)\\' } |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($dongTep -and $dongTep.LastWriteTime -gt (Get-Item $DuongDanDll).LastWriteTime) { $canBuild = $true }
}

if ($canBuild) {
    # File DLL đang bị backend giữ nên Windows không cho ghi đè — phải dừng trước.
    DungTheoCong $CongBackend 'Backend'
    Push-Location $ThuMucServer
    & $dotnetExe build 2>&1 | Select-String -Pattern 'error|Warning\(s\)' | ForEach-Object { "    $($_.Line.Trim())" }
    $maLenh = $LASTEXITCODE
    Pop-Location
    if ($maLenh -ne 0) { Bao 'dotnet build' 'LỖI' "exit=$maLenh"; exit 1 }
    Bao 'Build backend' 'OK' '0 error'
}
else {
    Bao 'Build backend' 'BỎ QUA' 'DLL đã mới'
}

# ------------------------------------------------------------------ 5. backend

if (CoDichVu $UrlApi) {
    Bao "Backend (cổng $CongBackend)" 'OK' 'đã chạy sẵn'
}
else {
    DungTheoCong $CongBackend 'Backend cũ'
    $logBe = Join-Path $env:TEMP 'homestay-be.log'
    # Truyền tên DLL(relative) thay vì đường dẫn đầy đủ: đường dẫn gốc chứa dấu
    # cách và tiếng Việt, đưa nguyên qua -ArgumentList sẽ bị Windows tách theo
    # dấu cách nên `dotnet` chỉ nhận được "D:\bai" và báo không tìm thấy tệp.
    Start-Process -FilePath $dotnetExe -ArgumentList 'HomeStay.dll' `
        -WorkingDirectory (Split-Path $DuongDanDll -Parent) `
        -WindowStyle Hidden -RedirectStandardOutput $logBe -RedirectStandardError "$logBe.err" | Out-Null

    if (ChoDichVu $UrlApi) { Bao "Backend (cổng $CongBackend)" 'OK' 'API trả lời' }
    else {
        Bao "Backend (cổng $CongBackend)" 'LỖI' "xem $logBe.err"
        if (Test-Path "$logBe.err") { Get-Content "$logBe.err" -Tail 8 | ForEach-Object { "    $_" } }
        exit 1
    }
}

# ---------------------------------------------------------------- 6. frontend

if (CoDichVu $UrlWeb) {
    Bao "Frontend (cổng $CongFrontend)" 'OK' 'đã chạy sẵn'
}
else {
    $logFe = Join-Path $env:TEMP 'homestay-fe.log'
    Start-Process -FilePath $npmCmd -ArgumentList 'run', 'dev' `
        -WorkingDirectory $ThuMucClient `
        -WindowStyle Hidden -RedirectStandardOutput $logFe -RedirectStandardError "$logFe.err" | Out-Null

    if (ChoDichVu $UrlWeb) { Bao "Frontend (cổng $CongFrontend)" 'OK' 'Vite chạy' }
    else {
        Bao "Frontend (cổng $CongFrontend)" 'LỖI' "xem $logFe"
        exit 1
    }
}

# ------------------------------------------------------------------ 7. tổng kết

# Proxy là chỗ hay hỏng nhất: backend mà chạy sai cổng thì giao diện trắng.
$quaProxy = CoDichVu "http://localhost:$CongFrontend/api/rooms/search?page=1&pageSize=1"

Write-Host ''
Write-Host 'Dự án đã chạy:'
Write-Host ("  {0,-26} {1}" -f 'Trang khách',    "http://localhost:$CongFrontend")
Write-Host ("  {0,-26} {1}" -f 'Trang quản trị', "http://localhost:$CongFrontend/admin")
Write-Host ("  {0,-26} {1}" -f 'Swagger',        "http://localhost:$CongBackend/swagger")
Write-Host ''
Write-Host ("  Proxy frontend -> backend : {0}" -f $(if ($quaProxy) { 'OK' } else { 'HỎNG - giao diện sẽ trắng' }))
Write-Host ''
Write-Host '  Tài khoản demo (mật khẩu 123456):'
Write-Host '    admin@homestay.vn (Admin)   khach1@gmail.com (Khách)'
Write-Host ''
Write-Host '  Dừng tất cả:  .\stop-services.ps1'
