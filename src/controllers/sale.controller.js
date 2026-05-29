import * as saleService from "../services/sale.service.js";
import { success, created } from "../utils/response.js";

export const registrarVenta = async (req, res, next) => {
    try {
        const resultado = await saleService.registrarVenta({
            ...req.body,
            vendedorId: req.usuario.id,
        });
        return created(res, resultado, "Venta registrada correctamente");
    } catch (err) {
        next(err);
    }
};

export const listarVentas = async (req, res, next) => {
    try {
        const resultado = await saleService.listarVentas(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerVenta = async (req, res, next) => {
    try {
        const resultado = await saleService.obtenerVenta(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};
