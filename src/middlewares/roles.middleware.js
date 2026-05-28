import { forbidden } from "../utils/response.js";

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.usuario) {
            return forbidden(res, "Acceso denegado");
        }

        if (!roles.includes(req.usuario.rol)) {
            return forbidden(
                res,
                "No tienes permisos para realizar esta acción",
            );
        }

        next();
    };
};
