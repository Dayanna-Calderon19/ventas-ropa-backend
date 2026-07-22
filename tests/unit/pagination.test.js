import { getPaginationParams, buildPaginationMeta } from "../../src/utils/pagination.js";

describe("pagination utils - getPaginationParams", () => {
    test("usa page 1 y limit 20 por defecto cuando no se envian parametros", () => {
        const resultado = getPaginationParams({});

        expect(resultado).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    test("calcula el skip correcto para una pagina y limite dados", () => {
        const resultado = getPaginationParams({ page: "3", limit: "10" });

        expect(resultado).toEqual({ page: 3, limit: 10, skip: 20 });
    });

    test("limita el limit a 100 y la page a un minimo de 1 ante valores invalidos", () => {
        const resultado = getPaginationParams({ page: "-5", limit: "500" });

        expect(resultado.page).toBe(1);
        expect(resultado.limit).toBe(100);
    });
});

describe("pagination utils - buildPaginationMeta", () => {
    test("calcula totalPages y banderas hasNextPage/hasPrevPage en pagina intermedia", () => {
        const meta = buildPaginationMeta(45, 2, 20);

        expect(meta.totalPages).toBe(3);
        expect(meta.hasNextPage).toBe(true);
        expect(meta.hasPrevPage).toBe(true);
    });

    test("hasNextPage es false en la ultima pagina y hasPrevPage es false en la primera", () => {
        const ultima = buildPaginationMeta(45, 3, 20);
        const primera = buildPaginationMeta(45, 1, 20);

        expect(ultima.hasNextPage).toBe(false);
        expect(primera.hasPrevPage).toBe(false);
    });
});
