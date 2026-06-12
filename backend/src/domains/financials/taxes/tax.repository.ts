// @ts-nocheck
import prisma from "../../../config/database.js";
import { BaseRepository } from "../../../database/base.repository.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CreateTaxInput, UpdateTaxInput } from "./tax.types.js";

const taxCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.tax.create>>,
  Parameters<typeof prisma.tax.create>[0]["data"],
  Parameters<typeof prisma.tax.update>[0]["data"]
>(prisma.tax, {
  softDelete: true,
  tenantScoped: true,
});

const buildSearchFilter = (organizationId: string, search?: string) => {
  if (!search) {
    return { organizationId, deletedAt: null };
  }
  return {
    organizationId,
    deletedAt: null,
    name: { contains: search, mode: "insensitive" as const },
  };
};

export const taxRepository = {
  createTax: (organizationId: string, payload: CreateTaxInput) => {
    return taxCrudRepository.create({
      organizationId,
      name: payload.name,
      rate: payload.rate,
      type: payload.type,
      isDefault: payload.isDefault ?? false,
    });
  },
  updateTax: (
    organizationId: string,
    taxId: string,
    payload: UpdateTaxInput,
  ) => {
    return taxCrudRepository.updateById(
      taxId,
      {
        name: payload.name,
        rate: payload.rate,
        type: payload.type,
        isDefault: payload.isDefault,
      },
      organizationId,
    );
  },
  findById: (organizationId: string, taxId: string) => {
    return taxCrudRepository.findById(taxId, organizationId);
  },
  listTaxes: (
    organizationId: string,
    search: string | undefined,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildSearchFilter(organizationId, search?.trim());

    return prisma
      .$transaction([
        prisma.tax.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.tax.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  archiveTax: (organizationId: string, taxId: string) => {
    return taxCrudRepository.archiveById(taxId, organizationId);
  },
};
