import { corsOptions } from "../../src/config/cors.js";

const invocarOrigin = (origin) =>
    new Promise((resolve) => {
        corsOptions.origin(origin, (err, allowed) => {
            resolve({ err, allowed });
        });
    });

describe("configuracion de CORS", () => {
    test("permite un origen incluido en la lista blanca", async () => {
        const { err, allowed } = await invocarOrigin("http://localhost:5173");

        expect(err).toBeNull();
        expect(allowed).toBe(true);
    });

    test("rechaza un origen que no esta en la lista blanca", async () => {
        const { err, allowed } = await invocarOrigin("http://sitio-malicioso.com");

        expect(err).toBeInstanceOf(Error);
        expect(allowed).toBeUndefined();
    });
});
