<#
.SYNOPSIS
    Genera evidencias congeladas del estado del sistema para sustentacion.
.DESCRIPTION
    Ejecuta y congela:
    1. Salida de pytest en backend
    2. Salida de vitest, eslint y build en frontend
    3. Historial de commits en arbol (git log --graph)
    4. Estado de submodulos (git submodule status)
    5. Estado del cluster Kubernetes / Minikube (si esta activo)
#>

$desktopDir = Resolve-Path "$PSScriptRoot\..\..\..\.." -ErrorAction SilentlyContinue
if (-not (Test-Path "$desktopDir\unireserve-backend")) {
    $desktopDir = Resolve-Path "$PSScriptRoot\..\..\.." -ErrorAction SilentlyContinue
}
$desktopDir = $desktopDir.Path
$evidenciasDir = Join-Path $PSScriptRoot "..\EVIDENCIAS_CONGELADAS"

if (-not (Test-Path $evidenciasDir)) {
    New-Item -ItemType Directory -Path $evidenciasDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Write-Host "==> Congelando evidencias en: $evidenciasDir [$timestamp]" -ForegroundColor Cyan

# 1. Backend Pytest & Ruff
Write-Host "-> Ejecutando Pytest y Ruff en backend..." -ForegroundColor Yellow
$backendPath = Join-Path $desktopDir "unireserve-backend"
if (Test-Path $backendPath) {
    Set-Location $backendPath
    & .\.venv\Scripts\ruff.exe check . > "$evidenciasDir\backend-ruff.txt" 2>&1
    & .\.venv\Scripts\pytest.exe -v > "$evidenciasDir\backend-pytest.txt" 2>&1
    git log --graph --oneline --decorate -n 20 > "$evidenciasDir\backend-git-log.txt" 2>&1
}

# 2. Frontend Vitest, Lint & Build
Write-Host "-> Ejecutando Vitest, Lint y Build en frontend..." -ForegroundColor Yellow
$frontendPath = Join-Path $desktopDir "unireserve-frontend"
if (Test-Path $frontendPath) {
    Set-Location $frontendPath
    npm run lint > "$evidenciasDir\frontend-eslint.txt" 2>&1
    npm run test > "$evidenciasDir\frontend-vitest.txt" 2>&1
    npm run build > "$evidenciasDir\frontend-build.txt" 2>&1
    git log --graph --oneline --decorate -n 20 > "$evidenciasDir\frontend-git-log.txt" 2>&1
}

# 3. Orquestador y Submodulos
Write-Host "-> Capturando estado del orquestador unireserve-1..." -ForegroundColor Yellow
$orquestadorPath = Join-Path $desktopDir "unireserve-1"
if (Test-Path $orquestadorPath) {
    Set-Location $orquestadorPath
    git submodule status > "$evidenciasDir\submodules-status.txt" 2>&1
    git log --graph --oneline --decorate -n 20 > "$evidenciasDir\orquestador-git-log.txt" 2>&1
}

# 4. Kubernetes / Minikube (si está disponible)
Write-Host "-> Inspeccionando estado de Kubernetes (namespace unireserve)..." -ForegroundColor Yellow
if (Get-Command kubectl -ErrorAction SilentlyContinue) {
    kubectl get all -n unireserve -o wide > "$evidenciasDir\k8s-get-all.txt" 2>&1
    kubectl describe pod -n unireserve > "$evidenciasDir\k8s-describe-pods.txt" 2>&1
} else {
    "kubectl no esta disponible en el PATH" | Out-File "$evidenciasDir\k8s-get-all.txt"
}

Write-Host "==> ¡Evidencias congeladas exitosamente en $evidenciasDir!" -ForegroundColor Green
Get-ChildItem $evidenciasDir | Select-Object Name, Length, LastWriteTime | Format-Table -AutoSize
