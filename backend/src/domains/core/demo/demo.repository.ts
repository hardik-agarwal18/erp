
import { randomUUID, randomBytes } from "crypto";
import prisma from "../../../config/database.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../services/audit/index.js";

export const demoRepository = {
  seedWorkspaceData: async (organizationId: string, orgName: string, ownerId: string) => {
    const { faker } = await import("@faker-js/faker");
    const now = new Date();
    const sixMonthsAgo = faker.date.past({ years: 0.5 });

    // 0. Prepare System Roles for Invitations
    const roles = await prisma.role.findMany({ where: { organizationId, isSystem: true } });
    const memberRole = roles.find(r => r.name === "member");
    const adminRole = roles.find(r => r.name === "admin");

    // 1. Prepare Taxes
    const taxes = [
      { id: randomUUID(), organizationId, name: "Standard GST", rate: 18.0, type: "GST" as const, isDefault: true },
      { id: randomUUID(), organizationId, name: "Reduced GST", rate: 5.0, type: "GST" as const, isDefault: false },
      { id: randomUUID(), organizationId, name: "Zero Rated", rate: 0.0, type: "GST" as const, isDefault: false }
    ];

    // 2. Prepare Categories
    const categories = Array.from({ length: 6 }).map(() => ({
      id: randomUUID(),
      organizationId,
      name: faker.commerce.department() + " " + faker.string.uuid().substring(0, 4),
      description: faker.commerce.productDescription(),
    }));

    // 3. Prepare Products & Inventory Items
    const products: any[] = [];
    const inventoryItems: any[] = [];
    const inventoryMovements: any[] = [];
    for (let i = 1; i <= 30; i++) {
      const category = faker.helpers.arrayElement(categories);
      const isService = faker.datatype.boolean();
      const basePrice = parseFloat(faker.commerce.price({ min: 10, max: 2000 }));
      const productId = randomUUID();
      const tax = faker.helpers.arrayElement(taxes);

      products.push({
        id: productId,
        organizationId,
        categoryId: category.id,
        taxId: tax.id,
        name: faker.commerce.productName(),
        sku: faker.commerce.isbn(10) + `-${i}`,
        description: faker.commerce.productDescription(),
        unit: isService ? "HOURS" : "PCS",
        sellingPrice: basePrice,
        purchasePrice: isService ? 0 : basePrice * 0.4,
        type: isService ? ("SERVICE" as const) : ("PHYSICAL" as const),
      });

      if (!isService) {
        // Handle Edge Cases: Out of stock (i=1), Low stock (i=2), Normal
        let qty = faker.number.int({ min: 50, max: 200 });
        const reorderLevel = faker.number.int({ min: 10, max: 50 });
        if (i === 1) qty = 0;
        if (i === 2) qty = faker.number.int({ min: 1, max: reorderLevel - 1 });

        inventoryItems.push({
          id: randomUUID(),
          organizationId,
          productId: productId,
          quantity: qty,
          reorderLevel,
        });

        // Initial inventory movement
        inventoryMovements.push({
          id: randomUUID(),
          organizationId,
          productId,
          type: "ADJUSTMENT" as const,
          quantity: qty,
          createdAt: faker.date.between({ from: sixMonthsAgo, to: now }),
        });
      }
    }

    // 4. Prepare Customers (Include some with missing info)
    const customers: any[] = [];
    for (let i = 1; i <= 25; i++) {
      customers.push({
        id: randomUUID(),
        organizationId,
        name: faker.company.name(),
        email: i % 5 !== 0 ? faker.internet.email() : null, // 1 in 5 missing email
        phone: i % 4 !== 0 ? faker.phone.number() : null, // 1 in 4 missing phone
        gstNumber: i % 3 !== 0 ? faker.finance.routingNumber() : null,
        address: faker.location.streetAddress(),
        creditLimit: faker.number.int({ min: 1000, max: 50000 }),
      });
    }

    // 5. Prepare Vendors
    const vendors: any[] = [];
    for (let i = 1; i <= 15; i++) {
      vendors.push({
        id: randomUUID(),
        organizationId,
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        gstNumber: faker.finance.routingNumber(),
        address: faker.location.streetAddress(),
      });
    }

    // 6. Prepare Invoices, Items, Payments, Transactions
    const invoices: any[] = [];
    const invoiceItems: any[] = [];
    const payments: any[] = [];
    const transactions: any[] = [];
    let invoiceCounter = 1;

    for (let i = 1; i <= 120; i++) {
      const issueDate = faker.date.between({ from: sixMonthsAgo, to: now });
      const customer = faker.helpers.arrayElement(customers);

      const lineItemsCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, lineItemsCount);

      const invoiceId = randomUUID();
      let subtotal = 0;
      let totalTax = 0;

      selectedProducts.forEach((p) => {
        const qty = faker.number.int({ min: 1, max: 10 });
        const lineTotal = Number(p.sellingPrice) * qty;
        subtotal += lineTotal;
        const pTaxRate = taxes.find(t => t.id === p.taxId)?.rate || 18.0;
        const lineTax = lineTotal * (Number(pTaxRate) / 100);
        totalTax += lineTax;
        
        invoiceItems.push({
          id: randomUUID(),
          invoiceId,
          productId: p.id,
          quantity: qty,
          unitPrice: p.sellingPrice,
          taxAmount: lineTax,
          discountAmount: 0,
          lineTotal: lineTotal + lineTax,
        });

        // Add inventory movement for sold physical products
        if (p.type === "PHYSICAL") {
          inventoryMovements.push({
            id: randomUUID(),
            organizationId,
            productId: p.id,
            type: "SALE" as const,
            quantity: -qty,
            referenceId: invoiceId,
            createdAt: issueDate,
          });
        }
      });

      const totalAmount = subtotal + totalTax;
      
      const dueDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);

      // Status weights to cover all edge cases
      const statusWeights = { "PAID": 0.5, "ISSUED": 0.2, "OVERDUE": 0.1, "DRAFT": 0.05, "PARTIALLY_PAID": 0.1, "CANCELLED": 0.05 };
      let status = faker.helpers.objectKey(statusWeights) as "PAID" | "ISSUED" | "OVERDUE" | "DRAFT" | "PARTIALLY_PAID" | "CANCELLED";
      
      if (status === "ISSUED" && dueDate < now) {
        status = "OVERDUE";
      }

      const invoiceNumber = `INV-${invoiceCounter.toString().padStart(5, '0')}`;
      invoiceCounter++;

      invoices.push({
        id: invoiceId,
        organizationId,
        customerId: customer.id,
        invoiceNumber,
        status,
        issueDate,
        dueDate,
        subtotal,
        taxAmount: totalTax,
        discountAmount: 0,
        totalAmount,
      });

      if (status === "PAID" || status === "PARTIALLY_PAID") {
        const paymentCount = status === "PAID" ? 1 : faker.number.int({ min: 2, max: 4 });
        const amountPerPayment = status === "PAID" ? totalAmount : (totalAmount * faker.number.float({ min: 0.1, max: 0.8 })) / paymentCount;
        
        for (let j = 0; j < paymentCount; j++) {
            const paymentDate = faker.date.between({ from: issueDate, to: now });
            payments.push({
            id: randomUUID(),
            organizationId,
            invoiceId,
            amount: amountPerPayment,
            paymentMethod: faker.helpers.arrayElement(["BANK_TRANSFER", "CARD", "UPI", "CASH", "CHEQUE", "OTHER"]),
            paymentDate,
            });
            transactions.push({
            id: randomUUID(),
            organizationId,
            type: "INCOME" as const,
            referenceType: "INVOICE",
            referenceId: invoiceId,
            amount: amountPerPayment,
            description: `Payment for ${invoiceNumber}`,
            createdAt: paymentDate,
            });
        }
      }
    }

    // 7. Prepare Expenses & Expense Inventory Movements
    const expenses: any[] = [];
    const expenseCategories = ["SOFTWARE", "OTHER", "SALARY", "TRAVEL", "RENT", "MARKETING"];
    for (let i = 1; i <= 60; i++) {
      const expenseDate = faker.date.between({ from: sixMonthsAgo, to: now });
      const vendor = faker.helpers.arrayElement(vendors);
      const amount = faker.number.float({ min: 50, max: 5000, fractionDigits: 2 });
      const category = faker.helpers.arrayElement(expenseCategories) as any;
      const expenseId = randomUUID();

      expenses.push({
        id: expenseId,
        organizationId,
        vendorId: vendor.id,
        category,
        amount,
        expenseDate,
        description: faker.finance.transactionDescription(),
      });

      transactions.push({
        id: randomUUID(),
        organizationId,
        type: "EXPENSE" as const,
        referenceType: "EXPENSE",
        referenceId: expenseId,
        amount,
        description: `Payment to ${vendor.name}`,
        createdAt: expenseDate,
      });

      // Occasional purchase of inventory
      if (category === "OTHER" && faker.datatype.boolean()) {
        const product = faker.helpers.arrayElement(products.filter(p => p.type === "PHYSICAL"));
        if (product) {
            inventoryMovements.push({
                id: randomUUID(),
                organizationId,
                productId: product.id,
                type: "PURCHASE" as const,
                quantity: faker.number.int({ min: 10, max: 50 }),
                referenceId: expenseId,
                createdAt: expenseDate,
            });
        }
      }
    }

    // 8. Prepare Audit Logs
    const auditLogs: any[] = [];
    const auditActions = [AUDIT_ACTIONS.ORGANIZATION_CREATED, AUDIT_ACTIONS.INVITATION_SENT, AUDIT_ACTIONS.INVOICE_CREATED, AUDIT_ACTIONS.ORGANIZATION_UPDATED];
    for (let i = 0; i < 20; i++) {
      auditLogs.push({
        id: randomUUID(),
        organizationId,
        actorUserId: ownerId,
        action: faker.helpers.arrayElement(auditActions),
        entityType: faker.helpers.arrayElement([AUDIT_ENTITY_TYPES.ORGANIZATION, AUDIT_ENTITY_TYPES.INVOICE, AUDIT_ENTITY_TYPES.ORGANIZATION_MEMBER]),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }

    // 9. Prepare Invitations
    const invitations: any[] = [];
    for (let i = 0; i < 3; i++) {
      if (memberRole) {
        const token = randomBytes(32).toString("hex");
        invitations.push({
            id: randomUUID(),
            organizationId,
            email: faker.internet.email(),
            roleId: faker.datatype.boolean() && adminRole ? adminRole.id : memberRole.id,
            token,
            expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000), // expires in 1 day
            invitedBy: ownerId,
            createdAt: faker.date.recent({ days: 2 }),
        });
      }
    }

    // 10. Prepare Invoice Sequence
    const invoiceSequence = {
        id: randomUUID(),
        organizationId,
        prefix: "INV",
        nextNumber: invoiceCounter,
    };

    // Execute bulk inserts transactionally
    await prisma.$transaction([
      prisma.tax.createMany({ data: taxes }),
      prisma.productCategory.createMany({ data: categories }),
      prisma.product.createMany({ data: products }),
      ...(inventoryItems.length > 0 ? [prisma.inventoryItem.createMany({ data: inventoryItems })] : []),
      ...(inventoryMovements.length > 0 ? [prisma.inventoryMovement.createMany({ data: inventoryMovements })] : []),
      prisma.customer.createMany({ data: customers }),
      prisma.vendor.createMany({ data: vendors }),
      prisma.invoice.createMany({ data: invoices }),
      prisma.invoiceItem.createMany({ data: invoiceItems }),
      prisma.invoiceSequence.upsert({
        where: { organizationId },
        update: { nextNumber: invoiceCounter },
        create: invoiceSequence,
      }),
      ...(payments.length > 0 ? [prisma.payment.createMany({ data: payments })] : []),
      prisma.expense.createMany({ data: expenses }),
      ...(transactions.length > 0 ? [prisma.transaction.createMany({ data: transactions })] : []),
      ...(auditLogs.length > 0 ? [prisma.auditLog.createMany({ data: auditLogs })] : []),
      ...(invitations.length > 0 ? [prisma.invitation.createMany({ data: invitations })] : []),
    ]);
  },
};
