import prisma from "../config/db.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export const listarPromociones = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { busqueda, activo, codigo } = query;

    const where = {
        ...(activo !== undefined && { activo: activo === "true" }),
        ...(codigo && { codigo }),
        ...(busqueda && {
            OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { codigo: { contains: busqueda, mode: "insensitive" } },
            ],
        }),
    };

    const [total, promociones] = await Promise.all([
        prisma.promocion.count({ where }),
        prisma.promocion.findMany({
            where,
            include: { _count: { select: { ventas: true, pedidos: true } } },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: promociones, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerPromocion = async (id) => {
    const promocion = await prisma.promocion.findUnique({
        where: { id },
        include: {
            items: { include: { producto: true } },
            _count: { select: { ventas: true, pedidos: true } }
        }
    });

    if (!promocion) {
        const err = new Error("Promoción no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return promocion;
};

export const crearPromocion = async (data) => {
    const { items, ...resto } = data;
    
    return prisma.promocion.create({
        data: {
            ...resto,
            inicioEn: new Date(resto.inicioEn),
            finEn: new Date(resto.finEn),
            items: items?.length ? {
                create: items.map(id => ({ productoId: id }))
            } : undefined
        }
    });
};

export const actualizarPromocion = async (id, data) => {
    const { items, ...resto } = data;

    if (items) {
        await prisma.itemPromocion.deleteMany({ where: { promocionId: id } });
    }

    return prisma.promocion.update({
        where: { id },
        data: {
            ...resto,
            ...(resto.inicioEn && { inicioEn: new Date(resto.inicioEn) }),
            ...(resto.finEn && { finEn: new Date(resto.finEn) }),
            ...(items && {
                items: {
                    create: items.map(pId => ({ productoId: pId }))
                }
            })
        }
    });
};

export const eliminarPromocion = async (id) => {
    return prisma.promocion.delete({ where: { id } });
};
