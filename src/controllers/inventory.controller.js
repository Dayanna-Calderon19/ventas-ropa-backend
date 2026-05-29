import * as inventoryService from "../services/inventory.service.js";
import { success, created } from "../utils/response.js";

export const listarVariantes = async (req, res, next) => {
    try {
        const resultado = await inventoryService.listarVariantes(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerVariante = async (req, res, next) => {
    try {
        const resultado = await inventoryService.obtenerVariante(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const ajustarStock = async (req, res, next) => {
    try {
        const resultado = await inventoryService.ajustarStock(req.params.id, {
            ...req.body,
            usuarioId: req.usuario.id,
        });
        return success(res, resultado, "Stock ajustado correctamente");
    } catch (err) {
        next(err);
    }
};

export const crearVariante = async (req, res, next) => {
    try {
        const resultado = await inventoryService.crearVariante(
            req.params.productoId,
            req.body,
        );
        return created(res, resultado, "Variante creada correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarVariante = async (req, res, next) => {
    try {
        const resultado = await inventoryService.actualizarVariante(
            req.params.id,
            req.body,
        );
        return success(res, resultado, "Variante actualizada correctamente");
    } catch (err) {
        next(err);
    }
};

export const listarMovimientos = async (req, res, next) => {
    try {
        const resultado = await inventoryService.listarMovimientos(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const productosConStockBajo = async (req, res, next) => {
    try {
        const resultado = await inventoryService.productosConStockBajo();
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};
