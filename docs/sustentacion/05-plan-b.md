# Plan de Contingencia Técnico (Plan B) y Evidencias Congeladas

Guía de acción rápida ante contingencias durante la sustentación técnica de UniReserve.

---

## 🚨 Matriz de Contingencias y Acciones de Mitigación

| Escenario de Falla | Causa Probable | Acción de Mitigación Inmediata |
|---|---|---|
| **1. Falla de conexión a Internet en el aula** | Bloqueo de red institucional o WiFi inestable | Pasar inmediatamente a la demostración local con **Docker Compose** (`docker compose up -d`). Para sustentar el CI, abrir la carpeta `docs/sustentacion/EVIDENCIAS_CONGELADAS/` y mostrar los logs de ejecución de Pytest y Vitest. |
| **2. DockerHub no responde o límite de tasa (Rate Limit)** | Redes compartidas alcanzando el límite anónimo de DockerHub | Utilizar las imágenes compiladas localmente en el equipo con el script de build local: `docker compose build` o imágenes cacheadas localmente (`juanma313/unireserve-backend:v1.0.0`). |
| **3. Minikube / Clúster de Kubernetes no inicia** | Consumo de CPU/RAM o conflicto de hipervisor | Demostrar los manifiestos declarativos en `k8s/` y levantar la aplicación idéntica en Docker Compose local. Explicar cómo los contenedores son agnósticos al orquestador. |
| **4. GitHub está caído o inaccesible** | Interrupción en la plataforma de GitHub | Demostrar el flujo Git localmente usando las ramas locales (`develop`, `main`, `test/fallo-controlado`) y ejecutando el script `generar-evidencias.ps1` en PowerShell. |

---

## 📦 Carpeta de Respaldo: `EVIDENCIAS_CONGELADAS/`

Para garantizar que ningún fallo de conectividad impida la evaluación, hemos automatizado la captura de evidencias en la carpeta `docs/sustentacion/EVIDENCIAS_CONGELADAS/` (excluida del control de versiones en `.gitignore` para no ensuciar el repositorio).

### ¿Cómo regenerar o actualizar las evidencias congeladas?

Ejecuta desde PowerShell:
```powershell
cd C:\Users\braya\Desktop\unireserve-1
.\docs\sustentacion\scripts\generar-evidencias.ps1
```

### Contenido de las evidencias congeladas:
1. `backend-pytest.txt`: Salida completa y detallada de las 56 pruebas de Pytest ejecutadas contra PostgreSQL real (todas en verde).
2. `backend-ruff.txt`: Salida limpia de verificación del linter Ruff.
3. `frontend-vitest.txt`: Salida de ejecución de pruebas unitarias y de componentes con Vitest (8 pruebas en verde).
4. `frontend-eslint.txt`: Verificación de sintaxis y buenas prácticas con ESLint.
5. `frontend-build.txt`: Log de empaquetado y chequeo de tipos con `tsc -b && vite build`.
6. `submodules-status.txt`: Estado y hashes de los submódulos Git vinculados.
7. `backend-git-log.txt` y `frontend-git-log.txt`: Árboles gráficos de commits mostrando la historia de integración y tags `v1.0.0`.
8. `k8s-get-all.txt`: Estado de recursos de Kubernetes si Minikube se encuentra activo.
