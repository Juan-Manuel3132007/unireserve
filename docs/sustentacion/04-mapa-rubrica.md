# Matriz de Trazabilidad y Mapeo de Rúbrica de Evaluación

Mapeo detallado criterio por criterio de los requisitos de la asignatura contra las evidencias verificadas en el repositorio.

---

## 📌 1. Criterios de Proceso (P1 – P4)

| Criterio | Descripción | Estado | Evidencia Concreta en el Repositorio |
|---|---|---|---|
| **P1** | **Estructura y gestión del repositorio Git** | ✅ Completo | Monorepo orquestador (`unireserve-1`) con submódulos independientes `backend/` y `frontend/` configurados en `.gitmodules`. Flujo GitFlow con ramas `main`, `develop` y ramas de características `feature/*`. |
| **P2** | **Trazabilidad y Convenciones de Commits** | ✅ Completo | Commits redactados bajo el estándar **Conventional Commits** (`feat:`, `fix:`, `ci:`, `docs:`, `chore:`). Tags anotados de release semántico (`v1.0.0`). |
| **P3** | **Gestión de Configuración y 12-Factor** | ✅ Completo | Configuración 100% externa mediante `.env.example` y variables de entorno (`DATABASE_URL`, `JWT_SECRET`, `VITE_API_URL`). Aplicaciones sin estado (*stateless*) con autenticación JWT. |
| **P4** | **Documentación y Sustentación Técnica** | ✅ Completo | Documentación técnica exhaustiva en `unireserve-1/docs/sustentacion/`: Pitch estructurado (`01-pitch.md`), Guion de demo (`02-demo.md`), Banco de 15 preguntas (`03-preguntas.md`), y Plan de contingencia (`05-plan-b.md`). |

---

## ⚙️ 2. Criterios de Desarrollo y DevOps (D1 – D9)

| Criterio | Descripción | Estado | Evidencia Concreta en el Repositorio |
|---|---|---|---|
| **D1** | **Reproducibilidad y Documentación de Inicio Rápido** | ✅ Completo | `README.md` completos en los 3 repositorios con diagramas Mermaid de arquitectura, pasos paso a paso desde cero con `git clone --recurse-submodules`, tablas de variables de entorno y badges de estado de CI. |
| **D2** | **Integración Continua Automatizada (GitHub Actions)** | ✅ Completo | Workflows `.github/workflows/backend-ci.yml` y `frontend-ci.yml`. Concurrencia con cancelación de builds obsoletas, permisos mínimos `contents: read`, linter (Ruff/ESLint), pruebas y verificación de construcción Docker. |
| **D3** | **Batería de Pruebas Automatizadas (Backend & Frontend)** | ✅ Completo | **Backend**: 56 pruebas con `pytest` ejecutadas contra PostgreSQL 16 real en servicio contenedorizado (no SQLite). Reporte JUnit XML generado y publicado como artefacto.<br>**Frontend**: 8 pruebas unitarias/componentes con `vitest` + suite E2E con `playwright`. |
| **D4** | **Calidad de Código y Análisis Estático** | ✅ Completo | Linter `ruff check .` completamente limpio en backend. `eslint` con configuración en `.eslintrc.cjs` para TypeScript y React Hooks limpio en frontend. |
| **D5** | **Contenedorización Segura (Docker Multi-Stage)** | ✅ Completo | `Dockerfile` en backend con compilación separada y usuario sin privilegios `unireserve` (UID 1000). `Dockerfile` en frontend con Node 22 para build e imagen final ligera en Nginx Alpine con healthchecks nativos. |
| **D6** | **Publicación Segura y Trazabilidad de Artefactos** | ✅ Completo | Job `publish-image` condicionado con `needs: test` (solo publica si las pruebas pasan). Publicación a DockerHub (`juanma313/unireserve-backend` y `frontend`) con etiquetas `sha-<corto>`, semver y metadatos OCI (`revision`, `source`). |
| **D7** | **Manejo de Salud y Sondaje (Probes)** | ✅ Completo | Endpoints desacoplados en FastAPI: Liveness probe en `/health` (proceso vivo) y Readiness probe en `/health/ready` (validación de ping activo a la base de datos PostgreSQL). |
| **D8** | **Despliegue Declarativo en Kubernetes** | ⚠️ Parcial / Honesto | Manifiestos base documentados en `k8s/` y arquitectura preparada para namespace `unireserve`, ConfigMaps, Secrets y sondas. El despliegue se maneja de forma declarativa push-based; se descartó ArgoCD por consumo excesivo de memoria en Minikube. |
| **D9** | **Pruebas End-to-End (E2E) Parametrizables** | ✅ Completo | Suite Playwright en `unireserve-frontend/e2e/` configurable dinámicamente mediante `E2E_BASE_URL` y `E2E_API_URL` para ejecutar contra Docker Compose o Minikube vía port-forward. |
