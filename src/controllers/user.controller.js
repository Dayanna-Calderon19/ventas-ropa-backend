import * as userService from "../services/user.service.js";
import { success, created } from "../utils/response.js";

export const listarUsuarios = async (req, res, next) => {
    try {
        const resultado = await userService.listarUsuariosAdmin(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const crearUsuario = async (req, res, next) => {
    try {
        const resultado = await userService.crearUsuario(req.body);
        return created(res, resultado, "Usuario creado correctamente");
    } catch (err) {
        next(err);
    }
};

export const actualizarUsuario = async (req, res, next) => {
    try {
        const resultado = await userService.actualizarUsuario(req.params.id, req.body);
        return success(res, resultado, "Usuario actualizado correctamente");
    } catch (err) {
        next(err);
    }
};

export const toggleActivo = async (req, res, next) => {
    try {
        const resultado = await userService.toggleActivo(req.params.id);
        return success(res, resultado, "Estado del usuario actualizado");
    } catch (err) {
        next(err);
    }
};

export const crearCliente = async (req, res, next) => {
    try {
        const resultado = await userService.crearCliente(req.body);

        return created(
            res,
            resultado,
            "Cliente creado correctamente"
        );
    } catch (err) {
        next(err);
    }
};