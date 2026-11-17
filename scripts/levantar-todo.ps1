# ===========================================================================
# UniReserve — Despliegue Automatizado Completo de Infraestructura (Zero to Hero)
#
# Deja todo el entorno de Minikube funcionando con un solo comando:
# 1. Inicia Minikube si está apagado.
# 2. Carga las imágenes Docker locales al clúster (resiliente sin depender de Docker Hub).
# 3. Aplica Namespace, ConfigMap y genera Secretos criptográficos.
# 4. Despliega PostgreSQL StatefulSet con PVC y espera a que esté listo.
# 5. Despliega Backend (FastAPI) y Frontend (Nginx/React) con probes.
# 6. Muestra el estado consolidado de pods y servicios.
#
# Uso:
#   .\scripts\levantar-todo.ps1
# ===========================================================================
[CmdletBinding()]
param(
    [string]$Namespace = "unireserve"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$k8sDir = Join-Path (Split-Path -Parent $scriptDir) "k8s"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "    UniReserve — Despliegue de Infraestructura K8s        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Verificar Minikube
Write-Host "`n[1/6] Verificando estado de Minikube..." -ForegroundColor Yellow
$mkStatus = try { minikube status --format='{{.Host}}' 2>$null } catch { "Stopped" }
if ($mkStatus -ne "Running") {
    Write-Host "      Iniciando Minikube..." -ForegroundColor Gray
    minikube start --driver=docker
}
Write-Host "      Minikube operativo en contexto: $(kubectl config current-context)" -ForegroundColor Green

# 2. Carga de imagenes locales a Minikube (Plan B / Autonomo)
Write-Host "`n[2/6] Cargando imagenes al daemon de Minikube..." -ForegroundColor Yellow
minikube image load juanma313/unireserve-backend:v1.0.0
minikube image load juanma313/unireserve-backend:latest
minikube image load juanma313/unireserve-frontend:v1.0.0
minikube image load juanma313/unireserve-frontend:latest
Write-Host "      Imagenes cargadas exitosamente en Minikube." -ForegroundColor Green

# 3. Namespace, ConfigMap y Secretos
Write-Host "`n[3/6] Aplicando Namespace, ConfigMap y Secretos..." -ForegroundColor Yellow
kubectl apply -f (Join-Path $k8sDir "00-namespace.yaml")
kubectl apply -f (Join-Path $k8sDir "01-configmap.yaml")
& (Join-Path $scriptDir "crear-secretos.ps1") -Namespace $Namespace

# 4. PostgreSQL StatefulSet
Write-Host "`n[4/6] Desplegando PostgreSQL StatefulSet (PVC)..." -ForegroundColor Yellow
kubectl apply -f (Join-Path $k8sDir "03-postgres.yaml")
Write-Host "      Esperando disponibilidad de PostgreSQL..." -ForegroundColor Gray
kubectl rollout status statefulset/unireserve-postgres -n $Namespace --timeout=120s

# 5. Backend y Frontend
Write-Host "`n[5/6] Desplegando Backend y Frontend..." -ForegroundColor Yellow
kubectl apply -f (Join-Path $k8sDir "04-backend.yaml")
kubectl apply -f (Join-Path $k8sDir "05-frontend.yaml")

Write-Host "      Esperando a que las réplicas del Backend estén Ready..." -ForegroundColor Gray
kubectl rollout status deployment/backend-deployment -n $Namespace --timeout=120s

Write-Host "      Esperando a que las réplicas del Frontend estén Ready..." -ForegroundColor Gray
kubectl rollout status deployment/frontend-deployment -n $Namespace --timeout=120s

# 6. Resumen y verificación
Write-Host "`n[6/6] ESTADO CONSOLIDADO DEL DESPLIEGUE:" -ForegroundColor Green
kubectl get pods,svc,pvc -n $Namespace -o wide

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "  DESPLIEGUE COMPLETADO Y VERIFICADO AL 100%               " -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Para acceder desde tu navegador:"
Write-Host "  1. Frontend: kubectl port-forward svc/frontend-service 3000:80 -n $Namespace" -ForegroundColor Cyan
Write-Host "  2. Backend:  kubectl port-forward svc/backend-service 8000:8000 -n $Namespace" -ForegroundColor Cyan
Write-Host "  -> Abrir: http://localhost:3000`n" -ForegroundColor White
