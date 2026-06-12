
import { tenantContextMiddleware } from "../../../middleware/tenant.middleware.js";

export const organizationContextMiddleware = tenantContextMiddleware({
  allowRouteParam: true,
});
