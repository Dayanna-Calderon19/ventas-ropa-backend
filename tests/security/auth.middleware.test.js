import { jest } from "@jest/globals";
import express from "express";
import request from "supertest";

const mockPrisma = {
    usuario: { findUnique: jest.fn() },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { authenticate } = await import(
    "../../src/middlewares/auth.middleware.js"
);
const { generateToken } = await import("../../src/utils/jwt.js");

const buildApp = () => {
    const app = express();
    app.get("/protegido", authenticate, (req, res) => {
        res.json({ ok: true, usuario: req.usuario });
    });
    return app;
};

describe("authenticate middleware", () => {
    let app;

    beforeEach(() => {
        jest.clearAllMocks();
        app = buildApp();
    });

    test("rechaza la peticion si no hay header Authorization", async () => {
        const res = await request(app).get("/protegido");
        expect(res.status).toBe(401);
    });

    test("rechaza la peticion si el header no usa el prefijo Bearer", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", "Token abc123");

        expect(res.status).toBe(401);
    });

    test("rechaza un token con firma invalida", async () => {
        const res = await request(app)
            .get("/protegido")
            .set("Authorization", "Bearer token-falso");

        expect(res.status).toBe(401);
    });

    test("rechaza un token valido de un usuario desactivado", async () => {
        const token = generateToken({ id: "u1", rol: "CLIENTE" });
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            activo: false,
        });

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
    });

    test("permite el acceso con un token valido de un usuario activo", async () => {
        const token = generateToken({ id: "u1", rol: "CLIENTE" });
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            nombre: "Ana",
            correo: "ana@test.com",
            rol: "CLIENTE",
            activo: true,
        });

        const res = await request(app)
            .get("/protegido")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.usuario.id).toBe("u1");
    });
});
