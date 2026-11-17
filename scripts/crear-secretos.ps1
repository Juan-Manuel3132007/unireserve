# ===========================================================================
# UniReserve — Generador Idempotente de Secretos de Kubernetes
#
# Genera contraseñas criptográficas seguras y crea o actualiza el objeto Secret
# 'unireserve-secrets' en el namespace 'unireserve' sin persistir secretos en Git.
#
# Uso:
#   .\scripts\crear-secretos.ps1
# ===========================================================================
[CmdletBinding()]
param(
    [string]$Namespace = "unireserve",
    [string]$DbUser = "postgres",
    [string]$DbName = "unireserve",
    [string]$DbHost = "postgres-service",
    [int]$DbPort = 5432,
    [switch]$ForceRecreate
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "==> Verificando namespace '$Namespace'..." -ForegroundColor Cyan
$nsCheck = kubectl get namespace $Namespace --ignore-not-found -o jsonpath='{.metadata.name}'
if (-not $nsCheck) {
    Write-Host "    Creando namespace '$Namespace'..." -ForegroundColor Yellow
    kubectl create namespace $Namespace
}

$secretExists = kubectl get secret unireserve-secrets -n $Namespace --ignore-not-found -o jsonpath='{.metadata.name}'

if ($secretExists -and -not $ForceRecreate) {
    Write-Host "==> El secreto 'unireserve-secrets' ya existe en '$Namespace'. Se mantiene para evitar invalidar datos." -ForegroundColor Green
    Write-Host "    (Usa -ForceRecreate para forzar nueva generacion)." -ForegroundColor Gray
    exit 0
}

Write-Host "==> Generando credenciales seguras..." -ForegroundColor Cyan

# Generar contraseÃ±a alfanumÃ©rica segura de 24 caracteres (segura para URL sin encoding)
$charSet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$pwBytes = New-Object byte[] 24
$rng.GetBytes($pwBytes)
$pgPasswordChars = foreach ($b in $pwBytes) { $charSet[$b % $charSet.Length] }
$pgPassword = -join $pgPasswordChars

# Generar JWT_SECRET de 64 caracteres hexadecimales (256 bits)
$jwtBytes = New-Object byte[] 32
$rng.GetBytes($jwtBytes)
$jwtSecret = ($jwtBytes | ForEach-Object { $_.ToString("x2") }) -join ""

# Construir DATABASE_URL exacta con el driver postgresql+psycopg
$databaseUrl = "postgresql+psycopg://${DbUser}:${pgPassword}@${DbHost}:${DbPort}/${DbName}"

Write-Host "==> Aplicando secreto de forma declarativa e idempotente..." -ForegroundColor Cyan

$secretYaml = @"
apiVersion: v1
kind: Secret
metadata:
  name: unireserve-secrets
  namespace: $Namespace
  labels:
    app.kubernetes.io/name: unireserve-secrets
    app.kubernetes.io/part-of: unireserve-system
type: Opaque
stringData:
  POSTGRES_USER: "$DbUser"
  POSTGRES_PASSWORD: "$pgPassword"
  POSTGRES_DB: "$DbName"
  JWT_SECRET: "$jwtSecret"
  DATABASE_URL: "$databaseUrl"
"@

$secretYaml | kubectl apply -f -

Write-Host "==> Secreto 'unireserve-secrets' configurado exitosamente en namespace '$Namespace'." -ForegroundColor Green
Write-Host "    POSTGRES_USER : $DbUser"
Write-Host "    POSTGRES_DB   : $DbName"
Write-Host "    DATABASE_URL  : postgresql+psycopg://${DbUser}:***@${DbHost}:${DbPort}/${DbName}"
Write-Host "    (Las contrasenas reales quedan en memoria de K8s y NO se escriben en disco)." -ForegroundColor Gray
