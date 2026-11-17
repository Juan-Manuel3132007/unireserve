<#
.SYNOPSIS
    Provoca intencionalmente un fallo controlado en la suite de CI de UniReserve Backend.
.DESCRIPTION
    1. Crea la rama test/fallo-controlado a partir de develop/main.
    2. Modifica tests/test_health.py para inducir una asercion fallida (status == 500).
    3. Hace commit y push de la rama hacia el repositorio remoto.
    4. Demuestra que el CI falla en rojo y que el job publish-image es bloqueado.
#>

$repoBackend = Resolve-Path "$PSScriptRoot\..\..\..\unireserve-backend" -ErrorAction SilentlyContinue
if (-not $repoBackend) {
    $repoBackend = Resolve-Path "$PSScriptRoot\..\..\backend" -ErrorAction SilentlyContinue
}
if (-not $repoBackend) {
    $repoBackend = Resolve-Path "$PSScriptRoot\..\..\..\..\unireserve-backend" -ErrorAction SilentlyContinue
}
$backendDir = $repoBackend.Path
Set-Location $backendDir

Write-Host "==> Cambiando a rama test/fallo-controlado en backend ($backendDir)..." -ForegroundColor Cyan
git checkout -B test/fallo-controlado

Write-Host "==> Modificando tests/test_health.py para inducir fallo intencional..." -ForegroundColor Yellow
$testHealthPath = Join-Path $backendDir "tests\test_health.py"
$contenido = Get-Content $testHealthPath -Raw
$contenidoModificado = $contenido -replace 'assert respuesta\.status_code == 200', 'assert respuesta.status_code == 500 # FALLO CONTROLADO INDUCIDO'
Set-Content -Path $testHealthPath -Value $contenidoModificado -NoNewline

Write-Host "==> Realizando commit y push de fallo controlado..." -ForegroundColor Cyan
git add tests/test_health.py
git commit -m "test: inducir fallo controlado en prueba de health para demostracion de CI"
git push -u origin test/fallo-controlado --force

Write-Host "==> ¡Listo! Ve a GitHub Actions en unireserve-backend:" -ForegroundColor Green
Write-Host "    https://github.com/Juan-Manuel3132007/unireserve-backend/actions" -ForegroundColor White
Write-Host "    El job 'test' fallará en rojo y el job 'publish-image' NO se ejecutará." -ForegroundColor Green
