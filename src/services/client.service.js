import bcrypt from "bcryptjs";
import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const SALT_ROUNDS = 12;

export const listarClientes = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { busqueda, activo } = query;

    const where = {
        rol: "CLIENTE",
        ...(activo !== undefined && { activo: activo === "true" }),
        ...(busqueda && {
            OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { correo: { contains: busqueda, mode: "insensitive" } },
            ],
        }),
    };

    const [total, clientes] = await Promise.all([
        prisma.usuario.count({ where }),
        prisma.usuario.findMany({
            where,
            select: {
                id: true,
                nombre: true,
                correo: true,
                telefono: true,
                activo: true,
                creadoEn: true,
                perfil: true,
                _count: { select: { pedidos: true } },
            },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: clientes, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerCliente = async (id) => {
    const cliente = await prisma.usuario.findUnique({
        where: { id, rol: "CLIENTE" },
        select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            activo: true,
            creadoEn: true,
            perfil: true,
            pedidos: {
                orderBy: { creadoEn: "desc" },
                take: 10,
                select: { id: true, estado: true, total: true, creadoEn: true },
            },
            _count: { select: { pedidos: true } },
        },
    });

    if (!cliente) {
        const err = new Error("Cliente no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return cliente;
};

export const actualizarPerfil = async (
    usuarioId,
    { nombre, telefono, perfil },
) => {
    const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
    });
    if (!usuario) {
        const err = new Error("Usuario no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return prisma.usuario.update({
        where: { id: usuarioId },
        data: {
            ...(nombre && { nombre }),
            ...(telefono !== undefined && { telefono }),
            ...(perfil && {
                perfil: {
                    upsert: {
                        create: perfil,
                        update: perfil,
                    },
                },
            }),
        },
        select: {
            id: true,
            nombre: true,
            correo: true,
            telefono: true,
            perfil: true,
        },
    });
};

export const crearUsuario = async ({
    nombre,
    correo,
    contrasena,
    telefono,
    rol,
}) => {
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
            telefono: telefono || null,
            rol: rol || "CLIENTE",
            ...(rol === "CLIENTE" || !rol ? { perfil: { create: {} } } : {}),
        },
        select: {
            id: true,
            nombre: true,
            correo: true,
            rol: true,
            activo: true,
            creadoEn: true,
        },
    });
};

export const toggleActivoUsuario = async (id) => {
    const usuario = await prisma.usuario.findUnique({ where: { id } });
    if (!usuario) {
        const err = new Error("Usuario no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return prisma.usuario.update({
        where: { id },
        data: { activo: !usuario.activo },
        select: { id: true, nombre: true, activo: true },
    });
};

export const historialPedidosCliente = async (clienteId, query) => {
    const { page, limit, skip } = getPaginationParams(query);

    const where = { clienteId };

    const [total, pedidos] = await Promise.all([
        prisma.pedido.count({ where }),
        prisma.pedido.findMany({
            where,
            include: {
                items: {
                    include: {
                        variante: {
                            include: {
                                producto: {
                                    select: { nombre: true, imagenUrl: true },
                                },
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: pedidos, meta: buildPaginationMeta(total, page, limit) };
};
