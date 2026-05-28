import { PrismaClient } from "@prisma/client";
import { env } from "./env.js";
const prisma = new PrismaClient({
    log: env.isDev ? ["query", "warn", "error"] : ["error"],
});
export default prisma;
