import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import * as z from "zod";
import * as fs from "fs";
import * as path from "path";

// Initialize Zod with OpenAPI
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

// This is a minimal schema-driven registration. In a real scenario, this would dynamically parse
// the shared-contracts or shared-validation exports to build the full API surface.
// For demonstration of Phase 4 API Governance, we mock out a representative schema.
// A more robust implementation would use a utility like `zod-express-middleware` + auto discovery.

const ProductSchema = registry.register("Product", z.object({
  id: z.string().openapi({ example: "prod_123" }),
  name: z.string().openapi({ example: "Enterprise Widget" }),
  price: z.number().openapi({ example: 499.99 }),
  organizationId: z.string().openapi({ example: "org_1" })
}));

registry.registerPath({
  method: "get",
  path: "/api/v1/products",
  description: "List products",
  summary: "Get a list of products",
  responses: {
    200: {
      description: "Array of products",
      content: {
        "application/json": {
          schema: z.array(ProductSchema)
        }
      }
    }
  }
});

const generator = new OpenApiGeneratorV3(registry.definitions);

const document = generator.generateDocument({
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "ERP API",
    description: "Enterprise ERP API with strongly-typed Zod schemas"
  },
  servers: [{ url: "http://localhost:3000" }]
});

fs.writeFileSync(
  path.join(process.cwd(), "openapi.json"),
  JSON.stringify(document, null, 2)
);

console.log("openapi.json successfully generated.");
