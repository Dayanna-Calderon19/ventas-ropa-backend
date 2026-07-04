# Sistema de Gestión de Ventas - Backend 👕🚀

Este es el backend del **Sistema de Gestión de Ventas de Ropa**, desarrollado con **Node.js**, **Express**, y **Prisma ORM 7.8.0** conectado a una base de datos PostgreSQL hospedada en **Neon**. Está configurado para ser desplegado de forma rápida y sencilla en **Vercel**.

---

## 🛠️ Tecnologías y Herramientas

*   **Entorno:** [Node.js (v18+)](https://nodejs.org/)
*   **Framework Web:** [Express](https://expressjs.com/)
*   **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) en [Neon](https://neon.tech/)
*   **ORM:** [Prisma ORM (v7.8.0)](https://www.prisma.io/)
*   **Adaptador de Base de Datos:** `@prisma/adapter-pg` + `pg` (obligatorio para la arquitectura Rust-free de Prisma 7)
*   **Autenticación:** `jsonwebtoken` + `bcryptjs`
*   **Validaciones:** `express-validator`
*   **Variables de Entorno:** `dotenv`

---

## 📁 Estructura del Directorio

```text
tienda-backend/
├── src/
│   ├── config/             # Configuración de base de datos, CORS y variables
│   ├── controllers/        # Controladores que manejan peticiones HTTP
│   ├── middlewares/        # Manejo de errores y verificación de tokens
│   ├── routes/             # Enrutamiento de endpoints (/api/v1/*)
│   ├── services/           # Lógica de negocio (consultas Prisma)
│   ├── prisma/             # Schema y migraciones de la base de datos
│   │   ├── schema.prisma   # Definición de modelos (Usuarios, Productos, Ventas, etc.)
│   │   └── seed.js         # Script para poblar la base de datos con datos de prueba
│   ├── app.js              # Configuración e inicialización de Express
│   └── server.js           # Punto de entrada local (app.listen)
├── vercel.json             # Configuración de despliegue en Vercel
├── prisma.config.ts        # Configuración principal de Prisma v7
├── package.json
└── tsconfig.json           # Configuración de TypeScript de soporte para configs
```

---

## ⚙️ Configuración del Entorno (`.env`)

Crea un archivo `.env` en la raíz de `tienda-backend/` basándote en `.env.example`:

```env
# URL de conexión directa o pooler de tu base de datos Neon PostgreSQL
DATABASE_URL="postgresql://usuario:contraseña@servidor.neon.tech/neondb?sslmode=require"

# Puerto local del servidor
PORT=4000

# Secreto para firmar tokens JWT
JWT_SECRET="tu_secreto_super_seguro"
JWT_EXPIRES_IN="7d"

# Origen permitido para CORS (Frontend URL)
CORS_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

---

## 🚀 Comandos del Proyecto

Instala las dependencias necesarias antes de arrancar el proyecto:

```bash
npm install
```

### Desarrollo y Servidor Local
*   **Iniciar servidor de desarrollo:**
    ```bash
    npm run dev
    ```
    *(Levanta el backend utilizando nodemon con recarga automática)*
*   **Iniciar servidor en producción:**
    ```bash
    npm start
    ```

### Comandos de Prisma ORM
*   **Generar cliente de Prisma:**
    ```bash
    npm run db:generate
    # o de forma directa:
    npx prisma generate
    ```
*   **Crear y aplicar migraciones de desarrollo:**
    ```bash
    npm run db:migrate
    ```
*   **Poblar base de datos (seeding):**
    ```bash
    npm run db:seed
    ```
*   **Abrir interfaz visual de base de datos (Prisma Studio):**
    ```bash
    npm run db:studio
    ```
*   **Reiniciar base de datos completa y ejecutar semillas:**
    ```bash
    npm run db:reset
    ```

---

## ☁️ Despliegue en Vercel

Este proyecto está configurado mediante `vercel.json` para ser desplegado de manera independiente o como monorepo.

1.  Conecta tu repositorio en Vercel y añade un nuevo proyecto.
2.  Establece la **Root Directory** a `tienda-backend`.
3.  Define el **Build Command** a: `prisma generate` (para que genere el cliente Prisma compatible con el runtime de Vercel).
4.  Configura las variables de entorno en Vercel, en especial `DATABASE_URL` y `JWT_SECRET`.
5.  ¡Despliega! Vercel mapeará de forma automática el Express Router a las Serverless Functions de Node.js.
