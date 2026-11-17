# Pendientes Manuales y Verificaciones de CI/CD

Este documento consolida las acciones que requieren intervención en la interfaz web de GitHub debido a limitaciones de permisos o ausencia de tokens administrativos en la sesión local.

---

## 1. Permiso de Escritura en Repositorio Frontend

- **Problema detectado**: Al intentar hacer push a `https://github.com/Juan-Manuel3132007/unireserve-frontend.git` con el usuario `camilocastn2007`, GitHub devolvió:
  ```
  remote: Permission to Juan-Manuel3132007/unireserve-frontend.git denied to camilocastn2007.
  fatal: unable to access 'https://github.com/Juan-Manuel3132007/unireserve-frontend.git/': The requested URL returned error: 403
  ```
- **Paso a realizar por Juan Manuel (Owner)**:
  1. Ir a: [https://github.com/Juan-Manuel3132007/unireserve-frontend/settings/access](https://github.com/Juan-Manuel3132007/unireserve-frontend/settings/access)
  2. Hacer clic en **Add people** e invitar a `camilocastn2007` con rol **Write** o **Admin**.
  3. Brayan Camilo debe aceptar la invitación por correo o en [https://github.com/Juan-Manuel3132007/unireserve-frontend/invitations](https://github.com/Juan-Manuel3132007/unireserve-frontend/invitations).
  4. Una vez aceptada, ejecutar en la máquina:
     ```powershell
     cd C:\Users\braya\Desktop\unireserve-frontend
     git push -u origin feature/ci-github-actions
     git checkout develop
     git merge feature/ci-github-actions
     git push -u origin develop
     git checkout main
     git merge develop
     git push -u origin main
     git push origin v1.0.0
     ```

---

## 2. Configuración de Secretos en GitHub Actions (DockerHub)

Para que el job `publish-image` pueda autenticar y subir las imágenes a DockerHub, deben existir los secretos en los repositorios de GitHub.

### Repositorios a configurar:
- `Juan-Manuel3132007/unireserve-backend`
- `Juan-Manuel3132007/unireserve-frontend`

### Secretos requeridos:
1. **`DOCKERHUB_USERNAME`**:
   - Valor: `juanma313`
2. **`DOCKERHUB_TOKEN`**:
   - Valor: Token de acceso personal generado en Docker Hub con permisos `Read & Write` ([https://hub.docker.com/settings/security](https://hub.docker.com/settings/security)).

### Pasos en GitHub:
1. En cada repositorio, ir a: **Settings** -> **Secrets and variables** -> **Actions**.
2. Hacer clic en **New repository secret**.
3. Crear `DOCKERHUB_USERNAME` y `DOCKERHUB_TOKEN`.

---

## 3. Configuración de Reglas de Protección de Rama (`main`)

Para garantizar que ningún cambio roto entre a producción sin pasar la suite de pruebas:

1. Ir a: **Settings** -> **Branches** -> **Add branch ruleset** (o **Add branch protection rule**).
2. Branch pattern: `main`.
3. Activar:
   - ✅ **Require a pull request before merging**.
   - ✅ **Require status checks to pass before merging**:
     - Buscar y seleccionar: `Lint & Pytest` (para el backend) y `Lint, Vitest & Build` (para el frontend).
   - ✅ **Require branches to be up to date before merging**.
4. Guardar cambios.
