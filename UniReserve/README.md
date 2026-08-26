# UniReserve

Sistema de gestion y reserva de espacios universitarios: salas de estudio,
laboratorios, salas de reuniones, auditorios y aulas.

Proyecto base para la asignatura **Gestion de la Configuracion**.

**Estado:** v1.0.0 — funcional de extremo a extremo.
**Pruebas:** 56 pruebas de backend + 8 de frontend, todas en verde.

---

## Tabla de contenido

1. [Que es UniReserve](#1-que-es-unireserve)
2. [Problema que resuelve](#2-problema-que-resuelve)
3. [Funcionalidades](#3-funcionalidades)
4. [Arquitectura](#4-arquitectura)
5. [Tecnologias](#5-tecnologias)
6. [Requisitos](#6-requisitos)
7. [Instalacion](#7-instalacion)
8. [Variables de entorno](#8-variables-de-entorno)
9. [Configuracion de PostgreSQL](#9-configuracion-de-postgresql)
10. [Migraciones](#10-migraciones)
11. [Seed de datos](#11-seed-de-datos)
12. [Ejecucion del backend](#12-ejecucion-del-backend)
13. [Ejecucion del frontend](#13-ejecucion-del-frontend)
14. [Ejecucion mediante Docker](#14-ejecucion-mediante-docker)
15. [Ejecucion de pruebas](#15-ejecucion-de-pruebas)
16. [Credenciales de desarrollo](#16-credenciales-de-desarrollo)
17. [Estructura del proyecto](#17-estructura-del-proyecto)
18. [Endpoints principales](#18-endpoints-principales)
19. [Estado actual del proyecto](#19-estado-actual-del-proyecto)
20. [Roadmap / Funcionalidades pendientes](#20-roadmap--funcionalidades-pendientes)

---

## 1. Que es UniReserve

UniReserve es una aplicacion web que permite a estudiantes y profesores
consultar la disponibilidad de los espacios de un campus y reservarlos por
franjas horarias. Los administradores gestionan el catalogo de espacios, las
cuentas de usuario y el calendario completo de reservas.

La aplicacion tiene dos partes independientes que se comunican por una API REST:
un frontend en React y un backend en FastAPI respaldado por PostgreSQL.

---

## 2. Problema que resuelve

En muchas universidades la reserva de salas se maneja con un cuaderno en
porteria, una hoja de calculo compartida o mensajes sueltos por WhatsApp. Eso
produce tres problemas concretos:

- **Choques de horario.** Dos grupos llegan al mismo salon a la misma hora
  porque nadie tenia la informacion completa.
- **Falta de visibilidad.** Para saber si una sala esta libre hay que
  preguntarle a alguien.
- **Cero trazabilidad.** Cuando algo sale mal, no hay registro de quien
  reservo que ni cuando.

UniReserve ataca los tres con un unico registro autoritativo: el servidor
rechaza cualquier reserva que se superponga con otra, cada espacio muestra su
jornada completa y toda reserva queda asociada a un usuario con marca de tiempo.

---

## 3. Funcionalidades

### Estudiante

- Registrarse, iniciar y cerrar sesion.
- Consultar el catalogo de espacios con filtros por tipo, capacidad,
  disponibilidad y texto libre.
- Ver la jornada de 6:00 a 22:00 de cualquier espacio en cualquier fecha, con
  las franjas ocupadas dibujadas a escala.
- Crear reservas indicando espacio, fecha, franja horaria y motivo.
- Consultar el historial completo de sus reservas.
- Cancelar sus propias reservas.

### Administrador

Todo lo anterior, y ademas:

- Crear, editar y deshabilitar espacios.
- Consultar y buscar todas las cuentas de usuario.
- Desactivar cuentas.
- Consultar el calendario completo de reservas del campus, con el usuario
  responsable de cada franja.
- Cancelar cualquier reserva.

### Reglas de negocio implementadas

| # | Regla | Donde se aplica | Respuesta |
|---|---|---|---|
| 1 | Sin autenticacion no se puede reservar | `app/api/deps.py` | `401` |
| 2 | No se puede reservar un espacio deshabilitado o en mantenimiento | `app/services/reservations.py` | `409 space_unavailable` |
| 3 | La hora de fin debe ser posterior a la de inicio | schema + servicio + constraint en la BD | `422` |
| 4 | No se permiten reservas superpuestas para el mismo espacio | `buscar_solapamientos()` | `409 reservation_overlap` |
| 5 | Un estudiante solo cancela sus propias reservas | `cancelar_reserva()` | `403` |
| 6 | Un administrador consulta y gestiona todas las reservas | filtro en el `WHERE` del SQL | — |
| 7 | No se permiten reservas en fechas pasadas | `_validar_fecha()` | `422` |
| 8 | Las contrasenas nunca se guardan en texto plano | bcrypt en `app/core/security.py` | — |

Ademas: las reservas solo se permiten dentro de la jornada del campus
(06:00–22:00), y cancelar una reserva libera la franja para que otra persona
pueda tomarla.

**Nota sobre la Regla 6.** El filtro por rol se aplica en la consulta SQL, no
ocultando filas en el frontend. Un estudiante no recibe las reservas de otro
usuario ni siquiera en el JSON de la respuesta.

---

## 4. Arquitectura

```
   Navegador
       |
       |  HTTPS / JSON
       v
+------------------+
|    Frontend      |   React + Vite + TypeScript
|    (Nginx)       |   Puerto 3000 (Docker) / 5173 (dev)
+------------------+
       |
       |  API REST + JWT Bearer
       v
+------------------+
|    Backend       |   FastAPI + SQLAlchemy
|    (Uvicorn)     |   Puerto 8000
+------------------+
       |
       |  psycopg (driver)
       v
+------------------+
|   PostgreSQL 16  |   Puerto 5432
+------------------+
```

Decisiones que sostienen esta arquitectura:

- **El frontend nunca toca la base de datos.** Solo conoce la URL de la API.
- **Las tres capas se despliegan por separado.** Cada una tiene su propia
  imagen de contenedor y su propio ciclo de vida.
- **El backend no guarda estado en memoria.** La autenticacion es por JWT, sin
  sesiones en el servidor, asi que se pueden correr N replicas detras de un
  balanceador sin sesiones pegajosas. Esto es lo que hace viable el despliegue
  en Kubernetes mas adelante.
- **La configuracion entra por variables de entorno.** No hay una sola URL ni
  credencial escrita en el codigo.
- **Las reglas de negocio viven en `app/services/`, no en los routers.** Se
  pueden probar sin levantar el servidor HTTP y no se duplican entre endpoints.

### Modelo de datos

```
   User                     Space
   ----                     -----
   id (PK)                  id (PK)
   nombre                   nombre (unico)
   apellido                 descripcion
   correo (unico, idx)      ubicacion
   contrasena_hash          capacidad  (CHECK > 0)
   rol                      tipo       (idx)
   activo                   estado     (idx)
   created_at               created_at
   updated_at               updated_at
      |                        |
      | 1                    1 |
      |                        |
      |     N            N     |
      +------ Reservation -----+
              -----------
              id (PK)
              user_id  (FK -> users.id,  idx)
              space_id (FK -> spaces.id, idx)
              fecha    (idx)
              hora_inicio
              hora_fin
              estado (idx)
              motivo
              created_at
              updated_at

              CHECK (hora_fin > hora_inicio)
              INDEX (space_id, fecha)   <- consulta mas frecuente
```

Los borrados son logicos: deshabilitar un espacio o desactivar un usuario
cambia su estado, nunca borra la fila. El historial de reservas se conserva
para trazabilidad.

---

## 5. Tecnologias

| Capa | Tecnologia | Version | Por que |
|---|---|---|---|
| Frontend | React | 18.3 | Ecosistema maduro, facil de mantener por un equipo pequeno |
| | Vite | 5.4 | Build rapido y variables de entorno por prefijo `VITE_` |
| | TypeScript | 5.7 | Los tipos del frontend reflejan los schemas del backend |
| | React Router | 6.28 | Rutas anidadas y guardas por rol |
| | Vitest + Testing Library | 2.1 | Mismo motor que Vite, sin configuracion duplicada |
| Backend | Python | 3.12 | |
| | FastAPI | 0.115 | OpenAPI automatico y validacion integrada |
| | Pydantic | 2.10 | Validacion declarativa de entrada y salida |
| | SQLAlchemy | 2.0 | ORM con tipado moderno (`Mapped[]`) |
| | Alembic | 1.14 | Migraciones versionadas |
| | Pytest | 8.3 | |
| Base de datos | PostgreSQL | 16 | Constraints, indices compuestos y tipos ENUM reales |
| Seguridad | JWT (python-jose) | 3.3 | Autenticacion sin estado |
| | bcrypt (passlib) | 4.0 | Hashing de contrasenas |
| Contenedores | Docker + Compose | | |
| Servidor web | Nginx | 1.27 | Sirve el build estatico del frontend |

---

## 6. Requisitos

### Opcion A — con Docker (recomendada)

- Docker Engine 24+ con el plugin Compose v2.

Nada mas. Ni Python, ni Node, ni PostgreSQL en la maquina.

### Opcion B — instalacion local

- Python 3.11 o superior
- Node.js 20 o superior
- PostgreSQL 14 o superior
- Git

---

## 7. Instalacion

```bash
git clone https://github.com/<usuario>/UniReserve.git
cd UniReserve
cp .env.example .env
```

Si va a usar Docker, ya puede saltar directamente a la
[seccion 14](#14-ejecucion-mediante-docker).

Para la instalacion local, continue:

```bash
# --- Backend ---
cd backend
python -m venv .venv
source .venv/bin/activate        # En Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../.env.example .env

# --- Frontend ---
cd ../frontend
npm install
cp .env.example .env
```

---

## 8. Variables de entorno

Ningun secreto esta escrito en el codigo. Toda la configuracion entra por
variables de entorno, documentadas en `.env.example`.

| Variable | Ejemplo | Descripcion |
|---|---|---|
| `POSTGRES_USER` | `postgres` | Usuario de PostgreSQL (solo Docker) |
| `POSTGRES_PASSWORD` | `postgres` | Contrasena de PostgreSQL (solo Docker) |
| `POSTGRES_DB` | `unireserve` | Nombre de la base (solo Docker) |
| `DATABASE_URL` | `postgresql+psycopg://postgres:postgres@localhost:5432/unireserve` | Cadena de conexion del backend |
| `TEST_DATABASE_URL` | `...@localhost:5432/unireserve_test` | Base separada para las pruebas |
| `JWT_SECRET` | `openssl rand -hex 32` | Clave de firma de los tokens |
| `JWT_ALGORITHM` | `HS256` | Algoritmo de firma |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Vigencia del token de acceso |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Origenes permitidos, separados por coma |
| `ENVIRONMENT` | `development` | Entorno actual |
| `LOG_LEVEL` | `INFO` | Nivel de los logs estructurados |
| `RUN_SEED` | `true` | Carga los datos de prueba al arrancar el contenedor |
| `VITE_API_URL` | `http://localhost:8000` | URL de la API que consume el frontend |

Tres advertencias que importan:

- **`.env` nunca se versiona.** Esta en `.gitignore`. Solo se versiona
  `.env.example`.
- **`JWT_SECRET` debe cambiarse fuera de local.** Cualquiera que conozca esa
  clave puede fabricar tokens validos, incluidos tokens de administrador.
- **`VITE_API_URL` se aplica en tiempo de compilacion, no de ejecucion.** Vite
  la incrusta en el bundle durante `npm run build`. Cambiarla despues no tiene
  efecto: hay que reconstruir la imagen.

---

## 9. Configuracion de PostgreSQL

Solo aplica a la instalacion local; con Docker esto es automatico.

```bash
# Linux
sudo -u postgres psql

# macOS (Homebrew)
psql -U postgres
```

Dentro de psql:

```sql
CREATE DATABASE unireserve;
CREATE DATABASE unireserve_test;   -- base separada para las pruebas
ALTER USER postgres PASSWORD 'postgres';
\q
```

Verificar la conexion:

```bash
psql -U postgres -d unireserve -c "SELECT version();"
```

La base de pruebas es independiente a proposito: `pytest` la borra y la vuelve
a crear en cada ejecucion, y no debe tocar los datos de desarrollo.

---

## 10. Migraciones

El esquema se gestiona con Alembic. Nunca se crean tablas a mano.

```bash
cd backend
alembic upgrade head        # aplicar todas las migraciones
alembic current             # ver la revision aplicada
alembic history --verbose   # historial completo
alembic downgrade -1        # revertir la ultima
```

Para crear una migracion nueva despues de cambiar un modelo:

```bash
alembic revision --autogenerate -m "descripcion del cambio"
```

**Siempre hay que revisar a mano el archivo generado.** El autogenerate no
detecta bien los renombres de columna, algunos cambios de tipo ni ciertos
constraints. Y una migracion que ya se fusiono en `develop` no se edita: se
crea otra que la corrija. Ver `CONTRIBUTING.md`, seccion 5.

---

## 11. Seed de datos

```bash
cd backend
python -m app.db.seed
```

El script es **idempotente**: se puede ejecutar varias veces sin duplicar
registros. Crea 1 administrador, 4 estudiantes, 6 espacios y 5 reservas de
ejemplo.

Uno de los espacios (`Aula 305`) queda en estado `MANTENIMIENTO` a proposito:
sirve para comprobar la Regla 2 desde la interfaz sin tener que modificar nada.

---

## 12. Ejecucion del backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Disponible en:

| Recurso | URL |
|---|---|
| API | http://localhost:8000 |
| Documentacion Swagger | http://localhost:8000/docs |
| Documentacion ReDoc | http://localhost:8000/redoc |
| Esquema OpenAPI | http://localhost:8000/openapi.json |
| Health check | http://localhost:8000/health |
| Readiness (verifica la BD) | http://localhost:8000/health/ready |

---

## 13. Ejecucion del frontend

```bash
cd frontend
npm run dev
```

Disponible en http://localhost:5173.

Otros comandos:

```bash
npm run build      # build de produccion en dist/
npm run preview    # sirve el build para verificarlo
npm run lint       # ESLint, cero avisos permitidos
npm run test       # Vitest
```

---

## 14. Ejecucion mediante Docker

Desde la raiz del proyecto:

```bash
cp .env.example .env
docker compose up --build
```

Un solo comando levanta los tres servicios. El backend espera a que PostgreSQL
acepte conexiones, aplica las migraciones y carga el seed antes de empezar a
atender peticiones.

| Servicio | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| Swagger | http://localhost:8000/docs |
| PostgreSQL | `localhost:5432` |

Comandos utiles:

```bash
docker compose logs -f backend     # seguir los logs de un servicio
docker compose ps                  # estado y health de los contenedores
docker compose down                # detener (los datos persisten)
docker compose down -v             # detener y BORRAR la base de datos
docker compose exec db psql -U postgres -d unireserve
```

**Sobre los nombres de servicio.** El backend se conecta a la base usando el
host `db`, que es el nombre del servicio en la red de Compose, no `localhost`.
El frontend en cambio usa `http://localhost:8000`, porque quien resuelve esa
URL es el navegador del usuario, que esta fuera de la red de Docker. Confundir
estos dos casos es el error mas comun al contenerizar una aplicacion web.

---

## 15. Ejecucion de pruebas

### Backend

```bash
cd backend
export TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@localhost:5432/unireserve_test"
pytest                    # 56 pruebas
pytest -v                 # con el nombre de cada prueba
pytest tests/test_reservations.py::test_regla_4_solapamiento_parcial
ruff check .              # linter
```

Las pruebas corren contra **PostgreSQL real**, no contra SQLite. Es una
decision deliberada: SQLite no reproduce los tipos ENUM, los `CHECK`
constraints ni el comportamiento de los indices de PostgreSQL, asi que unas
pruebas en verde sobre SQLite no garantizan nada sobre produccion.

Cobertura por archivo:

| Archivo | Pruebas | Que cubre |
|---|---|---|
| `test_auth.py` | 12 | Registro, login, hashing, tokens invalidos, cuentas desactivadas |
| `test_users.py` | 9 | CRUD de usuarios y autorizacion por rol |
| `test_spaces.py` | 11 | CRUD de espacios, filtros, duplicados, validaciones |
| `test_reservations.py` | 21 | Las 7 reglas de reserva, incluidos los casos limite de solapamiento |
| `test_health.py` | 3 | Health checks y generacion del OpenAPI |

### Frontend

```bash
cd frontend
npm run test      # 8 pruebas
npm run lint
```

Cubren el formulario de registro (validacion en el cliente antes de llamar a la
API) y la banda de disponibilidad, que es el componente critico: si posiciona
mal un bloque, el usuario lee mal el horario.

---

## 16. Credenciales de desarrollo

> **Estas credenciales son exclusivamente para el entorno LOCAL.**
> Estan escritas en el seed y en este README a proposito, para que cualquiera
> pueda levantar el proyecto desde cero. **Nunca deben existir en un entorno
> desplegado.** Antes de desplegar: cambiar `JWT_SECRET`, poner `RUN_SEED=false`
> y crear el administrador real por otra via.

### Administrador

| Campo | Valor |
|---|---|
| Correo | `admin@unireserve.com` |
| Contrasena | `Admin123!` |

### Estudiantes de prueba

Todos con la contrasena `Estudiante123!`:

- `juan.restrepo@unireserve.com`
- `maria.gomez@unireserve.com`
- `carlos.vasquez@unireserve.com`
- `laura.mejia@unireserve.com`

### Espacios cargados

| Espacio | Tipo | Capacidad | Estado |
|---|---|---|---|
| Sala de estudio 101 | Sala de estudio | 8 | Disponible |
| Sala de estudio 102 | Sala de estudio | 6 | Disponible |
| Laboratorio de Sistemas | Laboratorio | 30 | Disponible |
| Sala de reuniones A | Sala de reuniones | 12 | Disponible |
| Auditorio principal | Auditorio | 200 | Disponible |
| Aula 305 | Aula | 40 | En mantenimiento |

---

## 17. Estructura del proyecto

```
UniReserve/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py              # autenticacion y control de rol
│   │   │   ├── router.py            # agregador de routers
│   │   │   └── routes/              # auth, users, spaces, reservations, stats, health
│   │   ├── core/
│   │   │   ├── config.py            # settings desde variables de entorno
│   │   │   ├── logging.py           # logs estructurados en JSON
│   │   │   └── security.py          # bcrypt y JWT
│   │   ├── db/
│   │   │   ├── base.py              # engine, sesion, Base declarativa
│   │   │   └── seed.py              # datos iniciales idempotentes
│   │   ├── models/                  # tablas SQLAlchemy
│   │   ├── schemas/                 # contratos Pydantic de entrada y salida
│   │   ├── services/                # reglas de negocio y errores de dominio
│   │   └── main.py                  # app, CORS, middleware, manejo de errores
│   ├── alembic/versions/            # migraciones versionadas
│   ├── tests/                       # 56 pruebas
│   ├── Dockerfile
│   ├── entrypoint.sh                # espera BD, migra, siembra, arranca
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/                     # cliente HTTP y tipos
│   │   ├── components/              # Layout, guardas, banda horaria, piezas de UI
│   │   ├── context/                 # AuthContext, ToastContext
│   │   ├── pages/                   # 12 paginas
│   │   ├── styles/global.css        # sistema de diseno con tokens
│   │   └── App.tsx                  # rutas
│   ├── Dockerfile
│   └── nginx.conf
│
├── k8s/                             # pendiente (ver roadmap)
├── docker-compose.yml
├── .env.example
├── .gitignore
├── CONTRIBUTING.md                  # ramas, commits, versionado
└── README.md
```

---

## 18. Endpoints principales

Documentacion interactiva completa en http://localhost:8000/docs.

### Autenticacion

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `POST` | `/auth/register` | Publico | Registro. **Siempre crea un ESTUDIANTE**; el campo `rol` que envie el cliente se ignora. |
| `POST` | `/auth/login` | Publico | Devuelve el token de acceso |
| `GET` | `/auth/me` | Autenticado | Perfil del usuario actual |

### Espacios

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `GET` | `/spaces` | Publico | Listado con filtros `tipo`, `estado`, `capacidad_min`, `buscar` |
| `GET` | `/spaces/{id}` | Publico | Detalle |
| `GET` | `/spaces/{id}/availability?fecha=YYYY-MM-DD` | Publico | Franjas ocupadas de esa fecha |
| `POST` | `/spaces` | **Admin** | Crear |
| `PUT` | `/spaces/{id}` | **Admin** | Editar |
| `DELETE` | `/spaces/{id}` | **Admin** | Deshabilitar (borrado logico) |

### Reservas

| Metodo | Ruta | Acceso | Descripcion |
|---|---|---|---|
| `GET` | `/reservations` | Autenticado | El admin ve todas; el estudiante solo las suyas |
| `GET` | `/reservations/{id}` | Autenticado | Detalle |
| `POST` | `/reservations` | Autenticado | Crear. Aplica las reglas 1 a 4 y 7 |
| `PUT` | `/reservations/{id}` | Autenticado | Modificar. Revalida el solapamiento |
| `DELETE` | `/reservations/{id}` | Autenticado | Cancelar. Aplica las reglas 5 y 6 |

### Usuarios

| Metodo | Ruta | Acceso |
|---|---|---|
| `GET` | `/users` | **Admin** |
| `POST` | `/users` | **Admin** (unica via para crear un administrador) |
| `GET` | `/users/{id}` | Admin, o el propio usuario |
| `PUT` | `/users/{id}` | Admin, o el propio usuario (sin poder cambiar rol ni estado) |
| `DELETE` | `/users/{id}` | **Admin** (desactivacion logica) |

### Sistema

| Metodo | Ruta | Acceso |
|---|---|---|
| `GET` | `/health` | Publico |
| `GET` | `/health/ready` | Publico |
| `GET` | `/stats/dashboard` | Autenticado (metricas segun el rol) |

### Formato de las respuestas

Los listados devuelven siempre la misma estructura paginada:

```json
{ "items": [], "total": 0, "page": 1, "size": 20, "pages": 1 }
```

Los errores tambien son uniformes, con un codigo de dominio estable que el
frontend puede interpretar:

```json
{
  "detail": "El espacio ya esta reservado el 2026-08-24 de 09:00 a 10:00.",
  "code": "reservation_overlap"
}
```

| Codigo HTTP | Significado |
|---|---|
| `200` / `201` | Exito |
| `401` | Sin token, token invalido o sesion expirada |
| `403` | Autenticado pero sin permisos para esa operacion |
| `404` | El recurso no existe |
| `409` | Conflicto: solapamiento, duplicado, espacio no disponible |
| `422` | Datos invalidos |

---

## 19. Estado actual del proyecto

### Implementado y verificado

- [x] Autenticacion JWT con registro, login y sesion
- [x] Autorizacion por rol aplicada **en el backend**
- [x] CRUD completo de usuarios, espacios y reservas
- [x] Las 8 reglas de negocio, con pruebas para cada una
- [x] Consulta de disponibilidad por espacio y fecha
- [x] PostgreSQL con migraciones de Alembic, constraints e indices
- [x] Seed idempotente de datos de prueba
- [x] Frontend funcional de 12 paginas conectado a la API real
- [x] Manejo de carga, error, vacio, formulario invalido y sesion expirada
- [x] Configuracion completa por variables de entorno
- [x] Logs estructurados en JSON con `request_id`
- [x] Health check y readiness probe
- [x] 56 pruebas de backend + 8 de frontend
- [x] Linters configurados (`ruff`, `eslint`)
- [x] Dockerfiles multi-stage y `docker compose up --build`
- [x] Estrategia de ramas, commits y versionado documentada

### Verificaciones ejecutadas sobre esta version

| Verificacion | Resultado |
|---|---|
| PostgreSQL 16 funcionando | OK |
| `alembic upgrade head` crea las 4 tablas | OK |
| El seed carga sin duplicar al repetirse | OK |
| El backend arranca y responde | OK |
| `/health/ready` confirma la conexion a la BD | OK |
| Registro y login emiten un JWT valido | OK |
| Regla 4: 09:30–10:30 sobre 09:00–10:00 | `409` |
| Regla 2: reservar un espacio en mantenimiento | `409` |
| Regla 1: reservar sin token | `401` |
| Autorizacion: estudiante hacia `GET /users` | `403` |
| Reserva valida sobre franja libre | `201` |
| Las reservas quedan persistidas en PostgreSQL | OK |
| `pytest` | 56 en verde |
| `ruff check .` | sin hallazgos |
| `tsc -b` y `vite build` | sin errores |
| `eslint --max-warnings 0` | sin avisos |
| `vitest run` | 8 en verde |

### Todavia no implementado

Se documenta explicitamente para no dar a entender que existe:

- El directorio `k8s/` esta vacio: no hay manifiestos de Kubernetes.
- No hay workflows de GitHub Actions: `.github/workflows/` esta vacio.
- No hay refresh tokens; el token expira a los 60 minutos y hay que
  volver a iniciar sesion.
- No hay recuperacion de contrasena.
- No hay paginacion en la interfaz: los listados piden hasta 100 elementos.
- No hay notificaciones por correo.

---

## 20. Roadmap / Funcionalidades pendientes

Ordenado por lo que conviene atacar primero en una asignatura de Gestion de la
Configuracion. Los tres primeros bloques son el trabajo propio de la materia:
la aplicacion existe para tener algo sobre lo que ejercerlos.

### Fase 1 — Integracion continua

- [ ] Workflow de CI en `.github/workflows/ci.yml` con checkout, instalacion de
      dependencias, lint, pruebas y build.
- [ ] Servicio de PostgreSQL en el runner para las pruebas del backend.
- [ ] Ejecucion en paralelo de los trabajos de backend y frontend.
- [ ] Checks obligatorios en `main` y `develop` antes de fusionar.
- [ ] Reporte de cobertura y umbral minimo.

### Fase 2 — Entrega continua

- [ ] Construccion y publicacion de imagenes Docker en GitHub Container Registry.
- [ ] Etiquetado de imagenes por version semantica y por SHA del commit.
- [ ] Generacion automatica del changelog a partir de los Conventional Commits.
- [ ] Sincronizacion automatica de la version entre `config.py`, `package.json`
      y la etiqueta de Git.
- [ ] Entorno de staging.

### Fase 3 — Kubernetes y AWS

- [ ] Manifiestos en `k8s/`: Deployment y Service de frontend y backend.
- [ ] ConfigMap para la configuracion y Secret para `JWT_SECRET` y las
      credenciales de la base.
- [ ] Ingress con TLS.
- [ ] Liveness y readiness probes apuntando a `/health` y `/health/ready`
      (los endpoints ya existen).
- [ ] HorizontalPodAutoscaler.
- [ ] PostgreSQL administrado con AWS RDS en lugar de un pod.
- [ ] Cluster EKS y despliegue desde el pipeline.
- [ ] Estrategia de rollback documentada y probada.

### Fase 4 — Observabilidad

- [ ] Metricas en formato Prometheus.
- [ ] Tableros en Grafana.
- [ ] Agregacion centralizada de logs.
- [ ] Trazas distribuidas con OpenTelemetry.
- [ ] Alertas sobre la tasa de error y la latencia.

### Fase 5 — Funcionalidades de producto

- [ ] Notificaciones por correo al confirmar o cancelar una reserva.
- [ ] Calendario visual semanal y mensual.
- [ ] Flujo de aprobacion para los espacios que lo requieran.
- [ ] Reservas recurrentes.
- [ ] Estadisticas de utilizacion por espacio y por franja.
- [ ] Exportacion a CSV y PDF.
- [ ] Refresh tokens y recuperacion de contrasena.
- [ ] Paginacion y ordenamiento en la interfaz.
- [ ] Mayor cobertura de pruebas, incluidas pruebas de extremo a extremo.

---

## Licencia

Proyecto academico. Uso educativo.
