import { reportService } from "../../../src/modules/reports/report.service.js";
import { seedReportData } from "../../helpers/report.helper.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import app from "../../../src/app.js";

describe("Inventory Report", () => {
  let orgId: string;

  beforeEach(async () => {
    const ts = Date.now();
    const auth = await createAuthenticatedUser(app, { email: `inventory_${ts}@example.com` });
    const org = await createOrganization(auth.user.id);
    orgId = org.id;
    await seedReportData(orgId);
  });

  it("calculates total inventory valuation correctly", async () => {
    const report = await reportService.inventoryReport(orgId);
    
    // We seeded 1 item with quantity 50 and sellingPrice 100
    // Valuation = 50 * 100 = 5000
    expect(report.stockValue).toBe(5000);
  });

  it("identifies low stock items", async () => {
    const report = await reportService.inventoryReport(orgId);
    
    // seeded item qty 50, reorderLevel 10 -> not low stock yet
    expect(report.lowStockItems.length).toBe(0);
  });
});
