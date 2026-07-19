import { Router } from "express";
import {
    crearReclamacion,
    listarReclamaciones,
    estadisticasReclamaciones,
} from "../controllers/reclamacion.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";

const router = Router();

// Público: cualquier persona puede enviar una reclamación
router.post("/", crearReclamacion);

// Admin: listar y ver estadísticas
router.get("/", authenticate, authorize("ADMIN"), listarReclamaciones);
router.get("/stats", authenticate, authorize("ADMIN"), estadisticasReclamaciones);

export default router;
