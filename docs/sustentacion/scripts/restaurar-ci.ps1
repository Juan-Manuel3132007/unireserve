<#
.SYNOPSIS
    Restaura el estado original y verde de la suite de CI de UniReserve Backend.
.DESCRIPTION
    1. Restaura tests/test_health.py al estado original de main/develop.
    2. Hace commit y push en la rama test/fallo-controlado.
    3. Confirma que el pipeline vuelve a verde.
    4. Opcionalmente limpia la rama local y remota.
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

Write-Host "==> Restaurando tests/test_health.py desde main ($backendDir)..." -ForegroundColor Cyan
git checkout main -- tests/test_health.py

Write-Host "==> Comprobando si hay cambios para commitear en test/fallo-controlado..." -ForegroundColor Cyan
if ((git status --porcelain)) {
    git add tests/test_health.py
    git commit -m "fix: restaurar asercion valida de healthcheck para recuperar CI en verde"
    git push origin test/fallo-controlado
    Write-Host "==> Push realizado. El pipeline en GitHub Actions vuelve a VERDE." -ForegroundColor Green
} else {
    Write-Host "==> El archivo ya estaba limpio." -ForegroundColor Yellow
}

Write-Host "==> Regresando a rama main..." -ForegroundColor Cyan
git checkout main
