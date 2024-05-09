import client from "prom-client";

export const registry = new client.Registry();

registry.setDefaultLabels({
  app: "erp-backend",
});

client.collectDefaultMetrics({ register: registry });
