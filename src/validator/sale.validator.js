import { body, query } from "express-validator";

export const validarRegistrarVenta = [
    body("items")
        .isArray({ min: 1 })
        .withMessage("Debe incluir al menos un producto"),

    body("items.*.varianteId")
        .notEmpty()
        .withMessage("El ID de variante es requerido")
        .isUUID()
        .withMessage("El ID de variante no es válido"),

    body("items.*.cantidad")
        .notEmpty()
        .withMessage("La cantidad es requerida")
        .isInt({ min: 1 })
        .withMessage("La cantidad debe ser un número entero mayor a 0"),

    body("clienteId")
        .optional()
        .isUUID()
        .withMessage("El ID de cliente no es válido"),

    body("promocionId")
        .optional()
        .isUUID()
        .withMessage("El ID de promoción no es válido"),

    body("notas")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Las notas no pueden superar 500 caracteres"),
];

export const validarFiltrosVenta = [
    query("canal")
        .optional()
        .isIn(["TIENDA", "WEB"])
        .withMessage("El canal debe ser TIENDA o WEB"),

    query("fechaDesde")
        .optional()
        .isISO8601()
        .withMessage("La fecha de inicio no es válida"),

    query("fechaHasta")
        .optional()
        .isISO8601()
        .withMessage("La fecha de fin no es válida"),

    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La página debe ser un número entero mayor a 0"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe estar entre 1 y 100"),
];
