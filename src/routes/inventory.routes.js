import { Router } from "express";
import * as inventoryController from "../controllers/inventory.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarAjusteStock,
    validarCrearVariante,
    validarActualizarVariante,
    validarFiltrosMovimientos,
} from "../validators/inventory.validator.js";

const router = Router();

router.get(
    "/",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    inventoryController.listarVariantes,
);
router.get(
    "/stock-bajo",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    inventoryController.productosConStockBajo,
);
router.get(
    "/movimientos",
    authenticate,
    authorize("ADMIN"),
    validarFiltrosMovimientos,
    validate,
    inventoryController.listarMovimientos,
);
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    inventoryController.obtenerVariante,
);

router.post(
    "/producto/:productoId",
    authenticate,
    authorize("ADMIN"),
    validarCrearVariante,
    validate,
    inventoryController.crearVariante,
);
router.patch(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validarActualizarVariante,
    validate,
    inventoryController.actualizarVariante,
);
router.post(
    "/:id/ajuste",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    validarAjusteStock,
    validate,
    inventoryController.ajustarStock,
);

export default router;
