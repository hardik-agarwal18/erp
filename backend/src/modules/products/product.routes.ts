import { Router } from "express";

import { authMiddleware } from "../../middleware/auth.middleware.js";
import {
  requirePermission,
  tenantContextMiddleware,
} from "../../middleware/tenant.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { PERMISSIONS } from "../../shared/constants/permissions.js";
import { productController } from "./product.controller.js";
import {
  categoryIdParamSchema,
  createCategorySchema,
  createProductSchema,
  listCategoriesSchema,
  listProductsSchema,
  productIdParamSchema,
  updateCategorySchema,
  updateProductSchema,
} from "./product.validators.js";

const router = Router();

router.use(authMiddleware);
router.use(tenantContextMiddleware());

router.post(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  validate(createProductSchema),
  asyncHandler(productController.createProduct),
);
router.get(
  "/",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  validate(listProductsSchema),
  asyncHandler(productController.listProducts),
);
router.get(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  validate(productIdParamSchema),
  asyncHandler(productController.getProduct),
);
router.patch(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  validate(updateProductSchema),
  asyncHandler(productController.updateProduct),
);
router.delete(
  "/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  validate(productIdParamSchema),
  asyncHandler(productController.archiveProduct),
);

router.post(
  "/categories",
  requirePermission(PERMISSIONS.PRODUCTS_CREATE),
  validate(createCategorySchema),
  asyncHandler(productController.createCategory),
);
router.get(
  "/categories",
  requirePermission(PERMISSIONS.PRODUCTS_VIEW),
  validate(listCategoriesSchema),
  asyncHandler(productController.listCategories),
);
router.patch(
  "/categories/:id",
  requirePermission(PERMISSIONS.PRODUCTS_UPDATE),
  validate(updateCategorySchema),
  asyncHandler(productController.updateCategory),
);
router.delete(
  "/categories/:id",
  requirePermission(PERMISSIONS.PRODUCTS_DELETE),
  validate(categoryIdParamSchema),
  asyncHandler(productController.archiveCategory),
);

export default router;
