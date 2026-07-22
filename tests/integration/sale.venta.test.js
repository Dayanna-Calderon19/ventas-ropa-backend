import { jest } from "@jest/globals";
import request from "supertest";

const VARIANTE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const mockPrisma = {
    usuario: { findUnique: jest.fn() },
    varianteProducto: { findMany: jest.fn(), update: jest.fn() },
    promocion: { findUnique: jest.fn(), update: jest.fn() },
    venta: { create: jest.fn() },
    movimientoStock: { create: jest.fn() },
    $transaction: jest.fn(),
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { generateToken } = await import("../../src/utils/jwt.js");
const { default: app } = await import("../../src/app.js");

describe("POST /api/v1/ventas", () => {
    let token;

    beforeEach(() => {
        jest.clearAllMocks();
        token = generateToken({ id: "vendedor-1", rol: "VENDEDOR" });
        mockPrisma.usuario.findUnique.mockResolvedValue({
            id: "vendedor-1",
            nombre: "Vendedor Uno",
            correo: "vendedor@test.com",
            rol: "VENDEDOR",
            activo: true,
        });
        mockPrisma.$transaction.mockImplementation(async (callback) =>
            callback({
                venta: { create: mockPrisma.venta.create },
                varianteProducto: { update: mockPrisma.varianteProducto.update },
                movimientoStock: { create: mockPrisma.movimientoStock.create },
                promocion: { update: mockPrisma.promocion.update },
            }),
        );
    });

    test("registra la venta y responde 201 con los totales calculados", async () => {
        mockPrisma.varianteProducto.findMany.mockResolvedValue([
            { id: VARIANTE_ID, sku: "SKU-1", stock: 10, precio: 100, activo: true },
        ]);
        mockPrisma.venta.create.mockImplementation(({ data }) => ({
            ...data,
            id: "venta-1",
            items: [],
            vendedor: { id: "vendedor-1", nombre: "Vendedor Uno" },
        }));

        const res = await request(app)
            .post("/api/v1/ventas")
            .set("Authorization", `Bearer ${token}`)
            .send({ items: [{ varianteId: VARIANTE_ID, cantidad: 2 }] });

        expect(res.status).toBe(201);
        expect(res.body.data.subtotal).toBe(200);
        expect(res.body.data.total).toBe(236);
    });

    test("responde 400 cuando el stock disponible es insuficiente", async () => {
        mockPrisma.varianteProducto.findMany.mockResolvedValue([
            { id: VARIANTE_ID, sku: "SKU-1", stock: 1, precio: 100, activo: true },
        ]);

        const res = await request(app)
            .post("/api/v1/ventas")
            .set("Authorization", `Bearer ${token}`)
            .send({ items: [{ varianteId: VARIANTE_ID, cantidad: 5 }] });

        expect(res.status).toBe(400);
        expect(mockPrisma.venta.create).not.toHaveBeenCalled();
    });
});
