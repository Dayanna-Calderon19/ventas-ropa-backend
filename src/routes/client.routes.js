import { Router } from "express";
import * as clientController from "../controllers/client.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarActualizarPerfil,
    validarCrearUsuario,
} from "../validators/client.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN"),
    clientController.listarClientes,
);
router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validarCrearUsuario,
    validate,
    clientController.crearUsuario,
);
router.get(
    "/mi-perfil",
    authenticate,
    clientController.historialPedidosCliente,
);
router.patch(
    "/mi-perfil",
    authenticate,
    validarActualizarPerfil,
    validate,
    clientController.actualizarPerfil,
);
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    clientController.obtenerCliente,
);
router.patch(
    "/:id/toggle-activo",
    authenticate,
    authorize("ADMIN"),
    clientController.toggleActivoUsuario,
);

export default router;
