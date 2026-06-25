import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
    validarRegistro,
    validarLogin,
    validarCambioContrasena,
} from "../validator/auth.validator.js";

const router = Router();

router.post("/registrar", validarRegistro, validate, authController.registrar);
router.post("/login", validarLogin, validate, authController.login);
router.get("/perfil", authenticate, authController.perfil);
router.patch(
    "/cambiar-contrasena",
    authenticate,
    validarCambioContrasena,
    validate,
    authController.cambiarContrasena,
);

export default router;
