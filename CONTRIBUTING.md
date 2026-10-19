# Guia de contribucion — UniReserve

Este documento es el contrato de trabajo del equipo. En una asignatura de
Gestion de la Configuracion, **como se gestionan los cambios importa tanto como
el codigo que se escribe**, asi que estas reglas son parte del entregable.

---

## 1. Estrategia de ramas

Se usa una variante reducida de GitFlow, suficiente para un equipo de tres
personas:

| Rama | Proposito | Quien la toca |
|---|---|---|
| `main` | Codigo estable y desplegable. Cada commit aqui es una version. | Nadie directamente: solo por Pull Request desde `develop`. |
| `develop` | Rama de integracion. Es donde converge el trabajo del equipo. | Solo por Pull Request desde ramas de trabajo. |
| `feature/<nombre>` | Una funcionalidad nueva. | Autor de la funcionalidad. |
| `fix/<nombre>` | Correccion de un defecto. | Quien lo corrige. |
| `docs/<nombre>` | Cambios que solo tocan documentacion. | Cualquiera. |

**`main` y `develop` deben estar protegidas en GitHub.** Sin eso, la estrategia
de ramas es una intencion, no un control.

Configuracion recomendada en *Settings → Branches → Add rule*:

- Require a pull request before merging (minimo 1 aprobacion).
- Require status checks to pass before merging.
- Do not allow bypassing the above settings.

### Flujo normal

```bash
git checkout develop
git pull origin develop
git checkout -b feature/cancelar-reserva

# ... trabajo, commits pequenos ...

git push -u origin feature/cancelar-reserva
# Abrir Pull Request hacia develop en GitHub
```

Una rama de trabajo deberia vivir pocos dias. Si lleva mas de una semana
abierta, probablemente el alcance era demasiado grande.

---

## 2. Formato de los commits

Se usa [Conventional Commits](https://www.conventionalcommits.org/). No es un
capricho: permite generar el changelog y deducir el numero de version de forma
automatica mas adelante.

```
<tipo>(<alcance>): <descripcion en imperativo>
```

Tipos admitidos:

| Tipo | Cuando se usa | Efecto en la version |
|---|---|---|
| `feat` | Funcionalidad nueva | MINOR |
| `fix` | Correccion de un defecto | PATCH |
| `docs` | Solo documentacion | ninguno |
| `test` | Solo pruebas | ninguno |
| `refactor` | Cambio interno sin alterar el comportamiento | ninguno |
| `chore` | Dependencias, configuracion, herramientas | ninguno |
| `ci` | Cambios en el pipeline | ninguno |

Un cambio que rompe compatibilidad lleva `!` y una nota al pie:

```
feat(api)!: renombrar /spaces/{id}/availability a /availability

BREAKING CHANGE: los clientes deben actualizar la ruta.
```

Ejemplos reales de este proyecto:

```
feat(reservations): rechazar reservas que se superponen
fix(auth): devolver 403 en lugar de 401 para cuentas desactivadas
docs(readme): documentar las credenciales de desarrollo
test(spaces): cubrir el conflicto de nombres duplicados
```

Regla practica: si la descripcion necesita un "y", probablemente son dos
commits.

---

## 3. Versionado

Se sigue [Versionado Semantico](https://semver.org/lang/es/): `MAYOR.MENOR.PARCHE`.

- **MAYOR** — cambios incompatibles en la API REST.
- **MENOR** — funcionalidad nueva compatible hacia atras.
- **PARCHE** — correcciones compatibles.

La version vive en tres lugares y **deben coincidir**:

1. `backend/app/core/config.py` → `APP_VERSION`
2. `frontend/package.json` → `version`
3. La etiqueta de Git → `v1.0.0`

Mantenerlos sincronizados a mano es fragil. Es un buen candidato a
automatizar durante el semestre (ver el roadmap del README).

### Publicar una version

```bash
git checkout main
git merge --no-ff develop
git tag -a v1.1.0 -m "v1.1.0: calendario visual y cancelacion masiva"
git push origin main --tags
```

---

## 4. Antes de abrir un Pull Request

Ejecutar localmente lo mismo que ejecutara el pipeline. Si falla aqui, fallara
alla:

```bash
# Backend
cd backend
ruff check .
pytest

# Frontend
cd frontend
npm run lint
npm run test
npm run build
```

### Lista de verificacion del PR

- [ ] La rama sale de `develop` y apunta a `develop`.
- [ ] Los commits siguen Conventional Commits.
- [ ] Hay al menos una prueba que cubre el cambio.
- [ ] `ruff`, `pytest`, `eslint`, `vitest` y `build` pasan en local.
- [ ] No se agrego ningun secreto ni ningun `.env` real.
- [ ] Si cambio el modelo de datos, hay una migracion de Alembic.
- [ ] El README esta actualizado si cambio la forma de ejecutar el proyecto.

---

## 5. Cambios en la base de datos

**Nunca se edita una migracion ya fusionada en `develop`.** Otra persona ya la
aplico en su base local; cambiarla rompe su entorno sin aviso.

Para modificar el esquema:

```bash
cd backend
# 1. Editar el modelo en app/models/
# 2. Generar la migracion
alembic revision --autogenerate -m "agregar columna equipamiento a spaces"
# 3. REVISAR el archivo generado a mano: el autogenerate se equivoca
# 4. Aplicarla y verificar que se puede revertir
alembic upgrade head
alembic downgrade -1
alembic upgrade head
```

El paso 3 no es opcional. Alembic no detecta bien los cambios de tipo, los
renombres de columna ni algunos constraints.

---

## 6. Manejo de secretos

- El archivo `.env` **nunca** se sube. Esta en `.gitignore`.
- Toda variable nueva se documenta en `.env.example` con un valor de ejemplo,
  nunca con el valor real.
- Las credenciales del seed (`admin@unireserve.com` / `Admin123!`) son
  exclusivamente para el entorno local y estan documentadas como tales.
- Si alguien sube un secreto por error: **rotarlo primero**, borrarlo del
  historial despues. Un secreto que estuvo publico un minuto ya esta
  comprometido.
