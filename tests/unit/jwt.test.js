import jwt from "jsonwebtoken";
import { env } from "../../src/config/env.js";
import { generateToken, verifyToken } from "../../src/utils/jwt.js";

describe("jwt utils", () => {
    test("genera un token valido y lo verifica correctamente", () => {
        const token = generateToken({ id: "u1", rol: "ADMIN" });
        const payload = verifyToken(token);

        expect(payload.id).toBe("u1");
        expect(payload.rol).toBe("ADMIN");
    });

    test("rechaza un token firmado con un secreto distinto", () => {
        const tokenFalso = jwt.sign({ id: "u1" }, "otro-secreto-cualquiera");

        expect(() => verifyToken(tokenFalso)).toThrow();
    });

    test("rechaza un token expirado", () => {
        const tokenExpirado = jwt.sign({ id: "u1" }, env.jwt.secret, {
            expiresIn: -10,
        });

        expect(() => verifyToken(tokenExpirado)).toThrow();
    });
});
