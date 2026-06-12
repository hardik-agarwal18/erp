
import prisma from "../../../config/database.js";
import { BaseRepository } from "../../../database/base.repository.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import {
  CreateCategoryInput,
  CreateProductInput,
  ProductFilters,
  UpdateCategoryInput,
  UpdateProductInput,
} from "./product.types.js";

const productCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.product.create>>,
  Parameters<typeof prisma.product.create>[0]["data"],
  Parameters<typeof prisma.product.update>[0]["data"]
>(prisma.product, {
  softDelete: true,
  tenantScoped: true,
});

const productCategoryCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.productCategory.create>>,
  Parameters<typeof prisma.productCategory.create>[0]["data"],
  Parameters<typeof prisma.productCategory.update>[0]["data"]
>(prisma.productCategory, {
  softDelete: true,
  tenantScoped: true,
});

const buildProductFilter = (
  organizationId: string,
  filters: ProductFilters,
) => {
  const search = filters.search?.trim();
  const where: Record<string, unknown> = {
    organizationId,
    deletedAt: null,
  };

  if (filters.type) {
    where.type = filters.type;
  }
  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }

  return where;
};

const buildCategoryFilter = (organizationId: string, search?: string) => {
  if (!search) {
    return { organizationId, deletedAt: null };
  }
  return {
    organizationId,
    deletedAt: null,
    name: { contains: search, mode: "insensitive" as const },
  };
};

export const productRepository = {
  createProduct: (organizationId: string, payload: CreateProductInput) => {
    return productCrudRepository.create({
      organizationId,
      name: payload.name,
      sku: payload.sku,
      description: payload.description,
      unit: payload.unit,
      sellingPrice: payload.sellingPrice,
      purchasePrice: payload.purchasePrice,
      taxId: payload.taxId,
      categoryId: payload.categoryId,
      type: payload.type,
    });
  },
  updateProduct: (productId: string, payload: UpdateProductInput) => {
    return prisma.product.update({
      where: { id: productId },
      data: {
        name: payload.name,
        sku: payload.sku,
        description: payload.description,
        unit: payload.unit,
        sellingPrice: payload.sellingPrice,
        purchasePrice: payload.purchasePrice,
        taxId: payload.taxId,
        categoryId: payload.categoryId,
        type: payload.type,
      },
    });
  },
  findById: (organizationId: string, productId: string) => {
    return prisma.product.findFirst({
      where: { id: productId, organizationId, deletedAt: null },
    });
  },
  listProducts: (
    organizationId: string,
    filters: ProductFilters,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildProductFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.product.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
          include: { category: true, tax: true },
        }),
        prisma.product.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  updateProductForOrganization: (
    organizationId: string,
    productId: string,
    payload: UpdateProductInput,
  ) => {
    return productCrudRepository.updateById(
      productId,
      {
        name: payload.name,
        sku: payload.sku,
        description: payload.description,
        unit: payload.unit,
        sellingPrice: payload.sellingPrice,
        purchasePrice: payload.purchasePrice,
        taxId: payload.taxId,
        categoryId: payload.categoryId,
        type: payload.type,
      },
      organizationId,
    );
  },
  archiveProduct: (organizationId: string, productId: string) => {
    return productCrudRepository.archiveById(productId, organizationId);
  },
  createCategory: (organizationId: string, payload: CreateCategoryInput) => {
    return productCategoryCrudRepository.create({
      organizationId,
      name: payload.name,
      description: payload.description,
    });
  },
  updateCategory: (
    organizationId: string,
    categoryId: string,
    payload: UpdateCategoryInput,
  ) => {
    return productCategoryCrudRepository.updateById(
      categoryId,
      {
        name: payload.name,
        description: payload.description,
      },
      organizationId,
    );
  },
  findCategoryById: (organizationId: string, categoryId: string) => {
    return productCategoryCrudRepository.findById(categoryId, organizationId);
  },
  listCategories: (
    organizationId: string,
    search: string | undefined,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildCategoryFilter(organizationId, search?.trim());

    return prisma
      .$transaction([
        prisma.productCategory.findMany({
          where,
          orderBy: { name: "asc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.productCategory.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  archiveCategory: (organizationId: string, categoryId: string) => {
    return productCategoryCrudRepository.archiveById(
      categoryId,
      organizationId,
    );
  },
  restoreProduct: (organizationId: string, productId: string) => {
    return productCrudRepository.restoreById(productId, organizationId);
  },
  restoreCategory: (organizationId: string, categoryId: string) => {
    return productCategoryCrudRepository.restoreById(
      categoryId,
      organizationId,
    );
  },
};
