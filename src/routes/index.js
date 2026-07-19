import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import categoryRoutes from "./category.routes.js";
import promotionRoutes from "./promotion.routes.js";
import inventoryRoutes from "./inventory.routes.js";
import saleRoutes from "./sale.routes.js";
import orderRoutes from "./order.routes.js";
import clientRoutes from "./client.routes.js";
import userRoutes from "./user.routes.js";
import reportRoutes from "./report.routes.js";
import reclamacionRoutes from "./reclamacion.routes.js";

const router = Router();

router.get("/health", (req, res) => {
    res.json({
        ok: true,
        message: "API funcionando correctamente",
        timestamp: new Date().toISOString(),
        version: "1.0.0",
    });
});

router.use("/auth", authRoutes);
router.use("/productos", productRoutes);
router.use("/categorias", categoryRoutes);
router.use("/promociones", promotionRoutes);
router.use("/inventario", inventoryRoutes);
router.use("/ventas", saleRoutes);
router.use("/pedidos", orderRoutes);
router.use("/usuarios", clientRoutes);
router.use("/gestion-usuarios", userRoutes);
router.use("/reportes", reportRoutes);
router.use("/reclamaciones", reclamacionRoutes);

export default router;
