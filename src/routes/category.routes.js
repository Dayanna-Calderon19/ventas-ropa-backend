import { Router } from "express";
import * as categoryController from "../controllers/category.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

router.get("/", categoryController.listarCategorias);
router.get("/:id", categoryController.obtenerCategoria);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate,
    categoryController.crearCategoria
);

router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate,
    categoryController.actualizarCategoria
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    categoryController.eliminarCategoria
);

export default router;
