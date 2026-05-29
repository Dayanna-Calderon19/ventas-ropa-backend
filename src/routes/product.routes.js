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
} from "../validators/product.validator.js";

const router = Router();

router.get(
    "/",
    validarFiltrosProducto,
    validate,
    productController.listarProductos,
);
router.get("/categorias", productController.listarCategorias);
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
router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    productController.eliminarProducto,
);
router.post(
    "/categorias",
    authenticate,
    authorize("ADMIN"),
    validarCrearCategoria,
    validate,
    productController.crearCategoria,
);

export default router;
