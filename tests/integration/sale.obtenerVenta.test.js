import { jest } from "@jest/globals";
import request from "supertest";

const mockPrisma = {
    usuario: { findUnique: jest.fn() },
    venta: { findUnique: jest.fn() },
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { generateToken } = await import("../../src/utils/jwt.js");
const { default: app } = await import("../../src/app.js");

describe("GET /api/v1/ventas/:id", () => {
    let token;

    beforeEach(() => {
        jest.clearAllMocks();
        token = generateToken({ id: "vendedor-1", rol: "ADMIN" });
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "vendedor-1",
            nombre: "Admin Uno",
            correo: "admin@test.com",
            rol: "ADMIN",
            activo: true,
        });
    });

    test("devuelve 200 con los datos de la venta cuando existe", async () => {
        mockPrisma.venta.findUnique.mockResolvedValue({
            id: "venta-1",
            numeroComprobante: "V-20260101-00001",
            total: 118,
            items: [],
            vendedor: { id: "vendedor-1", nombre: "Admin Uno" },
            promocion: null,
        });

        const res = await request(app)
            .get("/api/v1/ventas/venta-1")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.numeroComprobante).toBe("V-20260101-00001");
    });

    test("devuelve 404 cuando la venta no existe", async () => {
        mockPrisma.venta.findUnique.mockResolvedValue(null);

        const res = await request(app)
            .get("/api/v1/ventas/venta-inexistente")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});
