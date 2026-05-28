import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const ESTADOS_PERMITIDOS = {
    PENDIENTE: ["CONFIRMADO", "CANCELADO"],
    CONFIRMADO: ["ENVIADO", "CANCELADO"],
    ENVIADO: ["ENTREGADO"],
    ENTREGADO: [],
    CANCELADO: [],
};

const calcularTotalesPedido = (items, promocion, costoEnvio = 0) => {
    const subtotal = items.reduce((acc, i) => acc + i.subtotal, 0);
    let descuento = 0;

    if (promocion) {
        if (!promocion.montoMinimo || subtotal >= promocion.montoMinimo) {
            if (promocion.tipoDescuento === "PORCENTAJE") {
                descuento = (subtotal * promocion.valorDescuento) / 100;
            } else {
                descuento = Math.min(promocion.valorDescuento, subtotal);
            }
        }
    }

    const base = subtotal - descuento + costoEnvio;
    const impuesto = parseFloat((base * 0.18).toFixed(2));
    const total = parseFloat((base + impuesto).toFixed(2));

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        descuento: parseFloat(descuento.toFixed(2)),
        costoEnvio: parseFloat(costoEnvio.toFixed(2)),
        impuesto,
        total,
    };
};

export const crearPedido = async ({
    clienteId,
    items,
    promocionId,
    costoEnvio,
    direccionEnvio,
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

        return {
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario: variante.precio,
            subtotal: parseFloat((variante.precio * item.cantidad).toFixed(2)),
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

    const totales = calcularTotalesPedido(
        itemsConPrecio,
        promocion,
        costoEnvio || 0,
    );

    const pedido = await prisma.$transaction(async (tx) => {
        const nuevoPedido = await tx.pedido.create({
            data: {
                clienteId,
                promocionId: promocionId || null,
                direccionEnvio: direccionEnvio || null,
                notas: notas || null,
                ...totales,
                items: { create: itemsConPrecio },
                historialEstados: {
                    create: { estado: "PENDIENTE", nota: "Pedido creado" },
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
                cliente: { select: { id: true, nombre: true, correo: true } },
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
                    motivo: `Pedido web ${nuevoPedido.id}`,
                    usuarioId: clienteId,
                },
            });
        }

        if (promocionId) {
            await tx.promocion.update({
                where: { id: promocionId },
                data: { usoActual: { increment: 1 } },
            });
        }

        return nuevoPedido;
    });

    return pedido;
};

export const listarPedidos = async (query, usuarioId, rol) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { estado, fechaDesde, fechaHasta } = query;

    const where = {
        ...(rol === "CLIENTE" && { clienteId: usuarioId }),
        ...(estado && { estado }),
        ...((fechaDesde || fechaHasta) && {
            creadoEn: {
                ...(fechaDesde && { gte: new Date(fechaDesde) }),
                ...(fechaHasta && { lte: new Date(fechaHasta) }),
            },
        }),
    };

    const [total, pedidos] = await Promise.all([
        prisma.pedido.count({ where }),
        prisma.pedido.findMany({
            where,
            include: {
                cliente: { select: { id: true, nombre: true, correo: true } },
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

export const obtenerPedido = async (id, usuarioId, rol) => {
    const pedido = await prisma.pedido.findUnique({
        where: { id },
        include: {
            cliente: { select: { id: true, nombre: true, correo: true } },
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
            historialEstados: { orderBy: { cambiadoEn: "desc" } },
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

    if (!pedido) {
        const err = new Error("Pedido no encontrado");
        err.statusCode = 404;
        throw err;
    }

    if (rol === "CLIENTE" && pedido.clienteId !== usuarioId) {
        const err = new Error("No tienes acceso a este pedido");
        err.statusCode = 403;
        throw err;
    }

    return pedido;
};

export const actualizarEstadoPedido = async (
    id,
    { estado, nota, cambiadoPor },
) => {
    const pedido = await prisma.pedido.findUnique({ where: { id } });

    if (!pedido) {
        const err = new Error("Pedido no encontrado");
        err.statusCode = 404;
        throw err;
    }

    const transicionesPermitidas = ESTADOS_PERMITIDOS[pedido.estado];
    if (!transicionesPermitidas.includes(estado)) {
        const err = new Error(
            `No se puede cambiar el estado de ${pedido.estado} a ${estado}. Estados válidos: ${transicionesPermitidas.join(", ") || "ninguno"}`,
        );
        err.statusCode = 400;
        throw err;
    }

    const [pedidoActualizado] = await prisma.$transaction([
        prisma.pedido.update({
            where: { id },
            data: { estado },
        }),
        prisma.historialEstadoPedido.create({
            data: { pedidoId: id, estado, nota: nota || null, cambiadoPor },
        }),
    ]);

    if (estado === "CANCELADO") {
        const items = await prisma.itemPedido.findMany({
            where: { pedidoId: id },
        });

        await prisma.$transaction(
            items.flatMap((item) => [
                prisma.varianteProducto.update({
                    where: { id: item.varianteId },
                    data: { stock: { increment: item.cantidad } },
                }),
                prisma.movimientoStock.create({
                    data: {
                        varianteId: item.varianteId,
                        tipo: "ENTRADA",
                        cantidad: item.cantidad,
                        motivo: `Cancelación pedido ${id}`,
                        usuarioId: cambiadoPor,
                    },
                }),
            ]),
        );
    }

    return pedidoActualizado;
};

export const cancelarPedido = async (id, clienteId) => {
    const pedido = await prisma.pedido.findUnique({ where: { id } });

    if (!pedido) {
        const err = new Error("Pedido no encontrado");
        err.statusCode = 404;
        throw err;
    }

    if (pedido.clienteId !== clienteId) {
        const err = new Error("No tienes acceso a este pedido");
        err.statusCode = 403;
        throw err;
    }

    if (!["PENDIENTE"].includes(pedido.estado)) {
        const err = new Error(
            "Solo puedes cancelar pedidos en estado PENDIENTE",
        );
        err.statusCode = 400;
        throw err;
    }

    return actualizarEstadoPedido(id, {
        estado: "CANCELADO",
        nota: "Cancelado por el cliente",
        cambiadoPor: clienteId,
    });
};
