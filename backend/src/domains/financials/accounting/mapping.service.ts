import { prisma } from "../../../config/database.js";

export const accountMappingService = {
  getDefaultAccounts: async (organizationId: string): Promise<Record<string, string>> => {
    const mappings = await prisma.systemAccountMapping.findMany({
      where: { organizationId },
    });

    if (mappings.length === 0) {
      throw new Error(`Default account mappings not found for organization ${organizationId}. Please configure them first.`);
    }

    const mappingObj: Record<string, string> = {};
    for (const m of mappings) {
      mappingObj[m.mappingKey] = m.accountId;
    }

    return mappingObj;
  },

  getRequiredAccount: async (organizationId: string, accountKey: string): Promise<string> => {
    const mapping = await accountMappingService.getDefaultAccounts(organizationId);
    const accountId = mapping[accountKey];

    if (!accountId) {
      throw new Error(`Required account mapping '${String(accountKey)}' is missing for organization ${organizationId}. Please configure it.`);
    }

    return accountId;
  },

  setMapping: async (organizationId: string, mappingKey: string, accountId: string): Promise<void> => {
    await prisma.systemAccountMapping.upsert({
      where: {
        organizationId_mappingKey: {
          organizationId,
          mappingKey,
        },
      },
      update: { accountId },
      create: {
        organizationId,
        mappingKey,
        accountId,
      },
    });
  }
};
