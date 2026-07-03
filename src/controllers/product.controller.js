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
        const resultado = await productService.toggleActivoProducto(req.params.id);
        return success(
            res,
            resultado,
            `Producto ${resultado.activo ? "reactivado" : "desactivado"} correctamente`,
        );
    } catch (err) {
        next(err);
    }
};

export const toggleActivoVariante = async (req, res, next) => {
    try {
        const resultado = await productService.toggleActivoVariante(req.params.id);
        return success(
            res,
            resultado,
            `Variante ${resultado.activo ? "reactivada" : "desactivada"} correctamente`,
        );
    } catch (err) {
        next(err);
    }
};

export const crearVariante = async (req, res, next) => {
    try {
        const resultado = await productService.crearVariante(
            req.params.productoId,
            req.body,
        );
        return created(res, resultado, "Variante agregada correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarVariante = async (req, res, next) => {
    try {
        const resultado = await productService.actualizarVariante(
            req.params.id,
            req.body,
        );
        return success(res, resultado, "Variante actualizada correctamente");
    } catch (err) {
        next(err);
    }
};


