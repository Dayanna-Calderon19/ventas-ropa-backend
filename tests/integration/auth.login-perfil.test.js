import { jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
    },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { default: app } = await import("../../src/app.js");

describe("POST /api/v1/auth/login -> GET /api/v1/auth/perfil", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("login exitoso permite acceder al perfil con el token emitido", async () => {
        const hash = await bcrypt.hash("Secret123", 12);
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: hash,
            rol: "CLIENTE",
            activo: true,
            creadoEn: new Date(),
            telefono: null,
            perfil: null,
        });

        const loginRes = await request(app).post("/api/v1/auth/login").send({
            correo: "ana@test.com",
            contrasena: "Secret123",
        });

        expect(loginRes.status).toBe(200);
        const { token } = loginRes.body.data;
        expect(token).toBeDefined();

        const perfilRes = await request(app)
            .get("/api/v1/auth/perfil")
            .set("Authorization", `Bearer ${token}`);

        expect(perfilRes.status).toBe(200);
        expect(perfilRes.body.data.correo).toBe("ana@test.com");
    });

    test("login con contrasena incorrecta responde 401", async () => {
        const hash = await bcrypt.hash("Secret123", 12);
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            contrasena: hash,
            activo: true,
        });

        const res = await request(app).post("/api/v1/auth/login").send({
            correo: "ana@test.com",
            contrasena: "otra-clave",
        });

        expect(res.status).toBe(401);
    });
});
