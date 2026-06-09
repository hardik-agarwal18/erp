import { randomUUID } from "crypto";
import prisma from "../../config/database.js";
import { faker } from "@faker-js/faker";

export const demoRepository = {
  seedWorkspaceData: async (organizationId: string, orgName: string) => {
    const now = new Date();
    const sixMonthsAgo = faker.date.past({ years: 0.5 });

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

    // 3. Prepare Products
    const products: any[] = [];
    const inventoryItems: any[] = [];
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
        inventoryItems.push({
          id: randomUUID(),
          organizationId,
          productId: productId,
          quantity: faker.number.int({ min: 0, max: 200 }),
          reorderLevel: faker.number.int({ min: 10, max: 50 }),
        });
      }
    }

    // 4. Prepare Customers
    const customers: any[] = [];
    for (let i = 1; i <= 25; i++) {
      customers.push({
        id: randomUUID(),
        organizationId,
        name: faker.company.name(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        gstNumber: faker.finance.routingNumber(),
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

    for (let i = 1; i <= 100; i++) {
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
      });

      const totalAmount = subtotal + totalTax;
      
      const statusWeights = { "PAID": 0.6, "ISSUED": 0.2, "OVERDUE": 0.1, "DRAFT": 0.05, "PARTIALLY_PAID": 0.05 };
      let status = faker.helpers.objectKey(statusWeights) as "PAID" | "ISSUED" | "OVERDUE" | "DRAFT" | "PARTIALLY_PAID" | "CANCELLED";
      
      const dueDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);
      if (status === "ISSUED" && dueDate < now) {
        status = "OVERDUE";
      }

      const invoiceNumber = `INV-${orgName.substring(0, 3).toUpperCase()}-${faker.string.numeric(5)}`;

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
        const paymentDate = faker.date.between({ from: issueDate, to: now });
        const amountPaid = status === "PAID" ? totalAmount : totalAmount * faker.number.float({ min: 0.1, max: 0.9 });
        payments.push({
          id: randomUUID(),
          organizationId,
          invoiceId,
          amount: amountPaid,
          paymentMethod: faker.helpers.arrayElement(["BANK_TRANSFER", "CARD", "UPI", "CASH", "CHEQUE", "OTHER"]),
          paymentDate,
        });
        transactions.push({
          id: randomUUID(),
          organizationId,
          type: "INCOME" as const,
          referenceType: "INVOICE",
          referenceId: invoiceId,
          amount: amountPaid,
          description: `Payment for ${invoiceNumber}`,
          createdAt: paymentDate,
        });
      }
    }

    // 7. Prepare Expenses
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
    }

    // Execute bulk inserts transactionally
    await prisma.$transaction([
      prisma.tax.createMany({ data: taxes }),
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
