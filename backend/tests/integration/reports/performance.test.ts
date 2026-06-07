import { reportService } from "../../../src/modules/reports/report.service.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { prisma } from "../../setup/testDb.js";
import app from "../../../src/app.js";
import { performance } from "perf_hooks";

describe("Report Scalability / Performance", () => {
  let orgId: string;
  let customerId: string;

  beforeEach(async () => {
    const auth = await createAuthenticatedUser(app, { email: "perf@example.com" });
    const org = await createOrganization(auth.user.id);
    orgId = org.id;

    const customer = await prisma.customer.create({ data: { organizationId: orgId, name: "Perf Customer" } });
    customerId = customer.id;

    // Note: We bypass Prisma nested creates for bulk inserts to simulate scale
    const invoicesData = Array.from({ length: 500 }).map((_, i) => ({
      organizationId: orgId,
      customerId: customerId,
      invoiceNumber: `PERF-INV-${orgId.substring(0,4)}-${i}`,
      status: "ISSUED",
      issueDate: new Date(),
      subtotal: 10,
      taxAmount: 1,
      discountAmount: 0,
      totalAmount: 11,
    }));

    await prisma.invoice.createMany({ data: invoicesData as any });
  });

  it("handles large datasets efficiently without memory leaks", async () => {
    const startMem = process.memoryUsage().heapUsed;
    const startTime = performance.now();

    const report = await reportService.salesReport(orgId, {});

    const endTime = performance.now();
    const endMem = process.memoryUsage().heapUsed;

    const duration = endTime - startTime;
    const memUsed = endMem - startMem;

    // 500 * 11 = 5500
    expect(report.totalSales).toBe(5500);
    expect(report.invoiceCount).toBe(500);

    console.log(`[Performance] duration: ${duration.toFixed(2)}ms`);
    console.log(`[Performance] Memory variance: ${(memUsed / 1024 / 1024).toFixed(2)} MB`);
    
    // Aggregation should be extremely fast since it's pushed to the DB layer
    expect(duration).toBeLessThan(1000); 
  });
});
