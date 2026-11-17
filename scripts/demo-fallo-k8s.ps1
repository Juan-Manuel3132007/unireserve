# ===========================================================================
# UniReserve — Demostración de Fallo Controlado en Kubernetes (Criterio D8)
#
# Simula una caída del servicio de base de datos para evidenciar:
# 1. Detección automática por la Readiness Probe (/health/ready -> HTTP 503).
# 2. Desacoplamiento del Pod del balanceador sin tumbar el contenedor (Liveness OK).
# 3. Diagnóstico en vivo con kubectl get events y describe pod.
# 4. Autorrecuperación instantánea al restaurar la réplica de PostgreSQL.
# ===========================================================================
[CmdletBinding()]
param(
    [string]$Namespace = "unireserve"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

Write-Host "`n========================================================" -ForegroundColor Yellow
Write-Host " [PASO 1] ESTADO INICIAL SANO (READINESS 1/1 READY)" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Yellow
kubectl get pods -n $Namespace -o wide

Write-Host "`n========================================================" -ForegroundColor Red
Write-Host " [PASO 2] PROVOCANDO FALLO CONTROLADO: APAGANDO POSTGRES" -ForegroundColor Red
Write-Host " (kubectl scale statefulset unireserve-postgres --replicas=0)" -ForegroundColor Red
Write-Host "========================================================" -ForegroundColor Red
kubectl scale statefulset unireserve-postgres --replicas=0 -n $Namespace

Write-Host "Esperando 12 segundos a que actúe la Readiness Probe (periodSeconds=5)..." -ForegroundColor Gray
Start-Sleep -Seconds 12

Write-Host "`n========================================================" -ForegroundColor Magenta
Write-Host " [PASO 3] DIAGNÓSTICO EN VIVO: OBSERVAR READINESS 0/1" -ForegroundColor Magenta
Write-Host "========================================================" -ForegroundColor Magenta
kubectl get pods -n $Namespace -l app=unireserve-backend

Write-Host "`n--> Eventos de Kubernetes detectando la sonda fallida:" -ForegroundColor Cyan
kubectl get events -n $Namespace --sort-by=.metadata.creationTimestamp | Select-Object -Last 6

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " [PASO 4] RECUPERACIÓN: RESTAURANDO POSTGRESQL" -ForegroundColor Green
Write-Host " (kubectl scale statefulset unireserve-postgres --replicas=1)" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
kubectl scale statefulset unireserve-postgres --replicas=1 -n $Namespace

Write-Host "Esperando 15 segundos a que PostgreSQL inicie y la sonda vuelva a verde..." -ForegroundColor Gray
Start-Sleep -Seconds 15

Write-Host "`n========================================================" -ForegroundColor Green
Write-Host " [PASO 5] ESTADO FINAL RESTAURADO" -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Green
kubectl get pods -n $Namespace -o wide
Write-Host "`n[EXITO] Demostración de resiliencia y diagnóstico completada.`n" -ForegroundColor Green
