import * as reportService from "../services/report.service.js";
import { success } from "../utils/response.js";

export const resumenGeneral = async (req, res, next) => {
    try {
        const resultado = await reportService.resumenGeneral();
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const resumenDetallado = async (req, res, next) => {
    try {
        const resultado = await reportService.resumenDetallado();
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const ventasPorPeriodo = async (req, res, next) => {
    try {
        const resultado = await reportService.ventasPorPeriodo(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const productosMasVendidos = async (req, res, next) => {
    try {
        const resultado = await reportService.productosMasVendidos(req.query);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const ingresosMensuales = async (req, res, next) => {
    try {
        const resultado = await reportService.ingresosMensuales(req.query.anio);
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};

export const reporteInventario = async (req, res, next) => {
    try {
        const resultado = await reportService.reporteInventario();
        return success(res, resultado);
    } catch (err) {
        next(err);
    }
};
