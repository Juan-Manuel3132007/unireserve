# Acciones Manuales de Infraestructura Pendientes (Ejecución Humana)

Este documento registra exclusivamente las acciones que requieren credenciales personales, sesión interactiva o permisos de navegador, con el comando exacto para copiar y pegar.

---

## 1. Publicación de Imágenes en Docker Hub (Requiere `docker login`)

Si no se ha iniciado sesión con la cuenta de Docker Hub (`juanma313`), ejecutar en la terminal interactiva:

```powershell
# 1. Iniciar sesión interactiva
docker login -u juanma313

# 2. Publicar imágenes del Backend
docker push juanma313/unireserve-backend:v1.0.0
docker push juanma313/unireserve-backend:sha-daa9be8
docker push juanma313/unireserve-backend:latest

# 3. Publicar imágenes del Frontend
docker push juanma313/unireserve-frontend:v1.0.0
docker push juanma313/unireserve-frontend:sha-ec43bd5
docker push juanma313/unireserve-frontend:latest
```

> **Nota para Minikube:** Las imágenes ya están cargadas localmente en el entorno del clúster Minikube, por lo que el despliegue funciona al 100% incluso antes de hacer el push público.

---

## 2. Secretos de GitHub Actions (Para el compañero de CI)

Si el compañero de equipo va a configurar la publicación automatizada en GitHub Actions desde los repositorios:
- `DOCKERHUB_USERNAME`: `juanma313`
- `DOCKERHUB_TOKEN`: Personal Access Token generado en *Docker Hub -> Account Settings -> Security -> New Access Token*.
