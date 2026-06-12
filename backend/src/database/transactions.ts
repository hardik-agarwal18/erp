// @ts-nocheck
import { Prisma, InvoiceStatus, InventoryMovementType, PaymentMethod, ProductType, TransactionType } from "@prisma/client";

import type { DatabaseTransactionClient } from "../config/database.js";
import { prisma } from "../config/database.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../services/audit/index.js";

/**
 * Shared transaction configuration tuned for ERP write workflows.
 */
export const DEFAULT_TRANSACTION_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5_000,
  timeout: 15_000,
} satisfies NonNullable<Parameters<typeof prisma.$transaction>[1]>;

export type InvoiceItemDraftInput = {
  discountAmount?: Prisma.Decimal | number | string;
  lineTotal: Prisma.Decimal | number | string;
  productId: string;
  quantity: Prisma.Decimal | number | string;
  taxAmount?: Prisma.Decimal | number | string;
  unitPrice: Prisma.Decimal | number | string;
};

export type CreateInvoiceAndPaymentInput = {
  invoice: {
    customerId: string;
    discountAmount?: Prisma.Decimal | number | string;
    dueDate?: Date;
    invoiceNumber: string;
    issueDate: Date;
    notes?: string;
    organizationId: string;
    status?: InvoiceStatus;
    subtotal: Prisma.Decimal | number | string;
    taxAmount?: Prisma.Decimal | number | string;
    taxId?: string;
    totalAmount: Prisma.Decimal | number | string;
  };
  items: InvoiceItemDraftInput[];
  payment: {
    amount: Prisma.Decimal | number | string;
    paymentDate: Date;
    paymentMethod: PaymentMethod;
    reference?: string;
  };
};

export type CreateProductAndInventoryInput = {
  inventory: {
    initialQuantity?: Prisma.Decimal | number | string;
    reorderLevel?: Prisma.Decimal | number | string;
  };
  product: {
    categoryId?: string;
    description?: string;
    name: string;
    organizationId: string;
    purchasePrice?: Prisma.Decimal | number | string;
    sellingPrice: Prisma.Decimal | number | string;
    sku?: string;
    taxId?: string;
    type?: ProductType;
    unit?: string;
  };
};

export type CreateOrganizationAndOwnerInput = {
  organization: {
    logo?: string;
    name: string;
    settings?: Prisma.InputJsonValue;
    slug: string;
    joinCode: string;
  };
  owner: {
    email: string;
    isVerified?: boolean;
    name: string;
    password: string;
  };
};

/**
 * Executes a callback in a single ACID transaction with enterprise-safe defaults.
 */
export async function withTransaction<T>(
  callback: (tx: DatabaseTransactionClient) => Promise<T>,
): Promise<T> {
  try {
    return await prisma.$transaction(
      async (tx) => callback(tx),
      DEFAULT_TRANSACTION_OPTIONS,
    );
  } catch (error: unknown) {
    const wrappedError =
      error instanceof Error
        ? error
        : new Error("An unknown database transaction error occurred.");

    throw wrappedError;
  }
}

/**
 * Creates an invoice, its line items, a payment record, and the matching
 * financial transaction atomically.
 */
export async function createInvoiceAndPayment(
  input: CreateInvoiceAndPaymentInput,
): Promise<{
  invoice: Awaited<ReturnType<DatabaseTransactionClient["invoice"]["create"]>>;
  payment: Awaited<ReturnType<DatabaseTransactionClient["payment"]["create"]>>;
  transaction: Awaited<ReturnType<DatabaseTransactionClient["transaction"]["create"]>>;
}> {
  if (input.items.length === 0) {
    throw new Error("At least one invoice item is required.");
  }

  return withTransaction(async (tx) => {
    const paymentAmount = new Prisma.Decimal(input.payment.amount);
    const totalAmount = new Prisma.Decimal(input.invoice.totalAmount);
    const taxAmount = new Prisma.Decimal(input.invoice.taxAmount ?? 0);
    const discountAmount = new Prisma.Decimal(input.invoice.discountAmount ?? 0);

    if (paymentAmount.greaterThan(totalAmount)) {
      throw new Error("Payment amount cannot exceed the invoice total.");
    }

    const invoiceStatus =
      paymentAmount.equals(totalAmount)
        ? InvoiceStatus.PAID
        : paymentAmount.greaterThan(0)
          ? InvoiceStatus.PARTIALLY_PAID
          : input.invoice.status ?? InvoiceStatus.ISSUED;

    const invoice = await tx.invoice.create({
      data: {
        organizationId: input.invoice.organizationId,
        customerId: input.invoice.customerId,
        taxId: input.invoice.taxId,
        invoiceNumber: input.invoice.invoiceNumber,
        status: invoiceStatus,
        issueDate: input.invoice.issueDate,
        dueDate: input.invoice.dueDate,
        subtotal: input.invoice.subtotal,
        taxAmount,
        discountAmount,
        totalAmount,
        notes: input.invoice.notes,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            taxAmount: item.taxAmount ?? 0,
            discountAmount: item.discountAmount ?? 0,
            lineTotal: item.lineTotal,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const payment = await tx.payment.create({
      data: {
        organizationId: input.invoice.organizationId,
        invoiceId: invoice.id,
        amount: paymentAmount,
        paymentMethod: input.payment.paymentMethod,
        paymentDate: input.payment.paymentDate,
        reference: input.payment.reference,
      },
    });

    const transaction = await tx.transaction.create({
      data: {
        organizationId: input.invoice.organizationId,
        type: TransactionType.PAYMENT,
        referenceType: "INVOICE_PAYMENT",
        referenceId: payment.id,
        amount: paymentAmount,
        description: `Payment recorded for invoice ${invoice.invoiceNumber}`,
      },
    });

    return {
      invoice,
      payment,
      transaction,
    };
  });
}

/**
 * Creates a product together with its inventory ledger and an opening stock
 * movement when initial quantity is provided.
 */
export async function createProductAndInventory(
  input: CreateProductAndInventoryInput,
): Promise<{
  inventoryItem: Awaited<ReturnType<DatabaseTransactionClient["inventoryItem"]["create"]>>;
  movement: Awaited<ReturnType<DatabaseTransactionClient["inventoryMovement"]["create"]>> | null;
  product: Awaited<ReturnType<DatabaseTransactionClient["product"]["create"]>>;
}> {
  return withTransaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        organizationId: input.product.organizationId,
        categoryId: input.product.categoryId,
        taxId: input.product.taxId,
        name: input.product.name,
        sku: input.product.sku,
        description: input.product.description,
        unit: input.product.unit,
        sellingPrice: input.product.sellingPrice,
        purchasePrice: input.product.purchasePrice,
        type: input.product.type ?? ProductType.PHYSICAL,
      },
    });

    const initialQuantity = new Prisma.Decimal(input.inventory.initialQuantity ?? 0);

    const inventoryItem = await tx.inventoryItem.create({
      data: {
        organizationId: input.product.organizationId,
        productId: product.id,
        quantity: initialQuantity,
        reorderLevel: input.inventory.reorderLevel,
      },
    });

    let movement: Awaited<ReturnType<DatabaseTransactionClient["inventoryMovement"]["create"]>> | null = null;

    if (initialQuantity.greaterThan(0)) {
      movement = await tx.inventoryMovement.create({
        data: {
          organizationId: input.product.organizationId,
          productId: product.id,
          type: InventoryMovementType.ADJUSTMENT,
          quantity: initialQuantity,
          referenceId: inventoryItem.id,
        },
      });
    }

    return {
      product,
      inventoryItem,
      movement,
    };
  });
}

/**
 * Creates an owner account, its organization, owner role, membership, and
 * baseline invoice sequence in one transaction.
 */
export async function createOrganizationAndOwner(
  input: CreateOrganizationAndOwnerInput,
): Promise<{
  membership: Awaited<ReturnType<DatabaseTransactionClient["organizationMember"]["create"]>>;
  organization: Awaited<ReturnType<DatabaseTransactionClient["organization"]["create"]>>;
  owner: Awaited<ReturnType<DatabaseTransactionClient["user"]["create"]>>;
  ownerRole: Awaited<ReturnType<DatabaseTransactionClient["role"]["create"]>>;
}> {
  return withTransaction(async (tx) => {
    const owner = await tx.user.create({
      data: {
        name: input.owner.name,
        email: input.owner.email,
        password: input.owner.password,
        isVerified: input.owner.isVerified ?? true,
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: input.organization.name,
        slug: input.organization.slug,
        joinCode: input.organization.joinCode,
        logo: input.organization.logo,
        settings: input.organization.settings,
        ownerId: owner.id,
      },
    });

    const ownerRole = await tx.role.create({
      data: {
        organizationId: organization.id,
        name: "ORGANIZATION_OWNER",
        description: "Tenant owner with full organization access.",
        isSystem: true,
      },
    });

    const membership = await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: owner.id,
        roleId: ownerRole.id,
      },
    });

    await tx.invoiceSequence.create({
      data: {
        organizationId: organization.id,
        prefix: "INV",
        nextNumber: 1,
      },
    });

    await auditService.record(
      {
        organizationId: organization.id,
        userId: owner.id,
        action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
        entityType: AUDIT_ENTITY_TYPES.ORGANIZATION,
        entityId: organization.id,
        metadata: {
          ownerUserId: owner.id,
          roleId: ownerRole.id,
        },
      },
      tx,
    );

    return {
      owner,
      organization,
      ownerRole,
      membership,
    };
  });
}
