# ===========================================================================
# UniReserve — Comandos de la Demo Técnica en Vivo (Orden de Sustentación)
#
# Ejecuta este script o copia bloque por bloque durante la presentación.
# ===========================================================================
param([string]$Namespace = "unireserve")

Write-Host "=== 1. ESTADO DEL CLUSTER Y CONTEXTO ===" -ForegroundColor Cyan
minikube status
kubectl config current-context

Write-Host "`n=== 2. RECURSOS DECLARATIVOS EN NAMESPACE '$Namespace' ===" -ForegroundColor Cyan
kubectl get namespace $Namespace
kubectl get configmap,secret -n $Namespace
kubectl get pods,svc,deploy,statefulset,pvc -n $Namespace -o wide

Write-Host "`n=== 3. TRAZABILIDAD: COMMIT -> TAG -> MANIFIESTO -> POD ===" -ForegroundColor Cyan
Write-Host "Imagenes corriendo en los Pods (JSONPath):" -ForegroundColor Yellow
kubectl get pods -n $Namespace -o jsonpath="{range .items[*]}{.metadata.name}{'\t'}{.spec.containers[*].image}{'\n'}{end}"

Write-Host "`n=== 4. OBSERVABILIDAD: LOGS ESTRUCTURADOS CON REQUEST-ID ===" -ForegroundColor Cyan
kubectl logs -n $Namespace -l app=unireserve-backend --tail=10

Write-Host "`n=== 5. SEGURIDAD Y DIAGNOSTICO: DESCRIBE POD (NON-ROOT & PROBES) ===" -ForegroundColor Cyan
$backendPod = (kubectl get pods -n $Namespace -l app=unireserve-backend -o jsonpath="{.items[0].metadata.name}")
kubectl describe pod $backendPod -n $Namespace | Select-String -Pattern "Image:","State:","Ready:","Liveness:","Readiness:","Requests:","Limits:","User:"

Write-Host "`n=== 6. EVENTOS RECIENTES DEL CLUSTER ===" -ForegroundColor Cyan
kubectl get events -n $Namespace --sort-by=.metadata.creationTimestamp | Select-Object -Last 8

Write-Host "`n=== 7. PERSISTENCIA REAL EN POSTGRESQL (PVC) ===" -ForegroundColor Cyan
kubectl exec -i unireserve-postgres-0 -n $Namespace -- psql -U postgres -d unireserve -c "SELECT id, user_id, space_id, fecha, hora_inicio, hora_fin, estado FROM reservations ORDER BY id DESC LIMIT 5;"
