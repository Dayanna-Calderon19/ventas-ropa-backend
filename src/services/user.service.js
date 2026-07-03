import prisma from "../config/db.js";
import bcrypt from "bcryptjs";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

const SALT_ROUNDS = 12;

export const listarUsuariosAdmin = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { busqueda, rol, activo } = query;

    const where = {
        ...(rol && { rol }),

        ...(activo !== undefined && {
            activo: activo === "true",
        }),

        ...(busqueda && {
            OR: [
                {
                    nombre: {
                        contains: busqueda,
                        mode: "insensitive",
                    },
                },
                {
                    correo: {
                        contains: busqueda,
                        mode: "insensitive",
                    },
                },
            ],
        }),
    };

    const [total, usuarios] = await Promise.all([
        prisma.usuario.count({
            where,
        }),

        prisma.usuario.findMany({
            where,

            select: {
                id: true,
                nombre: true,
                correo: true,
                telefono: true,
                rol: true,
                activo: true,
                creadoEn: true,

                perfil: {
                    select: {
                        direccion: true,
                        distrito: true,
                        ciudad: true,
                    },
                },

                pedidos: {
                    select: {
                        id: true,
                        total: true,
                        estado: true,
                        creadoEn: true,
                    },
                    orderBy: {
                        creadoEn: "desc",
                    },
                    take: 5,
                },

                _count: {
                    select: {
                        pedidos: true,
                    },
                },
            },

            skip,
            take: limit,

            orderBy: {
                creadoEn: "desc",
            },
        }),
    ]);

    return {
        data: usuarios,
        meta: buildPaginationMeta(total, page, limit),
    };
};

export const crearUsuario = async (data) => {
    const { nombre, correo, contrasena, rol, telefono } = data;

    const existe = await prisma.usuario.findUnique({ where: { correo } });
    if (existe) {
        const err = new Error("El correo ya está registrado");
        err.statusCode = 409;
        throw err;
    }

    const hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

    return prisma.usuario.create({
        data: {
            nombre,
            correo,
            contrasena: hash,
            rol,
            telefono: telefono || null,
        },
        select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            activo: true,
        }
    });
};

export const actualizarUsuario = async (id, data) => {
    const { contrasena, ...resto } = data;

    let hash;
    if (contrasena) {
        hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    }

    return prisma.usuario.update({
        where: { id },
        data: {
            ...resto,
            ...(hash && { contrasena: hash })
        },
        select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            activo: true,
        }
    });
};

export const toggleActivo = async (id) => {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
        const err = new Error("Usuario no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return prisma.usuario.update({
        where: { id },
        data: { activo: !usuario.activo },
        select: { id: true, nombre: true, activo: true }
    });
};

export const crearCliente = async (data) => {
    const {
        nombre,
        correo,
        telefono,
        contrasena,
    } = data;

    const existe = await prisma.usuario.findUnique({
        where: {
            correo,
        },
    });

    if (existe) {
        const err = new Error("El correo ya está registrado");
        err.statusCode = 409;
        throw err;
    }

    const hash = await bcrypt.hash(
        contrasena,
        SALT_ROUNDS
    );

    return prisma.usuario.create({
        data: {
            nombre,
            correo,
            telefono: telefono || null,
            contrasena: hash,
            rol: "CLIENTE",
            activo: true,
        },
        select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            rol: true,
            activo: true,
        },
    });
};