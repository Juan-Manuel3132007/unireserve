# UniReserve

Aplicación web para consultar y reservar espacios universitarios (salas de estudio, laboratorios, auditorios y aulas) sin choques de horario.

Proyecto de la asignatura **Gestión de la Configuración** — Universidad de Medellín.

## Aplicaciones del repositorio

Este repositorio es un **monorepo**: el frontend y el backend son **submódulos de Git**, cada uno con su propio repositorio y su propia imagen en Docker Hub.

| Carpeta | Aplicación | Tecnologías | Repositorio | Imagen Docker Hub |
|---|---|---|---|---|
| `frontend/` | Interfaz web (SPA) | React 18.3, Vite 5.4, TypeScript 5.7, Node 22, Nginx 1.27 | [unireserve-frontend](https://github.com/Juan-Manuel3132007/unireserve-frontend) | [`juanma313/unireserve-frontend`](https://hub.docker.com/r/juanma313/unireserve-frontend) |
| `backend/` | API REST + Swagger | Python 3.12, FastAPI 0.115, SQLAlchemy 2.0, Alembic 1.14 | [unireserve-backend](https://github.com/Juan-Manuel3132007/unireserve-backend) | [`juanma313/unireserve-backend`](https://hub.docker.com/r/juanma313/unireserve-backend) |
| — | Base de datos | PostgreSQL 16 | — | `postgres:16-alpine` (oficial) |

```
unireserve/
├── docker-compose.yml   # levanta frontend, backend y base de datos
├── frontend/            # submódulo -> unireserve-frontend
├── backend/             # submódulo -> unireserve-backend
├── docs/                # historias de usuario y documentación
└── README.md
```

## Requisitos

| Para | Necesita |
|---|---|
| Ejecutar la app (recomendado) | [Git](https://git-scm.com/) y [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Docker 24+ con Compose v2) |
| Correr las pruebas del frontend | Además: [Node.js](https://nodejs.org/) 20 o superior |
| Desarrollar el backend sin Docker | Además: Python 3.11+ y PostgreSQL 14+ |

> Docker Desktop debe estar **abierto** (estado *Engine running*) antes de ejecutar cualquier comando `docker`.

## 1. Descargar el proyecto

**Opción A — Clonar el código (con submódulos):**

```bash
git clone --recurse-submodules https://github.com/Juan-Manuel3132007/unireserve.git
cd unireserve
```

> Si clonó sin `--recurse-submodules`, las carpetas `frontend/` y `backend/` quedan vacías. Arréglelo con:
> `git submodule update --init --recursive`

**Opción B — Solo las imágenes de Docker Hub (sin compilar):**

```bash
docker pull juanma313/unireserve-backend:1.0.0
docker pull juanma313/unireserve-frontend:1.0.0
```

Tags disponibles: `latest` y `1.0.0`.

## 2. Ejecutar la aplicación

Desde la carpeta `unireserve`:

**Windows (PowerShell):**

```powershell
Copy-Item .env.example .env
docker compose up --build
```

**Mac / Linux:**

```bash
cp .env.example .env
docker compose up --build
```

La primera vez tarda unos minutos. Está lista cuando aparecen mensajes `GET /health ... 200 OK`. El backend crea las tablas (migraciones) y carga datos de prueba automáticamente.

> Para usar las imágenes publicadas en vez de compilar: `docker compose pull` y luego `docker compose up -d`.

| Servicio | URL |
|---|---|
| Aplicación web | http://localhost:3000 |
| API | http://localhost:8000 |
| Swagger (documentación de la API) | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` (usuario `postgres`, clave `postgres`) |

**Usuarios de prueba:**

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@unireserve.com` | `Admin123!` |
| Estudiante | `juan.restrepo@unireserve.com` | `Estudiante123!` |

**Flujo de prueba completo (frontend → backend → base de datos):** inicie sesión como estudiante, cree una reserva en **Reservar**, verifique que aparece en **Mis reservas**, y luego entre como administrador y véala en **Todas las reservas**.

**Comandos útiles:**

```bash
docker compose up -d            # arrancar en segundo plano
docker compose ps               # ver el estado de los contenedores
docker compose logs -f backend  # ver los logs del backend
docker compose down             # apagar (los datos se conservan)
docker compose down -v          # apagar y BORRAR la base de datos
```

## 3. Ejecutar las pruebas

| Tipo | Herramienta | Cantidad | Ubicación |
|---|---|---|---|
| Unitarias backend | Pytest 8.3 | 56 | `backend/tests/` |
| Unitarias frontend | Vitest 2.1 | 8 | `frontend/src/**/__tests__/` |
| End-to-end | Playwright 1.49+ | 11 | `frontend/e2e/` |

**Frontend (unitarias y end-to-end).** Las pruebas end-to-end necesitan la app corriendo (`docker compose up -d`):

```bash
cd frontend
npm install
npx playwright install chromium   # solo la primera vez
npm test                          # 8 pruebas unitarias
npm run test:e2e                  # 11 pruebas end-to-end
```

> Si `npm install` muestra un aviso `allow-scripts` sobre **esbuild**, ejecute `npm approve-scripts esbuild` y `npm rebuild esbuild`.

**Backend.** Las pruebas usan una base de datos aparte (`unireserve_test`). Con la app corriendo, desde la carpeta `unireserve`:

```bash
docker compose exec db psql -U postgres -c "CREATE DATABASE unireserve_test;"   # solo la primera vez
docker compose run --rm --no-deps -u root -v "${PWD}/backend:/app" -e TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@db:5432/unireserve_test --entrypoint sh backend -c "pip install -q -r requirements-dev.txt && pytest"
```

> Las pruebas corren en un contenedor temporal que monta la carpeta `backend/`, porque la imagen de producción no incluye la carpeta `tests/`. El comando funciona igual en PowerShell y en Mac/Linux.

## 4. Publicar una nueva versión en Docker Hub

```bash
docker login
docker compose build
docker compose push backend frontend
```

Para publicar con un número de versión: en Mac/Linux `TAG=1.1.0 docker compose build && TAG=1.1.0 docker compose push backend frontend`; en PowerShell, primero `$env:TAG="1.1.0"` y luego los mismos dos comandos.

> Si se suben cambios a los repos de frontend o backend, el monorepo no se actualiza solo: ejecute `git submodule update --remote --merge` y haga commit del cambio de los submódulos.

## Problemas comunes

| Problema | Solución |
|---|---|
| `no configuration file provided` | No está en la carpeta `unireserve`. Use `cd` hasta ella. |
| Carpetas `frontend/` o `backend/` vacías | `git submodule update --init --recursive` |
| `port is already allocated` (5432, 8000 o 3000) | Otro programa usa ese puerto. Ciérrelo, o cambie el puerto izquierdo en `docker-compose.yml` (por ejemplo `"5433:5432"`). |
| `error during connect` | Docker Desktop no está abierto. |
| La web abre pero dice que no conecta con el servidor | Espere a que el backend termine de arrancar (`docker compose logs -f backend`). |

## Documentación adicional

- `docs/HISTORIAS_DE_USUARIO.md` — historias de usuario y responsable de cada una.
- `CONTRIBUTING.md` — ramas, commits y versionado del equipo.
- Swagger, con la app corriendo: http://localhost:8000/docs