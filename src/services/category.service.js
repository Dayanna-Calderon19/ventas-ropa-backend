import prisma from "../config/db.js";
import { getPaginationParams, buildPaginationMeta } from "../utils/pagination.js";

export const listarCategorias = async (query) => {
    const { page, limit, skip } = getPaginationParams(query);
    const { busqueda, activo } = query;

    const where = {
        ...(activo !== undefined && { activo: activo === "true" }),
        ...(busqueda && {
            OR: [
                { nombre: { contains: busqueda, mode: "insensitive" } },
                { descripcion: { contains: busqueda, mode: "insensitive" } },
            ],
        }),
    };

    const [total, categorias] = await Promise.all([
        prisma.categoria.count({ where }),
        prisma.categoria.findMany({
            where,
            include: { _count: { select: { productos: true } } },
            skip,
            take: limit,
            orderBy: { nombre: "asc" },
        }),
    ]);

    return { data: categorias, meta: buildPaginationMeta(total, page, limit) };
};

export const obtenerCategoria = async (id) => {
    const categoria = await prisma.categoria.findUnique({
        where: { id },
        include: { _count: { select: { productos: true } } },
    });

    if (!categoria) {
        const err = new Error("Categoría no encontrada");
        err.statusCode = 404;
        throw err;
    }

    return categoria;
};

export const crearCategoria = async ({ nombre, descripcion, imagenUrl }) => {
    const slug = nombre.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    
    const existe = await prisma.categoria.findUnique({ where: { slug } });
    if (existe) {
        const err = new Error("Ya existe una categoría con ese nombre");
        err.statusCode = 409;
        throw err;
    }

    return prisma.categoria.create({
        data: { nombre, slug, descripcion, imagenUrl }
    });
};

export const actualizarCategoria = async (id, data) => {
    const categoria = await prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
        const err = new Error("Categoría no encontrada");
        err.statusCode = 404;
        throw err;
    }

    const { nombre, descripcion, imagenUrl, activo } = data;
    let slug = categoria.slug;

    if (nombre && nombre !== categoria.nombre) {
        slug = nombre.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
        const existe = await prisma.categoria.findFirst({ where: { slug, NOT: { id } } });
        if (existe) {
            const err = new Error("Ya existe una categoría con ese nombre");
            err.statusCode = 409;
            throw err;
        }
    }

    return prisma.categoria.update({
        where: { id },
        data: {
            ...(nombre && { nombre, slug }),
            ...(descripcion !== undefined && { descripcion }),
            ...(imagenUrl !== undefined && { imagenUrl }),
            ...(activo !== undefined && { activo })
        }
    });
};

export const eliminarCategoria = async (id) => {
    const tieneProductos = await prisma.producto.count({ where: { categoriaId: id } });
    if (tieneProductos > 0) {
        const err = new Error("No se puede eliminar una categoría que tiene productos asociados");
        err.statusCode = 400;
        throw err;
    }

    return prisma.categoria.delete({ where: { id } });
};
