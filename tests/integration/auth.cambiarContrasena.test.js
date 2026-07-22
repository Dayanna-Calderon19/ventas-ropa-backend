import { jest } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { generateToken } = await import("../../src/utils/jwt.js");
const { default: app } = await import("../../src/app.js");

describe("PATCH /api/v1/auth/cambiar-contrasena", () => {
    let token;

    beforeEach(async () => {
        jest.clearAllMocks();
        token = generateToken({ id: "u1", rol: "CLIENTE" });
    });

    test("actualiza la contrasena y responde 200 con la contrasena actual correcta", async () => {
        const hashActual = await bcrypt.hash("ActualCorrecta1", 12);
        mockPrisma.usuario.findUnique
            .mockResolvedValueOnce({
                id: "u1",
                nombre: "Ana",
                correo: "ana@test.com",
                rol: "CLIENTE",
                activo: true,
            })
            .mockResolvedValueOnce({
                id: "u1",
                contrasena: hashActual,
            });
        mockPrisma.usuario.update.mockResolvedValue({});

        const res = await request(app)
            .patch("/api/v1/auth/cambiar-contrasena")
            .set("Authorization", `Bearer ${token}`)
            .send({
                contrasenaActual: "ActualCorrecta1",
                contrasenaNueva: "NuevaClave123",
            });

        expect(res.status).toBe(200);
        expect(mockPrisma.usuario.update).toHaveBeenCalledTimes(1);
    });

    test("responde 400 cuando la contrasena actual enviada no coincide", async () => {
        const hashActual = await bcrypt.hash("ActualCorrecta1", 12);
        mockPrisma.usuario.findUnique
            .mockResolvedValueOnce({
                id: "u1",
                nombre: "Ana",
                correo: "ana@test.com",
                rol: "CLIENTE",
                activo: true,
            })
            .mockResolvedValueOnce({
                id: "u1",
                contrasena: hashActual,
            });

        const res = await request(app)
            .patch("/api/v1/auth/cambiar-contrasena")
            .set("Authorization", `Bearer ${token}`)
            .send({
                contrasenaActual: "otra-clave",
                contrasenaNueva: "NuevaClave123",
            });

        expect(res.status).toBe(400);
        expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
    });
});
