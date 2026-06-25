import * as categoryService from "../services/category.service.js";
import { success, created } from "../utils/response.js";

export const listarCategorias = async (req, res, next) => {
    try {
        const resultado = await categoryService.listarCategorias(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerCategoria = async (req, res, next) => {
    try {
        const resultado = await categoryService.obtenerCategoria(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const crearCategoria = async (req, res, next) => {
    try {
        const resultado = await categoryService.crearCategoria(req.body);
        return created(res, resultado, "Categoría creada correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarCategoria = async (req, res, next) => {
    try {
        const resultado = await categoryService.actualizarCategoria(req.params.id, req.body);
        return success(res, resultado, "Categoría actualizada correctamente");
    } catch (err) {
        next(err);
    }
};

export const eliminarCategoria = async (req, res, next) => {
    try {
        await categoryService.eliminarCategoria(req.params.id);
        return success(res, null, "Categoría eliminada correctamente");
    } catch (err) {
        next(err);
    }
};
