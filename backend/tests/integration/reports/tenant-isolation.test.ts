import { reportService } from "../../../src/modules/reports/report.service.js";
import { seedReportData } from "../../helpers/report.helper.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import app from "../../../src/app.js";

describe("Report Tenant Isolation", () => {
  let org1Id: string;
  let org2Id: string;
  let seed1: any;

  beforeEach(async () => {
    const ts = Date.now();
    const auth1 = await createAuthenticatedUser(app, { email: `org1_${ts}@example.com` });
    const org1 = await createOrganization(auth1.user.id);
    org1Id = org1.id;
    seed1 = await seedReportData(org1Id);

    const auth2 = await createAuthenticatedUser(app, { email: `org2_${ts}@example.com` });
    const org2 = await createOrganization(auth2.user.id);
    org2Id = org2.id;
    // Seed exactly the same data for org2
    await seedReportData(org2Id);
  });

  it("ensures reports for Org 1 do not include data from Org 2", async () => {
    const start = new Date(seed1.pastDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(seed1.currentDate);
    end.setDate(end.getDate() + 1);

    const report1 = await reportService.salesReport(org1Id, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // Only org1's sales: 354, not 708
    expect(report1.totalSales).toBe(354);
  });

  it("ensures inventory valuation is isolated", async () => {
    const report1 = await reportService.inventoryReport(org1Id);
    
    // Only org1's inventory: 5000, not 10000
    expect(report1.stockValue).toBe(5000);
  });
});
