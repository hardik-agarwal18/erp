import prisma from "../../config/database.js";
import { BaseRepository } from "../../database/base.repository.js";
import { parsePagination } from "../../shared/utils/pagination.js";
import {
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilters,
} from "./vendor.types.js";

const vendorCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.vendor.create>>,
  Parameters<typeof prisma.vendor.create>[0]["data"],
  Parameters<typeof prisma.vendor.update>[0]["data"]
>(prisma.vendor, {
  softDelete: true,
  tenantScoped: true,
});

const buildSearchFilter = (organizationId: string, filters: VendorFilters) => {
  const search = filters.search?.trim();
  if (!search) {
    return { organizationId, deletedAt: null };
  }

  return {
    organizationId,
    deletedAt: null,
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { email: { contains: search, mode: "insensitive" as const } },
      { phone: { contains: search, mode: "insensitive" as const } },
      { gstNumber: { contains: search, mode: "insensitive" as const } },
    ],
  };
};

export const vendorRepository = {
  createVendor: (organizationId: string, payload: CreateVendorInput) => {
    return vendorCrudRepository.create({
      organizationId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      gstNumber: payload.gstNumber,
      address: payload.address,
    });
  },
  updateVendor: (
    organizationId: string,
    vendorId: string,
    payload: UpdateVendorInput,
  ) => {
    return vendorCrudRepository.updateById(
      vendorId,
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        gstNumber: payload.gstNumber,
        address: payload.address,
      },
      organizationId,
    );
  },
  findById: (organizationId: string, vendorId: string) => {
    return vendorCrudRepository.findById(vendorId, organizationId);
  },
  listVendors: (
    organizationId: string,
    filters: VendorFilters,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildSearchFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.vendor.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.vendor.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  archiveVendor: (organizationId: string, vendorId: string) => {
    return vendorCrudRepository.archiveById(vendorId, organizationId);
  },
};
