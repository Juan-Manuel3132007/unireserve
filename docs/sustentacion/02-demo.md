# Guion de Demostración Técnica en Vivo (15–20 Minutos)

Guion ordenado paso a paso con roles, comandos de terminal exactos, qué decir y qué mostrar en pantalla.

---

## 📋 Checklist Previa ("Antes de entrar al aula")

- [ ] Docker Desktop iniciado y en verde (`Engine running`).
- [ ] Pestañas del navegador abiertas:
  - Repositorio Orquestador: `https://github.com/Juan-Manuel3132007/unireserve`
  - GitHub Actions Backend: `https://github.com/Juan-Manuel3132007/unireserve-backend/actions`
  - GitHub Actions Frontend: `https://github.com/Juan-Manuel3132007/unireserve-frontend/actions`
  - DockerHub Repositories: `https://hub.docker.com/u/juanma313`
  - Localhost Frontend: `http://localhost:3000`
  - Swagger API Backend: `http://localhost:8000/docs`
- [ ] Terminal PowerShell abierta en la carpeta del proyecto: `C:\Users\braya\Desktop\unireserve-1`.
- [ ] Carpeta de respaldo de contingencia generada: `docs/sustentacion/EVIDENCIAS_CONGELADAS/`.

---

## 🎬 Desarrollo de la Demostración

### Fase 1: Arquitectura y Orquestación Local (Minuto 0:00 – 4:00)
**Responsable**: Juan Manuel

1. **Mostrar estructura del monorepo y submódulos**:
   - **Qué decir**: *"Aquí vemos el repositorio orquestador `unireserve`. El frontend y backend son submódulos independientes con sus propios ciclos de vida."*
   - **Comando**:
     ```powershell
     git submodule status
     ```
   - **Qué mostrar**: Señalar los commits fijados de cada submódulo.

2. **Levantar el stack completo con Docker Compose**:
   - **Qué decir**: *"Con un solo comando declarativo levantamos la base de datos PostgreSQL 16, la API de FastAPI y la interfaz React servida por Nginx."*
   - **Comando**:
     ```powershell
     docker compose up -d
     docker compose ps
     ```
   - **Qué mostrar**: Los 3 contenedores en estado `healthy` / `Up`.

3. **Verificar endpoints de salud y Swagger**:
   - **Qué decir**: *"FastAPI expone dos sondas de salud: Liveness (`/health`) que responde instantáneo para verificar el proceso, y Readiness (`/health/ready`) que verifica que la conexión con PostgreSQL esté activa."*
   - **Navegador**: Abrir `http://localhost:8000/health` y `http://localhost:8000/health/ready`.
   - **Navegador**: Abrir `http://localhost:8000/docs` para mostrar la especificación OpenAPI autogenerada.

---

### Fase 2: Aplicación en Funcionamiento y Caso de Uso (Minuto 4:00 – 8:00)
**Responsable**: Daniel

1. **Navegación e inicio de sesión**:
   - **Qué decir**: *"Ingresamos a la interfaz web con el usuario de prueba cargado automáticamente por el seed."*
   - **Acción**: Ingresar a `http://localhost:3000/login` con:
     - Correo: `juan.restrepo@unireserve.com`
     - Contraseña: `Estudiante123!`
   - **Qué mostrar**: El panel de espacios disponibles (aulas, laboratorios y salas de estudio).

2. **Demostración de la regla de no-solapamiento (Regla de negocio principal)**:
   - **Qué decir**: *"Vamos a reservar la Sala de Estudio A para hoy de 10:00 a 12:00. La reserva se crea con éxito. Si ahora otro usuario intenta solicitarla de 11:00 a 13:00, el backend detecta inmediatamente el solapamiento en el intervalo continuo y bloquea la operación con un error 409 Conflict."*
   - **Acción**: Intentar crear la reserva en conflicto y mostrar la notificación de rechazo en pantalla.

---

### Fase 3: CI/CD y Calidad de Código (Minuto 8:00 – 14:00)
**Responsable**: Brayan Camilo

1. **Mostrar la suite de pruebas local en verde**:
   - **Qué decir**: *"En nuestra estación de trabajo y en el pipeline ejecutamos 56 pruebas de backend contra PostgreSQL real y pruebas de componentes en el frontend."*
   - **Comandos**:
     ```powershell
     cd ..\unireserve-backend
     .\.venv\Scripts\pytest -v
     cd ..\unireserve-frontend
     npm run test
     ```
   - **Qué mostrar**: Ambos ejecutores finalizando con 100% de pruebas pasadas.

2. **Demostración de Fallo Controlado de CI (La prueba de fuego)**:
   - **Qué decir**: *"Para demostrar que nuestro pipeline es una compuerta real que impide la promoción de código defectuoso a DockerHub, vamos a inducir un fallo intencional en una prueba con nuestro script automatizado."*
   - **Comando**:
     ```powershell
     cd ..\unireserve-1
     .\docs\sustentacion\scripts\provocar-fallo-ci.ps1
     ```
   - **Qué mostrar en GitHub**:
     - Abrir la pestaña Actions en `unireserve-backend`.
     - Mostrar la ejecución de la rama `test/fallo-controlado`.
     - Mostrar el paso de Pytest fallando en **rojo**.
     - **Punto crítico a resaltar al profesor**: Señalar que el job `publish-image` aparece como **CANCELADO / OMITIDO** (`skipped`), demostrando que ninguna imagen rota se sube al registry.

3. **Restaurar el pipeline a verde**:
   - **Qué decir**: *"Ahora ejecutamos el script de restauración, corrigiendo la aserción y devolviendo la rama a verde."*
   - **Comando**:
     ```powershell
     .\docs\sustentacion\scripts\restaurar-ci.ps1
     ```
   - **Qué mostrar**: Mostrar en GitHub Actions cómo la nueva ejecución finaliza en verde.

---

### Fase 4: Despliegue Declarativo, Kubernetes y Preguntas (Minuto 14:00 – 18:00)
**Responsable**: Juan Manuel / Daniel

1. **Inspección de manifiestos y trazabilidad commit → imagen**:
   - **Qué decir**: *"Cada imagen publicada en DockerHub cuenta con metadata OCI vinculada al SHA del commit. En Kubernetes los despliegues utilizan el namespace aislado `unireserve`, separando configuración sensible en Secrets y montando las sondas liveness/readiness correspondientes."*
   - **Comando**:
     ```powershell
     kubectl get all -n unireserve
     ```

2. **Cierre de la demo**:
   - **Qué decir**: *"Hemos demostrado la arquitectura de 3 capas, el cumplimiento de la regla de solapamiento, la ejecución de 56 pruebas en bases de datos reales y el bloqueo efectivo de CI ante fallos. Quedamos atentos a sus preguntas."*
