import prisma from "../../../config/database.js";
import { parsePagination } from "../../../shared/utils/pagination.js";
import { CustomerFilters, CreateCustomerInput, UpdateCustomerInput } from "./customer.types.js";

const buildSearchFilter = (organizationId: string, filters: CustomerFilters) => {
  const search = filters.search?.trim();
  const filter: any = { organizationId, deletedAt: null };

  if (filters.status) filter.status = filters.status;
  if (filters.type) filter.type = filters.type;

  if (search) {
    filter.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { gstNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  return filter;
};

export const customerRepository = {
  createCustomer: async (organizationId: string, code: string, payload: CreateCustomerInput) => {
    return (prisma.customer.create as any)({
      data: {
        ...payload,
        organizationId,
        code,
      } as any,
      include: {
        creditProfile: true,
      }
    });
  },

  updateCustomer: async (organizationId: string, customerId: string, payload: UpdateCustomerInput) => {
    // For deep updates, Prisma's update is limited. We might need to split this or rely on nested updates if needed.
    // For simplicity right now, we will update scalar fields on the customer.
    // In a full implementation, contacts/addresses would be managed through separate endpoints or complex upsert logic.
    return (prisma.customer.update as any)({
      where: { id: customerId, organizationId },
      data: {
        status: (payload as any).status as any,
      } as any,
      include: {
        creditProfile: true,
      }
    });
  },

  findById: async (organizationId: string, customerId: string) => {
    return (prisma.customer.findUnique as any)({
      where: { id: customerId, organizationId, deletedAt: null },
      include: {
        creditProfile: true,
      }
    });
  },

  listCustomers: async (organizationId: string, filters: CustomerFilters, query: Record<string, unknown>) => {
    const pagination = parsePagination(query);
    const where = buildSearchFilter(organizationId, filters);

    const [items, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
        include: { creditProfile: true }
      }),
      prisma.customer.count({ where }),
    ]);

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
    };
  },

  archiveCustomer: async (organizationId: string, customerId: string) => {
    return prisma.customer.update({
      where: { id: customerId, organizationId },
      data: { deletedAt: new Date(), status: "INACTIVE" } as any
    });
  },

  restoreCustomer: async (organizationId: string, customerId: string) => {
    return prisma.customer.update({
      where: { id: customerId, organizationId },
      data: { deletedAt: null, status: "ACTIVE" } as any
    });
  },
};
