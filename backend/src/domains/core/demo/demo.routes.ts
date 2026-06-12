// @ts-nocheck
import { Router } from "express";
import { demoController } from "./demo.controller.js";
import asyncHandler from "../../../utils/asyncHandler.js";

const router = Router();

router.post("/seed", asyncHandler(demoController.seedDemo));

export default router;
