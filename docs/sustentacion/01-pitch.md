# Guion de Sustentación — Elevator Pitch (4:30)

**Distribución de Tiempos**:
- **0:00 – 1:30**: Juan Manuel (Problema de negocio, arquitectura y 12-Factor)
- **1:30 – 3:00**: Brayan Camilo (Calidad de código, batería de pruebas y CI/CD automatizado)
- **3:00 – 4:30**: Daniel (Contenedores, despliegue declarativo, compromisos de diseño y visión)

---

### [0:00 – 1:30] Juan Manuel: El Reto y la Solución Arquitectónica

> *"Buenos días profesor y compañeros. En nuestra universidad, la reserva de espacios como salas de estudio, laboratorios o auditorios históricamente ha sido un proceso fragmentado: planillas dispersas, choques de horario de último minuto y docentes que llegan al aula encontrando otro grupo dentro.*
>
> *Para resolverlo construimos **UniReserve**: una plataforma web moderna, resiliente y diseñada bajo los principios de los **12 Factores** y arquitectura orientada a la nube.*
>
> *UniReserve desacopla completamente tres capas fundamentales:*
> 1. *Una interfaz SPA en **React 18 con Vite**, empaquetada en un servidor web ultra liviano Nginx.*
> 2. *Una API REST robusta en **FastAPI y SQLAlchemy 2.0**, que implementa autenticación sin estado mediante **JWT** y centraliza las reglas de negocio.*
> 3. *Y una capa de persistencia relacional con **PostgreSQL 16**, gestionada estrictamente mediante migraciones declarativas y versionadas con **Alembic**.*
>
> *El corazón de nuestro sistema garantiza la regla dorada del negocio: el control riguroso de solapamiento en intervalos continuos. Una reserva no puede colisionar jamás en tiempo con otra sobre el mismo espacio físico.*
>
> *Pero un software excelente no sirve si su proceso de entrega es frágil. Ahora Brayan les explicará cómo garantizamos la calidad y la trazabilidad de cada línea de código antes de que llegue a producción."*

---

### [1:30 – 3:00] Brayan: Calidad Continua, Batería de Pruebas y CI/CD

> *"Gracias Juan Manuel. En UniReserve la calidad no es una promesa en papel, es una compuerta infranqueable en nuestro pipeline de Integración Continua.*
>
> *Desarrollamos una pirámide de pruebas completa:*
> - *En el backend, contamos con una suite de **56 pruebas unitarias y de integración** con Pytest. Pero tomamos una decisión técnica crítica: **no testeamos contra SQLite en memoria**. Levantamos una instancia real de PostgreSQL 16 como servicio en GitHub Actions para validar tipos nativos, enums y transacciones idénticas a producción.*
> - *En el frontend, ejecutamos **Vitest y Testing Library** para verificar componentes reactivos y validaciones de formularios en el cliente, además de pruebas de integración **End-to-End con Playwright**.*
>
> *Construimos flujos de GitHub Actions completamente automatizados bajo el principio de menor privilegio (`contents: read`), con cancelación automática de ejecuciones obsoletas para optimizar recursos.*
>
> *Y lo más importante de nuestro flujo de entrega: **la construcción y publicación de artefactos a DockerHub depende estrictamente de que las pruebas pasen al 100%**. Si un desarrollador introduce un error que rompa una aserción, el pipeline falla en rojo y el job de publicación se cancela de inmediato, imposibilitando la promoción de una imagen defectuosa.*
>
> *Además, cada imagen Docker publicada lleva inyectada trazabilidad OCI con el SHA corto del commit y el enlace al repositorio exacto, asegurando una correlación unívoca commit → imagen.*
>
> *Le doy paso a Daniel para mostrar el despliegue y los compromisos que asumimos."*

---

### [3:00 – 4:30] Daniel: Contenedores, Despliegue Declarativo y Realidad Técnica

> *"Gracias Brayan. Desde la perspectiva de operaciones, construimos imágenes Docker con **Multi-stage builds** optimizadas:*
> - *El backend no arrastra compiladores de C ni dependencias de desarrollo; corre como un usuario sin privilegios `unireserve` con UID 1000 para cumplir con los estándares de seguridad de Kubernetes.*
> - *El frontend compila los assets estáticos con Node 22 e inyecta la URL de la API (`VITE_API_URL`) en tiempo de empaquetado, dejando una imagen final basada en Alpine de menos de 25 MB.*
>
> *Para la orquestación, definimos un modelo declarativo: todo el estado deseado de la infraestructura reside en código. En Kubernetes, separamos la configuración en `ConfigMaps`, credenciales en `Secrets`, y exponemos healthchecks desacoplados: un **liveness probe** que verifica la vida del proceso web y un **readiness probe** que valida la conectividad real con la base de datos.*
>
> *Queremos ser totalmente transparentes en nuestras decisiones de diseño: evaluamos herramientas como ArgoCD para GitOps puro, pero decidimos conscientemente mantener un despliegue declarativo push-based automatizado. Para el alcance y los recursos de esta infraestructura, levantar operadores pesados de sincronización habría sobrecargado el clúster sin aportar valor funcional adicional.*
>
> *En conclusión, UniReserve no es solo una aplicación funcional; es un ecosistema confiable donde cada cambio de código es trazable, validado contra bases de datos reales y empaquetado de forma inmutable y segura.*
>
> *Muchas gracias, y quedamos listos para iniciar la demostración en vivo."*
