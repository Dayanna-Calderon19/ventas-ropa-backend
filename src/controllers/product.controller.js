import * as productService from "../services/product.service.js";
import { success, created } from "../utils/response.js";

export const listarProductos = async (req, res, next) => {
    try {
        const resultado = await productService.listarProductos(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerProducto = async (req, res, next) => {
    try {
        const resultado = await productService.obtenerProducto(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const crearProducto = async (req, res, next) => {
    try {
        const resultado = await productService.crearProducto(req.body);
        return created(res, resultado, "Producto creado correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarProducto = async (req, res, next) => {
    try {
        const resultado = await productService.actualizarProducto(
            req.params.id,
            req.body,
        );
        return success(res, resultado, "Producto actualizado correctamente");
    } catch (err) {
        next(err);
    }
};

export const eliminarProducto = async (req, res, next) => {
    try {
        await productService.eliminarProducto(req.params.id);
        return success(res, null, "Producto desactivado correctamente");
    } catch (err) {
        next(err);
    }
};

export const listarCategorias = async (req, res, next) => {
    try {
        const resultado = await productService.listarCategorias();
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const resultado = await productService.crearCategoria(req.body);
        return created(res, resultado, "Categoría creada correctamente");
    } catch (err) {
        next(err);
    }
};
