import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";
import prisma from "./config/db.js";

const server = app.listen(env.port, () => {
    console.log(`Servidor corriendo en http://localhost:${env.port}`);
    console.log(`Entorno: ${env.nodeEnv}`);

    prisma.$connect()
        .then(() => {
            console.log("Conexion a la base de datos establecida");
        })
        .catch((err) => {
            console.error("Error al conectar a la base de datos:", err);
        });
});

const gracefulShutdown = async (signal) => {
    console.log(`Cerrando servidor Express debido a señal: ${signal}`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log("Desconectado de la base de datos y proceso finalizado");
        process.exit(0);
    });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

