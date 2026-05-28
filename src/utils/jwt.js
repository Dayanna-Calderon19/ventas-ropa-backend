import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const generateToken = (payload) => {
    return jwt.sign(payload, env.jwt.secret, {
        expiresIn: env.jwt.expiresIn,
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, env.jwt.secret);
};
