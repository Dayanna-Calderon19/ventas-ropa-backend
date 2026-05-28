import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import { generateToken } from "../utils/jwt.js";

const SALT_ROUNDS = 12;

const formatUsuario = (usuario) => ({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    activo: usuario.activo,
    creadoEn: usuario.creadoEn,
});

export const registrar = async ({ nombre, correo, contrasena, telefono }) => {
    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) {
        const err = new Error("El correo ya está registrado");
        err.statusCode = 409;
        throw err;
    }

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    const usuario = await prisma.usuario.create({
        data: {
            nombre,
            correo,
            contrasena: hash,
            telefono: telefono || null,
            rol: "CLIENTE",
            perfil: { create: {} },
        },
    });

    const token = generateToken({ id: usuario.id, rol: usuario.rol });
    return { usuario: formatUsuario(usuario), token };
};

export const login = async ({ correo, contrasena }) => {
    const usuario = await prisma.usuario.findUnique({ where: { correo } });

    if (!usuario) {
        const err = new Error("Credenciales inválidas");
        err.statusCode = 401;
        throw err;
    }

    if (!usuario.activo) {
        const err = new Error("Cuenta desactivada. Contacta al administrador");
        err.statusCode = 403;
        throw err;
    }

    const valida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!valida) {
        const err = new Error("Credenciales inválidas");
        err.statusCode = 401;
        throw err;
    }

    const token = generateToken({ id: usuario.id, rol: usuario.rol });
    return { usuario: formatUsuario(usuario), token };
};

export const perfil = async (usuarioId) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: { perfil: true },
    });

    if (!usuario) {
        const err = new Error("Usuario no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return formatUsuario(usuario);
};

export const cambiarContrasena = async (
    usuarioId,
    { contrasenaActual, contrasenaNueva },
) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
    });

    const valida = await bcrypt.compare(contrasenaActual, usuario.contrasena);
    if (!valida) {
        const err = new Error("La contraseña actual es incorrecta");
        err.statusCode = 400;
        throw err;
    }

    const hash = await bcrypt.hash(contrasenaNueva, SALT_ROUNDS);
    await prisma.usuario.update({
        where: { id: usuarioId },
        data: { contrasena: hash },
    });
};
