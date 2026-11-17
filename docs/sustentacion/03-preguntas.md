# Banco de Preguntas Técnicas y Respuestas de Sustentación

15 preguntas de alta probabilidad técnica ajustadas con rigor a la implementación real de UniReserve.

---

### 1. ¿Cómo garantiza el backend que dos reservas no se solapen en el mismo espacio?
**Respuesta técnica**:
En `app/services/reservations.py`, la función `buscar_solapamientos` implementa la condición matemática canónica para la intersección de dos intervalos semiabiertos $[A_{inicio}, A_{fin})$ y $[B_{inicio}, B_{fin})$:
$$\text{Solapamiento} \iff A_{inicio} < B_{fin} \land B_{inicio} < A_{fin}$$
A nivel de base de datos, se filtra por `space_id`, `fecha`, y únicamente reservas en estado `CONFIRMADA` (las reservas canceladas liberan el rango). Si la consulta retorna al menos un registro, el servicio detiene la operación y lanza un `ConflictError` (HTTP 409) con código de error `reservation_overlap`.

---

### 2. ¿Qué ocurre exactamente cuando arranca el contenedor del backend? ¿Cómo opera `entrypoint.sh`?
**Respuesta técnica**:
El script `entrypoint.sh` ejecuta una secuencia determinista de 4 etapas:
1. **Espera activa a PostgreSQL**: Ejecuta un script inline de Python que intenta un `SELECT 1` hasta 30 veces con pausas de 2 segundos. Si PostgreSQL no responde, aborta con código 1.
2. **Migraciones automáticas**: Ejecuta `alembic upgrade head`, aplicando los cambios de esquema pendientes sobre la base de datos de forma idempotente.
3. **Carga condicional de seed**: Solo si la variable de entorno `RUN_SEED=true`, invoca `python -m app.db.seed` para crear los roles y espacios iniciales. En producción esta variable se deja en `false`.
4. **Cesión de proceso**: Mediante `exec "$@"`, sustituye el proceso del shell por el comando principal (Uvicorn), permitiendo que reciba correctamente las señales del kernel (`SIGTERM`, `SIGINT`).

---

### 3. ¿Cómo se inyecta la variable `VITE_API_URL` en el frontend? ¿Se puede cambiar en tiempo de ejecución con un ConfigMap de Kubernetes?
**Respuesta técnica**:
No de forma directa mediante variables de entorno estándar del contenedor. En Vite, las variables que empiezan por `VITE_` se reemplazan estáticamente en el código JavaScript en **tiempo de compilación** (`npm run build`).
Por ello, nuestro `Dockerfile` recibe `ARG VITE_API_URL=http://localhost:8000` y lo expone como `ENV` durante la etapa `builder`. En Kubernetes, para cambiar de entorno se genera una imagen construida con el argumento adecuado o se sirve un archivo `config.json` estático desde Nginx que el frontend consulte dinámicamente antes de renderizar.

---

### 4. ¿Por qué corren las pruebas de Pytest contra PostgreSQL real y no contra SQLite en memoria?
**Respuesta técnica**:
Porque SQLite no implementa de forma idéntica los tipos de datos nativos de PostgreSQL, como los tipos `ENUM` de SQLAlchemy (`UserRole`, `SpaceType`, `ReservationStatus`) ni los comportamientos de truncado de tablas con reinicio de secuencias (`TRUNCATE ... RESTART IDENTITY CASCADE`). Probar contra SQLite produce "falsos positivos", donde las pruebas pasan en memoria pero fallan en producción ante restricciones de integridad referencial. En GitHub Actions levantamos un contenedor de servicio `postgres:16-alpine`.

---

### 5. ¿Por qué no utilizaron una herramienta GitOps completa como ArgoCD o Flux?
**Respuesta técnica (Honestidad de diseño)**:
ArgoCD y Flux son excelentes para infraestructuras empresariales con clústeres dedicados. Sin embargo, en un entorno de desarrollo o clúster local Minikube, los controladores y CRDs de ArgoCD consumen de 1 a 2 GB de memoria RAM de forma constante.
Decidimos adoptar un modelo **declarativo push-based**: el estado deseado de Kubernetes reside 100% en Git (manifiestos YAML en `k8s/`), y los despliegues se aplican mediante comandos o pipelines automatizados. Es una decisión consciente de ingeniería: priorizar rendimiento y simplicidad sobre la sobrecarga de un operador innecesario para este alcance.

---

### 6. ¿Cuál es la diferencia entre CI (Integración Continua) y CD / GitOps?
**Respuesta técnica**:
- **CI (Continuous Integration)**: Es la práctica de integrar frecuentemente el código en la rama principal, ejecutando automáticamente análisis estático (Ruff, ESLint), compilación y suites de pruebas automatizadas (Pytest, Vitest) para detectar errores tempranamente. En nuestro proyecto, el CI termina con la validación de la imagen y la publicación de artefactos versionados a DockerHub.
- **CD (Continuous Delivery / Deployment) / GitOps**: Se encarga de la entrega y despliegue del artefacto validado en los entornos de ejecución (staging/producción). En GitOps, el repositorio Git actúa como la única fuente de verdad (*Single Source of Truth*) para el estado de la infraestructura en Kubernetes.

---

### 7. ¿Cómo garantizan que una imagen Docker no se publique si una prueba falla?
**Respuesta técnica**:
En nuestros workflows de GitHub Actions (`backend-ci.yml` y `frontend-ci.yml`), el job `publish-image` incluye la directiva `needs: test`. Si el job `test` retorna un código de salida distinto de 0 (por ejemplo, una aserción fallida en Pytest o un error de linting), el motor de GitHub Actions marca el job dependiente como omitido (`skipped`) o cancelado, impidiendo cualquier llamada a DockerHub.

---

### 8. ¿Qué estrategia de ramas y versionamiento siguen los repositorios?
**Respuesta técnica**:
Seguimos un flujo basado en **GitFlow simplificado**:
- `main`: Código estable y probado, apto para producción. Cada release lleva un tag semántico anotado (`v1.0.0`).
- `develop`: Rama de integración para características terminadas.
- `feature/*`: Ramas de desarrollo temporal donde se construyen nuevas funcionalidades y se integran mediante Pull Requests con ejecución previa de CI.

---

### 9. ¿Qué permisos de seguridad tienen los flujos de GitHub Actions?
**Respuesta técnica**:
Siguen el principio de **menor privilegio** (*least privilege*). En la raíz del workflow se declara explícitamente:
```yaml
permissions:
  contents: read
```
Esto asegura que el token por defecto del workflow (`GITHUB_TOKEN`) solo tenga permisos de lectura sobre el código, evitando que un script malicioso o una vulnerabilidad en una dependencia pueda inyectar código o alterar el historial del repositorio.

---

### 10. ¿Por qué el contenedor de backend no corre como usuario `root`?
**Respuesta técnica**:
Por principios de seguridad en contenedores y cumplimiento de **Pod Security Standards** en Kubernetes (`Restricted`). En el Dockerfile del backend creamos un usuario de sistema dedicado:
```dockerfile
RUN useradd --create-home --uid 1000 unireserve && chown -R unireserve:unireserve /app
USER unireserve
```
Si un atacante lograra vulnerar la aplicación web, no obtendría privilegios de superusuario dentro del contenedor, reduciendo el riesgo de escape hacia el nodo anfitrión.

---

### 11. ¿Cómo manejan la autenticación y las sesiones de usuario en un entorno escalable?
**Respuesta técnica**:
Utilizamos autenticación sin estado (*stateless*) basada en tokens **JWT (JSON Web Tokens)** firmados con el algoritmo simétrico `HS256`. Cada petición protegida incluye el token en la cabecera `Authorization: Bearer <token>`.
Al no guardar sesiones en memoria RAM ni requerir almacenamiento compartido en caché (como Redis), la aplicación cumple con el Factor 6 de 12-Factor (*Stateless processes*), permitiendo escalar horizontalmente el backend a múltiples réplicas en Kubernetes sin problemas de sincronización de sesión.

---

### 12. ¿Cómo manejan la concurrencia en los pipelines de GitHub Actions?
**Respuesta técnica**:
Configuramos un grupo de concurrencia en cada workflow:
```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```
Si un desarrollador realiza múltiples pushes seguidos sobre la misma rama, el pipeline en curso se cancela automáticamente para darle prioridad al commit más reciente. Esto ahorra minutos de computación y evita que imágenes viejas sobreescriban tags recientes.

---

### 13. ¿Qué etiquetas OCI se agregan a las imágenes de Docker y para qué sirven?
**Respuesta técnica**:
Utilizamos la acción `docker/metadata-action` para inyectar especificaciones OCI (*Open Container Initiative*):
- `org.opencontainers.image.revision`: El SHA completo del commit que originó la imagen.
- `org.opencontainers.image.source`: La URL del repositorio en GitHub.
- `org.opencontainers.image.title` y `description`.
Esto garantiza **trazabilidad binario → código**: al inspeccionar una imagen en producción con `docker inspect`, se puede identificar inmediatamente la línea exacta de código que la generó.

---

### 14. ¿Cómo ejecutan las pruebas End-to-End (E2E) con Playwright en diferentes entornos?
**Respuesta técnica**:
El archivo `playwright.config.ts` y las utilidades en `e2e/helpers.ts` parametrizan dinámicamente las URLs mediante variables de entorno:
```typescript
baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000'
export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
```
Esto permite correr la suite E2E contra `docker-compose` local, o contra los servicios expuestos por port-forward en Minikube sin modificar una sola línea de código de las pruebas.

---

### 15. Si se cae la conexión a internet durante la sustentación, ¿cómo demuestran el funcionamiento del sistema?
**Respuesta técnica**:
Disponemos de un plan de contingencia documentado en `05-plan-b.md` y un respaldo de **Evidencias Congeladas** en la carpeta `EVIDENCIAS_CONGELADAS/`. Esta carpeta contiene los logs completos de ejecución local de `pytest` (56/56 en verde), `vitest`, `ruff`, diagramas de commits de Git y el estado de los contenedores Docker locales generados mediante el script `generar-evidencias.ps1`.
