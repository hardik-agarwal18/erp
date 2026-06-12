import { reportService } from "../../../src/domains/core/reports/report.service.js";
import { seedReportData } from "../../helpers/report.helper.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import app from "../../../src/app.js";

describe("Tax Report", () => {
  let orgId: string;
  let seed: any;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser(app, { email: "tax@example.com" });
    const org = await createOrganization(auth.user.id);
    orgId = org.id;
    seed = await seedReportData(orgId);
  });

  it("calculates tax liability from invoices", async () => {
    const start = new Date(seed.pastDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(seed.currentDate);
    end.setDate(end.getDate() + 1);

    const report = await reportService.taxReport(orgId, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // Invoices tax amounts: 18 + 36 = 54
    expect(report.taxCollected).toBe(54);
    expect(report.taxPaid).toBe(0); // Assuming no tax tracking for expenses currently
    expect(report.taxLiability).toBe(54);
  });
});
