import { Router } from "express";
import * as reportController from "../controllers/report.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { validarFiltrosReporte } from "../validators/report.validator.js";

const router = Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/resumen", reportController.resumenGeneral);
router.get(
    "/ventas",
    validarFiltrosReporte,
    validate,
    reportController.ventasPorPeriodo,
);
router.get(
    "/productos-mas-vendidos",
    validarFiltrosReporte,
    validate,
    reportController.productosMasVendidos,
);
router.get(
    "/ingresos-mensuales",
    validarFiltrosReporte,
    validate,
    reportController.ingresosMensuales,
);
router.get("/inventario", reportController.reporteInventario);

export default router;
