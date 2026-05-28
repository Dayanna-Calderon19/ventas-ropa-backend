import { body, query } from "express-validator";

export const validarAjusteStock = [
    body("tipo")
        .notEmpty()
        .withMessage("El tipo de movimiento es requerido")
        .isIn(["ENTRADA", "SALIDA"])
        .withMessage("El tipo debe ser ENTRADA o SALIDA"),

    body("cantidad")
        .notEmpty()
        .withMessage("La cantidad es requerida")
        .isInt({ min: 1 })
        .withMessage("La cantidad debe ser un número entero mayor a 0"),

    body("motivo")
        .optional()
        .isLength({ max: 255 })
        .withMessage("El motivo no puede superar 255 caracteres"),
];

export const validarCrearVariante = [
    body("sku")
        .trim()
        .notEmpty()
        .withMessage("El SKU es requerido")
        .isLength({ max: 50 })
        .withMessage("El SKU no puede superar 50 caracteres"),

    body("talla").trim().notEmpty().withMessage("La talla es requerida"),

    body("color").trim().notEmpty().withMessage("El color es requerido"),

    body("precio")
        .notEmpty()
        .withMessage("El precio es requerido")
        .isFloat({ min: 0 })
        .withMessage("El precio debe ser un número positivo"),

    body("stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("El stock debe ser un número entero positivo"),
];

export const validarActualizarVariante = [
    body("precio")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El precio debe ser un número positivo"),

    body("activo")
        .optional()
        .isBoolean()
        .withMessage("El campo activo debe ser verdadero o falso"),
];

export const validarFiltrosMovimientos = [
    query("tipo")
        .optional()
        .isIn(["ENTRADA", "SALIDA"])
        .withMessage("El tipo debe ser ENTRADA o SALIDA"),

    query("fechaDesde")
        .optional()
        .isISO8601()
        .withMessage("La fecha de inicio no es válida"),

    query("fechaHasta")
        .optional()
        .isISO8601()
        .withMessage("La fecha de fin no es válida"),
];
