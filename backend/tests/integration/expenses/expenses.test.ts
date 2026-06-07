import request from "supertest";
import app from "../../../src/app.js";
import { createAuthenticatedUser } from "../../helpers/auth.helper.js";
import { createOrganization } from "../../helpers/organization.helper.js";
import { createVendor, createExpense } from "../../helpers/entity.helper.js";

const switchAndGetToken = async (auth: any, orgId: string) => {
  const res = await request(app)
    .post("/api/v1/auth/switch-workspace")
    .set("Authorization", `Bearer ${auth.accessToken}`)
    .set("Cookie", auth.cookieHeader)
    .set("x-csrf-token", auth.csrfToken!)
    .send({ organizationId: orgId });
  return res.body.data?.accessToken ?? auth.accessToken;
};

describe("Expenses — scenario tests", () => {
  describe("POST /api/v1/expenses", () => {
    it("creates an expense and returns 201", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.create@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp Create Org" });
      const token = await switchAndGetToken(auth, org.id);
      const vendor = await createVendor(org.id, { name: "Exp Vendor" });

      const res = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${token}`)
        .send({
          vendorId: vendor.id,
          amount: 250,
          category: "TRAVEL",
          expenseDate: new Date().toISOString(),
          description: "Business trip",
        });

      expect(res.status).toBe(201);
      expect(Number(res.body.data.amount)).toBe(250);
      expect(res.body.data.category).toBe("TRAVEL");
    });

    it("creates an expense without a vendor (general expense)", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.novendor@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp NoVendor Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 50, category: "SOFTWARE", expenseDate: new Date().toISOString() });

      expect(res.status).toBe(201);
      expect(res.body.data.vendorId).toBeNull();
    });

    it("returns 400 when amount is missing", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.noamt@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp NoAmt Org" });
      const token = await switchAndGetToken(auth, org.id);

      const res = await request(app)
        .post("/api/v1/expenses")
        .set("Authorization", `Bearer ${token}`)
        .send({ category: "SOFTWARE", expenseDate: new Date().toISOString() });

      expect(res.status).toBe(400);
    });

    it("returns 401 when not authenticated", async () => {
      const res = await request(app)
        .post("/api/v1/expenses")
        .send({ amount: 100, category: "OTHER", expenseDate: new Date().toISOString() });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/expenses", () => {
    it("lists expenses for the authenticated org only", async () => {
      const authA = await createAuthenticatedUser(app, { email: "exp.list.a@example.com" });
      const orgA = await createOrganization(authA.user.id, { name: "Exp List Org A" });
      const tokenA = await switchAndGetToken(authA, orgA.id);

      const authB = await createAuthenticatedUser(app, { email: "exp.list.b@example.com" });
      const orgB = await createOrganization(authB.user.id, { name: "Exp List Org B" });

      await createExpense(orgA.id, { amount: 111 });
      await createExpense(orgB.id, { amount: 999 });

      const res = await request(app)
        .get("/api/v1/expenses")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const amounts = (res.body.data.items ?? res.body.data).map((e: any) => Number(e.amount));
      expect(amounts).toContain(111);
      expect(amounts).not.toContain(999);
    });

    it("supports date range filtering", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.filter@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp Filter Org" });
      const token = await switchAndGetToken(auth, org.id);

      const today = new Date();
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      await createExpense(org.id, { amount: 50, expenseDate: today });
      await createExpense(org.id, { amount: 75, expenseDate: lastMonth });

      const startDate = new Date(today);
      startDate.setDate(startDate.getDate() - 1);

      const res = await request(app)
        .get(`/api/v1/expenses?startDate=${startDate.toISOString()}&endDate=${new Date(today.getTime() + 86400000).toISOString()}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      const amounts = (res.body.data.items ?? res.body.data).map((e: any) => Number(e.amount));
      expect(amounts).toContain(50);
      expect(amounts).not.toContain(75);
    });
  });

  describe("GET /api/v1/expenses/:id", () => {
    it("returns an expense by ID", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.get@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp Get Org" });
      const token = await switchAndGetToken(auth, org.id);
      const expense = await createExpense(org.id, { amount: 333 });

      const res = await request(app)
        .get(`/api/v1/expenses/${expense.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(expense.id);
    });
  });

  describe("PATCH /api/v1/expenses/:id", () => {
    it("updates expense amount", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.update@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp Update Org" });
      const token = await switchAndGetToken(auth, org.id);
      const expense = await createExpense(org.id, { amount: 100 });

      const res = await request(app)
        .patch(`/api/v1/expenses/${expense.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 200 });

      expect(res.status).toBe(200);
      expect(Number(res.body.data.amount)).toBe(200);
    });
  });

  describe("DELETE /api/v1/expenses/:id", () => {
    it("deletes an expense", async () => {
      const auth = await createAuthenticatedUser(app, { email: "exp.delete@example.com" });
      const org = await createOrganization(auth.user.id, { name: "Exp Delete Org" });
      const token = await switchAndGetToken(auth, org.id);
      const expense = await createExpense(org.id, { amount: 50 });

      const del = await request(app)
        .delete(`/api/v1/expenses/${expense.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(del.status).toBe(200);

      const get = await request(app)
        .get(`/api/v1/expenses/${expense.id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(get.status).toBe(404);
    });
  });
});
