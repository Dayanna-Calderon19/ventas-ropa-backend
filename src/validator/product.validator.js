import { body, query } from "express-validator";

export const validarCrearProducto = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre es requerido")
        .isLength({ min: 2, max: 200 })
        .withMessage("El nombre debe tener entre 2 y 200 caracteres"),

    body("precioBase")
        .notEmpty()
        .withMessage("El precio base es requerido")
        .isFloat({ min: 0 })
        .withMessage("El precio base debe ser un número positivo"),

    body("categoriaId")
        .notEmpty()
        .withMessage("La categoría es requerida")
        .isUUID()
        .withMessage("El ID de categoría no es válido"),

    body("descripcion")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("La descripción no puede superar 1000 caracteres"),

    body("destacado")
        .optional()
        .isBoolean()
        .withMessage("El campo destacado debe ser verdadero o falso"),

    body("variantes")
        .optional()
        .isArray({ min: 1 })
        .withMessage(
            "Las variantes deben ser un arreglo con al menos un elemento",
        ),

    body("variantes.*.sku")
        .if(body("variantes").exists())
        .notEmpty()
        .withMessage("El SKU es requerido")
        .isLength({ max: 50 })
        .withMessage("El SKU no puede superar 50 caracteres"),

    body("variantes.*.talla")
        .if(body("variantes").exists())
        .notEmpty()
        .withMessage("La talla es requerida"),

    body("variantes.*.color")
        .if(body("variantes").exists())
        .notEmpty()
        .withMessage("El color es requerido"),

    body("variantes.*.precio")
        .if(body("variantes").exists())
        .isFloat({ min: 0 })
        .withMessage("El precio de la variante debe ser un número positivo"),

    body("variantes.*.stock")
        .optional()
        .isInt({ min: 0 })
        .withMessage("El stock debe ser un número entero positivo"),
];

export const validarActualizarProducto = [
    body("nombre")
        .optional()
        .trim()
        .isLength({ min: 2, max: 200 })
        .withMessage("El nombre debe tener entre 2 y 200 caracteres"),

    body("precioBase")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El precio base debe ser un número positivo"),

    body("categoriaId")
        .optional()
        .isUUID()
        .withMessage("El ID de categoría no es válido"),

    body("descripcion")
        .optional()
        .isLength({ max: 1000 })
        .withMessage("La descripción no puede superar 1000 caracteres"),

    body("destacado")
        .optional()
        .isBoolean()
        .withMessage("El campo destacado debe ser verdadero o falso"),

    body("activo")
        .optional()
        .isBoolean()
        .withMessage("El campo activo debe ser verdadero o falso"),
];

export const validarFiltrosProducto = [
    query("page")
        .optional()
        .isInt({ min: 1 })
        .withMessage("La página debe ser un número entero mayor a 0"),

    query("limit")
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage("El límite debe estar entre 1 y 100"),

    query("precioMin")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El precio mínimo debe ser un número positivo"),

    query("precioMax")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("El precio máximo debe ser un número positivo"),
];

export const validarCrearCategoria = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre de la categoría es requerido")
        .isLength({ min: 2, max: 100 })
        .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("descripcion")
        .optional()
        .isLength({ max: 500 })
        .withMessage("La descripción no puede superar 500 caracteres"),
];
