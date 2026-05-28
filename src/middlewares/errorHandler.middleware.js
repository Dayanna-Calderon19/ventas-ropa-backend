import { env } from "../config/env.js";

export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Error interno del servidor";

    const body = {
        ok: false,
        message,
        ...(env.isDev && { stack: err.stack }),
    };

    res.status(statusCode).json(body);
};

export const notFoundHandler = (req, res) => {
    res.status(404).json({
        ok: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    });
};
