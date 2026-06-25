import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const productoInclude = {
    categoria: { select: { id: true, nombre: true, slug: true } },
    variantes: { orderBy: { talla: "asc" } },
    imagenes: { orderBy: { orden: "asc" } },
};

export const listarProductos = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const {
        categoriaId,
        talla,
        color,
        precioMin,
        precioMax,
        busqueda,
        destacado,
        activo,
    } = query;

    const where = {
        ...(activo !== undefined && { activo: activo === "true" }),
        ...(destacado === "true" && { destacado: true }),
        ...(categoriaId && { categoriaId }),
        ...(busqueda && {
            OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { descripcion: { contains: busqueda, mode: "insensitive" } },
            ],
        }),
        ...(talla || color || precioMin || precioMax
            ? {
                  variantes: {
                      some: {
                          ...(activo !== undefined && { activo: activo === "true" }),
                          ...(talla && {
                              talla: { equals: talla, mode: "insensitive" },
                          }),
                          ...(color && {
                              color: { contains: color, mode: "insensitive" },
                          }),
                          ...((precioMin || precioMax) && {
                              precio: {
                                  ...(precioMin && {
                                      gte: parseFloat(precioMin),
                                  }),
                                  ...(precioMax && {
                                      lte: parseFloat(precioMax),
                                  }),
                              },
                          }),
                      },
                  },
              }
            : {}),
    };

    const [total, productos] = await Promise.all([
        prisma.producto.count({ where }),
        prisma.producto.findMany({
            where,
            include: {
                ...productoInclude,
                _count: { select: { variantes: true } }
            },
            skip,
            take: limit,
            orderBy: { creadoEn: "desc" },
        }),
    ]);

    return { data: productos, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerProducto = async (id) => {
    const producto = await prisma.producto.findUnique({
        where: { id },
        include: productoInclude,
    });

    if (!producto) {
        const err = new Error("Producto no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return producto;
};

export const crearProducto = async (data) => {
    const {
        nombre,
        descripcion,
        precioBase,
        categoriaId,
        imagenUrl,
        destacado,
        variantes,
        galeria, // Array de strings (URLs)
    } = data;

    const categoriaExiste = await prisma.categoria.findUnique({
        where: { id: categoriaId },
    });
    if (!categoriaExiste) {
        const err = new Error("La categoría no existe");
        err.statusCode = 404;
        throw err;
    }

    const slug = nombre
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    const slugExiste = await prisma.producto.findUnique({ where: { slug } });
    if (slugExiste) {
        const err = new Error("Ya existe un producto con ese nombre");
        err.statusCode = 409;
        throw err;
    }

    if (variantes?.length) {
        const skus = variantes.map((v) => v.sku);
        const skusDuplicados = await prisma.varianteProducto.findMany({
            where: { sku: { in: skus } },
        });
        if (skusDuplicados.length > 0) {
            const err = new Error(
                `SKUs ya registrados: ${skusDuplicados.map((s) => s.sku).join(", ")}`,
            );
            err.statusCode = 409;
            throw err;
        }
    }

    // Preparar imágenes
    const imagenes = [];
    if (imagenUrl) {
        imagenes.push({ url: imagenUrl, esPrincipal: true, orden: 0 });
    }
    if (galeria?.length) {
        galeria.forEach((url, index) => {
            imagenes.push({ url, esPrincipal: false, orden: index + 1 });
        });
    }

    return prisma.producto.create({
        data: {
            nombre,
            slug,
            descripcion,
            precioBase,
            imagenUrl,
            destacado: destacado || false,
            categoriaId,
            variantes: variantes?.length
                ? {
                      create: variantes.map(
                          ({ sku, talla, color, precio, stock }) => ({
                              sku,
                              talla,
                              color,
                              precio: precio || precioBase,
                              stock: stock || 0,
                          }),
                      ),
                  }
                : undefined,
            imagenes: imagenes.length ? { create: imagenes } : undefined,
        },
        include: productoInclude,
    });
};

export const actualizarProducto = async (id, data) => {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
        const err = new Error("Producto no encontrado");
        err.statusCode = 404;
        throw err;
    }

    const {
        nombre,
        descripcion,
        precioBase,
        categoriaId,
        imagenUrl,
        destacado,
        activo,
        galeria,
    } = data;

    let slug = producto.slug;
    if (nombre && nombre !== producto.nombre) {
        slug = nombre
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");
        const slugExiste = await prisma.producto.findFirst({
            where: { slug, NOT: { id } },
        });
        if (slugExiste) {
            const err = new Error("Ya existe un producto con ese nombre");
            err.statusCode = 409;
            throw err;
        }
    }

    // Si se envía galería o imagen principal, refrescar imágenes
    if (imagenUrl !== undefined || galeria !== undefined) {
        await prisma.imagenProducto.deleteMany({ where: { productoId: id } });
        
        const nuevasImagenes = [];
        const principal = imagenUrl || producto.imagenUrl;
        if (principal) {
            nuevasImagenes.push({ url: principal, esPrincipal: true, orden: 0 });
        }
        
        if (galeria?.length) {
            galeria.forEach((url, index) => {
                nuevasImagenes.push({ url, esPrincipal: false, orden: index + 1 });
            });
        }

        if (nuevasImagenes.length) {
            await prisma.imagenProducto.createMany({
                data: nuevasImagenes.map(img => ({ ...img, productoId: id }))
            });
        }
    }

    return prisma.producto.update({
        where: { id },
        data: {
            ...(nombre && { nombre, slug }),
            ...(descripcion !== undefined && { descripcion }),
            ...(precioBase !== undefined && { precioBase }),
            ...(categoriaId && { categoriaId }),
            ...(imagenUrl !== undefined && { imagenUrl }),
            ...(destacado !== undefined && { destacado }),
            ...(activo !== undefined && { activo }),
        },
        include: productoInclude,
    });
};

export const toggleActivoProducto = async (id) => {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
        const err = new Error("Producto no encontrado");
        err.statusCode = 404;
        throw err;
    }

    return prisma.producto.update({
        where: { id },
        data: { activo: !producto.activo },
    });
};

export const toggleActivoVariante = async (id) => {
    const variante = await prisma.varianteProducto.findUnique({ where: { id } });
    if (!variante) {
        const err = new Error("Variante no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return prisma.varianteProducto.update({
        where: { id },
        data: { activo: !variante.activo },
    });
};

export const crearVariante = async (productoId, data) => {
    const { sku } = data;
    const existeSku = await prisma.varianteProducto.findUnique({ where: { sku } });
    if (existeSku) {
        const err = new Error("El SKU ya está registrado");
        err.statusCode = 409;
        throw err;
    }

    return prisma.varianteProducto.create({
        data: { ...data, productoId },
    });
};

export const actualizarVariante = async (id, data) => {
    return prisma.varianteProducto.update({
        where: { id },
        data,
    });
};


