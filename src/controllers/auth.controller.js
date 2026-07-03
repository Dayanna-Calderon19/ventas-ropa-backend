import * as authService from "../services/auth.service.js";
import { success, created } from "../utils/response.js";

export const registrar = async (req, res, next) => {
    try {
        const resultado = await authService.registrar(req.body);
        return created(res, resultado, "Usuario registrado correctamente");
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const resultado = await authService.login(req.body);
        return success(res, resultado, "Sesión iniciada correctamente");
    } catch (err) {
        next(err);
    }
};

export const perfil = async (req, res, next) => {
    try {
        const resultado = await authService.perfil(req.usuario.id);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const actualizarPerfil = async (req, res, next) => {
    try {
        const resultado = await authService.actualizarPerfil(req.usuario.id, req.body);
        return success(res, resultado, "Perfil actualizado correctamente");
    } catch (err) {
        next(err);
    }
};

export const cambiarContrasena = async (req, res, next) => {
    try {
        await authService.cambiarContrasena(req.usuario.id, req.body);
        return success(res, null, "Contraseña actualizada correctamente");
    } catch (err) {
        next(err);
    }
};
