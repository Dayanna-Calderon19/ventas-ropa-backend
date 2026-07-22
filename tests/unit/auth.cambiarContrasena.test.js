import { jest } from "@jest/globals";

const mockPrisma = {
    usuario: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
};

const mockCompare = jest.fn();
const mockHash = jest.fn();

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

jest.unstable_mockModule("bcryptjs", () => ({
    default: { compare: mockCompare, hash: mockHash },
}));

const { cambiarContrasena } = await import("../../src/services/auth.service.js");

describe("auth.service - cambiarContrasena", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("rechaza el cambio si la contrasena actual es incorrecta", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            contrasena: "hash-guardado",
        });
        mockCompare.mockResolvedValue(false);

        await expect(
            cambiarContrasena("u1", {
                contrasenaActual: "incorrecta",
                contrasenaNueva: "NuevaClave123",
            }),
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(mockPrisma.usuario.update).not.toHaveBeenCalled();
    });

    test("actualiza la contrasena con el nuevo hash cuando la actual es correcta", async () => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "u1",
            contrasena: "hash-guardado",
        });
        mockCompare.mockResolvedValue(true);
        mockHash.mockResolvedValue("hash-nuevo");

        await cambiarContrasena("u1", {
            contrasenaActual: "ActualCorrecta1",
            contrasenaNueva: "NuevaClave123",
        });

        expect(mockHash).toHaveBeenCalledWith("NuevaClave123", 12);
        expect(mockPrisma.usuario.update).toHaveBeenCalledWith({
            where: { id: "u1" },
            data: { contrasena: "hash-nuevo" },
        });
    });
});
