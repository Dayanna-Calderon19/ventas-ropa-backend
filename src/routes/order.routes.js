import { Router } from "express";
import * as orderController from "../controllers/order.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarCrearPedido,
    validarActualizarEstado,
    validarFiltrosPedido,
} from "../validators/order.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("CLIENTE"),
    validarCrearPedido,
    validate,
    orderController.crearPedido,
);
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "VENDEDOR", "CLIENTE"),
    validarFiltrosPedido,
    validate,
    orderController.listarPedidos,
);
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR", "CLIENTE"),
    orderController.obtenerPedido,
);
router.patch(
    "/:id/estado",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    validarActualizarEstado,
    validate,
    orderController.actualizarEstadoPedido,
);
router.patch(
    "/:id/cancelar",
    authenticate,
    authorize("CLIENTE"),
    orderController.cancelarPedido,
);

export default router;
