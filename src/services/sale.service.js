import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const generarNumeroComprobante = () => {
    const fecha = new Date();
    const year = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const dia = String(fecha.getDate()).padStart(2, "0");
    const random = String(Math.floor(Math.random() * 99999)).padStart(5, "0");
    return `V-${year}${mes}${dia}-${random}`;
};

const calcularTotalesVenta = (items, promocion) => {
    const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
    let descuento = 0;

    if (promocion) {
        if (!promocion.minOrderTotal || subtotal >= promocion.montoMinimo) {
            if (promocion.tipoDescuento === "PORCENTAJE") {
                descuento = (subtotal * promocion.valorDescuento) / 100;
            } else {
                descuento = Math.min(promocion.valorDescuento, subtotal);
            }
        }
    }

    const base = subtotal - descuento;
    const impuesto = parseFloat((base * 0.18).toFixed(2));
    const total = parseFloat((base + impuesto).toFixed(2));

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuento: parseFloat(descuento.toFixed(2)),
        impuesto,
        total,
    };
};

export const registrarVenta = async ({
    items,
    vendedorId,
    clienteId,
    promocionId,
    notas,
}) => {
    const varianteIds = items.map((i) => i.varianteId);
    const variantes = await prisma.varianteProducto.findMany({
        where: { id: { in: varianteIds }, activo: true },
    });

    if (variantes.length !== varianteIds.length) {
        const err = new Error(
            "Una o más variantes no existen o están inactivas",
        );
        err.statusCode = 400;
        throw err;
    }

    const itemsConPrecio = items.map((item) => {
        const variante = variantes.find((v) => v.id === item.varianteId);

        if (variante.stock < item.cantidad) {
            const err = new Error(
                `Stock insuficiente para SKU: ${variante.sku}. Disponible: ${variante.stock}`,
            );
            err.statusCode = 400;
            throw err;
        }

        const unitPrice = variante.precio;
        return {
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: unitPrice,
            subtotal: parseFloat((unitPrice * item.cantidad).toFixed(2)),
        };
    });

    let promocion = null;
    if (promocionId) {
        promocion = await prisma.promocion.findUnique({
            where: { id: promocionId },
        });
        if (!promocion || !promocion.activo) {
            const err = new Error("La promoción no existe o no está activa");
            err.statusCode = 400;
            throw err;
        }

        const ahora = new Date();
        if (ahora < promocion.inicioEn || ahora > promocion.finEn) {
            const err = new Error("La promoción no está vigente");
            err.statusCode = 400;
            throw err;
        }

        if (promocion.usoMaximo && promocion.usoActual >= promocion.usoMaximo) {
            const err = new Error(
                "La promoción ha alcanzado su límite de usos",
            );
            err.statusCode = 400;
            throw err;
        }
    }

    const { subtotal, descuento, impuesto, total } = calcularTotalesVenta(
        itemsConPrecio,
        promocion,
    );

    const venta = await prisma.$transaction(async (tx) => {
        const nuevaVenta = await tx.venta.create({
            data: {
                vendedorId,
                clienteId: clienteId || null,
                promocionId: promocionId || null,
                canal: "TIENDA",
                subtotal,
                descuento,
                impuesto,
                total,
                notas: notas || null,
                numeroComprobante: generarNumeroComprobante(),
                items: {
                    create: itemsConPrecio,
                },
            },
            include: {
                items: {
                    include: {
                        variante: {
                            include: { producto: { select: { nombre: true } } },
                        },
                    },
                },
                vendedor: { select: { id: true, nombre: true } },
            },
        });

        for (const item of itemsConPrecio) {
            await tx.varianteProducto.update({
                where: { id: item.varianteId },
                data: { stock: { decrement: item.cantidad } },
            });

            await tx.movimientoStock.create({
                data: {
                    varianteId: item.varianteId,
                    tipo: "SALIDA",
                    cantidad: item.cantidad,
                    motivo: `Venta ${nuevaVenta.numeroComprobante}`,
                    usuarioId: vendedorId,
                },
            });
        }

        if (promocionId) {
            await tx.promocion.update({
                where: { id: promocionId },
                data: { usoActual: { increment: 1 } },
            });
        }

        return nuevaVenta;
    });

    return venta;
};

export const listarVentas = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { vendedorId, clienteId, fechaDesde, fechaHasta, canal } = query;

    const where = {
        ...(vendedorId && { vendedorId }),
        ...(clienteId && { clienteId }),
        ...(canal && { canal }),
        ...((fechaDesde || fechaHasta) && {
            creadoEn: {
                ...(fechaDesde && { gte: new Date(fechaDesde) }),
                ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
        }),
    };

    const [total, ventas] = await Promise.all([
        prisma.venta.count({ where }),
        prisma.venta.findMany({
            where,
            include: {
                vendedor: { select: { id: true, nombre: true } },
                items: {
                    include: {
                        variante: {
                            include: { producto: { select: { nombre: true } } },
                        },
                    },
                },
            },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: ventas, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerVenta = async (id) => {
    const venta = await prisma.venta.findUnique({
        where: { id },
        include: {
            vendedor: { select: { id: true, nombre: true } },
            items: {
                include: {
                    variante: {
                        include: {
                            producto: {
                                select: {
                                    id: true,
                                    nombre: true,
                                    imagenUrl: true,
                                },
                            },
                        },
                    },
                },
            },
            promocion: {
                select: {
                    id: true,
                    nombre: true,
                    tipoDescuento: true,
                    valorDescuento: true,
                },
            },
        },
    });

    if (!venta) {
        const err = new Error("Venta no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return venta;
};
