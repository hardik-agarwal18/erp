import { randomUUID, randomBytes } from "crypto";
import prisma from "../../../config/database.js";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "../../../services/audit/index.js";

export const demoRepository = {
  seedWorkspaceData: async (organizationId: string, orgName: string, ownerId: string) => {
    const { faker } = await import("@faker-js/faker");
    const now = new Date();
    const sixMonthsAgo = faker.date.past({ years: 0.5 });

    // Arrays to collect generated data
    const taxes: any[] = [];
    const categories: any[] = [];
    const products: any[] = [];
    const inventoryItems: any[] = [];
    const inventoryMovements: any[] = [];
    const customers: any[] = [];
    const vendors: any[] = [];
    const invoices: any[] = [];
    const invoiceItems: any[] = [];
    const payments: any[] = [];
    const transactions: any[] = [];
    const expenses: any[] = [];
    const auditLogs: any[] = [];
    const invitations: any[] = [];
    const departments: any[] = [];
    const designations: any[] = [];
    const employees: any[] = [];
    const leaveTypes: any[] = [];
    const leaveBalances: any[] = [];
    const approvalTemplates: any[] = [];
    const approvalSteps: any[] = [];
    
    // New Data Collections
    const accounts: any[] = [];
    const journalEntries: any[] = [];
    const journalLines: any[] = [];
    const purchaseOrders: any[] = [];
    const purchaseOrderItems: any[] = [];
    const vendorInvoices: any[] = [];
    const vendorInvoiceItems: any[] = [];
    const grns: any[] = [];
    const grnItems: any[] = [];
    const godowns: any[] = [];
    const stockGroups: any[] = [];
    const payrollRuns: any[] = [];
    const payrollRunEmployees: any[] = [];
    const payslips: any[] = [];
    const payslipLineItems: any[] = [];
    const salaryComponents: any[] = [];
    const employeeSalaryStructures: any[] = [];
    const fiscalYears: any[] = [];
    const financialStatementSnapshots: any[] = [];
    const attendanceRecords: any[] = [];
    const leaveApplications: any[] = [];
    const holidays: any[] = [];
    const shifts: any[] = [];
    const employeeShiftAssignments: any[] = [];

    // 0. System Roles
    const roles = await prisma.role.findMany({ where: { organizationId, isSystem: true } });
    const memberRole = roles.find(r => r.name === "member");
    const adminRole = roles.find(r => r.name === "admin");

    // Fix missing HRMS permissions
    const hrPermissions = [
      "ATTENDANCE_READ", "ATTENDANCE_MANAGE", "LEAVES_READ", "LEAVES_CREATE", "LEAVES_MANAGE", 
      "PAYROLL_READ", "PAYROLL_MANAGE", "PAYROLL_RUN", "EMPLOYEES_VIEW", "EMPLOYEES_MANAGE", 
      "DESIGNATIONS_MANAGE", "DEPARTMENTS_MANAGE", "CLAIMS_READ", "CLAIMS_MANAGE", 
      "holidays.manage", "shifts.manage"
    ];
    
    for (const p of hrPermissions) {
       await prisma.permission.upsert({
         where: { name: p },
         create: { name: p, description: p },
         update: {}
       });
    }

    const hrPermRecords = await prisma.permission.findMany({ where: { name: { in: hrPermissions } } });

    if (adminRole) {
      await prisma.rolePermission.createMany({
        data: hrPermRecords.map(p => ({ roleId: adminRole.id, permissionId: p.id })),
        skipDuplicates: true
      });
    }

    // 0.1 Chart of Accounts
    // Demo originally used hardcoded codes, but the system now seeds actual accounts via accountingService.
    // We map the legacy demo codes to the actual system codes.
    const accountCodeMap: Record<string, string> = {
      "1000": "1010", // Cash
      "1010": "1030", // Bank
      "1200": "1100", // AR
      "1300": "1200", // Inventory
      "1400": "1600", // Prepaid
      "1410": "1300", // Input GST
      "1500": "1700", // Fixed Assets
      "1510": "1800", // Acc Dep
      "2000": "2010", // AP
      "2100": "2010", // CC Payable -> map to AP
      "2210": "2100", // Output GST
      "2220": "2110", // TDS
      "2230": "2120", // PF
      "2300": "2200", // Payroll Liab (Salary Payable)
      "2500": "2420", // LT Loan
      "3000": "3000", // Owner Eq
      "3100": "3100", // Retained Earn
      "3200": "3300", // Drawings
      "4000": "4010", // Sales Rev
      "4100": "4100", // Service Rev
      "4200": "4200", // Other Inc
      "5000": "5010", // COGS
      "5100": "6010", // Salary Exp
      "5110": "6010", // Payroll Tax Exp
      "5200": "6700", // Office Exp
      "5300": "6100", // Rent Exp
      "5400": "6200", // Utils Exp
      "5500": "6500", // Marketing Exp
      "5600": "6600", // Travel Exp
      "5700": "6400", // Software Sub
      "5800": "7010", // Dep Exp
      "5900": "6900", // Bank Fees
    };

    const existingAccounts = await prisma.account.findMany({ where: { organizationId } });
    accounts.push(...existingAccounts);

    const getAccount = (demoCode: string) => {
      const realCode = accountCodeMap[demoCode] || demoCode;
      const acc = accounts.find(a => a.code === realCode);
      if (!acc) throw new Error(`Demo Seeder: Account mapped to ${realCode} (from ${demoCode}) not found!`);
      return acc.id;
    };

    // 0.2 Godowns
    godowns.push({ id: randomUUID(), organizationId, name: "Main Warehouse", isDefault: true });
    const defaultGodownId = godowns[0].id;

    // 0.3 Stock Groups
    const group1Id = randomUUID();
    const group2Id = randomUUID();
    stockGroups.push(
      { id: group1Id, organizationId, name: "Electronics", description: "All electronic goods", parentId: null },
      { id: group2Id, organizationId, name: "Furniture", description: "Office furniture", parentId: null },
      { id: randomUUID(), organizationId, name: "Laptops", description: "Laptop computers", parentId: group1Id }
    );

    // 0.4 Fiscal Years
    const existingFy = await prisma.fiscalYear.findFirst({ where: { organizationId, isActive: true } });
    const currentFyId = existingFy?.id || randomUUID();
    if (!existingFy) {
      const currentYear = now.getFullYear();
      fiscalYears.push(
        { id: randomUUID(), organizationId, name: `FY ${currentYear - 1}`, startDate: new Date(`${currentYear - 1}-01-01T00:00:00.000Z`), endDate: new Date(`${currentYear - 1}-12-31T23:59:59.999Z`), isActive: false, isClosed: true },
        { id: currentFyId, organizationId, name: `FY ${currentYear}`, startDate: new Date(`${currentYear}-01-01T00:00:00.000Z`), endDate: new Date(`${currentYear}-12-31T23:59:59.999Z`), isActive: true, isClosed: false }
      );
    }

    // 0.5 Opening Capital (Issue 2 & 3)
    const openingJeId = randomUUID();
    journalEntries.push({ id: openingJeId, organizationId, entryNumber: `JE-OPENING-1`, description: `Initial Owner Capital`, isPosted: true, postedAt: sixMonthsAgo, createdAt: sixMonthsAgo });
    journalLines.push(
        { id: randomUUID(), entryId: openingJeId, accountId: getAccount("1010")!, debit: 500000, credit: 0 },
        { id: randomUUID(), entryId: openingJeId, accountId: getAccount("3000")!, debit: 0, credit: 500000 }
    );

    // 1. Taxes
    taxes.push(
      { id: randomUUID(), organizationId, name: "Standard GST", rate: 18.0, type: "GST" as const, isDefault: true },
      { id: randomUUID(), organizationId, name: "Reduced GST", rate: 5.0, type: "GST" as const, isDefault: false },
      { id: randomUUID(), organizationId, name: "Zero Rated", rate: 0.0, type: "GST" as const, isDefault: false }
    );

    // 2. Categories
    Array.from({ length: 6 }).forEach(() => {
      categories.push({
        id: randomUUID(),
        organizationId,
        name: faker.commerce.department() + " " + faker.string.uuid().substring(0, 4),
        description: faker.commerce.productDescription(),
      });
    });

    // 3. Products & Initial Inventory Movements
    // We will track current inventory count to prevent negative stock
    const stockTracker: Record<string, number> = {};

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
        // Issue 1: We start with movements to calculate quantity.
        // We do initial ADJUSTMENT. Edge Cases: Out of stock (i=1), Low stock (i=2), Normal
        let initialQty = faker.number.int({ min: 50, max: 200 });
        const reorderLevel = faker.number.int({ min: 10, max: 50 });
        if (i === 1) initialQty = 0;
        if (i === 2) initialQty = faker.number.int({ min: 1, max: reorderLevel - 1 });
        
        stockTracker[productId] = initialQty;

        inventoryItems.push({
          id: randomUUID(),
          organizationId,
          productId: productId,
          godownId: defaultGodownId,
          quantity: 0, // Will update this at the end after all movements
          reorderLevel,
        });

        if (initialQty > 0) {
          inventoryMovements.push({
            id: randomUUID(),
            organizationId,
            productId,
            godownId: defaultGodownId,
            type: "ADJUSTMENT" as const,
            quantity: initialQty,
            createdAt: faker.date.between({ from: sixMonthsAgo, to: now }),
          });

          // Initial Inventory Value JE (Issue 3)
          const adjJeId = randomUUID();
          const adjAmount = initialQty * (basePrice * 0.4);
          journalEntries.push({ id: adjJeId, organizationId, entryNumber: `JE-ADJ-${i}`, description: `Initial Inventory Adjustment`, isPosted: true, postedAt: now, createdAt: now });
          journalLines.push(
              { id: randomUUID(), entryId: adjJeId, accountId: getAccount("1300")!, debit: adjAmount, credit: 0 },
              { id: randomUUID(), entryId: adjJeId, accountId: getAccount("3000")!, debit: 0, credit: adjAmount } // Owner Equity
          );
        }
      }
    }

    // 4. Customers
    for (let i = 1; i <= 25; i++) {
      customers.push({
        id: randomUUID(),
        organizationId,
        name: faker.company.name(),
        email: i % 5 !== 0 ? faker.internet.email() : null,
        phone: i % 4 !== 0 ? faker.phone.number() : null,
        gstNumber: i % 3 !== 0 ? faker.finance.routingNumber() : null,
        address: faker.location.streetAddress(),
        creditLimit: faker.number.int({ min: 1000, max: 50000 }),
      });
    }

    // 5. Vendors
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

    // 6. Procurement (Purchase Orders, GRNs, Vendor Invoices) - Addressing Missing Demo Data
    let purEntryCounter = 1;
    for (let i = 1; i <= 15; i++) {
        const vendor = faker.helpers.arrayElement(vendors);
        const poDate = faker.date.between({ from: sixMonthsAgo, to: now });
        const poId = randomUUID();
        const lineItemsCount = faker.number.int({ min: 1, max: 4 });
        const physicalProducts = products.filter(p => p.type === "PHYSICAL");
        if (physicalProducts.length === 0) continue;
        const selectedProducts = faker.helpers.arrayElements(physicalProducts, lineItemsCount);
        
        let totalAmount = 0;
        let totalTaxAmount = 0;
        let isReceived = faker.datatype.boolean(); // Unified receiving logic for the whole PO
        const grnId = randomUUID();
        const vendorInvoiceId = randomUUID();

        selectedProducts.forEach(p => {
            const qty = faker.number.int({ min: 5, max: 50 });
            const lineTotal = Number(p.purchasePrice) * qty;
            totalAmount += lineTotal;
            purchaseOrderItems.push({
                id: randomUUID(),
                purchaseOrderId: poId,
                productId: p.id,
                quantity: qty,
                unitPrice: p.purchasePrice,
                lineTotal
            });
            // GRN & Inventory Update
            if (isReceived) { 
                grnItems.push({
                    id: randomUUID(), grnId, productId: p.id, receivedQty: qty, unitPrice: p.purchasePrice
                });
                inventoryMovements.push({
                    id: randomUUID(), organizationId, productId: p.id, godownId: defaultGodownId,
                    type: "PURCHASE" as const, quantity: qty, referenceId: grnId, referenceType: "GRN", createdAt: poDate
                });
                stockTracker[p.id] = (stockTracker[p.id] || 0) + qty;

                // Also generate a Vendor Invoice for the received PO
                const taxAmount = lineTotal * 0.18;
                totalTaxAmount += taxAmount;
                vendorInvoiceItems.push({
                    id: randomUUID(), invoiceId: vendorInvoiceId, productId: p.id,
                    quantity: qty, unitPrice: p.purchasePrice, taxAmount: taxAmount, lineTotal: lineTotal + taxAmount
                });
            }
        });

        purchaseOrders.push({
            id: poId, organizationId, vendorId: vendor.id, poNumber: `PO-${faker.string.alphanumeric(6).toUpperCase()}`,
            status: isReceived ? "COMPLETED" : "APPROVED", issueDate: poDate, totalAmount
        });

        if (isReceived) {
            grns.push({
                id: grnId, organizationId, purchaseOrderId: poId, vendorId: vendor.id,
                godownId: defaultGodownId, grnNumber: `GRN-${faker.string.alphanumeric(6).toUpperCase()}`,
                status: "RECEIVED", receivedDate: poDate
            });

            const isPaid = faker.datatype.boolean();

            vendorInvoices.push({
                id: vendorInvoiceId, organizationId, vendorId: vendor.id, purchaseOrderId: poId,
                invoiceNumber: `VI-${faker.string.alphanumeric(6).toUpperCase()}`,
                status: isPaid ? "PAID" : "POSTED",
                invoiceDate: poDate, dueDate: new Date(poDate.getTime() + 30 * 24 * 60 * 60 * 1000),
                subtotal: totalAmount, taxAmount: totalTaxAmount, discountAmount: 0, totalAmount: totalAmount + totalTaxAmount
            });

            // Journal Entry for Procurement (Issue 5: Balances Ledger)
            const jeId = randomUUID();
            journalEntries.push({ id: jeId, organizationId, entryNumber: `JE-PUR-${purEntryCounter++}`, description: `Purchase Invoice from ${vendor.name}`, isPosted: true, postedAt: poDate, createdAt: poDate });
            journalLines.push(
                { id: randomUUID(), entryId: jeId, accountId: getAccount("1300")!, debit: totalAmount, credit: 0 },
                { id: randomUUID(), entryId: jeId, accountId: getAccount("1410")!, debit: totalTaxAmount, credit: 0 }, // Input GST
                { id: randomUUID(), entryId: jeId, accountId: getAccount("2000")!, debit: 0, credit: totalAmount + totalTaxAmount }
            );

            // AP Payment (Issue 5 - Payment to AP)
            if (isPaid) { // simulate paid
                const payDate = faker.date.between({ from: poDate, to: now });
                const payJeId = randomUUID();
                journalEntries.push({ id: payJeId, organizationId, entryNumber: `JE-VENDPAY-${purEntryCounter++}`, description: `Payment to ${vendor.name}`, isPosted: true, postedAt: payDate, createdAt: payDate });
                journalLines.push(
                    { id: randomUUID(), entryId: payJeId, accountId: getAccount("2000")!, debit: totalAmount + totalTaxAmount, credit: 0 },
                    { id: randomUUID(), entryId: payJeId, accountId: getAccount("1010")!, debit: 0, credit: totalAmount + totalTaxAmount }
                );
            }
        }
    }

    // 7. Expenses
    const expenseCategories = ["SOFTWARE", "OTHER", "SALARY", "TRAVEL", "RENT", "MARKETING"];
    const expenseAccountMap: Record<string, string> = {
      RENT: "5300",
      TRAVEL: "5600",
      SOFTWARE: "5700",
      MARKETING: "5500",
      SALARY: "5100",
      OTHER: "5200",
    };
    for (let i = 1; i <= 60; i++) {
      const expenseDate = faker.date.between({ from: sixMonthsAgo, to: now });
      const vendor = faker.helpers.arrayElement(vendors);
      const amount = faker.number.float({ min: 50, max: 5000, fractionDigits: 2 });
      const category = faker.helpers.arrayElement(expenseCategories) as string;
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

      // Journal Entry for Expense (Issue 5: Balances Ledger)
      const jeId = randomUUID();
      const expAccountCode = expenseAccountMap[category] || "5200";
      journalEntries.push({ id: jeId, organizationId, entryNumber: `JE-EXP-${i}`, description: `Expense ${category}`, isPosted: true, postedAt: expenseDate, createdAt: expenseDate });
      journalLines.push(
        { id: randomUUID(), entryId: jeId, accountId: getAccount(expAccountCode)!, debit: amount, credit: 0 },
        { id: randomUUID(), entryId: jeId, accountId: getAccount("1010")!, debit: 0, credit: amount }
      );
    }

    // 8. Invoices, Items, Payments, Transactions
    let invoiceCounter = 1;
    let entryCounter = 1;
    for (let i = 1; i <= 120; i++) {
      const issueDate = faker.date.between({ from: sixMonthsAgo, to: now });
      const customer = faker.helpers.arrayElement(customers);

      const lineItemsCount = faker.number.int({ min: 1, max: 5 });
      const selectedProducts = faker.helpers.arrayElements(products, lineItemsCount);

      const invoiceId = randomUUID();
      let totalCogs = 0; // Added for COGS
      let subtotal = 0;
      let totalTax = 0;

      const tempMovements: any[] = [];
      const invoiceLineItems: any[] = [];

      selectedProducts.forEach((p) => {
        let qty = faker.number.int({ min: 1, max: 10 });
        
        // Issue 4: Prevent negative inventory
        if (p.type === "PHYSICAL") {
            const currentStock = stockTracker[p.id] || 0;
            if (currentStock < qty) qty = currentStock; // clamp quantity
            if (qty <= 0) {
                return; // skip this product for this invoice
            }
            stockTracker[p.id] -= qty;

            tempMovements.push({
              id: randomUUID(),
              organizationId,
              productId: p.id,
              godownId: defaultGodownId,
              type: "SALE" as const,
              quantity: -qty,
              referenceType: "INVOICE",
              referenceId: invoiceId,
              createdAt: issueDate,
            });
            totalCogs += Number(p.purchasePrice) * qty; // Added
        }

        const lineTotal = Number(p.sellingPrice) * qty;
        subtotal += lineTotal;
        const pTaxRate = taxes.find(t => t.id === p.taxId)?.rate || 18.0;
        const lineTax = lineTotal * (Number(pTaxRate) / 100);
        totalTax += lineTax;
        
        invoiceLineItems.push({
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

      if (invoiceLineItems.length === 0) continue; // Skipped if no items

      const totalAmount = subtotal + totalTax;
      const dueDate = new Date(issueDate.getTime() + 15 * 24 * 60 * 60 * 1000);

      // Issue 2: Fixed Invoice Status Logic with weighted Array
      let status = faker.helpers.weightedArrayElement([
        { weight: 50, value: "PAID" },
        { weight: 20, value: "ISSUED" },
        { weight: 10, value: "OVERDUE" },
        { weight: 5, value: "DRAFT" },
        { weight: 10, value: "PARTIALLY_PAID" },
        { weight: 5, value: "CANCELLED" }
      ]) as "PAID" | "ISSUED" | "OVERDUE" | "DRAFT" | "PARTIALLY_PAID" | "CANCELLED";
      
      if (status === "ISSUED" && dueDate < now) {
        status = "OVERDUE";
      }

      // Issue 3: Cancelled invoices shouldn't affect stock or have payments
      if (status !== "CANCELLED") {
          inventoryMovements.push(...tempMovements);
          invoiceItems.push(...invoiceLineItems);
      } else {
          // Revert stock tracker since we simulated selling it
          tempMovements.forEach(m => { stockTracker[m.productId] += Math.abs(m.quantity); });
          subtotal = 0; totalTax = 0; // Empty invoice amounts if we want to mimic a voided invoice
          // Alternatively, keep amounts but don't create items, or just skip item creation. 
          // For demo, we just add the items but don't record the payment/movements. Let's add the items.
          invoiceItems.push(...invoiceLineItems);
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

      // Journal Entry for Sales
      if (status !== "CANCELLED" && status !== "DRAFT") {
        const jeId = randomUUID();
        journalEntries.push({ id: jeId, organizationId, entryNumber: `JE-SALES-${entryCounter++}`, description: `Sale for ${invoiceNumber}`, isPosted: true, postedAt: issueDate, createdAt: issueDate });
        journalLines.push(
          { id: randomUUID(), entryId: jeId, accountId: getAccount("1200")!, debit: totalAmount, credit: 0 },
          { id: randomUUID(), entryId: jeId, accountId: getAccount("4000")!, debit: 0, credit: subtotal },
          { id: randomUUID(), entryId: jeId, accountId: getAccount("2210")!, debit: 0, credit: totalTax } // Output GST
        );
        
        // COGS Entry
        if (totalCogs > 0) {
            const cogsJeId = randomUUID();
            journalEntries.push({ id: cogsJeId, organizationId, entryNumber: `JE-COGS-${entryCounter++}`, description: `COGS for ${invoiceNumber}`, isPosted: true, postedAt: issueDate, createdAt: issueDate });
            journalLines.push(
                { id: randomUUID(), entryId: cogsJeId, accountId: getAccount("5000")!, debit: totalCogs, credit: 0 },
                { id: randomUUID(), entryId: cogsJeId, accountId: getAccount("1300")!, debit: 0, credit: totalCogs }
            );
        }
      }

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
            // Journal Entry for Payment
            const pjeId = randomUUID();
            const paymentAccount = faker.helpers.weightedArrayElement([
                { weight: 90, value: "1010" }, // Bank
                { weight: 10, value: "1000" }  // Cash
            ]);
            journalEntries.push({ id: pjeId, organizationId, entryNumber: `JE-PAY-${entryCounter++}`, description: `Payment Receipt for ${invoiceNumber}`, isPosted: true, postedAt: paymentDate, createdAt: paymentDate });
            journalLines.push(
              { id: randomUUID(), entryId: pjeId, accountId: getAccount(paymentAccount)!, debit: amountPerPayment, credit: 0 },
              { id: randomUUID(), entryId: pjeId, accountId: getAccount("1200")!, debit: 0, credit: amountPerPayment }
            );
        }
      }
    }

    // 9. HRMS Data
    const departmentNames = ["Sales", "Engineering", "HR", "Marketing", "Finance", "Operations"];
    departmentNames.forEach(name => {
      departments.push({ id: randomUUID(), organizationId, name, isActive: true });
    });

    const designationNames = ["Manager", "Lead", "Senior Specialist", "Specialist", "Associate"];
    designationNames.forEach((name, i) => {
      designations.push({ id: randomUUID(), organizationId, name, level: i + 1, isActive: true });
    });

    const employmentTypes = ["FULL_TIME", "PART_TIME", "CONTRACT"];
    for (let i = 1; i <= 20; i++) {
      const dept = faker.helpers.arrayElement(departments);
      const desig = faker.helpers.arrayElement(designations);
      
      const joiningDate = faker.date.between({ from: faker.date.past({ years: 2 }), to: now });
      const dob = faker.date.birthdate({ min: 22, max: 60, mode: "age" });
      const empCode = `EMP-${i.toString().padStart(3, '0')}-${faker.string.alphanumeric(4)}`;

      // Issue 7: Unique employee emails
      const safeEmail = `${faker.internet.username()}.${empCode}@example.com`;
      
      employees.push({
        id: randomUUID(),
        organizationId,
        employeeCode: empCode,
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        officialEmail: safeEmail,
        phone: faker.phone.number(),
        dateOfBirth: dob,
        gender: faker.helpers.arrayElement(["MALE", "FEMALE", "OTHER"]),
        joiningDate,
        departmentId: dept.id,
        designationId: desig.id,
        employmentType: faker.helpers.arrayElement(employmentTypes),
        status: faker.helpers.weightedArrayElement([
          { weight: 80, value: "ACTIVE" },
          { weight: 10, value: "PROBATION" },
          { weight: 5, value: "INACTIVE" },
          { weight: 5, value: "TERMINATED" }
        ]),
        isActive: true,
      });
    }

    // 10. Audit Logs
    const auditActions = [AUDIT_ACTIONS.ORGANIZATION_CREATED, AUDIT_ACTIONS.INVITATION_SENT, AUDIT_ACTIONS.INVOICE_CREATED, AUDIT_ACTIONS.ORGANIZATION_UPDATED];
    // Issue 6: Realistic Actor IDs
    const possibleActors = [ownerId]; // Must use actual User IDs, we only have ownerId here
    for (let i = 0; i < 20; i++) {
      auditLogs.push({
        id: randomUUID(),
        organizationId,
        actorUserId: faker.helpers.arrayElement(possibleActors),
        action: faker.helpers.arrayElement(auditActions),
        entityType: faker.helpers.arrayElement([AUDIT_ENTITY_TYPES.ORGANIZATION, AUDIT_ENTITY_TYPES.INVOICE, AUDIT_ENTITY_TYPES.ORGANIZATION_MEMBER]),
        createdAt: faker.date.recent({ days: 30 }),
      });
    }

    // 11. Invitations
    // Issue 8: Invitation states (accepted, expired, pending)
    for (let i = 0; i < 5; i++) {
      if (memberRole) {
        const token = randomBytes(32).toString("hex");
        const state = faker.helpers.arrayElement(["PENDING", "ACCEPTED", "EXPIRED"]);
        const createdAt = faker.date.recent({ days: 10 });
        let expiresAt = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
        let acceptedAt = null;

        if (state === "EXPIRED") {
            expiresAt = faker.date.recent({ days: 2 }); // Already expired
        } else if (state === "ACCEPTED") {
            acceptedAt = faker.date.between({ from: createdAt, to: expiresAt });
        } else {
            expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Pending, valid
        }

        invitations.push({
            id: randomUUID(),
            organizationId,
            email: faker.internet.email(),
            roleId: faker.datatype.boolean() && adminRole ? adminRole.id : memberRole.id,
            token,
            expiresAt,
            acceptedAt,
            invitedBy: ownerId,
            createdAt,
        });
      }
    }

    // 12. Leave Types and Balances
    leaveTypes.push(
      { id: randomUUID(), organizationId, name: "Annual Leave", description: "Paid time off", maxDays: 12, isPaid: true },
      { id: randomUUID(), organizationId, name: "Sick Leave", description: "Medical leave", maxDays: 8, isPaid: true },
      { id: randomUUID(), organizationId, name: "Casual Leave", description: "Personal matters", maxDays: 6, isPaid: true }
    );

    employees.forEach(emp => {
      leaveTypes.forEach(lt => {
        // Issue 9: Leave balances edge cases
        let allocated = lt.maxDays;
        let used = 0;
        
        if (emp.status === "PROBATION") {
           allocated = 0; // Probation employees have no allocated leaves
        } else {
            used = faker.helpers.weightedArrayElement([
                { weight: 50, value: faker.number.int({ min: 0, max: 3 }) }, // Healthy balance
                { weight: 20, value: allocated }, // Exhausted leaves
                { weight: 10, value: allocated + faker.number.int({ min: 1, max: 3 }) } // Negative balance
            ]);
        }

        leaveBalances.push({
          id: randomUUID(),
          organizationId,
          employeeId: emp.id,
          leaveTypeId: lt.id,
          allocated,
          used,
          remaining: allocated - used,
        });
      });
    });

    // 13. Payroll Missing Demo Data
    salaryComponents.push(
        { id: randomUUID(), organizationId, name: "Basic Pay", calculationType: "FLAT_AMOUNT", isEarning: true },
        { id: randomUUID(), organizationId, name: "HRA", calculationType: "PERCENTAGE_OF_BASIC", percentage: 50, isEarning: true },
        { id: randomUUID(), organizationId, name: "PF", calculationType: "PERCENTAGE_OF_BASIC", percentage: 12, isEarning: false }
    );

    employees.forEach(emp => {
        const basicAmt = faker.number.int({ min: 20000, max: 80000 });
        employeeSalaryStructures.push({
            id: randomUUID(), organizationId, employeeId: emp.id, componentId: salaryComponents[0].id, amount: basicAmt, effectiveDate: emp.joiningDate
        });
    });

    const prId = randomUUID();
    payrollRuns.push({ id: prId, organizationId, month: now.getMonth() + 1, year: now.getFullYear(), status: "COMPLETED", totalGrossPay: 0, totalDeductions: 0, totalNetPay: 0 });

    employees.forEach(emp => {
        const gross = faker.number.int({ min: 30000, max: 120000 });
        const deduction = gross * 0.1;
        const net = gross - deduction;
        
        payrollRunEmployees.push({
            id: randomUUID(), payrollRunId: prId, employeeId: emp.id, workingDays: 22, presentDays: 20, leaveDays: 2
        });
        const payslipId = randomUUID();
        payslips.push({
            id: payslipId, organizationId, payrollRunId: prId, employeeId: emp.id, status: "PAID", grossPay: gross, totalDeductions: deduction, netPay: net
        });
        payslipLineItems.push(
            { id: randomUUID(), payslipId, componentName: "Basic Pay", amount: gross * 0.5, isEarning: true },
            { id: randomUUID(), payslipId, componentName: "HRA", amount: gross * 0.5, isEarning: true },
            { id: randomUUID(), payslipId, componentName: "PF Deductions", amount: deduction, isEarning: false }
        );
        payrollRuns[0].totalGrossPay += gross;
        payrollRuns[0].totalDeductions += deduction;
        payrollRuns[0].totalNetPay += net;
    });

    // Journal Entry for Payroll (Issue 6)
    if (payrollRuns[0].totalGrossPay > 0) {
        const pfAmount = Number(payrollRuns[0].totalDeductions) * 0.6;
        const tdsAmount = Number(payrollRuns[0].totalDeductions) - pfAmount;
        
        const payJeId = randomUUID();
        journalEntries.push({ id: payJeId, organizationId, entryNumber: `JE-PAYROLL-${prId.substring(0,6)}`, description: `Payroll Run ${payrollRuns[0].month}/${payrollRuns[0].year}`, isPosted: true, postedAt: now, createdAt: now });
        journalLines.push(
            { id: randomUUID(), entryId: payJeId, accountId: getAccount("5100")!, debit: payrollRuns[0].totalGrossPay, credit: 0 },
            { id: randomUUID(), entryId: payJeId, accountId: getAccount("2300")!, debit: 0, credit: payrollRuns[0].totalNetPay },
            { id: randomUUID(), entryId: payJeId, accountId: getAccount("2230")!, debit: 0, credit: pfAmount }, // PF Payable
            { id: randomUUID(), entryId: payJeId, accountId: getAccount("2220")!, debit: 0, credit: tdsAmount } // TDS Payable
        );

        // Payroll Payment
        const payBankJeId = randomUUID();
        journalEntries.push({ id: payBankJeId, organizationId, entryNumber: `JE-PAYROLL-PAY-${prId.substring(0,6)}`, description: `Payroll Payment ${payrollRuns[0].month}/${payrollRuns[0].year}`, isPosted: true, postedAt: now, createdAt: now });
        journalLines.push(
            { id: randomUUID(), entryId: payBankJeId, accountId: getAccount("2300")!, debit: payrollRuns[0].totalNetPay, credit: 0 },
            { id: randomUUID(), entryId: payBankJeId, accountId: getAccount("1010")!, debit: 0, credit: payrollRuns[0].totalNetPay }
        );

        // Remit Statutory Deductions
        if (faker.datatype.boolean()) { // simulate remittance
            const remitJeId = randomUUID();
            journalEntries.push({ id: remitJeId, organizationId, entryNumber: `JE-REMIT-${prId.substring(0,6)}`, description: `Statutory Remittance ${payrollRuns[0].month}/${payrollRuns[0].year}`, isPosted: true, postedAt: now, createdAt: now });
            journalLines.push(
                { id: randomUUID(), entryId: remitJeId, accountId: getAccount("2230")!, debit: pfAmount, credit: 0 }, // PF
                { id: randomUUID(), entryId: remitJeId, accountId: getAccount("2220")!, debit: tdsAmount, credit: 0 }, // TDS
                { id: randomUUID(), entryId: remitJeId, accountId: getAccount("1010")!, debit: 0, credit: pfAmount + tdsAmount } // Bank
            );
        }
    }

    // 14. Approval Templates
    const entityTypes = ["LEAVE_APPLICATION", "PAYROLL_RUN", "EXPENSE_CLAIM"];
    entityTypes.forEach(entityType => {
      const templateId = randomUUID();
      approvalTemplates.push({
        id: templateId,
        organizationId,
        entityType,
        name: `Default ${entityType.replace("_", " ")} Approval`,
        isActive: true,
      });

      const roleForApproval = entityType === "PAYROLL_RUN" ? adminRole?.id : memberRole?.id;
      if (roleForApproval) {
        approvalSteps.push({
          id: randomUUID(),
          templateId,
          order: 1,
          approverType: "ROLE",
          roleId: roleForApproval,
        });
      }
    });

    // Finalize Inventory Quantity Calculation (Issue #1)
    inventoryItems.forEach(item => {
       item.quantity = stockTracker[item.productId] || 0; 
    });

    // Final Invoice Sequence
    const invoiceSequence = {
        id: randomUUID(), organizationId, prefix: "INV", nextNumber: invoiceCounter,
    };

    // 15. Manual Journal Entries
    for (let i = 1; i <= 5; i++) {
        const jeId = randomUUID();
        const date = faker.date.recent({ days: 30 });
        journalEntries.push({
            id: jeId,
            organizationId,
            entryNumber: `JE-MAN-${i}`,
            description: faker.finance.transactionDescription(),
            referenceType: "MANUAL",
            isPosted: true,
            postedAt: date,
            createdAt: date
        });
        const amount = faker.number.int({ min: 1000, max: 10000 });
        journalLines.push(
            { id: randomUUID(), entryId: jeId, accountId: getAccount("5200")!, debit: amount, credit: 0 },
            { id: randomUUID(), entryId: jeId, accountId: getAccount("1000")!, debit: 0, credit: amount }
        );
    }

    // ---------------------------------------------------------------------------
    // VALIDATION AND DYNAMIC FINANCIAL STATEMENTS GENERATION
    // ---------------------------------------------------------------------------

    // 1. Ledger Validation (Debits = Credits)
    let totalDebit = 0;
    let totalCredit = 0;
    journalLines.forEach(l => {
        totalDebit += Number(l.debit);
        totalCredit += Number(l.credit);
    });

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error(`Seeder out of balance: Debit=${totalDebit} Credit=${totalCredit}`);
    }

    // 2. Build Account Balances
    const accountBalances: Record<string, any> = {};
    accounts.forEach(a => {
        accountBalances[a.id] = {
            id: a.id,
            code: a.code,
            name: a.name,
            type: a.type,
            normalBalance: a.normalBalance,
            debitTotal: 0,
            creditTotal: 0,
            balance: 0,
            balanceType: a.normalBalance
        };
    });

    journalLines.forEach(l => {
        const acc = accountBalances[l.accountId];
        if (acc) {
            acc.debitTotal += Number(l.debit);
            acc.creditTotal += Number(l.credit);
        }
    });

    Object.values(accountBalances).forEach(acc => {
        if (acc.normalBalance === "DEBIT") {
            acc.balance = acc.debitTotal - acc.creditTotal;
        } else {
            acc.balance = acc.creditTotal - acc.debitTotal;
        }
    });

    // 3. Generate Trial Balance
    const trialBalancePayload = {
        totalDebit,
        totalCredit,
        accounts: Object.values(accountBalances).filter(a => a.balance !== 0).map(a => ({
            code: a.code,
            name: a.name,
            debit: a.debitTotal,
            credit: a.creditTotal,
            balance: a.balance,
            balanceType: a.balanceType
        }))
    };

    // Trial Balance Self-Validation (Issue 7)
    if (Math.abs(trialBalancePayload.totalDebit - trialBalancePayload.totalCredit) > 0.01) {
        throw new Error("Trial Balance self-validation failed.");
    }

    financialStatementSnapshots.push({
        id: randomUUID(),
        organizationId,
        statementType: "TRIAL_BALANCE",
        fiscalYearId: currentFyId,
        generatedBy: ownerId,
        statementHash: randomBytes(16).toString("hex"),
        payload: trialBalancePayload
    });

    // 4. Generate Profit & Loss
    const revenueAccounts = Object.values(accountBalances).filter(a => a.type === "REVENUE");
    const expenseAccounts = Object.values(accountBalances).filter(a => a.type === "EXPENSE");
    const totalRevenue = revenueAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalExpense = expenseAccounts.reduce((sum, a) => sum + a.balance, 0);
    const netIncome = totalRevenue - totalExpense;

    financialStatementSnapshots.push({
        id: randomUUID(),
        organizationId,
        statementType: "PROFIT_AND_LOSS",
        fiscalYearId: currentFyId,
        generatedBy: ownerId,
        statementHash: randomBytes(16).toString("hex"),
        payload: {
            totalRevenue,
            totalExpense,
            netIncome,
            revenueAccounts: revenueAccounts.map(a => ({ code: a.code, name: a.name, balance: a.balance })),
            expenseAccounts: expenseAccounts.map(a => ({ code: a.code, name: a.name, balance: a.balance }))
        }
    });

    // 5. Generate Balance Sheet
    const assetAccounts = Object.values(accountBalances).filter(a => a.type === "ASSET");
    const liabilityAccounts = Object.values(accountBalances).filter(a => a.type === "LIABILITY");
    const equityAccounts = Object.values(accountBalances).filter(a => a.type === "EQUITY");

    const totalAssets = assetAccounts.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilityAccounts.reduce((sum, a) => sum + a.balance, 0);
    const ledgerEquity = equityAccounts.reduce((sum, a) => sum + a.balance, 0);
    
    // Do NOT include netIncome in totalEquity validation logic (Option B)
    financialStatementSnapshots.push({
        id: randomUUID(),
        organizationId,
        statementType: "BALANCE_SHEET",
        fiscalYearId: currentFyId,
        generatedBy: ownerId,
        statementHash: randomBytes(16).toString("hex"),
        payload: {
            totalAssets,
            totalLiabilities,
            totalEquity: ledgerEquity,
            currentYearEarnings: netIncome, // Presentation only
            assets: assetAccounts.map(a => ({ code: a.code, name: a.name, balance: a.balance })),
            liabilities: liabilityAccounts.map(a => ({ code: a.code, name: a.name, balance: a.balance })),
            equity: [
                ...equityAccounts.map(a => ({ code: a.code, name: a.name, balance: a.balance }))
            ]
        }
    });

    // 6. Mandatory Balance Sheet Validation
    // Assets = Liabilities + Ledger Equity + Net Income
    const bsDifference = totalAssets - (totalLiabilities + ledgerEquity + netIncome);
    if (Math.abs(bsDifference) > 0.01) {
        throw new Error(`Balance sheet out of balance: Assets=${totalAssets} Liabilities=${totalLiabilities} Equity=${ledgerEquity} NetIncome=${netIncome}`);
    }

    // 7. Subledger Validations
    
    // AR Validation
    const expectedAR = invoices.filter(inv => inv.status !== 'CANCELLED' && inv.status !== 'DRAFT').reduce((sum, inv) => sum + Number(inv.totalAmount), 0) - payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const ledgerAR = accountBalances[getAccount("1200")!]?.balance || 0;
    if (Math.abs(expectedAR - ledgerAR) > 0.01) {
        throw new Error(`AR mismatch: Expected=${expectedAR} Ledger=${ledgerAR}`);
    }

    // AP Validation
    const expectedAP = vendorInvoices.filter(inv => inv.status !== 'PAID').reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const ledgerAP = accountBalances[getAccount("2000")!]?.balance || 0;
    if (Math.abs(expectedAP - ledgerAP) > 0.01) {
        throw new Error(`AP mismatch: Expected=${expectedAP} Ledger=${ledgerAP}`);
    }

    // Execute bulk inserts transactionally
    await prisma.$transaction([
      // Note: We no longer create accounts here, they are seeded during org creation.
      prisma.godown.createMany({ data: godowns }),
      prisma.tax.createMany({ data: taxes }),
      prisma.productCategory.createMany({ data: categories }),
      prisma.product.createMany({ data: products }),
      ...(inventoryItems.length > 0 ? [prisma.inventoryItem.createMany({ data: inventoryItems })] : []),
      ...(inventoryMovements.length > 0 ? [prisma.inventoryMovement.createMany({ data: inventoryMovements })] : []),
      prisma.customer.createMany({ data: customers }),
      prisma.vendor.createMany({ data: vendors }),
      
      ...(purchaseOrders.length > 0 ? [prisma.purchaseOrder.createMany({ data: purchaseOrders })] : []),
      ...(purchaseOrderItems.length > 0 ? [prisma.purchaseOrderItem.createMany({ data: purchaseOrderItems })] : []),
      ...(grns.length > 0 ? [prisma.goodsReceiptNote.createMany({ data: grns })] : []),
      ...(grnItems.length > 0 ? [prisma.goodsReceiptNoteItem.createMany({ data: grnItems })] : []),
      ...(vendorInvoices.length > 0 ? [prisma.vendorInvoice.createMany({ data: vendorInvoices })] : []),
      ...(vendorInvoiceItems.length > 0 ? [prisma.vendorInvoiceItem.createMany({ data: vendorInvoiceItems })] : []),
      ...(stockGroups.length > 0 ? [prisma.stockGroup.createMany({ data: stockGroups })] : []),

      prisma.invoice.createMany({ data: invoices }),
      prisma.invoiceItem.createMany({ data: invoiceItems }),
      prisma.invoiceSequence.upsert({
        where: { organizationId },
        update: { nextNumber: invoiceCounter },
        create: invoiceSequence,
      }),
      prisma.department.createMany({ data: departments }),
      prisma.designation.createMany({ data: designations }),
      prisma.employee.createMany({ data: employees }),
      prisma.leaveType.createMany({ data: leaveTypes.map(({ maxDays, isPaid, ...rest }) => rest) }),
      prisma.leaveBalance.createMany({ data: leaveBalances }),
      
      ...(salaryComponents.length > 0 ? [prisma.salaryComponent.createMany({ data: salaryComponents })] : []),
      ...(employeeSalaryStructures.length > 0 ? [prisma.employeeSalaryStructure.createMany({ data: employeeSalaryStructures })] : []),
      ...(payrollRuns.length > 0 ? [prisma.payrollRun.createMany({ data: payrollRuns })] : []),
      ...(payrollRunEmployees.length > 0 ? [prisma.payrollRunEmployee.createMany({ data: payrollRunEmployees })] : []),
      ...(payslips.length > 0 ? [prisma.payslip.createMany({ data: payslips })] : []),
      ...(payslipLineItems.length > 0 ? [prisma.payslipLineItem.createMany({ data: payslipLineItems })] : []),
      ...(shifts.length > 0 ? [prisma.shift.createMany({ data: shifts })] : []),
      ...(employeeShiftAssignments.length > 0 ? [prisma.employeeShiftAssignment.createMany({ data: employeeShiftAssignments })] : []),
      ...(attendanceRecords.length > 0 ? [prisma.attendanceRecord.createMany({ data: attendanceRecords })] : []),
      ...(holidays.length > 0 ? [prisma.holiday.createMany({ data: holidays })] : []),
      ...(leaveApplications.length > 0 ? [prisma.leaveApplication.createMany({ data: leaveApplications })] : []),

      prisma.approvalTemplate.createMany({ data: approvalTemplates }),
      prisma.approvalStep.createMany({ data: approvalSteps }),
      ...(payments.length > 0 ? [prisma.payment.createMany({ data: payments })] : []),
      prisma.expense.createMany({ data: expenses }),
      ...(transactions.length > 0 ? [prisma.transaction.createMany({ data: transactions })] : []),
      
      ...(journalEntries.length > 0 ? [prisma.journalEntry.createMany({ data: journalEntries })] : []),
      ...(journalLines.length > 0 ? [prisma.journalLine.createMany({ data: journalLines })] : []),

      ...(auditLogs.length > 0 ? [prisma.auditLog.createMany({ data: auditLogs })] : []),
      ...(invitations.length > 0 ? [prisma.invitation.createMany({ data: invitations })] : []),
      ...(fiscalYears.length > 0 ? [prisma.fiscalYear.createMany({ data: fiscalYears })] : []),
      ...(financialStatementSnapshots.length > 0 ? [prisma.financialStatementSnapshot.createMany({ data: financialStatementSnapshots })] : []),
    ]);
  },
};
