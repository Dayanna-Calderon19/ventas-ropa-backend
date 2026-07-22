import { jest } from "@jest/globals";

const VARIANTE_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

const mockPrisma = {
    varianteProducto: {
        findMany: jest.fn(),
        update: jest.fn(),
    },
    promocion: {
        findUnique: jest.fn(),
        update: jest.fn(),
    },
    venta: {
        create: jest.fn(),
    },
    movimientoStock: {
        create: jest.fn(),
    },
    $transaction: jest.fn(),
};

jest.unstable_mockModule("../../src/config/db.js", () => ({
    default: mockPrisma,
}));

const { registrarVenta } = await import("../../src/services/sale.service.js");

describe("sale.service - registrarVenta", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockPrisma.$transaction.mockImplementation(async (callback) =>
            callback({
                venta: { create: mockPrisma.venta.create },
                varianteProducto: { update: mockPrisma.varianteProducto.update },
                movimientoStock: { create: mockPrisma.movimientoStock.create },
                promocion: { update: mockPrisma.promocion.update },
            }),
        );
    });

    test("aplica descuento porcentual y calcula el impuesto del 18%", async () => {
        mockPrisma.varianteProducto.findMany.mockResolvedValue([
            { id: VARIANTE_ID, sku: "SKU-1", stock: 10, precio: 100, activo: true },
        ]);
        mockPrisma.promocion.findUnique.mockResolvedValue({
            id: "p1",
            activo: true,
            tipoDescuento: "PORCENTAJE",
            valorDescuento: 10,
            montoMinimo: 0,
            usoMaximo: null,
            usoActual: 0,
            inicioEn: new Date(Date.now() - 1000 * 60 * 60),
            finEn: new Date(Date.now() + 1000 * 60 * 60),
        });
        mockPrisma.venta.create.mockImplementation(({ data }) => ({
            ...data,
            id: "venta-1",
        }));

        const resultado = await registrarVenta({
            items: [{ varianteId: VARIANTE_ID, cantidad: 2 }],
            vendedorId: "user-1",
            clienteId: null,
            promocionId: "p1",
            notas: null,
        });

        expect(resultado.subtotal).toBe(200);
        expect(resultado.descuento).toBe(20);
        expect(resultado.impuesto).toBe(32.4);
        expect(resultado.total).toBe(212.4);
    });

    test("sin promocion no aplica descuento", async () => {
        mockPrisma.varianteProducto.findMany.mockResolvedValue([
            { id: VARIANTE_ID, sku: "SKU-1", stock: 10, precio: 50, activo: true },
        ]);
        mockPrisma.venta.create.mockImplementation(({ data }) => ({
            ...data,
            id: "venta-2",
        }));

        const resultado = await registrarVenta({
            items: [{ varianteId: VARIANTE_ID, cantidad: 3 }],
            vendedorId: "user-1",
            clienteId: null,
            promocionId: null,
            notas: null,
        });

        expect(resultado.subtotal).toBe(150);
        expect(resultado.descuento).toBe(0);
        expect(resultado.total).toBe(177);
    });

    test("rechaza la venta cuando el stock disponible es insuficiente", async () => {
        mockPrisma.varianteProducto.findMany.mockResolvedValue([
            { id: VARIANTE_ID, sku: "SKU-1", stock: 1, precio: 50, activo: true },
        ]);

        await expect(
            registrarVenta({
                items: [{ varianteId: VARIANTE_ID, cantidad: 5 }],
                vendedorId: "user-1",
                clienteId: null,
                promocionId: null,
                notas: null,
            }),
        ).rejects.toMatchObject({ statusCode: 400 });

        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
});
