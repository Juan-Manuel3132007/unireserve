# Historias de usuario — UniReserve

Proyecto semestral de **Gestión de la Configuración**. Cada historia tiene un responsable, que es el integrante que responde por ella en la sustentación.

## Equipo

| Integrante | Usuario de GitHub | Área principal |
|---|---|---|
| Juan Manuel Moreno Muñoz | `Juan-Manuel3132007` | Reservas e infraestructura (Docker, submódulos, Docker Hub) |
| Brayan Camilo Gutierrez Castañeda | `pendiente` | Autenticación, catálogo de espacios y pruebas end-to-end |
| Daniel Morales | `pendiente` | Administración, backend contenerizado y pruebas unitarias |

## Resumen

| ID | Historia | Tipo | Prioridad | Puntos | Responsable | Estado |
|---|---|---|---|---|---|---|
| HU-01 | Registro de estudiante | Funcional | Alta | 3 | Brayan Gutierrez | Terminada |
| HU-02 | Inicio y cierre de sesión | Funcional | Alta | 3 | Brayan Gutierrez | Terminada |
| HU-03 | Catálogo de espacios con filtros | Funcional | Alta | 3 | Brayan Gutierrez | Terminada |
| HU-04 | Disponibilidad de un espacio por fecha | Funcional | Alta | 5 | Brayan Gutierrez | Terminada |
| HU-05 | Crear una reserva | Funcional | Alta | 5 | Juan Manuel Moreno | Terminada |
| HU-06 | Consultar mis reservas | Funcional | Media | 2 | Juan Manuel Moreno | Terminada |
| HU-07 | Cancelar mi reserva | Funcional | Media | 2 | Juan Manuel Moreno | Terminada |
| HU-08 | Gestionar espacios (admin) | Funcional | Alta | 5 | Daniel Morales | Terminada |
| HU-09 | Gestionar usuarios (admin) | Funcional | Media | 3 | Daniel Morales | Terminada |
| HU-10 | Ver y cancelar todas las reservas (admin) | Funcional | Media | 3 | Daniel Morales | Terminada |
| HU-11 | Panel con métricas | Funcional | Baja | 2 | Daniel Morales | Terminada |
| HU-12 | Contenerizar el backend y publicar Swagger | Técnica | Alta | 3 | Daniel Morales | Terminada |
| HU-13 | Contenerizar el frontend | Técnica | Alta | 3 | Brayan Gutierrez | Terminada |
| HU-14 | Orquestar servicios y esquema de base de datos | Técnica | Alta | 5 | Juan Manuel Moreno | Terminada |
| HU-15 | Monorepo con submódulos y "hola mundo" | Técnica | Alta | 3 | Juan Manuel Moreno | Terminada |
| HU-16 | Publicar imágenes en Docker Hub | Técnica | Alta | 2 | Juan Manuel Moreno | Terminada |
| HU-17 | Pruebas unitarias | Técnica | Alta | 3 | Daniel Morales | Terminada |
| HU-18 | Pruebas end-to-end con Playwright | Técnica | Alta | 5 | Brayan Gutierrez | Terminada |
| HU-19 | README de instalación y ejecución | Técnica | Media | 2 | Juan Manuel Moreno | Terminada |

**Puntos por integrante:** Juan Manuel Moreno 21 · Brayan Gutierrez 22 · Daniel Morales 19.

---

## Funcionalidades del estudiante

### HU-01 — Registro de estudiante
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** estudiante, **quiero** crear una cuenta con mi nombre, apellido, correo y contraseña, **para** poder reservar espacios del campus.

**Criterios de aceptación**
- Dado un correo no registrado, cuando envío el formulario válido, entonces se crea la cuenta con rol `ESTUDIANTE` y entro al panel.
- Dado un correo ya registrado, cuando intento registrarme, entonces veo un error y no se crea la cuenta.
- La contraseña se guarda cifrada con bcrypt, nunca en texto plano.

**Evidencia:** `POST /auth/register` · `frontend/src/pages/Registro.tsx` · `backend/tests/test_auth.py` · `frontend/e2e/auth.spec.ts`

### HU-02 — Inicio y cierre de sesión
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** usuario registrado, **quiero** iniciar y cerrar sesión, **para** acceder solo yo a mis reservas.

**Criterios de aceptación**
- Con credenciales correctas recibo un token JWT y entro al panel.
- Con una contraseña incorrecta veo un mensaje de error y sigo en el login.
- Si intento abrir una página protegida sin sesión, la app me lleva al login.

**Evidencia:** `POST /auth/login` · `frontend/src/pages/Login.tsx` · `frontend/src/components/RutaProtegida.tsx` · `frontend/e2e/auth.spec.ts`

### HU-03 — Catálogo de espacios con filtros
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** estudiante, **quiero** ver los espacios del campus y filtrarlos por tipo, capacidad y texto, **para** encontrar rápido uno que me sirva.

**Criterios de aceptación**
- El catálogo muestra nombre, tipo, ubicación, capacidad y estado de cada espacio.
- Los filtros reducen la lista según lo elegido.

**Evidencia:** `GET /spaces` · `frontend/src/pages/Espacios.tsx` · `backend/tests/test_spaces.py`

### HU-04 — Disponibilidad de un espacio por fecha
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** estudiante, **quiero** ver la jornada de 6:00 a 22:00 de un espacio en una fecha, **para** saber qué franjas están libres antes de reservar.

**Criterios de aceptación**
- Las franjas ocupadas se dibujan a escala sobre la banda horaria.
- Al cambiar la fecha, la banda se actualiza con las reservas de ese día.

**Evidencia:** `GET /spaces/{id}/availability` · `frontend/src/pages/DetalleEspacio.tsx` · `frontend/src/components/BandaDisponibilidad.tsx` y su prueba en `__tests__/`

### HU-05 — Crear una reserva
**Responsable:** Juan Manuel Moreno Muñoz

**Como** estudiante, **quiero** reservar un espacio indicando fecha, franja horaria y motivo, **para** asegurar el lugar para mi actividad.

**Criterios de aceptación**
- Si la franja está libre, la reserva se crea y aparece en "Mis reservas".
- Si la franja se cruza con otra reserva del mismo espacio, el sistema la rechaza (`409`) y muestra con cuál choca.
- No se permite reservar en fechas pasadas, fuera de 06:00–22:00, ni espacios en mantenimiento.

**Evidencia:** `POST /reservations` · `backend/app/services/reservations.py` · `frontend/src/pages/NuevaReserva.tsx` · `backend/tests/test_reservations.py` · `frontend/e2e/reservas.spec.ts`

### HU-06 — Consultar mis reservas
**Responsable:** Juan Manuel Moreno Muñoz

**Como** estudiante, **quiero** ver el historial de mis reservas, **para** recordar cuándo y dónde tengo un espacio.

**Criterios de aceptación**
- Veo solo mis reservas, nunca las de otros usuarios (el filtro se aplica en el backend).
- Cada reserva muestra espacio, fecha, franja, motivo y estado.

**Evidencia:** `GET /reservations` · `frontend/src/pages/MisReservas.tsx` · `backend/tests/test_reservations.py`

### HU-07 — Cancelar mi reserva
**Responsable:** Juan Manuel Moreno Muñoz

**Como** estudiante, **quiero** cancelar una reserva futura, **para** liberar el espacio si ya no lo necesito.

**Criterios de aceptación**
- Al cancelar, la reserva pasa a estado `CANCELADA` y la franja queda libre.
- Un estudiante no puede cancelar reservas de otro usuario (`403`).

**Evidencia:** `DELETE /reservations/{id}` · `frontend/src/pages/MisReservas.tsx` · `frontend/e2e/reservas.spec.ts`

---

## Funcionalidades del administrador

### HU-08 — Gestionar espacios
**Responsable:** Daniel Morales

**Como** administrador, **quiero** crear, editar y deshabilitar espacios, **para** mantener el catálogo del campus actualizado.

**Criterios de aceptación**
- Solo un administrador puede crear, editar o deshabilitar espacios; un estudiante recibe `403`.
- No se permiten dos espacios con el mismo nombre.
- Deshabilitar un espacio no borra su historial de reservas (borrado lógico).

**Evidencia:** `POST/PUT/DELETE /spaces` · `frontend/src/pages/AdminEspacios.tsx` · `backend/tests/test_spaces.py`

### HU-09 — Gestionar usuarios
**Responsable:** Daniel Morales

**Como** administrador, **quiero** buscar usuarios y desactivar cuentas, **para** controlar quién usa el sistema.

**Criterios de aceptación**
- Puedo buscar usuarios por nombre o correo y filtrar por rol.
- Una cuenta desactivada no puede iniciar sesión.

**Evidencia:** `GET/DELETE /users` · `frontend/src/pages/AdminUsuarios.tsx` · `backend/tests/test_users.py`

### HU-10 — Ver y cancelar todas las reservas
**Responsable:** Daniel Morales

**Como** administrador, **quiero** ver el calendario completo de reservas con su responsable, **para** resolver conflictos y cancelar cuando sea necesario.

**Criterios de aceptación**
- Veo las reservas de todos los usuarios, con el nombre de quien reservó.
- Puedo cancelar cualquier reserva.

**Evidencia:** `GET/DELETE /reservations` · `frontend/src/pages/AdminReservas.tsx` · `backend/tests/test_reservations.py`

### HU-11 — Panel con métricas
**Responsable:** Daniel Morales

**Como** usuario, **quiero** ver un resumen al entrar, **para** conocer de un vistazo el estado del sistema.

**Criterios de aceptación**
- El administrador ve usuarios, espacios, reservas totales y reservas del día.
- El estudiante ve métricas de sus propias reservas.

**Evidencia:** `GET /stats/dashboard` · `frontend/src/pages/Panel.tsx`

---

## Historias técnicas (Entrega 2)

### HU-12 — Contenerizar el backend y publicar Swagger
**Responsable:** Daniel Morales

**Como** equipo de desarrollo, **queremos** el backend en una imagen Docker con su documentación OpenAPI, **para** ejecutarlo igual en cualquier máquina y que cualquiera pueda consultar la API.

**Criterios de aceptación**
- El `Dockerfile` es multi-stage y el contenedor corre con un usuario sin privilegios.
- Al arrancar, el contenedor espera a PostgreSQL, aplica migraciones y carga el seed.
- Swagger está disponible en `http://localhost:8000/docs`.

**Evidencia:** `backend/Dockerfile` · `backend/.dockerignore` · `backend/entrypoint.sh` · `frontend/e2e/api.spec.ts`

### HU-13 — Contenerizar el frontend
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** equipo de desarrollo, **queremos** el frontend compilado y servido por Nginx en una imagen Docker, **para** desplegarlo sin instalar Node.

**Criterios de aceptación**
- El `Dockerfile` compila con Node 22 y sirve el resultado con Nginx 1.27.
- Las rutas de React funcionan al recargar la página (fallback a `index.html`).
- La URL de la API se configura en el build con `VITE_API_URL`.

**Evidencia:** `frontend/Dockerfile` · `frontend/.dockerignore` · `frontend/nginx.conf`

### HU-14 — Orquestar servicios y esquema de base de datos
**Responsable:** Juan Manuel Moreno Muñoz

**Como** equipo de desarrollo, **queremos** levantar frontend, backend y base de datos con un solo comando, **para** probar el flujo completo sin configuraciones manuales.

**Criterios de aceptación**
- `docker compose up --build` levanta los 3 servicios en una red compartida.
- El backend se conecta a la base por el nombre de servicio `db`, y el esquema se crea con migraciones de Alembic.
- Hay un flujo completo probado: el frontend crea una reserva, el backend la guarda en PostgreSQL y el frontend la muestra.

**Evidencia:** `docker-compose.yml` · `backend/alembic/versions/` · `frontend/e2e/reservas.spec.ts`

### HU-15 — Monorepo con submódulos y "hola mundo"
**Responsable:** Juan Manuel Moreno Muñoz

**Como** equipo de desarrollo, **queremos** un repositorio principal que referencie el frontend y el backend como submódulos, **para** versionar cada aplicación por separado y orquestarlas desde un solo lugar.

**Criterios de aceptación**
- `unireserve-backend` y `unireserve-frontend` tienen rama `main` con un primer commit "hola mundo".
- El monorepo incluye `backend/` y `frontend/` como submódulos (`.gitmodules`).
- Los cambios al monorepo entran por Pull Request con revisión.

**Evidencia:** `.gitmodules` · primer commit de cada repo · PR #1 del monorepo

### HU-16 — Publicar imágenes en Docker Hub
**Responsable:** Juan Manuel Moreno Muñoz

**Como** equipo de desarrollo, **queremos** publicar las imágenes de cada aplicación en Docker Hub, **para** que cualquiera pueda ejecutar la app sin compilarla.

**Criterios de aceptación**
- Existen `juanma313/unireserve-backend` y `juanma313/unireserve-frontend` con los tags `latest` y `1.0.0`.
- `docker compose pull && docker compose up -d` levanta la app usando solo esas imágenes.

**Evidencia:** https://hub.docker.com/r/juanma313/unireserve-backend · https://hub.docker.com/r/juanma313/unireserve-frontend

### HU-17 — Pruebas unitarias
**Responsable:** Daniel Morales

**Como** equipo de desarrollo, **queremos** pruebas unitarias del backend y del frontend, **para** detectar errores antes de integrar cambios.

**Criterios de aceptación**
- 56 pruebas de backend (Pytest) cubren autenticación, usuarios, espacios, reservas y health checks.
- 8 pruebas de frontend (Vitest) cubren el registro y la banda de disponibilidad.
- Todas pasan en verde.

**Evidencia:** `backend/tests/` · `frontend/src/**/__tests__/`

### HU-18 — Pruebas end-to-end con Playwright
**Responsable:** Brayan Camilo Gutierrez Castañeda

**Como** equipo de desarrollo, **queremos** pruebas que recorran la app en un navegador real, **para** verificar que las funcionalidades críticas funcionan de punta a punta.

**Criterios de aceptación**
- 11 pruebas cubren API (health, conexión a BD, Swagger), autenticación y reservas.
- Las pruebas corren contra el stack levantado con Docker.
- Todas pasan en verde.

**Evidencia:** `frontend/playwright.config.ts` · `frontend/e2e/`

### HU-19 — README de instalación y ejecución
**Responsable:** Juan Manuel Moreno Muñoz

**Como** nuevo integrante o evaluador, **quiero** un README con las tecnologías, cómo descargar y cómo ejecutar el proyecto, **para** ponerlo a funcionar sin ayuda.

**Criterios de aceptación**
- Indica qué aplicaciones contiene el repo, con tecnologías y versiones.
- Explica cómo clonar con submódulos y cómo bajar las imágenes de Docker Hub.
- Explica requisitos, ejecución y pruebas, con comandos para Windows y Mac/Linux.

**Evidencia:** `README.md`