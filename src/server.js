import "dotenv/config";
import app from "./app.js";
import { env } from "./src/config/env.js";
import prisma from "./src/config/db.js";

const start = async () => {
    try {
        await prisma.$connect();
        console.log("Conexion a la base de datos establecida");

        app.listen(env.port, () => {
            console.log(`Servidor corriendo en http://localhost:${env.port}`);
            console.log(`Entorno: ${env.nodeEnv}`);
        });
    } catch (err) {
        console.error("Error al iniciar el servidor:", err);
        await prisma.$disconnect();
        process.exit(1);
    }
};

process.on("SIGINT", async () => {
    await prisma.$disconnect();
    console.log("Servidor detenido");
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();
    process.exit(0);
});

start();
