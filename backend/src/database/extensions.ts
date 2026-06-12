
import { AsyncLocalStorage } from "node:async_hooks";

import { Prisma } from "@prisma/client";

import { prisma } from "./prisma.js";

export type DatabaseRequestContext = {
  actorUserId?: string;
  bypassTenant?: boolean;
  includeDeleted?: boolean;
  organizationId?: string;
};

type QueryArguments = Record<string, unknown>;
type QueryData = Record<string, unknown>;
type RootDelegate = {
  findFirst: (args: { where: QueryArguments }) => Promise<Record<string, unknown> | null>;
  update: (args: { where: { id: string }; data: QueryData }) => Promise<unknown>;
  updateMany: (args: {
    data: QueryData;
    where?: QueryArguments;
  }) => Promise<{ count: number }>;
};

const requestContextStorage = new AsyncLocalStorage<DatabaseRequestContext>();

export const TENANT_OWNED_MODELS = [
  "AuditLog",
  "Customer",
  "Expense",
  "InventoryItem",
  "InventoryMovement",
  "Invitation",
  "Invoice",
  "InvoiceSequence",
  "OrganizationMember",
  "Payment",
  "Product",
  "ProductCategory",
  "Role",
  "Tax",
  "Transaction",
  "Vendor",
] as const satisfies readonly Prisma.ModelName[];

export const SOFT_DELETE_MODELS = [
  "Customer",
  "Expense",
  "InventoryItem",
  "Invoice",
  "Payment",
  "Product",
  "ProductCategory",
  "Tax",
  "Vendor",
] as const satisfies readonly Prisma.ModelName[];

const UPDATED_AT_MODELS = Prisma.dmmf.datamodel.models
  .filter((model) => model.fields.some((field) => field.name === "updatedAt"))
  .map((model) => model.name);

const prismaModelMetadata = new Map(
  Prisma.dmmf.datamodel.models.map((model) => [
    model.name,
    new Set(model.fields.map((field) => field.name)),
  ]),
);

const tenantOwnedModelSet = new Set<string>(TENANT_OWNED_MODELS);
const softDeleteModelSet = new Set<string>(SOFT_DELETE_MODELS);
const updatedAtModelSet = new Set<string>(UPDATED_AT_MODELS);

function getRequestContext(): DatabaseRequestContext {
  return requestContextStorage.getStore() ?? {};
}

function hasField(modelName: string, fieldName: string): boolean {
  return prismaModelMetadata.get(modelName)?.has(fieldName) ?? false;
}

function toDelegateName(modelName: string): string {
  return `${modelName.charAt(0).toLowerCase()}${modelName.slice(1)}`;
}

function getRootDelegate(modelName: string): RootDelegate {
  return (prisma as unknown as Record<string, RootDelegate>)[toDelegateName(modelName)];
}

function mergeWhereWithClause(
  where: QueryArguments | undefined,
  clause: QueryArguments,
): QueryArguments {
  return where ? { AND: [where, clause] } : clause;
}

function mergeTenantWhere(
  where: QueryArguments | undefined,
  organizationId: string,
): QueryArguments {
  return mergeWhereWithClause(where, { organizationId });
}

function mergeSoftDeleteWhere(
  where: QueryArguments | undefined,
): QueryArguments {
  return mergeWhereWithClause(where, { deletedAt: null });
}

function assertTenantData(
  data: QueryData,
  organizationId: string,
  modelName: string,
): QueryData {
  const nextData = { ...data };
  const incomingOrganizationId = nextData.organizationId;

  if (
    incomingOrganizationId !== undefined &&
    incomingOrganizationId !== organizationId
  ) {
    throw new Error(
      `Tenant mismatch for model "${modelName}". Cross-organization writes are blocked.`,
    );
  }

  nextData.organizationId = organizationId;
  return nextData;
}

function applyActorMetadata(
  modelName: string,
  data: QueryData,
  actorUserId: string,
  operation: "create" | "update",
): QueryData {
  const nextData = { ...data };

  if (operation === "create" && hasField(modelName, "createdBy")) {
    nextData.createdBy = nextData.createdBy ?? actorUserId;
  }

  if (hasField(modelName, "updatedBy")) {
    nextData.updatedBy = actorUserId;
  }

  return nextData;
}

function applyUpdatedAt(modelName: string, data: QueryData): QueryData {
  if (!updatedAtModelSet.has(modelName)) {
    return data;
  }

  return {
    ...data,
    updatedAt: new Date(),
  };
}

function applyMutationMetadata(
  modelName: string,
  data: QueryData,
  context: DatabaseRequestContext,
  operation: "create" | "update",
): QueryData {
  let nextData = { ...data };

  if (context.actorUserId) {
    nextData = applyActorMetadata(
      modelName,
      nextData,
      context.actorUserId,
      operation,
    );
  }

  if (operation === "update") {
    nextData = applyUpdatedAt(modelName, nextData);
  }

  return nextData;
}

async function findScopedRecord(
  modelName: string,
  where: QueryArguments | undefined,
  context: DatabaseRequestContext,
  includeDeleted = false,
): Promise<Record<string, unknown> | null> {
  let scopedWhere: QueryArguments | undefined = where ? { ...where } : undefined;

  if (scopedWhere) {
    for (const [key, value] of Object.entries(scopedWhere)) {
      if (key.includes("_") && typeof value === "object" && value !== null && !Array.isArray(value)) {
        Object.assign(scopedWhere, value);
        delete scopedWhere[key];
      }
    }
  }

  if (
    tenantOwnedModelSet.has(modelName) &&
    context.organizationId &&
    !context.bypassTenant
  ) {
    scopedWhere = mergeTenantWhere(scopedWhere, context.organizationId);
  }

  if (
    softDeleteModelSet.has(modelName) &&
    !includeDeleted &&
    !context.includeDeleted
  ) {
    scopedWhere = mergeSoftDeleteWhere(scopedWhere);
  }

  return getRootDelegate(modelName).findFirst({
    where: scopedWhere ?? {},
  });
}

/**
 * Runs work within a tenant and actor-aware async-local database context.
 */
export async function runWithDatabaseContext<T>(
  context: DatabaseRequestContext,
  callback: () => Promise<T>,
): Promise<T> {
  return requestContextStorage.run(context, callback);
}

/**
 * Returns the current request-scoped database context.
 */
export function getDatabaseContext(): DatabaseRequestContext {
  return getRequestContext();
}

/**
 * Returns whether a model is tenant-owned by `organizationId`.
 */
export function isTenantOwnedModel(modelName: string): boolean {
  return tenantOwnedModelSet.has(modelName);
}

/**
 * Returns whether a model supports soft deletion via `deletedAt`.
 */
export function isSoftDeleteModel(modelName: string): boolean {
  return softDeleteModelSet.has(modelName);
}

const prismaExtensions = Prisma.defineExtension({
  name: "erp-database-extensions",
  model: {
    $allModels: {
      async softDelete<T>(
        this: T,
        where: QueryArguments,
      ): Promise<unknown> {
        const extensionContext = Prisma.getExtensionContext(this) as Record<string, unknown>;
        const modelName = String(extensionContext.$name);

        if (!softDeleteModelSet.has(modelName)) {
          throw new Error(`Model "${modelName}" does not support soft deletes.`);
        }

        const context = getRequestContext();
        const record = await findScopedRecord(modelName, where, context);

        if (!record || typeof record.id !== "string") {
          throw new Error(`No ${modelName} record was found for soft delete.`);
        }

        return getRootDelegate(modelName).update({
          where: { id: record.id },
          data: applyMutationMetadata(
            modelName,
            { deletedAt: new Date() },
            context,
            "update",
          ),
        });
      },

      async restore<T>(
        this: T,
        where: QueryArguments,
      ): Promise<unknown> {
        const extensionContext = Prisma.getExtensionContext(this) as Record<string, unknown>;
        const modelName = String(extensionContext.$name);

        if (!softDeleteModelSet.has(modelName)) {
          throw new Error(`Model "${modelName}" does not support soft delete restore.`);
        }

        const context = getRequestContext();
        const record = await findScopedRecord(modelName, where, context, true);

        if (!record || typeof record.id !== "string") {
          throw new Error(`No ${modelName} record was found for restore.`);
        }

        return getRootDelegate(modelName).update({
          where: { id: record.id },
          data: applyMutationMetadata(
            modelName,
            { deletedAt: null },
            context,
            "update",
          ),
        });
      },
    },
  },
  query: {
    $allModels: {
      async $allOperations({
        args,
        model,
        operation,
        query,
      }: {
        args: QueryArguments;
        model?: string;
        operation: string;
        query: (queryArgs: QueryArguments) => Promise<unknown>;
      }): Promise<unknown> {
        if (!model) {
          return query(args);
        }

        const context = getRequestContext();
        const scopedArgs: QueryArguments = { ...args };
        const isTenantOwned = tenantOwnedModelSet.has(model);
        const isSoftDelete = softDeleteModelSet.has(model);
        const organizationId = context.organizationId;

        if (isTenantOwned && organizationId && !context.bypassTenant) {
          if (operation === "create") {
            scopedArgs.data = assertTenantData(
              (scopedArgs.data as QueryData | undefined) ?? {},
              organizationId,
              model,
            );
          }

          if (operation === "createMany") {
            const inputData = scopedArgs.data;
            const items = Array.isArray(inputData) ? inputData : [inputData];
            scopedArgs.data = items.map((item) =>
              assertTenantData(
                (item as QueryData | undefined) ?? {},
                organizationId,
                model,
              ),
            );
          }

          if (
            [
              "aggregate",
              "count",
              "deleteMany",
              "findFirst",
              "findFirstOrThrow",
              "findMany",
              "groupBy",
              "updateMany",
            ].includes(operation)
          ) {
            scopedArgs.where = mergeTenantWhere(
              scopedArgs.where as QueryArguments | undefined,
              organizationId,
            );
          }

          if (operation === "upsert") {
            scopedArgs.create = assertTenantData(
              (scopedArgs.create as QueryData | undefined) ?? {},
              organizationId,
              model,
            );
          }
        }

        if (isSoftDelete && !context.includeDeleted) {
          if (
            [
              "aggregate",
              "count",
              "findFirst",
              "findFirstOrThrow",
              "findMany",
              "groupBy",
              "updateMany",
              "deleteMany",
            ].includes(operation)
          ) {
            scopedArgs.where = mergeSoftDeleteWhere(
              scopedArgs.where as QueryArguments | undefined,
            );
          }
        }

        if (context.actorUserId) {
          if (operation === "create") {
            scopedArgs.data = applyMutationMetadata(
              model,
              (scopedArgs.data as QueryData | undefined) ?? {},
              context,
              "create",
            );
          }

          if (operation === "createMany") {
            const inputData = scopedArgs.data;
            const items = Array.isArray(inputData) ? inputData : [inputData];
            scopedArgs.data = items.map((item) =>
              applyMutationMetadata(
                model,
                (item as QueryData | undefined) ?? {},
                context,
                "create",
              ),
            );
          }
        }

        if (operation === "update") {
          scopedArgs.data = applyMutationMetadata(
            model,
            (scopedArgs.data as QueryData | undefined) ?? {},
            context,
            "update",
          );
        }

        if (operation === "updateMany") {
          scopedArgs.data = applyMutationMetadata(
            model,
            (scopedArgs.data as QueryData | undefined) ?? {},
            context,
            "update",
          );
        }

        if (operation === "upsert") {
          scopedArgs.update = applyMutationMetadata(
            model,
            (scopedArgs.update as QueryData | undefined) ?? {},
            context,
            "update",
          );
        }

        if (["findUnique", "findUniqueOrThrow", "update", "delete"].includes(operation)) {
          const includeDeleted = operation === "delete";
          const record = await findScopedRecord(
            model,
            scopedArgs.where as QueryArguments | undefined,
            context,
            includeDeleted,
          );

          if (!record) {
            if (operation === "findUnique") {
              return null;
            }

            throw new Error(`No ${model} record was found for the active context.`);
          }

          if (operation === "findUnique" || operation === "findUniqueOrThrow") {
            if (typeof record.id !== "string") {
              return record;
            }
            return getRootDelegate(model).findFirst({
              ...scopedArgs,
              where: { id: record.id },
            });
          }

          if (typeof record.id !== "string") {
            throw new Error(`Model "${model}" does not expose a string id field.`);
          }

          if (operation === "update") {
            return getRootDelegate(model).update({
              where: { id: record.id },
              data: (scopedArgs.data as QueryData | undefined) ?? {},
            });
          }

          if (operation === "delete") {
            if (!isSoftDelete) {
              return query(scopedArgs);
            }

            return getRootDelegate(model).update({
              where: { id: record.id },
              data: applyMutationMetadata(
                model,
                { deletedAt: new Date() },
                context,
                "update",
              ),
            });
          }
        }

        if (operation === "deleteMany" && isSoftDelete) {
          return getRootDelegate(model).updateMany({
            where: scopedArgs.where as QueryArguments | undefined,
            data: applyMutationMetadata(
              model,
              { deletedAt: new Date() },
              context,
              "update",
            ),
          });
        }

        return query(scopedArgs);
      },
    },
  },
});

/**
 * Hardened Prisma client with tenant scoping, soft-delete behavior,
 * audit metadata propagation, and model helper methods.
 */
export const extendedPrisma = prisma.$extends(prismaExtensions);

export default extendedPrisma;
