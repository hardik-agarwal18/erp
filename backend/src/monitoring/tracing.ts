// @ts-nocheck
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import logger from "../config/logger.js";

const exporter = new OTLPTraceExporter({
  url: process.env.OTLP_ENDPOINT || "http://localhost:4318/v1/traces",
});

export const sdk = new NodeSDK({
  serviceName: "erp-backend",
  traceExporter: exporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

process.on("SIGTERM", () => {
  sdk.shutdown()
    .then(() => logger.info("Tracing terminated"))
    .catch((error) => logger.error({ error }, "Error terminating tracing"))
    .finally(() => process.exit(0));
});
