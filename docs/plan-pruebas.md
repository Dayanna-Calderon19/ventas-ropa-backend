# Plan de Pruebas — tienda-backend

> Stack real del proyecto: **Node.js + Express + Prisma (PostgreSQL)**, ESM (`"type": "module"`).
> Nota: se solicitó inicialmente Mockito/JUnit (Java), pero el backend es Node.js. Se usará el
> equivalente directo en el ecosistema JS: **Jest** como test runner + mocks nativos (`jest.mock`),
> y **Supertest** para pruebas de integración HTTP.

Estado actual: no existen tests ni configuración de Jest en el repo. Este plan cubre **9 pruebas**
(3 unitarias, 3 de integración, 3 de seguridad) como set inicial, pensado para crecer después.

## 1. Herramientas y setup

| Herramienta | Uso |
|---|---|
| `jest` (+ `babel-jest` o soporte ESM nativo de Jest) | Test runner, asserts, mocks (`jest.fn`, `jest.mock`) |
| `supertest` | Peticiones HTTP contra la app Express sin levantar un puerto real |
| `@faker-js/faker` (opcional) | Generar datos de prueba realistas |

Cambios de configuración necesarios (se harán en la fase de implementación, tras tu aprobación):

- Agregar a `package.json` → `devDependencies`: `jest`, `supertest`, y `cross-env` si hace falta forzar `NODE_ENV=test`.
- Agregar script `"test": "node --experimental-vm-modules node_modules/.bin/jest"` (o migrar a Vitest si se prefiere evitar el flag experimental de Jest con ESM — se decidió Jest, así que se usa este flag).
- Crear `jest.config.js` con `testEnvironment: "node"`.
- Mockear siempre `src/config/db.js` (cliente Prisma) en unitarias — **nunca tocar la base real**.
- Para integración: usar una base de datos de test separada (o mockear Prisma a nivel de capa de servicio si no hay BD de test disponible) — a confirmar según entorno disponible.

## 2. Pruebas Unitarias (3)

Objetivo: lógica de negocio pura, con Prisma y bcrypt/jwt mockeados vía `jest.mock`.

### U1 — `calcularTotalesVenta` (lógica de descuento e impuestos)
- **Archivo:** [sale.service.js](../src/services/sale.service.js) (función interna, se exportará o se probará indirectamente vía `registrarVenta`)
- **Qué valida:** dado un set de items y una promoción `PORCENTAJE` vigente, el subtotal, descuento, impuesto (18%) y total se calculan correctamente; sin promoción, descuento = 0.
- **Mocks:** `prisma.varianteProducto.findMany`, `prisma.promocion.findUnique`, `prisma.$transaction`.
- **Caso borde a incluir:** promoción tipo `MONTO_FIJO` que supera el subtotal → el descuento se limita al subtotal (no queda total negativo).

### U2 — `auth.service.login` (autenticación)
- **Archivo:** [auth.service.js](../src/services/auth.service.js)
- **Qué valida:**
  - Credenciales correctas → devuelve `{ usuario, token }` y llama a `generateToken` con `{ id, rol }`.
  - Usuario inexistente → lanza error con `statusCode 401`.
  - Usuario `activo: false` → lanza error con `statusCode 403`.
  - Contraseña incorrecta (bcrypt.compare devuelve `false`) → error `401`.
- **Mocks:** `prisma.usuario.findUnique`, `bcrypt.compare`, `generateToken`.

### U3 — `jwt.js` (generación/verificación de token)
- **Archivo:** [jwt.js](../src/utils/jwt.js)
- **Qué valida:** `generateToken` firma con el secreto y expiración de `env.jwt`; `verifyToken` decodifica correctamente un token válido y lanza al recibir uno inválido/expirado.
- **Mocks:** ninguno necesario (se puede probar contra `jsonwebtoken` real con un secreto de prueba), o mock de `env.js` para fijar el secreto.

## 3. Pruebas de Integración (3)

Objetivo: exercitar rutas Express reales con `supertest`, incluyendo middlewares (`validate`, `authenticate`, `authorize`) y la capa de controlador. Prisma se mockea o se apunta a una BD de test, según se confirme.

### I1 — `POST /api/v1/auth/registrar`
- **Archivo:** [auth.routes.js](../src/routes/auth.routes.js) → [auth.controller.js](../src/controllers/auth.controller.js) → [auth.service.js](../src/services/auth.service.js)
- **Qué valida:** flujo completo registro → 201, body con `usuario` (sin contraseña) y `token`; el middleware `validate` rechaza (400) payloads inválidos (correo mal formado, contraseña corta) antes de llegar al controlador.

### I2 — `POST /api/v1/auth/login` → `GET /api/v1/auth/perfil`
- **Archivo:** [auth.routes.js](../src/routes/auth.routes.js), [auth.middleware.js](../src/middlewares/auth.middleware.js)
- **Qué valida:** login exitoso devuelve un token; ese token usado como `Authorization: Bearer <token>` en `/perfil` devuelve los datos del usuario autenticado. Verifica el flujo completo de middleware `authenticate` + Prisma.

### I3 — `POST /api/v1/ventas` (registro de venta con stock)
- **Archivo:** [sale.routes.js](../src/routes/sale.routes.js), [sale.service.js](../src/services/sale.service.js)
- **Qué valida:** con datos válidos y stock suficiente, la venta se crea y responde 201 con totales calculados; con stock insuficiente, responde 400 con el mensaje de error esperado (sin llegar a ejecutar la transacción de escritura).

## 4. Pruebas de Seguridad (3)

Objetivo: validar controles de autenticación/autorización y configuración expuesta en middlewares y `env`.

### S1 — Acceso sin token / token inválido a rutas protegidas
- **Archivo:** [auth.middleware.js](../src/middlewares/auth.middleware.js)
- **Qué valida:**
  - Sin header `Authorization` → 401 "Token de acceso requerido".
  - Header sin prefijo `Bearer ` → 401.
  - Token con firma inválida o expirado → 401 "Token inválido o expirado" (no debe filtrar detalles del error de `jsonwebtoken`).
  - Usuario válido pero `activo: false` → 401 (cuenta desactivada no debe poder autenticar aunque el token sea válido).

### S2 — Control de roles (`authorize`) en rutas administrativas
- **Archivo:** [roles.middleware.js](../src/middlewares/roles.middleware.js) + rutas que lo usen (ej. `user.routes.js` / `inventory.routes.js`)
- **Qué valida:** un usuario autenticado con rol `CLIENTE` recibe 403 al intentar acceder a un endpoint restringido a `ADMIN`; un usuario `ADMIN` sí accede. Confirma que `authorize` se evalúa después de `authenticate` y que roles no listados quedan bloqueados por defecto.

### S3 — Inyección / payloads maliciosos rechazados por validadores
- **Archivo:** [auth.validator.js](../src/validator/auth.validator.js) (y/o `sale.validator.js`)
- **Qué valida:** `express-validator` rechaza (400) intentos de inyección típicos: correo con payload tipo `' OR '1'='1`, campos con HTML/script (`<script>alert(1)</script>`) en campos de texto libre, y objetos anidados inesperados en el body (prototype pollution vía `__proto__`). Confirma que ningún dato sin sanitizar llega a Prisma (que ya parametriza queries, pero se valida que la capa de validación actúa como primera barrera).

## 5. Fuera de alcance (por ahora)

- Tests de carga/rendimiento.
- Cobertura completa de todos los módulos (categorías, promociones, reportes, reclamaciones) — se abordarán en una siguiente tanda siguiendo el mismo patrón.
- CI/CD (ejecución automática en pipeline) — se puede agregar después si el proyecto ya tiene GitHub Actions u otro CI.

## 6. Estructura de archivos propuesta

```
tienda-backend/
  tests/
    unit/
      sale.service.test.js
      auth.service.test.js
      jwt.test.js
    integration/
      auth.registrar.test.js
      auth.login-perfil.test.js
      sale.venta.test.js
    security/
      auth.middleware.test.js
      roles.middleware.test.js
      validators.test.js
  jest.config.js
```

---

**Pendiente de tu aprobación antes de implementar.** Si apruebas, además necesito que confirmes:

1. ¿Hay una base de datos de test/PostgreSQL disponible para las pruebas de integración, o prefieres que mockee Prisma también ahí (sin BD real)?
2. ¿Confirmas Jest (con el flag experimental de ESM) en vez de Vitest?
