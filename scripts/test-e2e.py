"""Prueba E2E Automatizada sobre Kubernetes (Minikube)."""
import urllib.request
import json
import datetime
import sys

base_url = "http://127.0.0.1:8000"

print("==========================================================")
print("     UniReserve — Suite de Verificacion E2E en K8s       ")
print("==========================================================")

# 1. Health
req = urllib.request.urlopen(base_url + "/health")
health = json.loads(req.read().decode())
print(f"[E2E 1] Liveness Health OK: {health['status']} - {health['app']} v{health['version']}")

# 2. Login
login_data = json.dumps({"correo": "juan.restrepo@unireserve.com", "password": "Estudiante123!"}).encode()
req = urllib.request.Request(base_url + "/auth/login", data=login_data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
login_res = json.loads(resp.read().decode())
token = login_res["access_token"]
print(f"[E2E 2] Login exitoso! Token emitido para: {login_res['user']['correo']} ({login_res['user']['rol']})")

# 3. Spaces
headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
req = urllib.request.Request(base_url + "/spaces", headers=headers)
spaces_page = json.loads(urllib.request.urlopen(req).read().decode())
spaces = spaces_page["items"]
space = spaces[0]
print(f"[E2E 3] Catalogo consultado: {len(spaces)} espacios disponibles. Usando '{space['nombre']}' (ID: {space['id']})")

# 4. Crear Reserva valida
target_date = (datetime.date.today() + datetime.timedelta(days=3)).isoformat()
payload = {
    "space_id": space["id"],
    "fecha": target_date,
    "hora_inicio": "06:00",
    "hora_fin": "07:30",
    "motivo": "Prueba E2E DevOps Kubernetes"
}
req = urllib.request.Request(base_url + "/reservations", data=json.dumps(payload).encode(), headers=headers)
reserva = json.loads(urllib.request.urlopen(req).read().decode())
print(f"[E2E 4] Reserva creada con exito! ID: {reserva['id']}, Fecha: {reserva['fecha']}, Franja: {reserva['hora_inicio']}-{reserva['hora_fin']}, Estado: {reserva['estado']}")

# 5. Intentar solapamiento (07:00 a 08:00) -> esperar 409 Conflict
payload_overlap = {
    "space_id": space["id"],
    "fecha": target_date,
    "hora_inicio": "07:00",
    "hora_fin": "08:00",
    "motivo": "Intento de colision horaria"
}
try:
    req = urllib.request.Request(base_url + "/reservations", data=json.dumps(payload_overlap).encode(), headers=headers)
    urllib.request.urlopen(req)
    print("[ERROR] La reserva solapada debio ser rechazada!")
    sys.exit(1)
except urllib.error.HTTPError as err:
    print(f"[E2E 5] Exito! Regla 4 validada: HTTP {err.code} {err.reason}")
    err_body = json.loads(err.read().decode())
    print(f"         Respuesta de dominio: code='{err_body.get('code')}', detail='{err_body.get('detail')}'")

# 6. Frontend
fe_resp = urllib.request.urlopen("http://127.0.0.1:3000")
print(f"[E2E 6] Frontend SPA respondiendo por Nginx: HTTP {fe_resp.status} OK")
print("\n[RESULTADO] Todas las pruebas E2E pasaron exitosamente sobre los Pods de Minikube!\n")
