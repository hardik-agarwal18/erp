
import prisma from "../../config/database.js";
import logger from "../../config/logger.js";
import { CacheService } from "./cache.service.js";
import { CACHE_DOMAINS } from "./cache.constants.js";

export const warmCache = async () => {
  logger.info("Starting cache warming...");

  try {
    // 1. Get all active organizations (limit to avoid memory issues on huge deployments)
    // In a real enterprise system, you might only warm up "active" tenants
    const organizations = await prisma.organization.findMany({
      take: 100, // Just warm the top 100 for now
      select: { id: true },
    });

    for (const org of organizations) {
      // Warm roles
      await CacheService.getOrSet({
        organizationId: org.id,
        domain: CACHE_DOMAINS.ROLES,
        resource: "list",
        fetcher: async () => {
          return prisma.role.findMany({
            where: { organizationId: org.id },
          });
        },
      });

      // Warm organization settings
      await CacheService.getOrSet({
        organizationId: org.id,
        domain: CACHE_DOMAINS.ORGANIZATIONS,
        resource: "settings",
        fetcher: async () => {
          return prisma.organization.findUnique({
            where: { id: org.id },
          });
        },
      });
    }

    logger.info("Cache warming completed successfully.");
  } catch (error) {
    logger.error({ error }, "Cache warming failed. Non-fatal, continuing...");
  }
};
