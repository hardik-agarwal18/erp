import { prisma } from "../setup/testDb.js";

export const seedReportData = async (orgId: string) => {
  // Clear existing for this org just in case
  await prisma.invoice.deleteMany({ where: { organizationId: orgId } });
  await prisma.expense.deleteMany({ where: { organizationId: orgId } });
  await prisma.inventoryItem.deleteMany({ where: { organizationId: orgId } });
  await prisma.product.deleteMany({ where: { organizationId: orgId } });
  await prisma.customer.deleteMany({ where: { organizationId: orgId } });

  const customer1 = await prisma.customer.create({ data: { organizationId: orgId, name: "Customer 1" } });
  const customer2 = await prisma.customer.create({ data: { organizationId: orgId, name: "Customer 2" } });
  
  const vendor = await prisma.vendor.create({ data: { organizationId: orgId, name: "Vendor 1" } });
  
  const tax = await prisma.tax.create({ data: { organizationId: orgId, name: "GST 18%", rate: 18, type: "GST" } });
  
  const product = await prisma.product.create({
    data: {
      organizationId: orgId,
      name: "Widget",
      type: "PHYSICAL",
      sellingPrice: 100,
      taxId: tax.id
    }
  });

  await prisma.inventoryItem.create({
    data: {
      organizationId: orgId,
      productId: product.id,
      quantity: 50, // Valuation: 50 * 100 = 5000
      reorderLevel: 10
    }
  });

  const currentDate = new Date();
  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - 1);

  await prisma.invoice.create({
    data: {
      organizationId: orgId,
      customerId: customer1.id,
      invoiceNumber: "INV-001-" + orgId.substring(0,4),
      status: "ISSUED",
      issueDate: pastDate,
      subtotal: 100,
      taxAmount: 18,
      discountAmount: 0,
      totalAmount: 118,
      items: {
        create: [
          { productId: product.id, quantity: 1, unitPrice: 100, taxAmount: 18, discountAmount: 0, lineTotal: 118 }
        ]
      }
    }
  });

  await prisma.invoice.create({
    data: {
      organizationId: orgId,
      customerId: customer2.id,
      invoiceNumber: "INV-002-" + orgId.substring(0,4),
      status: "ISSUED",
      issueDate: currentDate,
      subtotal: 200,
      taxAmount: 36,
      discountAmount: 0,
      totalAmount: 236,
      items: {
        create: [
          { productId: product.id, quantity: 2, unitPrice: 100, taxAmount: 36, discountAmount: 0, lineTotal: 236 }
        ]
      }
    }
  });

  await prisma.expense.create({
    data: {
      organizationId: orgId,
      vendorId: vendor.id,
      category: "SOFTWARE",
      amount: 50,
      expenseDate: currentDate,
    }
  });

  await prisma.expense.create({
    data: {
      organizationId: orgId,
      vendorId: vendor.id,
      category: "SOFTWARE",
      amount: 75,
      expenseDate: pastDate,
    }
  });
  
  return { customer1, customer2, vendor, product, tax, currentDate, pastDate };
};
