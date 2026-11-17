# Infraestructura y Manifiestos de Kubernetes — UniReserve

Este directorio contiene los manifiestos declarativos de Kubernetes para el despliegue del sistema **UniReserve** en **Minikube** (o cualquier clúster compatible con Kubernetes v1.28+).

---

## 1. Arquitectura del Despliegue en Kubernetes

El despliegue está aislado en el namespace `unireserve` y desacoplado según principios de **12-Factor App**:

```
                                  [ Navegador del Usuario ]
                                             |
                                 (Port-Forward :3000 o NodePort :30080)
                                             v
                             +-------------------------------+
                             |    frontend-service (NodePort)|
                             +-------------------------------+
                                             |
                                             v
                           +-----------------------------------+
                           | frontend-deployment (2 réplicas)  |
                           |  Nginx 1.27 + React SPA bundle    |
                           +-----------------------------------+
                                             |
                               (Llamadas API HTTP :8000)
                                             v
                             +-------------------------------+
                             |   backend-service (ClusterIP) |
                             +-------------------------------+
                                             |
                                             v
                           +-----------------------------------+
                           |  backend-deployment (2 réplicas)  |
                           |  FastAPI + Uvicorn (Non-root 1000)|
                           |  Liveness: /health                |
                           |  Readiness: /health/ready         |
                           +-----------------------------------+
                                             |
                               (postgresql+psycopg:// :5432)
                                             v
                             +-------------------------------+
                             |   postgres-service (ClusterIP)|
                             +-------------------------------+
                                             |
                                             v
                           +-----------------------------------+
                           |  unireserve-postgres (StatefulSet)|
                           |  PostgreSQL 16 Alpine             |
                           |  PersistentVolumeClaim: 1Gi       |
                           +-----------------------------------+
```

---

## 2. Inventario de Manifiestos y Separación de Responsabilidades

| Manifiesto | Tipo | Propósito | Características Clave |
|---|---|---|---|
| `00-namespace.yaml` | `Namespace` | Aislamiento lógico | Namespace `unireserve` con etiquetas estándar. |
| `01-configmap.yaml` | `ConfigMap` | Configuración no sensible | Variables de entorno operativas (`APP_NAME`, `ENVIRONMENT`, `LOG_LEVEL`, `CORS_ORIGINS`). |
| `02-secret.example.yaml` | `Secret` (Plantilla) | Plantilla de credenciales | **Ningún secreto real viaja en Git**. Se versiona solo esta plantilla. El secreto real se genera con `scripts/crear-secretos.ps1`. |
| `03-postgres.yaml` | `Service` + `StatefulSet` | Motor de base de datos | `volumeClaimTemplates` con PVC de 1 GiB. Sondas `pg_isready`. Requests/limits de recursos. |
| `04-backend.yaml` | `Service` + `Deployment` | API REST FastAPI | 2 réplicas. Usuario no root (`runAsUser: 1000`). Sondas HTTP `/health` y `/health/ready`. Inyección con `envFrom` de ConfigMap y Secret. |
| `05-frontend.yaml` | `Service` + `Deployment` | Interfaz Web React | 2 réplicas. Nginx liviano (<30 MB). `NodePort 30080` para acceso directo y sondas de salud. |

---

## 3. Seguridad de la Configuración (Cumplimiento Criterio D7)

1. **Desacoplamiento Estricto:** Ni contraseñas ni cadenas de conexión con credenciales (`DATABASE_URL`) existen en archivos versionados ni en `01-configmap.yaml`.
2. **Generación Idempotente:** El script `scripts/crear-secretos.ps1` (y `.sh`) genera contraseñas criptográficas seguras y crea el secreto `unireserve-secrets` directamente en la API de Kubernetes.
3. **Mismo Secreto en Base y Aplicación:** El script construye `DATABASE_URL` inyectando la misma contraseña que asigna a `POSTGRES_PASSWORD`, evitando inconsistencias.
4. **Contenedores No Privilegiados:** El backend se ejecuta con `runAsNonRoot: true`, `runAsUser: 1000` y `fsGroup: 1000`.

---

## 4. Despliegue Paso a Paso desde Cero (Reproducibilidad)

### Opción A: Despliegue Automático en un solo comando

```powershell
.\scripts\levantar-todo.ps1
```

### Opción B: Despliegue Manual Paso a Paso

```powershell
# 1. Iniciar Minikube
minikube start --driver=docker

# 2. Cargar imágenes locales al clúster (sin requerir docker login)
minikube image load juanma313/unireserve-backend:v1.0.0
minikube image load juanma313/unireserve-frontend:v1.0.0

# 3. Crear Namespace y Configuración
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml

# 4. Generar Secretos de forma segura
.\scripts\crear-secretos.ps1

# 5. Desplegar Base de Datos y esperar a que esté lista
kubectl apply -f k8s/03-postgres.yaml
kubectl rollout status statefulset/unireserve-postgres -n unireserve --timeout=120s

# 6. Desplegar Backend y Frontend
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-frontend.yaml
kubectl rollout status deployment/backend-deployment -n unireserve --timeout=120s
kubectl rollout status deployment/frontend-deployment -n unireserve --timeout=60s

# 7. Verificar estado general
kubectl get pods,svc,pvc -n unireserve -o wide
```

---

## 5. Acceso y Prueba del Flujo E2E

Para interactuar con la aplicación en el navegador:

```powershell
# Terminal 1: Port-forward del Frontend
kubectl port-forward svc/frontend-service 3000:80 -n unireserve

# Terminal 2: Port-forward del Backend
kubectl port-forward svc/backend-service 8000:8000 -n unireserve
```

- **Frontend:** http://localhost:3000
- **Documentación Swagger:** http://localhost:8000/docs
- **Credenciales semilla de prueba:**
  - Estudiante: `juan.restrepo@unireserve.com` / `Estudiante123!`
  - Administrador: `admin@unireserve.com` / `Admin123!`

---

## 6. Justificación Técnica: GitOps vs. Alcance Aprobado (Criterio D6)

### Estado Declarativo en Git (Push-Based Delivery)
Todo el estado deseado de la infraestructura reside en este directorio `k8s/` versionado en Git. Cada actualización de software se traduce en un cambio de tag en el manifiesto (`juanma313/unireserve-backend:v1.0.0` o `sha-xxxxxxx`), asegurando **trazabilidad unívoca** entre el commit y el Pod en ejecución.

### ¿Por qué no se incluyó un operador GitOps (ArgoCD / Flux) en esta entrega?
1. **Consumo de Recursos en Entorno Local:** Un operador GitOps completo (ArgoCD o Flux con sus respectivos Custom Resource Definitions, controllers de sincronización y servidor web) requiere entre **1.5 y 2.0 GiB de RAM** continua. En un clúster local Minikube sobre máquinas de desarrollo, este overhead genera contención de memoria que amenaza la estabilidad de los pods de la aplicación.
2. **Complejidad vs. Retorno:** Para un equipo de 3 desarrolladores operando en Minikube, un pipeline declarativo push-based cubre el 100% de los requerimientos de entrega continua y trazabilidad sin agregar puntos de falla adicionales.
3. **Roadmap:** La reconciliación pull-based automática mediante ArgoCD está planificada para la **Fase 4**, cuando el clúster sea migrado a un servicio gestionado (GKE o EKS) con recursos dedicados.

### Diferencia conceptual clave entre CI, CD y GitOps:
- **CI (Integración Continua):** Valida el código ante cada commit mediante linters, análisis estático y pruebas automatizadas, empaquetando finalmente un artefacto inmutable (imagen Docker).
- **CD (Entrega/Despliegue Continuo - Push):** Toma el artefacto probado y ejecuta comandos imperativos o declarativos (`kubectl apply`) hacia el clúster objetivo.
- **GitOps (Reconciliación Declarativa - Pull):** Un agente interno en el clúster sondea el repositorio Git y reconcilia continuamente el estado real del clúster para que coincida con el estado deseado en Git, corrigiendo cualquier desviación (*drift*).
