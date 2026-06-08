import { randomUUID } from "crypto";
import prisma from "../../config/database.js";
import { hashPassword } from "../../lib/bcrypt.js";
import { organizationService } from "../organizations/organization.service.js";

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

    // 2. Create an organization through the service (sets up roles/permissions)
    const org = await organizationService.createOrganization(user.id, {
      name: `Demo Corp ${uuid.toUpperCase()}`,
    });
    
    const organizationId = org.id;

    // 3. Create Tax
    const tax = await prisma.tax.create({
      data: {
        organizationId,
        name: "Standard GST",
        rate: 18.0,
        type: "GST",
        isDefault: true,
      },
    });

    // 4. Create Category
    const category = await prisma.productCategory.create({
      data: {
        organizationId,
        name: "Electronics",
        description: "Electronic devices and accessories",
      },
    });

    // 5. Create Products & Inventory
    const products = [];
    for (let i = 1; i <= 5; i++) {
      const product = await prisma.product.create({
        data: {
          organizationId,
          categoryId: category.id,
          taxId: tax.id,
          name: `Premium Widget ${i}`,
          sku: `WIDGET-${i}`,
          description: `A very premium widget part ${i}`,
          unit: "PCS",
          sellingPrice: 99.99 * i,
          purchasePrice: 40.0 * i,
          type: "PHYSICAL",
          inventoryItem: {
            create: {
              organizationId,
              quantity: 100 * i,
              reorderLevel: 10,
            },
          },
        },
      });
      products.push(product);
    }

    // 6. Create Customers
    const customers = [];
    for (let i = 1; i <= 3; i++) {
      const customer = await prisma.customer.create({
        data: {
          organizationId,
          name: `Acme Corp ${i}`,
          email: `contact@acme${i}.com`,
        },
      });
      customers.push(customer);
    }

    // 7. Create Invoices
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      // 6 invoices spread across last 6 months
      const issueDate = new Date();
      issueDate.setMonth(now.getMonth() - i);
      
      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          customerId: customers[0].id,
          invoiceNumber: `INV-100${i}`,
          status: "PAID",
          issueDate,
          subtotal: 500,
          taxAmount: 90,
          discountAmount: 0,
          totalAmount: 590,
          items: {
            create: [
              {
                productId: products[0].id,
                quantity: 5,
                unitPrice: products[0].sellingPrice,
                taxAmount: 90,
                discountAmount: 0,
                lineTotal: 590,
              },
            ],
          },
          payments: {
            create: [
              {
                organizationId,
                amount: 590,
                paymentMethod: "BANK_TRANSFER",
                paymentDate: issueDate,
              },
            ],
          },
        },
      });

      // Income transaction
      await prisma.transaction.create({
        data: {
          organizationId,
          type: "INCOME",
          referenceType: "INVOICE",
          referenceId: invoice.id,
          amount: 590,
          description: `Payment for ${invoice.invoiceNumber}`,
          createdAt: issueDate,
        },
      });
    }

    // 8. Create Vendors & Expenses
    const vendor = await prisma.vendor.create({
      data: {
        organizationId,
        name: "Software Services Ltd",
        email: "billing@softwareltd.com",
      },
    });

    await prisma.expense.create({
      data: {
        organizationId,
        vendorId: vendor.id,
        category: "SOFTWARE",
        amount: 299.0,
        expenseDate: now,
        description: "Monthly ERP Subscription",
      },
    });

    await prisma.transaction.create({
      data: {
        organizationId,
        type: "EXPENSE",
        referenceType: "EXPENSE",
        referenceId: "N/A",
        amount: 299.0,
        description: "Monthly ERP Subscription",
        createdAt: now,
      },
    });

    return { email, password, organization: org };
  },
};
