import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import {
    errorHandler,
    notFoundHandler,
} from "./middlewares/errorHandler.middleware.js";
import router from "./routes/index.js";

const app = express();

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
