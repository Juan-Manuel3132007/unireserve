# ---------------------------------------------------------------------------
# Imagen del frontend (Vite build servido por Nginx)
#
# Vite inyecta VITE_API_URL en tiempo de COMPILACION, no de ejecucion. Por eso
# se recibe como build arg: cada entorno (local, staging, produccion) produce
# su propia imagen apuntando a su propia API.
# ---------------------------------------------------------------------------

FROM node:22-alpine AS builder

WORKDIR /app

# Se copian primero los manifiestos para aprovechar la cache de capas: si no
# cambian las dependencias, npm ci no se vuelve a ejecutar.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build


# --------------------------------------------------------------- imagen final
FROM nginx:1.27-alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
