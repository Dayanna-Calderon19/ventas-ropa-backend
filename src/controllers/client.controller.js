import * as clientService from "../services/client.service.js";
import { success, created } from "../utils/response.js";

export const listarClientes = async (req, res, next) => {
    try {
        const resultado = await clientService.listarClientes(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const obtenerCliente = async (req, res, next) => {
    try {
        const resultado = await clientService.obtenerCliente(req.params.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const actualizarPerfil = async (req, res, next) => {
    try {
        const resultado = await clientService.actualizarPerfil(
            req.usuario.id,
            req.body,
        );
        return success(res, resultado, "Perfil actualizado correctamente");
    } catch (err) {
        next(err);
    }
};

export const crearUsuario = async (req, res, next) => {
    try {
        const resultado = await clientService.crearUsuario(req.body);
        return created(res, resultado, "Usuario creado correctamente");
    } catch (err) {
        next(err);
    }
};

export const toggleActivoUsuario = async (req, res, next) => {
    try {
        const resultado = await clientService.toggleActivoUsuario(
            req.params.id,
        );
        return success(res, resultado, "Estado del usuario actualizado");
    } catch (err) {
        next(err);
    }
};

export const historialPedidosCliente = async (req, res, next) => {
    try {
        const resultado = await clientService.historialPedidosCliente(
            req.usuario.id,
            req.query,
        );
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};
