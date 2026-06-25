import { query } from "express-validator";

export const validarFiltrosReporte = [
    query("fechaDesde")
        .optional()
        .isISO8601()
        .withMessage("La fecha desde debe ser una fecha válida (YYYY-MM-DD)"),

    query("fechaHasta")
        .optional()
        .isISO8601()
        .withMessage("La fecha hasta debe ser una fecha válida (YYYY-MM-DD)"),

    query("agruparPor")
        .optional()
        .isIn(["dia", "semana", "mes"])
        .withMessage("El agrupamiento debe ser: dia, semana o mes"),

    query("limite")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe ser un número entre 1 y 100"),

    query("año")
        .optional()
        .isInt({ min: 2000, max: 2100 })
        .withMessage("El año debe ser un número válido"),
];
