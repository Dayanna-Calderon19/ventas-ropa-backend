import { Router } from "express";
import * as promotionController from "../controllers/promotion.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/roles.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

const router = Router();

router.get("/", promotionController.listarPromociones);
router.get("/:id", authenticate, authorize("ADMIN"), promotionController.obtenerPromocion);

router.post(
    "/",
    authenticate,
    authorize("ADMIN"),
    validate,
    promotionController.crearPromocion
);

router.put(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    validate,
    promotionController.actualizarPromocion
);

router.delete(
    "/:id",
    authenticate,
    authorize("ADMIN"),
    promotionController.eliminarPromocion
);

export default router;
