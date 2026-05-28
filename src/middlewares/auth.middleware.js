import { verifyToken } from "../utils/jwt.js";
import { unauthorized } from "../utils/response.js";
import prisma from "../config/db.js";

export const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return unauthorized(res, "Token de acceso requerido");
    }

    const token = authHeader.split(" ")[1];

    try {
        const payload = verifyToken(token);

        const usuario = await prisma.usuario.findUnique({
            where: { id: payload.id },
            select: {
                id: true,
                nombre: true,
                correo: true,
                rol: true,
                activo: true,
            },
        });

        if (!usuario || !usuario.activo) {
            return unauthorized(res, "Usuario no encontrado o inactivo");
        }

        req.usuario = usuario;
        next();
    } catch {
        return unauthorized(res, "Token inválido o expirado");
    }
};
