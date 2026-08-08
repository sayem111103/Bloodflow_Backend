import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { config } from "./app/config/config.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/routeNotFound.js";
import router from "./app/routes/index.js";
export const app: Application = express();

app.use(express.json());
app.use(cors({ origin: config.origin as string, credentials: true }));
app.use(cookieParser());
app.use("/api/v1", router);
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Blood Flow Server.");
});
app.use(globalErrorHandler);
app.use(notFound);

