<#
    stop-services.ps1 — Dừng backend và frontend của dự án HomeStay

    Cách chạy (ở thư mục gốc dự án):
        .\stop-services.ps1

    Script dừng tiến trình THEO CỔNG (5080 và 5174) chứ không kill theo tên
    `dotnet`/`node`. Kill theo tên sẽ giết luôn mọi dự án khác đang chạy trên
    máy — đã có lần làm vậy và mất tiến trình của dự án cũ.

    MySQL (Docker) được giữ lại: container dùng chung dữ liệu volume, dừng đi
    mỗi lần thì mỗi lần phải đợi healthcheck lại từ đầu. Muốn dừng hẳn:
        docker compose stop
#>

$CongBackend  = 5080
$CongFrontend = 5174

function Dung {
    param([int]$Cong, [string]$Ten)
    $ket = Get-NetTCPConnection -LocalPort $Cong -State Listen -ErrorAction SilentlyContinue |
           Select-Object -First 1
    if (-not $ket) {
        Write-Host ("  [{0,-8}] {1} (cổng {2})" -f 'BỎ QUA', $Ten, $Cong)
        return
    }

    $tenTienTrinh = 'không rõ'
    $p = Get-Process -Id $ket.OwningProcess -ErrorAction SilentlyContinue
    if ($p) { $tenTienTrinh = $p.ProcessName }

    Stop-Process -Id $ket.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1

    # Chốt lại: Windows có thể chưa nhả cổng ngay.
    if (Get-NetTCPConnection -LocalPort $Cong -State Listen -ErrorAction SilentlyContinue) {
        Write-Host ("  [{0,-8}] {1} (cổng {2}) - PID {3} ({4})" -f 'LỖI', $Ten, $Cong, $ket.OwningProcess, $tenTienTrinh)
    }
    else {
        Write-Host ("  [{0,-8}] {1} (cổng {2}) - PID {3} ({4})" -f 'DỪNG', $Ten, $Cong, $ket.OwningProcess, $tenTienTrinh)
    }
}

Write-Host ''
Write-Host 'Dừng dịch vụ:'
Dung $CongBackend  'Backend'
Dung $CongFrontend 'Frontend'
Write-Host ''
Write-Host '  MySQL (Docker) vẫn giữ nguyên. Dừng hẳn:  docker compose stop'
Write-Host ''
