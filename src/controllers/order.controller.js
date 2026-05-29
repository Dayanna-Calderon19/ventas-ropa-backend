import * as orderService from "../services/order.service.js";
import { success, created } from "../utils/response.js";

export const crearPedido = async (req, res, next) => {
    try {
        const resultado = await orderService.crearPedido({
            ...req.body,
            clienteId: req.usuario.id,
        });
        return created(res, resultado, "Pedido creado correctamente");
    } catch (err) {
        next(err);
    }
};

export const listarPedidos = async (req, res, next) => {
    try {
        const resultado = await orderService.listarPedidos(
            req.query,
            req.usuario.id,
            req.usuario.rol,
        );
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerPedido = async (req, res, next) => {
    try {
        const resultado = await orderService.obtenerPedido(
            req.params.id,
            req.usuario.id,
            req.usuario.rol,
        );
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const actualizarEstadoPedido = async (req, res, next) => {
    try {
        const resultado = await orderService.actualizarEstadoPedido(
            req.params.id,
            {
                ...req.body,
                cambiadoPor: req.usuario.id,
            },
        );
        return success(
            res,
            resultado,
            "Estado del pedido actualizado correctamente",
        );
    } catch (err) {
        next(err);
    }
};

export const cancelarPedido = async (req, res, next) => {
    try {
        const resultado = await orderService.cancelarPedido(
            req.params.id,
            req.usuario.id,
        );
        return success(res, resultado, "Pedido cancelado correctamente");
    } catch (err) {
        next(err);
    }
};
