import prisma from "../config/db.js";

/**
 * POST /reclamaciones
 * Crea una nueva reclamación (público, sin autenticación)
 */
export const crearReclamacion = async (req, res) => {
    try {
        const { tipo, nombre, correo, telefono, descripcion } = req.body;

        if (!tipo || !nombre || !correo || !descripcion) {
            return res.status(400).json({ message: "Los campos tipo, nombre, correo y descripción son requeridos." });
        }

        const tiposValidos = ["QUEJA", "RECLAMO", "SUGERENCIA"];
        if (!tiposValidos.includes(tipo)) {
            return res.status(400).json({ message: "El tipo debe ser QUEJA, RECLAMO o SUGERENCIA." });
        }

        const reclamacion = await prisma.reclamacion.create({
            data: {
                tipo,
                nombre: nombre.trim(),
                correo: correo.trim().toLowerCase(),
                telefono: telefono?.trim() || null,
                descripcion: descripcion.trim(),
            },
        });

        return res.status(201).json({
            message: "Reclamación registrada exitosamente.",
            data: reclamacion,
        });
    } catch (error) {
        console.error("Error al crear reclamación:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * GET /reclamaciones
 * Lista todas las reclamaciones (solo admin)
 */
export const listarReclamaciones = async (req, res) => {
    try {
        const { tipo, page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const where = tipo ? { tipo } : {};

        const [reclamaciones, total] = await Promise.all([
            prisma.reclamacion.findMany({
                where,
                orderBy: { creadoEn: "desc" },
                skip,
                take: parseInt(limit),
            }),
            prisma.reclamacion.count({ where }),
        ]);

        return res.json({
            data: reclamaciones,
            meta: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("Error al listar reclamaciones:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};

/**
 * GET /reclamaciones/stats
 * Estadísticas resumidas (solo admin)
 */
export const estadisticasReclamaciones = async (req, res) => {
    try {
        const [totalQuejas, totalReclamos, totalSugerencias] = await Promise.all([
            prisma.reclamacion.count({ where: { tipo: "QUEJA" } }),
            prisma.reclamacion.count({ where: { tipo: "RECLAMO" } }),
            prisma.reclamacion.count({ where: { tipo: "SUGERENCIA" } }),
        ]);

        return res.json({
            data: {
                totalQuejas,
                totalReclamos,
                totalSugerencias,
                total: totalQuejas + totalReclamos + totalSugerencias,
            },
        });
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        return res.status(500).json({ message: "Error interno del servidor." });
    }
};
