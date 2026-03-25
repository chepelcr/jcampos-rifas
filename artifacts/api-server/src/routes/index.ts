import { Router, type IRouter } from "express";
import healthRouter from "./health";
import rafflesRouter from "./raffles";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/raffles", rafflesRouter);

export default router;
