import { body } from "express-validator";

export const validarActualizarPerfil = [
    body("nombre")
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage("El nombre debe tener entre 2 y 100 caracteres"),

    body("telefono")
        .optional()
        .isMobilePhone()
        .withMessage("El teléfono no es válido"),

    body("perfil.direccion")
        .optional()
        .isLength({ max: 255 })
        .withMessage("La dirección no puede superar 255 caracteres"),

    body("perfil.ciudad")
        .optional()
        .isLength({ max: 100 })
        .withMessage("La ciudad no puede superar 100 caracteres"),

    body("perfil.distrito")
        .optional()
        .isLength({ max: 100 })
        .withMessage("El distrito no puede superar 100 caracteres"),

    body("perfil.codigoPostal")
        .optional()
        .isPostalCode("any")
        .withMessage("El código postal no es válido"),

    body("perfil.fechaNacimiento")
        .optional()
        .isISO8601()
        .withMessage("La fecha de nacimiento no es válida")
        .toDate(),
];

export const validarCrearUsuario = [
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

    body("rol")
        .optional()
        .isIn(["ADMIN", "VENDEDOR", "CLIENTE"])
        .withMessage("Rol no válido"),

    body("telefono")
        .optional()
        .isMobilePhone()
        .withMessage("El teléfono no es válido"),
];
