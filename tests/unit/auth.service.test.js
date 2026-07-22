import { jest } from "@jest/globals";

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
    },
};

const mockCompare = jest.fn();
const mockGenerateToken = jest.fn();

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

jest.unstable_mockModule("bcryptjs", () => ({
    default: { compare: mockCompare, hash: jest.fn() },
}));

jest.unstable_mockModule("../../src/utils/jwt.js", () => ({
    generateToken: mockGenerateToken,
    verifyToken: jest.fn(),
}));

const { login } = await import("../../src/services/auth.service.js");

describe("auth.service - login", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("credenciales validas devuelve usuario formateado y token", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            nombre: "Ana Torres",
            correo: "ana@test.com",
            contrasena: "hash-guardado",
            rol: "CLIENTE",
            activo: true,
            creadoEn: new Date(),
            telefono: null,
        });
        mockCompare.mockResolvedValue(true);
        mockGenerateToken.mockReturnValue("token-123");

        const resultado = await login({
            correo: "ana@test.com",
            contrasena: "Secret123",
        });

        expect(mockGenerateToken).toHaveBeenCalledWith({
            id: "u1",
            rol: "CLIENTE",
        });
        expect(resultado.token).toBe("token-123");
        expect(resultado.usuario.correo).toBe("ana@test.com");
        expect(resultado.usuario.contrasena).toBeUndefined();
    });

    test("usuario inexistente lanza error con statusCode 401", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue(null);

        await expect(
            login({ correo: "noexiste@test.com", contrasena: "Secret123" }),
        ).rejects.toMatchObject({ statusCode: 401 });
    });

    test("usuario desactivado lanza error con statusCode 403", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            contrasena: "hash-guardado",
            activo: false,
        });

        await expect(
            login({ correo: "ana@test.com", contrasena: "Secret123" }),
        ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("contrasena incorrecta lanza error con statusCode 401", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            contrasena: "hash-guardado",
            activo: true,
        });
        mockCompare.mockResolvedValue(false);

        await expect(
            login({ correo: "ana@test.com", contrasena: "incorrecta" }),
        ).rejects.toMatchObject({ statusCode: 401 });
    });
});
