import { body, query } from "express-validator";

export const validarCrearPedido = [
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

    body("promocionId")
        .optional()
        .isUUID()
        .withMessage("El ID de promoción no es válido"),

    body("costoEnvio")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El costo de envío debe ser un número positivo"),

    body("direccionEnvio")
        .optional()
        .isLength({ max: 500 })
        .withMessage("La dirección no puede superar 500 caracteres"),

    body("notas")
        .optional()
        .isLength({ max: 500 })
        .withMessage("Las notas no pueden superar 500 caracteres"),
];

export const validarActualizarEstado = [
    body("estado")
        .notEmpty()
        .withMessage("El estado es requerido")
        .isIn(["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"])
        .withMessage("Estado no válido"),

    body("nota")
        .optional()
        .isLength({ max: 500 })
        .withMessage("La nota no puede superar 500 caracteres"),
];

export const validarFiltrosPedido = [
    query("estado")
        .optional()
        .isIn(["PENDIENTE", "CONFIRMADO", "ENVIADO", "ENTREGADO", "CANCELADO"])
        .withMessage("Estado no válido"),

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
