import prisma from "../../config/database.js";
import { BaseRepository } from "../../database/base.repository.js";
import { parsePagination } from "../../shared/utils/pagination.js";
import {
  CustomerFilters,
  CreateCustomerInput,
  UpdateCustomerInput,
} from "./customer.types.js";

const customerCrudRepository = new BaseRepository<
  Awaited<ReturnType<typeof prisma.customer.create>>,
  Parameters<typeof prisma.customer.create>[0]["data"],
  Parameters<typeof prisma.customer.update>[0]["data"]
>(prisma.customer, {
  softDelete: true,
  tenantScoped: true,
});

const buildSearchFilter = (
  organizationId: string,
  filters: CustomerFilters,
) => {
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

export const customerRepository = {
  createCustomer: (organizationId: string, payload: CreateCustomerInput) => {
    return customerCrudRepository.create({
      organizationId,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      gstNumber: payload.gstNumber,
      address: payload.address,
      creditLimit: payload.creditLimit,
    });
  },
  updateCustomer: (
    organizationId: string,
    customerId: string,
    payload: UpdateCustomerInput,
  ) => {
    return customerCrudRepository.updateById(
      customerId,
      {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        gstNumber: payload.gstNumber,
        address: payload.address,
        creditLimit: payload.creditLimit,
      },
      organizationId,
    );
  },
  findById: (organizationId: string, customerId: string) => {
    return customerCrudRepository.findById(customerId, organizationId);
  },
  listCustomers: (
    organizationId: string,
    filters: CustomerFilters,
    query: Record<string, unknown>,
  ) => {
    const pagination = parsePagination(query);
    const where = buildSearchFilter(organizationId, filters);

    return prisma
      .$transaction([
        prisma.customer.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: pagination.skip,
          take: pagination.take,
        }),
        prisma.customer.count({ where }),
      ])
      .then(([items, total]) => ({
        items,
        total,
        page: pagination.page,
        limit: pagination.limit,
      }));
  },
  archiveCustomer: (organizationId: string, customerId: string) => {
    return customerCrudRepository.archiveById(customerId, organizationId);
  },
  restoreCustomer: (organizationId: string, customerId: string) => {
    return customerCrudRepository.restoreById(customerId, organizationId);
  },
};
