# Manifiestos de Kubernetes

**Este directorio esta vacio a proposito.**

Los manifiestos son trabajo pendiente de la Fase 3 del roadmap. No se incluyen
archivos de ejemplo ni plantillas a medias, porque un manifiesto que nunca se
aplico contra un cluster da una falsa sensacion de avance.

## Lo que ya esta preparado para que funcionen

La aplicacion no toma ninguna decision que impida el despliegue en Kubernetes:

| Requisito de Kubernetes | Como lo cumple la aplicacion |
|---|---|
| Contenedores sin estado | La autenticacion es por JWT: no hay sesiones en memoria, se pueden correr N replicas sin sesiones pegajosas |
| Configuracion externa | Todo entra por variables de entorno (`ConfigMap` y `Secret` directos) |
| Liveness probe | `GET /health` responde sin tocar la base de datos |
| Readiness probe | `GET /health/ready` verifica la conexion a PostgreSQL |
| Contenedor no privilegiado | El backend corre como el usuario `unireserve` (uid 1000), no como root |
| Base de datos externa | El backend solo conoce `DATABASE_URL`: cambiarla por un endpoint de AWS RDS no requiere tocar codigo |
| Migraciones separables | `alembic upgrade head` puede ejecutarse como un `initContainer` o un `Job`, en vez de en el entrypoint |

## Lo que habria que crear

- `namespace.yaml`
- `configmap.yaml` — configuracion no sensible
- `secret.yaml` — `JWT_SECRET` y credenciales de la base
- `backend-deployment.yaml` y `backend-service.yaml`
- `frontend-deployment.yaml` y `frontend-service.yaml`
- `ingress.yaml` — enrutamiento y TLS
- `migration-job.yaml` — `Job` que aplica las migraciones antes del despliegue
- `hpa.yaml` — escalado horizontal

## Un detalle a resolver antes

`VITE_API_URL` se incrusta en el bundle durante `npm run build`, no en tiempo
de ejecucion. En Kubernetes eso significa que **no** se puede inyectar por
`ConfigMap`: hay que construir una imagen por entorno, o servir la
configuracion desde un archivo que Nginx sirva y el frontend lea al arrancar.
Conviene decidirlo antes de escribir los manifiestos.
