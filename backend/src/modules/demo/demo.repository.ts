import { randomUUID } from "crypto";
import prisma from "../../config/database.js";

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

export const demoRepository = {
  seedWorkspaceData: async (organizationId: string, orgName: string) => {
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    // 1. Prepare Tax
    const taxId = randomUUID();
    const tax = {
      id: taxId,
      organizationId,
      name: "Standard GST",
      rate: 18.0,
      type: "GST" as const,
      isDefault: true,
    };

    // 2. Prepare Categories
    const categoryNames = ["Electronics", "Software", "Consulting", "Office Supplies"];
    const categories = categoryNames.map((name) => ({
      id: randomUUID(),
      organizationId,
      name,
      description: `${name} items`,
    }));

    // 3. Prepare Products
    const products = [];
    const inventoryItems = [];
    for (let i = 1; i <= 20; i++) {
      const category = getRandomElement(categories);
      const isService = category.name === "Consulting" || category.name === "Software";
      const basePrice = Math.floor(Math.random() * 500) + 50;
      const productId = randomUUID();

      products.push({
        id: productId,
        organizationId,
        categoryId: category.id,
        taxId: tax.id,
        name: `${category.name} Item ${i}`,
        sku: `SKU-${orgName.substring(0, 3).toUpperCase()}-${i}`,
        description: `Premium ${category.name} item`,
        unit: isService ? "HOURS" : "PCS",
        sellingPrice: basePrice,
        purchasePrice: isService ? 0 : basePrice * 0.4,
        type: isService ? ("SERVICE" as const) : ("PHYSICAL" as const),
      });

      if (!isService) {
        inventoryItems.push({
          id: randomUUID(),
          organizationId,
          productId: productId,
          quantity: Math.floor(Math.random() * 100) + 5,
          reorderLevel: 20,
        });
      }
    }

    // 4. Prepare Customers
    const customers = [];
    for (let i = 1; i <= 15; i++) {
      customers.push({
        id: randomUUID(),
        organizationId,
        name: `Client Company ${i}`,
        email: `contact${i}@client.com`,
      });
    }

    // 5. Prepare Vendors
    const vendors = [];
    for (let i = 1; i <= 8; i++) {
      vendors.push({
        id: randomUUID(),
        organizationId,
        name: `Supplier Vendor ${i}`,
        email: `billing@supplier${i}.com`,
      });
    }

    // 6. Prepare Invoices, Items, Payments, Transactions
    const invoices = [];
    const invoiceItems = [];
    const payments = [];
    const transactions = [];

    for (let i = 1; i <= 80; i++) {
      const issueDate = getRandomDate(sixMonthsAgo, now);
      const customer = getRandomElement(customers);

      const lineItemsCount = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = [];
      for (let j = 0; j < lineItemsCount; j++) {
        selectedProducts.push(getRandomElement(products));
      }

      const invoiceId = randomUUID();
      let subtotal = 0;

      selectedProducts.forEach((p) => {
        const qty = Math.floor(Math.random() * 5) + 1;
        const lineTotal = Number(p.sellingPrice) * qty;
        subtotal += lineTotal;
        invoiceItems.push({
          id: randomUUID(),
          invoiceId,
          productId: p.id,
          quantity: qty,
          unitPrice: p.sellingPrice,
          taxAmount: lineTotal * (18.0 / 100),
          discountAmount: 0,
          lineTotal: lineTotal + lineTotal * (18.0 / 100),
        });
      });

      const taxAmount = subtotal * (18.0 / 100);
      const totalAmount = subtotal + taxAmount;

      const rand = Math.random();
      let status = "PAID" as const;
      if (rand > 0.9) status = "OVERDUE" as const;
      else if (rand > 0.8) status = "ISSUED" as const;
      
      const invoiceNumber = `INV-${orgName.substring(0, 3).toUpperCase()}-${1000 + i}`;

      invoices.push({
        id: invoiceId,
        organizationId,
        customerId: customer.id,
        invoiceNumber,
        status,
        issueDate,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
      });

      if (status === "PAID") {
        const paymentDate = new Date(issueDate.getTime() + 86400000 * 2);
        payments.push({
          id: randomUUID(),
          organizationId,
          invoiceId,
          amount: totalAmount,
          paymentMethod: "BANK_TRANSFER" as const,
          paymentDate,
        });
        transactions.push({
          id: randomUUID(),
          organizationId,
          type: "INCOME" as const,
          referenceType: "INVOICE",
          referenceId: invoiceId,
          amount: totalAmount,
          description: `Payment for ${invoiceNumber}`,
          createdAt: paymentDate,
        });
      }
    }

    // 7. Prepare Expenses
    const expenses = [];
    const expenseCategories = ["SOFTWARE", "OTHER", "SALARY", "TRAVEL", "RENT", "MARKETING"];
    for (let i = 1; i <= 50; i++) {
      const expenseDate = getRandomDate(sixMonthsAgo, now);
      const vendor = getRandomElement(vendors);
      const amount = Math.floor(Math.random() * 2000) + 100;
      const category = getRandomElement(expenseCategories) as any;
      const expenseId = randomUUID();

      expenses.push({
        id: expenseId,
        organizationId,
        vendorId: vendor.id,
        category,
        amount,
        expenseDate,
        description: `${category} expense`,
      });

      transactions.push({
        id: randomUUID(),
        organizationId,
        type: "EXPENSE" as const,
        referenceType: "EXPENSE",
        referenceId: expenseId,
        amount,
        description: `${category} payment to ${vendor.name}`,
        createdAt: expenseDate,
      });
    }

    // Execute bulk inserts transactionally
    await prisma.$transaction([
      prisma.tax.createMany({ data: [tax] }),
      prisma.productCategory.createMany({ data: categories }),
      prisma.product.createMany({ data: products }),
      ...(inventoryItems.length > 0 ? [prisma.inventoryItem.createMany({ data: inventoryItems })] : []),
      prisma.customer.createMany({ data: customers }),
      prisma.vendor.createMany({ data: vendors }),
      prisma.invoice.createMany({ data: invoices }),
      prisma.invoiceItem.createMany({ data: invoiceItems }),
      ...(payments.length > 0 ? [prisma.payment.createMany({ data: payments })] : []),
      prisma.expense.createMany({ data: expenses }),
      ...(transactions.length > 0 ? [prisma.transaction.createMany({ data: transactions })] : []),
    ]);
  },
};
