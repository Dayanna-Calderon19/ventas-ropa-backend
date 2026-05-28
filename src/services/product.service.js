import prisma from "../config/db.js";
import {
    getPaginationParams,
    buildPaginationMeta,
} from "../utils/pagination.js";

const productoInclude = {
    categoria: { select: { id: true, nombre: true, slug: true } },
    variantes: { where: { activo: true }, orderBy: { talla: "asc" } },
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
        activo: activo === "false" ? false : true,
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
                          activo: true,
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
            include: productoInclude,
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

    const producto = await prisma.producto.create({
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
                              precio,
                              stock: stock || 0,
                          }),
                      ),
                  }
                : undefined,
        },
        include: productoInclude,
    });

    return producto;
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
    } = data;

    let slug = producto.slug;
    if (nombre && nombre !== producto.nombre) {
        slug = nombre
            .toLowerCase()
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

export const eliminarProducto = async (id) => {
    const producto = await prisma.producto.findUnique({ where: { id } });
    if (!producto) {
        const err = new Error("Producto no encontrado");
        err.statusCode = 404;
        throw err;
    }

    await prisma.producto.update({ where: { id }, data: { activo: false } });
};

export const listarCategorias = async () => {
    return prisma.categoria.findMany({
        where: { activo: true },
        orderBy: { nombre: "asc" },
    });
};

export const crearCategoria = async ({ nombre, descripcion, imagenUrl }) => {
    const slug = nombre
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const existe = await prisma.categoria.findUnique({ where: { slug } });
    if (existe) {
        const err = new Error("Ya existe una categoría con ese nombre");
        err.statusCode = 409;
        throw err;
    }

    return prisma.categoria.create({
        data: { nombre, slug, descripcion, imagenUrl },
    });
};
