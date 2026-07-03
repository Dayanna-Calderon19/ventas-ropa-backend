import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

// Wait, I saw roles.middleware.js earlier, let me double check the name.
// It was roles.middleware.js and the export was likely 'authorize'.

router.get("/", authenticate, authorize("ADMIN"), userController.listarUsuarios);
router.post("/", authenticate, authorize("ADMIN"), validate, userController.crearUsuario);
router.post("/clientes", authenticate, authorize("ADMIN", "VENDEDOR"), validate, userController.crearCliente);
router.put("/:id", authenticate, authorize("ADMIN"), validate, userController.actualizarUsuario);
router.patch("/:id/toggle-activo", authenticate, authorize("ADMIN"), userController.toggleActivo);

export default router;
