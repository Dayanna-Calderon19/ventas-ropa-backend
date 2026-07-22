# Documentación de Pruebas — tienda-backend

Referencia completa de la suite de pruebas implementada a partir de [plan-pruebas.md](plan-pruebas.md).

Estado actual: 15 archivos de prueba, 43 casos (`test`/`it`), todos en verde (5 unitarios, 5 de integración, 5 de seguridad).

## 0. Tecnología usada para el testeo

| Herramienta | Rol | Por qué esta y no otra |
|---|---|---|
| [Jest](https://jestjs.io/) `v29` | Test runner: ejecuta los archivos `*.test.js`, provee `describe`/`test`/`expect` y el sistema de mocks (`jest.fn`, `jest.unstable_mockModule`). | El proyecto original pedía JUnit + Mockito, que son de Java. Jest es el equivalente directo en el ecosistema Node.js: un único framework que integra test runner + asserts + mocking (no hace falta sumar Mocha/Chai/Sinon por separado). |
| [Supertest](https://github.com/ladjs/supertest) `v7` | Simula peticiones HTTP contra la app Express (`src/app.js`) sin necesidad de levantar un puerto real (`request(app).get(...)`). | Es la librería estándar para probar apps Express de punta a punta (rutas + middlewares + controladores) sin montar un servidor real. |
| Mocking nativo de Jest (`jest.unstable_mockModule`) sobre `src/config/db.js` | Reemplaza el cliente Prisma real por un objeto con `jest.fn()` en cada método usado (`findUnique`, `create`, `$transaction`, etc.), así ningún test toca una base de datos real. | El proyecto usa ESM nativo (`"type": "module"` en `package.json`, sin Babel), donde el clásico `jest.mock()` no funciona por falta de hoisting. `jest.unstable_mockModule` + `await import(...)` es la forma soportada de mockear módulos ESM en Jest. |
| `bcryptjs` y `jsonwebtoken` reales (sin mock) en varios tests | Se usan tal cual en pruebas donde interesa el comportamiento real de hash/verificación (ej. login end-to-end, JWT expirado). | Confirma que el flujo de negocio funciona con la librería real, no solo con un doble simulado. |
| Node `--experimental-vm-modules` | Flag necesario para que Jest pueda ejecutar y mockear módulos ES nativos. | Es un requisito de Jest para soportar ESM sin transpilar con Babel/TypeScript. |

No se usó Mockito/JUnit porque el backend es Node.js/Express, no Java (decisión confirmada con el usuario antes de implementar).

## 1. Instalación

Las dependencias ya están declaradas en `package.json` (`jest`, `supertest` como devDependencies).

```bash
cd tienda-backend
npm install
```

## 2. Comandos de ejecución

Todos los comandos se ejecutan desde `tienda-backend/`.

### Correr toda la suite

```bash
npm test
```

Equivale a:

```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

El flag `--experimental-vm-modules` es necesario porque el proyecto usa módulos ES nativos (sin Babel); Jest lo requiere para poder interceptar imports con `jest.unstable_mockModule`.

### Correr solo una categoría (carpeta)

```bash
# Unitarias
npm test -- tests/unit

# Integración
npm test -- tests/integration

# Seguridad
npm test -- tests/security
```

### Correr un archivo específico

```bash
npm test -- tests/unit/sale.service.test.js
npm test -- tests/unit/auth.service.test.js
npm test -- tests/unit/jwt.test.js
npm test -- tests/integration/auth.registrar.test.js
npm test -- tests/integration/auth.login-perfil.test.js
npm test -- tests/integration/sale.venta.test.js
npm test -- tests/security/auth.middleware.test.js
npm test -- tests/security/roles.middleware.test.js
npm test -- tests/security/validators.test.js
```

### Correr por nombre de test (`-t`)

Filtra por el texto del `describe`/`test` (regex):

```bash
npm test -- -t "credenciales validas"
```

El texto debe ser un substring literal (o regex) del nombre del test, no palabras sueltas fuera de orden.

### Modo watch (reejecuta al guardar cambios)

```bash
npm test -- --watch
```

### Ver cobertura

```bash
npm test -- --coverage
```

### Salida detallada de cada test individual

```bash
npm test -- --verbose
```

## 3. Configuración

| Archivo | Propósito |
|---|---|
| [jest.config.js](../jest.config.js) | `testEnvironment: "node"`, `transform: {}` (sin Babel, ESM puro), `testMatch` apunta a `**/tests/**/*.test.js`, carga `tests/setup/env.js` antes de cada suite. |
| [tests/setup/env.js](../tests/setup/env.js) | Define `JWT_SECRET`, `DATABASE_URL`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `NODE_ENV=test` — valores dummy para que `src/config/env.js` no lance error de variables faltantes y para firmar/verificar JWT de forma determinista en los tests. |

## 4. Estrategia de mocking

Como el proyecto usa ESM nativo (no CommonJS ni Babel), el `jest.mock()` clásico no funciona porque depende de hoisting que solo existe en CJS. Todos los tests usan en su lugar:

```js
jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { funcionAProbar } = await import("../../src/services/algo.service.js");
```

- El mock se declara **antes** del `await import(...)` del módulo real.
- Nunca se toca una base de datos real: `src/config/db.js` (el cliente Prisma) siempre se reemplaza por un objeto con `jest.fn()` en sus métodos.
- Las pruebas de integración levantan la app Express completa (`src/app.js`) vía `supertest`, con Prisma igualmente mockeado — no requieren un servidor corriendo ni un puerto abierto.

## 5. Pruebas Unitarias

### [tests/unit/sale.service.test.js](../tests/unit/sale.service.test.js)

Prueba la función `registrarVenta` de [sale.service.js](../src/services/sale.service.js), con foco en el cálculo de totales (`calcularTotalesVenta`, función interna no exportada, se ejercita indirectamente).

```bash
npm test -- tests/unit/sale.service.test.js
```

| Test | Qué hace |
|---|---|
| `aplica descuento porcentual y calcula el impuesto del 18%` | Mockea una variante con precio 100 y una promoción `PORCENTAJE` de 10% vigente. Verifica subtotal (200), descuento (20), impuesto sobre la base con descuento (32.4) y total (212.4). |
| `sin promocion no aplica descuento` | Sin `promocionId`, verifica que el descuento sea 0 y el total se calcule solo con el 18% de impuesto sobre el subtotal. |
| `rechaza la venta cuando el stock disponible es insuficiente` | Mockea una variante con `stock: 1` y pide `cantidad: 5`. Verifica que se lance un error con `statusCode: 400` y que `$transaction` **nunca** se llegue a invocar (la venta no debe persistir nada si falla la validación de stock). |

### [tests/unit/auth.service.test.js](../tests/unit/auth.service.test.js)

Prueba `login` de [auth.service.js](../src/services/auth.service.js), con `bcryptjs.compare` y `generateToken` mockeados para aislar la lógica de autenticación.

```bash
npm test -- tests/unit/auth.service.test.js
```

| Test | Qué hace |
|---|---|
| `credenciales validas devuelve usuario formateado y token` | Usuario existente y activo, `bcrypt.compare` resuelve `true`. Verifica que `generateToken` se llame con `{ id, rol }`, que el token devuelto sea el del mock, y que el objeto `usuario` devuelto **no** incluya el campo `contrasena`. |
| `usuario inexistente lanza error con statusCode 401` | `findUnique` devuelve `null`. Verifica que se lance un error `401`. |
| `usuario desactivado lanza error con statusCode 403` | Usuario existe pero `activo: false`. Verifica error `403` (no debe llegar a comparar la contraseña). |
| `contrasena incorrecta lanza error con statusCode 401` | Usuario activo, pero `bcrypt.compare` resuelve `false`. Verifica error `401`. |

### [tests/unit/jwt.test.js](../tests/unit/jwt.test.js)

Prueba [jwt.js](../src/utils/jwt.js) contra la librería real `jsonwebtoken` (sin mocks), usando el secreto de test definido en `tests/setup/env.js`.

```bash
npm test -- tests/unit/jwt.test.js
```

| Test | Qué hace |
|---|---|
| `genera un token valido y lo verifica correctamente` | Genera un token con `{ id, rol }` y lo verifica; confirma que el payload decodificado coincide. |
| `rechaza un token firmado con un secreto distinto` | Firma un token manualmente con un secreto diferente al de la app. Verifica que `verifyToken` lance (firma inválida). |
| `rechaza un token expirado` | Firma un token con `expiresIn: -10` (ya vencido al crearse). Verifica que `verifyToken` lance. |

### [tests/unit/pagination.test.js](../tests/unit/pagination.test.js)

Prueba las funciones puras de [pagination.js](../src/utils/pagination.js), sin mocks (no dependen de Prisma ni de ningún módulo externo).

```bash
npm test -- tests/unit/pagination.test.js
```

| Test | Qué hace |
|---|---|
| `usa page 1 y limit 20 por defecto cuando no se envian parametros` | Llama `getPaginationParams({})` y verifica los valores por defecto (`page: 1, limit: 20, skip: 0`). |
| `calcula el skip correcto para una pagina y limite dados` | `getPaginationParams({ page: "3", limit: "10" })` — verifica que `skip` se calcule como `(page - 1) * limit = 20`. |
| `limita el limit a 100 y la page a un minimo de 1 ante valores invalidos` | `page: "-5", limit: "500"` — verifica que se clampeen a `page: 1` y `limit: 100`. |
| `calcula totalPages y banderas hasNextPage/hasPrevPage en pagina intermedia` | `buildPaginationMeta(45, 2, 20)` — verifica `totalPages: 3` y ambas banderas en `true`. |
| `hasNextPage es false en la ultima pagina y hasPrevPage es false en la primera` | Verifica los casos borde de las banderas de paginación. |

### [tests/unit/auth.cambiarContrasena.test.js](../tests/unit/auth.cambiarContrasena.test.js)

Prueba `cambiarContrasena` de [auth.service.js](../src/services/auth.service.js), con Prisma y `bcryptjs` mockeados.

```bash
npm test -- tests/unit/auth.cambiarContrasena.test.js
```

| Test | Qué hace |
|---|---|
| `rechaza el cambio si la contrasena actual es incorrecta` | `bcrypt.compare` resuelve `false`. Verifica error `400` y que `usuario.update` nunca se llame. |
| `actualiza la contrasena con el nuevo hash cuando la actual es correcta` | `bcrypt.compare` resuelve `true`. Verifica que `bcrypt.hash` se llame con la nueva contraseña y 12 rondas de sal, y que `usuario.update` se llame con el hash resultante. |

## 6. Pruebas de Integración

Todas usan `supertest` contra la app Express real (`src/app.js`), pasando por routing, middlewares de validación/autenticación y controladores. Prisma está mockeado.

### [tests/integration/auth.registrar.test.js](../tests/integration/auth.registrar.test.js)

```bash
npm test -- tests/integration/auth.registrar.test.js
```

| Test | Qué hace |
|---|---|
| `registra un usuario nuevo y responde 201 con token` | `POST /api/v1/auth/registrar` con datos válidos. Verifica status 201, `data.token` definido y `data.usuario.correo` correcto. |
| `rechaza un correo ya registrado con 409` | `findUnique` simula que el correo ya existe. Verifica status 409 y que `usuario.create` no se llame. |
| `rechaza un payload invalido con 400 antes de tocar la base de datos` | Envía nombre muy corto, correo mal formado y contraseña débil. Verifica status 400 y que `findUnique` no se haya invocado (la validación de `express-validator` corta el flujo antes de llegar a la capa de datos). |

### [tests/integration/auth.login-perfil.test.js](../tests/integration/auth.login-perfil.test.js)

```bash
npm test -- tests/integration/auth.login-perfil.test.js
```

| Test | Qué hace |
|---|---|
| `login exitoso permite acceder al perfil con el token emitido` | Hashea una contraseña real con `bcrypt`, simula el usuario en Prisma, hace `POST /auth/login`, toma el `token` de la respuesta y lo usa en `GET /auth/perfil` con header `Authorization: Bearer <token>`. Verifica que ambas respuestas sean 200 y que el perfil devuelto tenga el correo esperado. Cubre el flujo completo login → middleware `authenticate` → controlador. |
| `login con contrasena incorrecta responde 401` | Mismo usuario, pero contraseña enviada no coincide con el hash. Verifica 401. |

### [tests/integration/sale.venta.test.js](../tests/integration/sale.venta.test.js)

```bash
npm test -- tests/integration/sale.venta.test.js
```

| Test | Qué hace |
|---|---|
| `registra la venta y responde 201 con los totales calculados` | Usuario con rol `VENDEDOR` autenticado (token real generado con `generateToken`), variante con stock suficiente. `POST /api/v1/ventas`. Verifica 201, `data.subtotal` (200) y `data.total` (236, con 18% de impuesto y sin descuento). |
| `responde 400 cuando el stock disponible es insuficiente` | Variante con `stock: 1`, se piden 5 unidades. Verifica 400 y que `venta.create` nunca se invoque. |

### [tests/integration/auth.cambiarContrasena.test.js](../tests/integration/auth.cambiarContrasena.test.js)

```bash
npm test -- tests/integration/auth.cambiarContrasena.test.js
```

| Test | Qué hace |
|---|---|
| `actualiza la contrasena y responde 200 con la contrasena actual correcta` | `PATCH /api/v1/auth/cambiar-contrasena` autenticado con token real, hash real de la contraseña actual. Verifica 200 y que `usuario.update` se haya llamado una vez. |
| `responde 400 cuando la contrasena actual enviada no coincide` | Misma ruta, contraseña actual incorrecta. Verifica 400 y que `usuario.update` no se llame. |

### [tests/integration/sale.obtenerVenta.test.js](../tests/integration/sale.obtenerVenta.test.js)

```bash
npm test -- tests/integration/sale.obtenerVenta.test.js
```

| Test | Qué hace |
|---|---|
| `devuelve 200 con los datos de la venta cuando existe` | `GET /api/v1/ventas/:id` con rol `ADMIN` autenticado y una venta existente en el mock de Prisma. Verifica 200 y el `numeroComprobante` esperado. |
| `devuelve 404 cuando la venta no existe` | Mismo endpoint, `venta.findUnique` resuelve `null`. Verifica 404. |

## 7. Pruebas de Seguridad

### [tests/security/auth.middleware.test.js](../tests/security/auth.middleware.test.js)

Monta una mini-app Express con una sola ruta protegida por el middleware real `authenticate`.

```bash
npm test -- tests/security/auth.middleware.test.js
```

| Test | Qué hace |
|---|---|
| `rechaza la peticion si no hay header Authorization` | Petición sin header. Verifica 401. |
| `rechaza la peticion si el header no usa el prefijo Bearer` | Header `Authorization: Token abc123`. Verifica 401. |
| `rechaza un token con firma invalida` | Header con un string que no es un JWT válido. Verifica 401 (y que el error real de `jsonwebtoken` no se filtre al cliente, solo el mensaje genérico). |
| `rechaza un token valido de un usuario desactivado` | Token válido, pero el usuario que devuelve Prisma tiene `activo: false`. Verifica 401 — una cuenta desactivada no puede autenticar aunque el JWT sea legítimo. |
| `permite el acceso con un token valido de un usuario activo` | Caso feliz: token válido + usuario activo. Verifica 200 y que `req.usuario` llegue al handler siguiente. |

### [tests/security/roles.middleware.test.js](../tests/security/roles.middleware.test.js)

Prueba el middleware real `authorize` de forma aislada (sin pasar por `authenticate` ni Prisma), inyectando `req.usuario` manualmente.

```bash
npm test -- tests/security/roles.middleware.test.js
```

| Test | Qué hace |
|---|---|
| `responde 403 si el rol del usuario no esta permitido` | `req.usuario.rol = "CLIENTE"`, ruta requiere `"ADMIN"`. Verifica 403. |
| `responde 403 si no hay usuario autenticado en la peticion` | No se asigna `req.usuario`. Verifica 403 (comportamiento seguro por defecto, no debe fallar con un error 500 ni dejar pasar la petición). |
| `permite el acceso si el rol del usuario esta permitido` | `req.usuario.rol = "ADMIN"`. Verifica 200. |

### [tests/security/validators.test.js](../tests/security/validators.test.js)

Prueba las cadenas de `express-validator` reales de [auth.validator.js](../src/validator/auth.validator.js) contra payloads maliciosos o inválidos, antes de que lleguen a cualquier lógica de negocio o a Prisma.

```bash
npm test -- tests/security/validators.test.js
```

| Test | Qué hace |
|---|---|
| `rechaza un intento de inyeccion SQL en el campo correo` | Envía `correo: "' OR '1'='1"` en el login. La regla `isEmail()` lo rechaza por formato antes de llegar a cualquier consulta. Verifica 400. |
| `rechaza contenido tipo script en el campo telefono` | Envía `telefono: "<script>alert(1)</script>"` en el registro. La regla `isMobilePhone()` lo rechaza. Verifica 400. |
| `rechaza una contrasena que no cumple la politica de complejidad` | Contraseña `"12345678"` (sin mayúscula) en el registro. Verifica 400 por la regla `matches(/[A-Z]/)`. |

### [tests/security/prototypePollution.test.js](../tests/security/prototypePollution.test.js)

Verifica que el body-parser de Express (`express.json()`) y el flujo de registro no permitan contaminar `Object.prototype` mediante una clave `__proto__` en el JSON recibido.

```bash
npm test -- tests/security/prototypePollution.test.js
```

| Test | Qué hace |
|---|---|
| `un payload con __proto__ no contamina Object.prototype` | Envía un JSON con `"__proto__":{"esAdmin":true}` a `POST /auth/registrar`. Verifica que `{}.esAdmin` y `Object.prototype.esAdmin` sigan siendo `undefined` después de la petición. |
| `un payload con __proto__ no provoca un error 500 en el servidor` | Mismo payload. Verifica que la respuesta no sea un error de servidor (status `< 500`), confirmando que el payload se procesa o rechaza de forma controlada. |

### [tests/security/cors.test.js](../tests/security/cors.test.js)

Prueba directamente la función `origin` de [cors.js](../src/config/cors.js), que decide qué orígenes puede aceptar la API.

```bash
npm test -- tests/security/cors.test.js
```

| Test | Qué hace |
|---|---|
| `permite un origen incluido en la lista blanca` | Invoca `corsOptions.origin("http://localhost:5173", callback)` (el origen configurado en `CORS_ORIGIN`). Verifica que el callback se llame sin error y con `allowed: true`. |
| `rechaza un origen que no esta en la lista blanca` | Invoca el mismo callback con `"http://sitio-malicioso.com"`. Verifica que el callback reciba un `Error` como primer argumento, bloqueando el origen. |

## 8. Resumen de comandos rápidos

```bash
# instalar dependencias
npm install

# correr todo
npm test

# correr una categoria
npm test -- tests/unit
npm test -- tests/integration
npm test -- tests/security

# correr un archivo puntual
npm test -- tests/unit/sale.service.test.js

# filtrar por nombre de test
npm test -- -t "insuficiente"

# con cobertura
npm test -- --coverage

# modo watch
npm test -- --watch
```

## 9. Notas y pendientes

- Las pruebas de integración mockean Prisma en vez de usar una base de datos de test real, porque no se confirmó disponibilidad de una BD de test dedicada (ver pregunta pendiente en [plan-pruebas.md](plan-pruebas.md)). Si más adelante se dispone de una BD de test (por ejemplo un contenedor Postgres efímero), se puede migrar estas pruebas para correr contra Prisma real y así cubrir también las queries/transacciones.
- Cobertura actual: `auth.service` (login, cambio de contraseña), `sale.service` (cálculo de totales, stock, obtención de venta), `jwt`, `pagination`, rutas `auth` y `ventas`, middlewares `authenticate`/`authorize`, validadores de `auth`, configuración de `CORS`, y protección contra prototype pollution. Módulos como categorías, promociones, inventario, reportes y reclamaciones quedan fuera de este set inicial (ver sección "Fuera de alcance" del plan).
- Hallazgo aparte, no cubierto por estas pruebas: [user.routes.js:9-10](../src/routes/user.routes.js#L9-L10) tiene un comentario residual de una edición anterior que no aporta valor y debería limpiarse.
