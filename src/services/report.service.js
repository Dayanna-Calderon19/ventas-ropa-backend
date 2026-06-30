import prisma from "../config/db.js";

const rango = (fechaDesde, fechaHasta) => ({
    creadoEn: {
        gte: fechaDesde
            ? new Date(fechaDesde)
            : new Date(new Date().setDate(1)),
        lte: fechaHasta ? new Date(fechaHasta) : new Date(),
    },
});

export const resumenGeneral = async () => {
    const ahora = new Date();
    const hoyInicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const mesInicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    const [ventasHoy, ventasMes, pedidosHoy, pedidosMes, usuariosActivos, pedidosPendientes] = await Promise.all([
        prisma.venta.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: { creadoEn: { gte: hoyInicio } },
        }),
        prisma.venta.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: { creadoEn: { gte: mesInicio } },
        }),
        prisma.pedido.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                creadoEn: { gte: hoyInicio },
                estado: { in: ["CONFIRMADO", "ENVIADO", "ENTREGADO"] },
            },
        }),
        prisma.pedido.aggregate({
            _sum: { total: true },
            _count: { id: true },
            where: {
                creadoEn: { gte: mesInicio },
                estado: { in: ["CONFIRMADO", "ENVIADO", "ENTREGADO"] },
            },
        }),
        prisma.usuario.count({
            where: { activo: true },
        }),
        prisma.pedido.count({
            where: { estado: "PENDIENTE" },
        }),
    ]);

    return {
        ventas: {
            hoy: {
                total: (ventasHoy._sum.total || 0) + (pedidosHoy._sum.total || 0),
                cantidad: (ventasHoy._count.id || 0) + (pedidosHoy._count.id || 0),
            },
            mes: {
                total: (ventasMes._sum.total || 0) + (pedidosMes._sum.total || 0),
                cantidad: (ventasMes._count.id || 0) + (pedidosMes._count.id || 0),
            },
        },
        usuarios: {
            total: usuariosActivos,
        },
        pedidos: {
            pendientes: pedidosPendientes,
        },
    };
};

export const resumenDetallado = async () => {
    const [totalProductos, totalVentas, ventas] = await Promise.all([
        prisma.producto.count({
            where: { activo: true },
        }),

        prisma.venta.count(),

        prisma.venta.aggregate({
            _sum: {
                total: true,
            },
            _avg: {
                total: true,
            },
        }),
    ]);

    return {
        totalVentas,
        ingresosTotales: ventas._sum.total || 0,
        ticketPromedio: ventas._avg.total || 0,
        totalProductos,
    };
};


export const ventasPorPeriodo = async ({
    fechaDesde,
    fechaHasta,
    agruparPor = "dia",
}) => {
    const whereRango = rango(fechaDesde, fechaHasta);

    const ventas = await prisma.venta.findMany({
        where: whereRango,
        select: {
            creadoEn: true,
            total: true,
            subtotal: true,
            descuento: true,
            impuesto: true,
        },
        orderBy: { creadoEn: "asc" },
    });

    const agrupado = ventas.reduce((acc, venta) => {
        const fecha = new Date(venta.creadoEn);
        let clave;

        if (agruparPor === "mes") {
            clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
        } else if (agruparPor === "semana") {
            const inicioSemana = new Date(fecha);
            inicioSemana.setDate(fecha.getDate() - fecha.getDay());
            clave = inicioSemana.toISOString().split("T")[0];
        } else {
            clave = fecha.toISOString().split("T")[0];
        }

        if (!acc[clave]) {
            acc[clave] = {
                periodo: clave,
                cantidad: 0,
                total: 0,
                subtotal: 0,
                descuento: 0,
                impuesto: 0,
            };
        }

        acc[clave].cantidad += 1;
        acc[clave].total += venta.total;
        acc[clave].subtotal += venta.subtotal;
        acc[clave].descuento += venta.descuento;
        acc[clave].impuesto += venta.impuesto;

        return acc;
    }, {});

    return Object.values(agrupado).map((item) => ({
        ...item,
        total: parseFloat(item.total.toFixed(2)),
        subtotal: parseFloat(item.subtotal.toFixed(2)),
        descuento: parseFloat(item.descuento.toFixed(2)),
        impuesto: parseFloat(item.impuesto.toFixed(2)),
    }));
};

export const productosMasVendidos = async ({
    fechaDesde,
    fechaHasta,
    limite = 10,
}) => {
    const whereRango = rango(fechaDesde, fechaHasta);

    const itemsVenta = await prisma.itemVenta.groupBy({
        by: ["varianteId"],
        where: { venta: whereRango },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { cantidad: "desc" } },
        take: parseInt(limite, 10),
    });

    const itemsPedido = await prisma.itemPedido.groupBy({
        by: ["varianteId"],
        where: { pedido: whereRango },
        _sum: { cantidad: true, subtotal: true },
        orderBy: { _sum: { cantidad: "desc" } },
        take: parseInt(limite, 10),
    });

    const consolidado = {};

    for (const item of [...itemsVenta, ...itemsPedido]) {
        if (!consolidado[item.varianteId]) {
            consolidado[item.varianteId] = {
                varianteId: item.varianteId,
                cantidadTotal: 0,
                ingresos: 0,
            };
        }
        consolidado[item.varianteId].cantidadTotal += item._sum.cantidad || 0;
        consolidado[item.varianteId].ingresos += item._sum.subtotal || 0;
    }

    const varianteIds = Object.keys(consolidado);
    if (varianteIds.length === 0) {
        return [];
    }
    
    const variantes = await prisma.varianteProducto.findMany({
        where: { id: { in: varianteIds } },
        include: {
            producto: { select: { id: true, nombre: true, imagenUrl: true } },
        },
    });

    return variantes
        .map((v) => ({
            id: v.producto.id,
            nombre: v.producto.nombre,
            cantidad: consolidado[v.id]?.cantidadTotal || 0,
            ingresos: consolidado[v.id]?.ingresos || 0,
        }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, parseInt(limite, 10));
};

export const ingresosMensuales = async (año) => {
    const anio = parseInt(año, 10) || new Date().getFullYear();

    const pedidosMes = await prisma.pedido.findMany({
        where: {
            estado: {
                in: ["CONFIRMADO", "ENVIADO", "ENTREGADO"],
            },
            creadoEn: {
                gte: new Date(`${anio}-01-01`),
                lte: new Date(`${anio}-12-31`),
            },
        },
        select: {
            total: true,
            creadoEn: true,
        },
    });

    const meses = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        nombre: new Date(anio, i).toLocaleString("es", { month: "long" }),
        ventasTienda: 0,
        ventasWeb: 0,
        total: 0,
    }));

    const ventas = await prisma.venta.findMany({
        where: {
            creadoEn: {
                gte: new Date(`${anio}-01-01`),
                lte: new Date(`${anio}-12-31`),
            },
        },
        select: { total: true, canal: true, creadoEn: true },
    });

    for (const venta of ventas) {
        const mes = new Date(venta.creadoEn).getMonth();
        meses[mes].ventasTienda += venta.total;
        meses[mes].total += venta.total;
    }

    for (const pedido of pedidosMes) {
        const mes = new Date(pedido.creadoEn).getMonth();
        meses[mes].ventasWeb += pedido.total;
        meses[mes].total += pedido.total;
    }

    return meses.map((m) => ({
        ...m,
        ventasTienda: parseFloat(m.ventasTienda.toFixed(2)),
        ventasWeb: parseFloat(m.ventasWeb.toFixed(2)),
        total: parseFloat(m.total.toFixed(2)),
    }));
};

export const reporteInventario = async () => {
    const [variantes, movimientosRecientes] = await Promise.all([
        prisma.varianteProducto.findMany({
            where: { activo: true },
            include: {
                producto: {
                    select: { id: true, nombre: true, categoriaId: true },
                },
            },
            orderBy: { stock: "asc" },
        }),
        prisma.movimientoStock.findMany({
            where: {
                creadoEn: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                },
            },
            include: {
                variante: {
                    include: { producto: { select: { nombre: true } } },
                },
            },
            orderBy: { creadoEn: "desc" },
            take: 50,
        }),
    ]);

    const sinStock = variantes.filter((v) => v.stock === 0);
    const stockBajo = variantes.filter((v) => v.stock > 0 && v.stock <= 5);
    const stockNormal = variantes.filter((v) => v.stock > 5);

    const valorInventario = variantes.reduce(
        (acc, v) => acc + v.precio * v.stock,
        0,
    );

    const totalUnidades = variantes.reduce((acc, v) => acc + v.stock, 0);

    return {
        stockBajo: stockBajo.length,
        stockSaludable: stockNormal.length,
        valorInventario,
        totalUnidades,
    };
};
