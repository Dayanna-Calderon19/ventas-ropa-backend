import { body } from "express-validator";

export const validarRegistro = [
    body("nombre")
        .trim()
        .notEmpty()
        .withMessage("El nombre es requerido")
        .isLength({ min: 2, max: 100 })
        .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("correo")
        .trim()
        .notEmpty()
        .withMessage("El correo es requerido")
        .isEmail()
        .withMessage("El correo no es válido")
        .normalizeEmail(),

    body("contrasena")
        .notEmpty()
        .withMessage("La contraseña es requerida")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/[A-Z]/)
        .withMessage("Debe contener al menos una letra mayúscula")
        .matches(/[0-9]/)
        .withMessage("Debe contener al menos un número"),

    body("telefono")
        .optional()
        .isMobilePhone()
        .withMessage("El teléfono no es válido"),
];

export const validarLogin = [
    body("correo")
        .trim()
        .notEmpty()
        .withMessage("El correo es requerido")
        .isEmail()
        .withMessage("El correo no es válido")
        .normalizeEmail(),

    body("contrasena").notEmpty().withMessage("La contraseña es requerida"),
];

export const validarCambioContrasena = [
    body("contrasenaActual")
        .notEmpty()
        .withMessage("La contraseña actual es requerida"),

    body("contrasenaNueva")
        .notEmpty()
        .withMessage("La contraseña nueva es requerida")
        .isLength({ min: 8 })
        .withMessage("La contraseña debe tener al menos 8 caracteres")
        .matches(/[A-Z]/)
        .withMessage("Debe contener al menos una letra mayúscula")
        .matches(/[0-9]/)
        .withMessage("Debe contener al menos un número"),
];
