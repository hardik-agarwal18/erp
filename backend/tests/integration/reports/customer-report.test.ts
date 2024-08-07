import { reportService } from "../../../src/modules/reports/report.service.js";
import { seedReportData } from "../../helpers/report.helper.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import app from "../../../src/app.js";

describe("Customer Report / Rankings", () => {
  let orgId: string;
  let seed: any;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser(app, { email: "customer-rep@example.com" });
    const org = await createOrganization(auth.user.id);
    orgId = org.id;
    seed = await seedReportData(orgId);
  });

  it("calculates customer rankings correctly based on total sales", async () => {
    const start = new Date(seed.pastDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(seed.currentDate);
    end.setDate(end.getDate() + 1);

    const report = await reportService.salesReport(orgId, {
      startDate: start.toISOString(),
      endDate: end.toISOString()
    });

    // Customer 2 had $236, Customer 1 had $118
    expect(report.topCustomers.length).toBe(2);
    expect(report.topCustomers[0].customer.id).toBe(seed.customer2.id);
    expect(report.topCustomers[0].totalSales).toBe(236);
    expect(report.topCustomers[1].customer.id).toBe(seed.customer1.id);
    expect(report.topCustomers[1].totalSales).toBe(118);
  });
});
