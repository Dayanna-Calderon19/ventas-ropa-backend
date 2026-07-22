import { jest } from "@jest/globals";
import request from "supertest";

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
        create: jest.fn(),
    },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { default: app } = await import("../../src/app.js");

describe("POST /api/v1/auth/registrar", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("registra un usuario nuevo y responde 201 con token", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue(null);
        mockPrisma.usuario.create.mockResolvedValue({
            id: "u1",
            nombre: "Ana Torres",
            correo: "ana@test.com",
            rol: "CLIENTE",
            activo: true,
            creadoEn: new Date(),
            telefono: null,
        });

        const res = await request(app).post("/api/v1/auth/registrar").send({
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: "Secret123",
        });

        expect(res.status).toBe(201);
        expect(res.body.ok).toBe(true);
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.usuario.correo).toBe("ana@test.com");
    });

    test("rechaza un correo ya registrado con 409", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({ id: "existente" });

        const res = await request(app).post("/api/v1/auth/registrar").send({
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: "Secret123",
        });

        expect(res.status).toBe(409);
        expect(mockPrisma.usuario.create).not.toHaveBeenCalled();
    });

    test("rechaza un payload invalido con 400 antes de tocar la base de datos", async () => {
        const res = await request(app).post("/api/v1/auth/registrar").send({
            nombre: "A",
            correo: "no-es-un-correo",
            contrasena: "123",
        });

        expect(res.status).toBe(400);
        expect(mockPrisma.usuario.findUnique).not.toHaveBeenCalled();
    });
});
