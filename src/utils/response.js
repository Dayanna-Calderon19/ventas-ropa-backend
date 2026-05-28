export const success = (res, data = null, message = "OK", statusCode = 200) => {
    return res.status(statusCode).json({
        ok: true,
        message,
        data,
    });
};

export const created = (res, data = null, message = "Recurso creado") => {
    return success(res, data, message, 201);
};

export const error = (
    res,
    message = "Error interno",
    statusCode = 500,
    errors = null,
) => {
    const body = { ok: false, message };
    if (errors) body.errors = errors;
    return res.status(statusCode).json(body);
};

export const notFound = (res, message = "Recurso no encontrado") => {
    return error(res, message, 404);
};

export const unauthorized = (res, message = "No autorizado") => {
    return error(res, message, 401);
};

export const forbidden = (res, message = "Acceso denegado") => {
    return error(res, message, 403);
};

export const badRequest = (
    res,
    message = "Solicitud inválida",
    errors = null,
) => {
    return error(res, message, 400, errors);
};
