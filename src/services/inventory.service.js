import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const STOCK_MINIMO = 5;

export const listarVariantes = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { productoId, stockBajo } = query;

    const where = {
        activo: true,
        ...(productoId && { productoId }),
        ...(stockBajo === "true" && { stock: { lte: STOCK_MINIMO } }),
    };

    const [total, variantes] = await Promise.all([
        prisma.varianteProducto.count({ where }),
        prisma.varianteProducto.findMany({
            where,
            include: {
                producto: { select: { id: true, nombre: true, slug: true } },
            },
            skip,
            take: limit,
            orderBy: { producto: { nombre: "asc" } },
        }),
    ]);

    return { data: variantes, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerVariante = async (id) => {
    const variante = await prisma.varianteProducto.findUnique({
        where: { id },
        include: {
            producto: { select: { id: true, nombre: true } },
            movimientosStock: {
                orderBy: { creadoEn: "desc" },
                take: 20,
            },
        },
    });

    if (!variante) {
        const err = new Error("Variante no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return variante;
};

export const ajustarStock = async (
    varianteId,
    { tipo, cantidad, motivo, usuarioId },
) => {
    const variante = await prisma.varianteProducto.findUnique({
        where: { id: varianteId },
    });
    if (!variante) {
        const err = new Error("Variante no encontrada");
        err.statusCode = 404;
        throw err;
    }

    if (!variante.activo) {
        const err = new Error("La variante está inactiva");
        err.statusCode = 400;
        throw err;
    }

    if (tipo === "SALIDA" && variante.stock < cantidad) {
        const err = new Error(
            `Stock insuficiente. Disponible: ${variante.stock}`,
        );
        err.statusCode = 400;
        throw err;
    }

    const nuevoStock =
        tipo === "ENTRADA"
            ? variante.stock + cantidad
            : variante.stock - cantidad;

    const [varianteActualizada, movimiento] = await prisma.$transaction([
        prisma.varianteProducto.update({
            where: { id: varianteId },
            data: { stock: nuevoStock },
        }),
        prisma.movimientoStock.create({
            data: { varianteId, tipo, cantidad, motivo, usuarioId },
        }),
    ]);

    return {
        variante: varianteActualizada,
        movimiento,
        alertaStockBajo: nuevoStock <= STOCK_MINIMO,
    };
};

export const crearVariante = async (
    productoId,
    { sku, talla, color, precio, stock },
) => {
    const productoExiste = await prisma.producto.findUnique({
        where: { id: productoId },
    });
    if (!productoExiste) {
        const err = new Error("Producto no encontrado");
        err.statusCode = 404;
        throw err;
    }

    const skuExiste = await prisma.varianteProducto.findUnique({
        where: { sku },
    });
    if (skuExiste) {
        const err = new Error(`El SKU ${sku} ya está registrado`);
        err.statusCode = 409;
        throw err;
    }

    return prisma.varianteProducto.create({
        data: { productoId, sku, talla, color, precio, stock: stock || 0 },
    });
};

export const actualizarVariante = async (id, { precio, activo }) => {
    const variante = await prisma.varianteProducto.findUnique({
        where: { id },
    });
    if (!variante) {
        const err = new Error("Variante no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return prisma.varianteProducto.update({
        where: { id },
        data: {
            ...(precio !== undefined && { precio }),
            ...(activo !== undefined && { activo }),
        },
    });
};

export const listarMovimientos = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { varianteId, tipo, fechaDesde, fechaHasta } = query;

    const where = {
        ...(varianteId && { varianteId }),
        ...(tipo && { tipo }),
        ...((fechaDesde || fechaHasta) && {
            creadoEn: {
                ...(fechaDesde && { gte: new Date(fechaDesde) }),
                ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
        }),
    };

    const [total, movimientos] = await Promise.all([
        prisma.movimientoStock.count({ where }),
        prisma.movimientoStock.findMany({
            where,
            include: {
                variante: {
                    include: { producto: { select: { nombre: true } } },
                },
            },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: movimientos, meta: buildPaginationMeta(total, page, limit) };
};

export const productosConStockBajo = async () => {
    return prisma.varianteProducto.findMany({
        where: { activo: true, stock: { lte: STOCK_MINIMO } },
        include: {
            producto: { select: { id: true, nombre: true, slug: true } },
        },
        orderBy: { stock: "asc" },
    });
};
