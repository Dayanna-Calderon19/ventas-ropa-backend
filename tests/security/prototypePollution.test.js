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

describe("proteccion contra prototype pollution", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("un payload con __proto__ no contamina Object.prototype", async () => {
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

        const payload = JSON.parse(
            '{"nombre":"Ana Torres","correo":"ana@test.com","contrasena":"Secret123","__proto__":{"esAdmin":true}}',
        );

        await request(app).post("/api/v1/auth/registrar").send(payload);

        expect({}.esAdmin).toBeUndefined();
        expect(Object.prototype.esAdmin).toBeUndefined();
    });

    test("un payload con __proto__ no provoca un error 500 en el servidor", async () => {
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

        const payload = JSON.parse(
            '{"nombre":"Ana Torres","correo":"ana@test.com","contrasena":"Secret123","__proto__":{"esAdmin":true}}',
        );

        const res = await request(app).post("/api/v1/auth/registrar").send(payload);

        expect(res.status).toBeLessThan(500);
    });
});
