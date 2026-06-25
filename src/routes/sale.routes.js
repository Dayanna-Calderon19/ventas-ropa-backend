import { Router } from "express";
import * as saleController from "../controllers/sale.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarRegistrarVenta,
    validarFiltrosVenta,
} from "../validator/sale.validator.js";

const router = Router();

router.post(
    "/",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    validarRegistrarVenta,
    validate,
    saleController.registrarVenta,
);
router.get(
    "/",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    validarFiltrosVenta,
    validate,
    saleController.listarVentas,
);
router.get(
    "/:id",
    authenticate,
    authorize("ADMIN", "VENDEDOR"),
    saleController.obtenerVenta,
);

export default router;
