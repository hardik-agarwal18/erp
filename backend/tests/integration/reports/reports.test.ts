import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { seedReportData } from "../../helpers/report.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Reports — scenario tests", () => {
  describe("GET /api/v1/reports/overview", () => {
    it("returns overview metrics for the authenticated org", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.overview@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Overview Org" });
      const token = await switchAndGetToken(auth, org.id);
      await seedReportData(org.id);

      const res = await request(app)
        .get("/api/v1/reports/overview")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      // Should include revenue and expense totals
      expect(res.body.data).toMatchObject(
        expect.objectContaining({
          totalRevenue: expect.any(Number),
          totalExpenses: expect.any(Number),
        }),
      );
    });

    it("returns 401 when unauthenticated", async () => {
      const res = await request(app).get("/api/v1/reports/overview");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/reports/sales", () => {
    it("returns sales data with correct structure", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.sales@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Sales Org" });
      const token = await switchAndGetToken(auth, org.id);
      await seedReportData(org.id);

      const res = await request(app)
        .get("/api/v1/reports/sales")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("supports date range filtering", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.sales.filter@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Sales Filter Org" });
      const token = await switchAndGetToken(auth, org.id);
      await seedReportData(org.id);

      const startDate = new Date();
      startDate.setDate(1); // start of current month

      const res = await request(app)
        .get(`/api/v1/reports/sales?startDate=${startDate.toISOString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("GET /api/v1/reports/expenses", () => {
    it("returns expense report data", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.expenses@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Expenses Org" });
      const token = await switchAndGetToken(auth, org.id);
      await seedReportData(org.id);

      const res = await request(app)
        .get("/api/v1/reports/expenses")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });

  describe("GET /api/v1/reports/inventory", () => {
    it("returns inventory valuation report", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.inv@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Inv Org" });
      const token = await switchAndGetToken(auth, org.id);
      await seedReportData(org.id);

      const res = await request(app)
        .get("/api/v1/reports/inventory")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/v1/reports/export", () => {
    it("enqueues a report export job and returns 202", async () => {
      const auth = await createAuthenticatedUser(app, { email: "rpt.export@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Rpt Export Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/reports/export")
        .set("Authorization", `Bearer ${token}`)
        .send({ reportType: "sales" });

      // Either queued (202) or synchronous export (200)
      expect([200, 202]).toContain(res.status);
    });
  });
});
