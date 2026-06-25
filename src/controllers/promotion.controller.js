import * as promotionService from "../services/promotion.service.js";
import { success, created } from "../utils/response.js";

export const listarPromociones = async (req, res, next) => {
    try {
        const resultado = await promotionService.listarPromociones(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerPromocion = async (req, res, next) => {
    try {
        const resultado = await promotionService.obtenerPromocion(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const crearPromocion = async (req, res, next) => {
    try {
        const resultado = await promotionService.crearPromocion(req.body);
        return created(res, resultado, "Promoción creada correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarPromocion = async (req, res, next) => {
    try {
        const resultado = await promotionService.actualizarPromocion(req.params.id, req.body);
        return success(res, resultado, "Promoción actualizada correctamente");
    } catch (err) {
        next(err);
    }
};

export const eliminarPromocion = async (req, res, next) => {
    try {
        await promotionService.eliminarPromocion(req.params.id);
        return success(res, null, "Promoción eliminada correctamente");
    } catch (err) {
        next(err);
    }
};
