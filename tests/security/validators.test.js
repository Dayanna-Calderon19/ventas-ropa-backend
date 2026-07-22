import express from "express";
import request from "supertest";
import {
    validarRegistro,
    validarLogin,
} from "../../src/validator/auth.validator.js";
import { validate } from "../../src/middlewares/validate.middleware.js";

const buildApp = (chain) => {
    const app = express();
    app.use(express.json());
    app.post("/test", chain, validate, (req, res) => res.json({ ok: true }));
    return app;
};

describe("validadores de seguridad", () => {
    test("rechaza un intento de inyeccion SQL en el campo correo", async () => {
        const app = buildApp(validarLogin);

        const res = await request(app).post("/test").send({
            correo: "' OR '1'='1",
            contrasena: "cualquiera",
        });

        expect(res.status).toBe(400);
    });

    test("rechaza contenido tipo script en el campo telefono", async () => {
        const app = buildApp(validarRegistro);

        const res = await request(app).post("/test").send({
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: "Secret123",
            telefono: "<script>alert(1)</script>",
        });

        expect(res.status).toBe(400);
    });

    test("rechaza una contrasena que no cumple la politica de complejidad", async () => {
        const app = buildApp(validarRegistro);

        const res = await request(app).post("/test").send({
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: "12345678",
        });

        expect(res.status).toBe(400);
    });
});
