import prisma from "../../config/database.js";
import ApiError from "../../utils/ApiError.js";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  auditService,
} from "../../services/audit/index.js";
import { productRepository } from "./product.repository.js";
import {
  CreateCategoryInput,
  CreateProductInput,
  ProductFilters,
  UpdateCategoryInput,
  UpdateProductInput,
} from "./product.types.js";

const assertTaxInOrganization = async (
  organizationId: string,
  taxId?: string,
) => {
  if (!taxId) {
    return;
  }
  const tax = await prisma.tax.findFirst({
    where: { id: taxId, organizationId, deletedAt: null },
  });
  if (!tax) {
    throw new ApiError(404, "Tax not found");
  }
};

const assertCategoryInOrganization = async (
  organizationId: string,
  categoryId?: string,
) => {
  if (!categoryId) {
    return;
  }
  const category = await prisma.productCategory.findFirst({
    where: { id: categoryId, organizationId, deletedAt: null },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
};

export const productService = {
  createProduct: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateProductInput,
  ) => {
    await assertCategoryInOrganization(organizationId, payload.categoryId);
    await assertTaxInOrganization(organizationId, payload.taxId);

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
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
        },
      });

      if (payload.type === "PHYSICAL") {
        await tx.inventoryItem.create({
          data: {
            organizationId,
            productId: created.id,
            quantity: 0,
          },
        });
      }

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.PRODUCT_CREATED,
          entityType: AUDIT_ENTITY_TYPES.PRODUCT,
          entityId: created.id,
        },
        tx,
      );

      return created;
    });

    return product;
  },

  updateProduct: async (
    organizationId: string,
    actorUserId: string,
    productId: string,
    payload: UpdateProductInput,
  ) => {
    const existing = await productRepository.findById(
      organizationId,
      productId,
    );
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }

    await assertCategoryInOrganization(organizationId, payload.categoryId);
    await assertTaxInOrganization(organizationId, payload.taxId);

    const updated = await prisma.$transaction(async (tx) => {
      const product = await tx.product.update({
        where: { id: existing.id },
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

      if (payload.type === "PHYSICAL") {
        const existingItem = await tx.inventoryItem.findFirst({
          where: { organizationId, productId },
        });
        if (!existingItem) {
          await tx.inventoryItem.create({
            data: {
              organizationId,
              productId,
              quantity: 0,
            },
          });
        }
      }

      await auditService.record(
        {
          organizationId,
          userId: actorUserId,
          action: AUDIT_ACTIONS.PRODUCT_UPDATED,
          entityType: AUDIT_ENTITY_TYPES.PRODUCT,
          entityId: productId,
        },
        tx,
      );

      return product;
    });

    return updated;
  },

  archiveProduct: async (
    organizationId: string,
    actorUserId: string,
    productId: string,
  ) => {
    const existing = await productRepository.findById(
      organizationId,
      productId,
    );
    if (!existing) {
      throw new ApiError(404, "Product not found");
    }

    await productRepository.archiveProduct(organizationId, productId);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.PRODUCT_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.PRODUCT,
      entityId: productId,
    });
  },

  listProducts: (
    organizationId: string,
    filters: ProductFilters,
    query: Record<string, unknown>,
  ) => {
    return productRepository.listProducts(organizationId, filters, query);
  },

  createCategory: async (
    organizationId: string,
    actorUserId: string,
    payload: CreateCategoryInput,
  ) => {
    const category = await productRepository.createCategory(
      organizationId,
      payload,
    );
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CATEGORY_CREATED,
      entityType: AUDIT_ENTITY_TYPES.CATEGORY,
      entityId: category.id,
    });
    return category;
  },

  updateCategory: async (
    organizationId: string,
    actorUserId: string,
    categoryId: string,
    payload: UpdateCategoryInput,
  ) => {
    const existing = await productRepository.findCategoryById(
      organizationId,
      categoryId,
    );
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }

    const updated = await productRepository.updateCategory(
      organizationId,
      categoryId,
      payload,
    );
    if (!updated) {
      throw new ApiError(404, "Category not found");
    }
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CATEGORY_UPDATED,
      entityType: AUDIT_ENTITY_TYPES.CATEGORY,
      entityId: categoryId,
    });
    return updated;
  },

  archiveCategory: async (
    organizationId: string,
    actorUserId: string,
    categoryId: string,
  ) => {
    const existing = await productRepository.findCategoryById(
      organizationId,
      categoryId,
    );
    if (!existing) {
      throw new ApiError(404, "Category not found");
    }

    await productRepository.archiveCategory(organizationId, categoryId);
    await auditService.record({
      organizationId,
      userId: actorUserId,
      action: AUDIT_ACTIONS.CATEGORY_ARCHIVED,
      entityType: AUDIT_ENTITY_TYPES.CATEGORY,
      entityId: categoryId,
    });
  },

  listCategories: (
    organizationId: string,
    search: string | undefined,
    query: Record<string, unknown>,
  ) => {
    return productRepository.listCategories(organizationId, search, query);
  },
};
