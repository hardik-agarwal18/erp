// @ts-nocheck
import { ExpressAdapter } from "@bull-board/express";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import basicAuth from "express-basic-auth";

import { env } from "../config/env.js";
import { mailQueue, pdfGenerationQueue, cleanupQueue, reportsQueue, auditQueue } from "./queue.service.js";

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/api/v1/admin/queues");

createBullBoard({
  queues: [
    new BullMQAdapter(mailQueue),
    new BullMQAdapter(pdfGenerationQueue),
    new BullMQAdapter(cleanupQueue),
    new BullMQAdapter(reportsQueue),
    new BullMQAdapter(auditQueue),
  ],
  serverAdapter: serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();

export const bullBoardAuth = basicAuth({
  users: { [env.SMTP_USER || "admin"]: env.JWT_ACCESS_SECRET },
  challenge: true,
});
