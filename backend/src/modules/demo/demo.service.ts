import { randomUUID } from "crypto";
import prisma from "../../config/database.js";
import { hashPassword } from "../../lib/bcrypt.js";
import { organizationService } from "../organizations/organization.service.js";

const getRandomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomElement = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const generateDataForWorkspace = async (organizationId: string, orgName: string) => {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sixMonthsAgo.setDate(1);

  // 1. Create Tax
  const tax = await prisma.tax.create({
    data: {
      organizationId,
      name: "Standard GST",
      rate: 18.0,
      type: "GST",
      isDefault: true,
    },
  });

  // 2. Create Categories
  const categoryNames = ["Electronics", "Software", "Consulting", "Office Supplies"];
  const categories = await Promise.all(
    categoryNames.map(name => prisma.productCategory.create({
      data: { organizationId, name, description: `${name} items` }
    }))
  );

  // 3. Create Products
  const products = [];
  for (let i = 1; i <= 20; i++) {
    const category = getRandomElement(categories);
    const isService = category.name === "Consulting" || category.name === "Software";
    const basePrice = Math.floor(Math.random() * 500) + 50;

    const product = await prisma.product.create({
      data: {
        organizationId,
        categoryId: category.id,
        taxId: tax.id,
        name: `${category.name} Item ${i}`,
        sku: `SKU-${orgName.substring(0,3).toUpperCase()}-${i}`,
        description: `Premium ${category.name} item`,
        unit: isService ? "HOURS" : "PCS",
        sellingPrice: basePrice,
        purchasePrice: isService ? 0 : basePrice * 0.4,
        type: isService ? "SERVICE" : "PHYSICAL",
        ...(isService ? {} : {
          inventoryItem: {
            create: {
              organizationId,
              quantity: Math.floor(Math.random() * 100) + 5, // some might be low stock
              reorderLevel: 20,
            },
          },
        }),
      },
    });
    products.push(product);
  }

  // 4. Create Customers
  const customers = [];
  for (let i = 1; i <= 15; i++) {
    const customer = await prisma.customer.create({
      data: {
        organizationId,
        name: `Client Company ${i}`,
        email: `contact${i}@client.com`,
      },
    });
    customers.push(customer);
  }

  // 5. Create Vendors
  const vendors = [];
  for (let i = 1; i <= 8; i++) {
    const vendor = await prisma.vendor.create({
      data: {
        organizationId,
        name: `Supplier Vendor ${i}`,
        email: `billing@supplier${i}.com`,
      },
    });
    vendors.push(vendor);
  }

  // 6. Create Invoices
  for (let i = 1; i <= 80; i++) {
    const issueDate = getRandomDate(sixMonthsAgo, now);
    const customer = getRandomElement(customers);
    
    // Pick 1-3 random products
    const lineItemsCount = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    for (let j=0; j<lineItemsCount; j++) {
      selectedProducts.push(getRandomElement(products));
    }

    let subtotal = 0;
    const itemsData = selectedProducts.map(p => {
      const qty = Math.floor(Math.random() * 5) + 1;
      const lineTotal = Number(p.sellingPrice) * qty;
      subtotal += lineTotal;
      return {
        productId: p.id,
        quantity: qty,
        unitPrice: p.sellingPrice,
        taxAmount: lineTotal * (Number(tax.rate) / 100),
        discountAmount: 0,
        lineTotal: lineTotal + (lineTotal * (Number(tax.rate) / 100)),
      };
    });

    const taxAmount = subtotal * (Number(tax.rate) / 100);
    const totalAmount = subtotal + taxAmount;

    // 80% paid, 10% issued, 10% overdue
    const rand = Math.random();
    let status = "PAID";
    if (rand > 0.9) status = "OVERDUE";
    else if (rand > 0.8) status = "ISSUED";

    const invoice = await prisma.invoice.create({
      data: {
        organizationId,
        customerId: customer.id,
        invoiceNumber: `INV-${orgName.substring(0,3).toUpperCase()}-${1000 + i}`,
        status: status as any,
        issueDate,
        subtotal,
        taxAmount,
        discountAmount: 0,
        totalAmount,
        items: {
          create: itemsData,
        },
      },
    });

    if (status === "PAID") {
      await prisma.payment.create({
        data: {
          organizationId,
          invoiceId: invoice.id,
          amount: totalAmount,
          paymentMethod: "BANK_TRANSFER",
          paymentDate: new Date(issueDate.getTime() + 86400000 * 2), // paid 2 days later
        }
      });
      await prisma.transaction.create({
        data: {
          organizationId,
          type: "INCOME",
          referenceType: "INVOICE",
          referenceId: invoice.id,
          amount: totalAmount,
          description: `Payment for ${invoice.invoiceNumber}`,
          createdAt: new Date(issueDate.getTime() + 86400000 * 2),
        },
      });
    }
  }

  // 7. Create Expenses
  const expenseCategories = ["SOFTWARE", "OTHER", "SALARY", "TRAVEL", "RENT", "MARKETING"];
  for (let i = 1; i <= 50; i++) {
    const expenseDate = getRandomDate(sixMonthsAgo, now);
    const vendor = getRandomElement(vendors);
    const amount = Math.floor(Math.random() * 2000) + 100;
    const category = getRandomElement(expenseCategories) as any;

    const expense = await prisma.expense.create({
      data: {
        organizationId,
        vendorId: vendor.id,
        category,
        amount,
        expenseDate,
        description: `${category} expense`,
      },
    });

    await prisma.transaction.create({
      data: {
        organizationId,
        type: "EXPENSE",
        referenceType: "EXPENSE",
        referenceId: expense.id,
        amount,
        description: `${category} payment to ${vendor.name}`,
        createdAt: expenseDate,
      },
    });
  }
};

export const demoService = {
  seedDemoEnvironment: async () => {
    const password = "password123";
    const hashedPassword = await hashPassword(password);
    const uuid = randomUUID().split("-")[0];
    const email = `demo-${uuid}@example.com`;

    // 1. Create a demo user
    const user = await prisma.user.create({
      data: {
        name: "Demo User",
        email,
        password: hashedPassword,
        isVerified: true,
      },
    });

    // 2. Create multiple organizations (workspaces)
    const org1 = await organizationService.createOrganization(user.id, {
      name: `Acme Corp ${uuid}`,
    });
    const org2 = await organizationService.createOrganization(user.id, {
      name: `Globex Inc ${uuid}`,
    });

    // 3. Seed data for both
    await generateDataForWorkspace(org1.id, "Acme");
    await generateDataForWorkspace(org2.id, "Globex");

    return { email, password, organization: org1 };
  },
};
