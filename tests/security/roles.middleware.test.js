import express from "express";
import request from "supertest";
import { authorize } from "../../src/middlewares/roles.middleware.js";

const buildApp = (rolActual) => {
    const app = express();
    app.get(
        "/admin",
        (req, res, next) => {
            if (rolActual) req.usuario = { id: "u1", rol: rolActual };
            next();
        },
        authorize("ADMIN"),
        (req, res) => res.json({ ok: true }),
    );
    return app;
};

describe("authorize middleware", () => {
    test("responde 403 si el rol del usuario no esta permitido", async () => {
        const app = buildApp("CLIENTE");
        const res = await request(app).get("/admin");
        expect(res.status).toBe(403);
    });

    test("responde 403 si no hay usuario autenticado en la peticion", async () => {
        const app = buildApp(null);
        const res = await request(app).get("/admin");
        expect(res.status).toBe(403);
    });

    test("permite el acceso si el rol del usuario esta permitido", async () => {
        const app = buildApp("ADMIN");
        const res = await request(app).get("/admin");
        expect(res.status).toBe(200);
    });
});
