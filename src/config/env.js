const required = ["DATABASE_URL", "JWT_SECRET"];
for (const key of required) {
    if (!process.env[key])
        throw new Error(`Variable requerida no definida: ${key}`);
}
export const env = {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT, 10) || 4000,
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
    cors: { origin: process.env.CORS_ORIGIN || "http://localhost:5173" },
    isDev: process.env.NODE_ENV !== "production",
};
