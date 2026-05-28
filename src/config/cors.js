import { env } from "./env.js";

export const corsOptions = {
    origin: (origin, callback) => {
        const allowed = env.cors.origin.split(",").map((o) => o.trim());
        if (!origin || allowed.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origen no permitido por CORS: ${origin}`));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
