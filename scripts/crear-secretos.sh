#!/usr/bin/env bash
# ===========================================================================
# UniReserve — Generador Idempotente de Secretos de Kubernetes
# ===========================================================================
set -euo pipefail

NAMESPACE="${1:-unireserve}"
DB_USER="postgres"
DB_NAME="unireserve"
DB_HOST="postgres-service"
DB_PORT="5432"

echo "==> Verificando namespace '${NAMESPACE}'..."
if ! kubectl get namespace "${NAMESPACE}" >/dev/null 2>&1; then
  echo "    Creando namespace '${NAMESPACE}'..."
  kubectl create namespace "${NAMESPACE}"
fi

if kubectl get secret unireserve-secrets -n "${NAMESPACE}" >/dev/null 2>&1; then
  echo "==> El secreto 'unireserve-secrets' ya existe en '${NAMESPACE}'. Se mantiene."
  exit 0
fi

echo "==> Generando credenciales seguras..."
PG_PASSWORD=$(head -c 18 /dev/urandom | base64 | tr -dc 'a-zA-Z0-9' | head -c 24)
JWT_SECRET=$(head -c 32 /dev/urandom | xxd -p | tr -d '\n')
DATABASE_URL="postgresql+psycopg://${DB_USER}:${PG_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Secret
metadata:
  name: unireserve-secrets
  namespace: ${NAMESPACE}
  labels:
    app.kubernetes.io/name: unireserve-secrets
    app.kubernetes.io/part-of: unireserve-system
type: Opaque
stringData:
  POSTGRES_USER: "${DB_USER}"
  POSTGRES_PASSWORD: "${PG_PASSWORD}"
  POSTGRES_DB: "${DB_NAME}"
  JWT_SECRET: "${JWT_SECRET}"
  DATABASE_URL: "${DATABASE_URL}"
EOF

echo "==> Secreto 'unireserve-secrets' configurado exitosamente en '${NAMESPACE}'."
