import { prisma } from "./tests/setup/testDb.js";
import { reportRepository } from "./src/modules/reports/report.repository.js";
import { seedReportData } from "./tests/helpers/report.helper.js";
import { createOrganization } from "./tests/helpers/organization.helper.js";
import { createAuthenticatedUser } from "./tests/helpers/auth.helper.js";
import app from "./src/app.js";

const run = async () => {
  try {
    const auth = await createAuthenticatedUser(app, { email: "sales_debug@example.com" });
    const org = await createOrganization(auth.user.id);
    const orgId = org.id;
    console.log("Created org:", orgId);

    const seed = await seedReportData(orgId);
    console.log("Seeded data. Invoices:");
    const invoices = await prisma.invoice.findMany({ where: { organizationId: orgId } });
    console.log(invoices.map(i => ({ id: i.id, date: i.issueDate, amount: i.totalAmount, status: i.status })));

    const start = new Date(seed.pastDate);
    start.setDate(start.getDate() - 1);
    const end = new Date(seed.currentDate);
    end.setDate(end.getDate() + 1);

    const agg = await reportRepository.aggregateInvoiceSales(
      orgId,
      start.toISOString(),
      end.toISOString()
    );

    console.log("Aggregation result:", agg);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
};

run();
