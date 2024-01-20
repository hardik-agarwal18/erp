import { Router } from "express";
import { getLiveness, getReadiness } from "./health.controller.js";

const router = Router();

router.get("/liveness", getLiveness);
router.get("/readiness", getReadiness);

export default router;
