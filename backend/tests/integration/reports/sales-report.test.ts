import { reportService } from "../../../src/domains/core/reports/report.service.js";
import { seedReportData } from "../../helpers/report.helper.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import app from "../../../src/app.js";

describe("Sales Report", () => {
  let orgId: string;
  let seed: any;

  beforeEach(async () => {
    const ts = Date.now();
    const auth = await createAuthenticatedUser(app, { email: `sales_${ts}@example.com` });
    const org = await createOrganization(auth.user.id);
    orgId = org.id;
    seed = await seedReportData(orgId);
  });

  it("calculates revenue accurately across full date range", async () => {
    const start = new Date(seed.pastDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(seed.currentDate);
    end.setDate(end.getDate() + 1);

    const report = await reportService.salesReport(orgId, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // 118 + 236 = 354 total sales
    expect(report.totalSales).toBe(354);
    expect(report.invoiceCount).toBe(2);
    expect(report.averageInvoiceValue).toBe(177);
  });

  it("filters accurately by narrow date range", async () => {
    const start = new Date(seed.currentDate);
    start.setHours(0,0,0,0);
    const end = new Date(seed.currentDate);
    end.setHours(23,59,59,999);

    const report = await reportService.salesReport(orgId, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // Only current month invoice: 236
    expect(report.totalSales).toBe(236);
    expect(report.invoiceCount).toBe(1);
    expect(report.averageInvoiceValue).toBe(236);
  });

  it("returns zero data for empty dataset", async () => {
    const start = new Date();
    start.setFullYear(start.getFullYear() + 10);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const report = await reportService.salesReport(orgId, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    expect(report.totalSales).toBe(0);
    expect(report.invoiceCount).toBe(0);
  });
});
