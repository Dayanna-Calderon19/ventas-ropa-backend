import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarCrearProducto,
    validarActualizarProducto,
    validarFiltrosProducto,
    validarCrearCategoria,
} from "../validator/product.validator.js";

const router = Router();

router.get(
    "/",
    validarFiltrosProducto,
    validate,
    productController.listarProductos,
);
router.get("/:id", productController.obtenerProducto);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validarCrearProducto,
    validate,
    productController.crearProducto,
);
router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validarActualizarProducto,
    validate,
    productController.actualizarProducto,
);
router.patch(
    "/:id/toggle-activo",
    authenticate,
    authorize("ADMIN"),
    productController.eliminarProducto,
);

// Variantes
router.post(
    "/:productoId/variantes",
    authenticate,
    authorize("ADMIN"),
    validate,
    productController.crearVariante,
);

router.put(
    "/variantes/:id",
    authenticate,
    authorize("ADMIN"),
    validate,
    productController.actualizarVariante,
);

router.patch(
    "/variantes/:id/toggle-activo",
    authenticate,
    authorize("ADMIN"),
    productController.toggleActivoVariante,
);

export default router;
