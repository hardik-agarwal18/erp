import { randomUUID } from "crypto";
import prisma from "../../config/database.js";
import { hashPassword } from "../../lib/bcrypt.js";
import { organizationService } from "../organizations/organization.service.js";
import { demoRepository } from "./demo.repository.js";

export const demoService = {
  seedDemoEnvironment: async () => {
    const password = "password123";
    const hashedPassword = await hashPassword(password);
    const uuid = randomUUID().split("-")[0];
    const email = `demo-${uuid}@example.com`;

    // 1. Create a demo user
    const user = await prisma.user.create({
      data: {
        name: "Demo User",
        email,
        password: hashedPassword,
        isVerified: true,
      },
    });

    // 2. Create multiple organizations (workspaces)
    const org1 = await organizationService.createOrganization(user.id, {
      name: `Acme Corp ${uuid}`,
    });
    const org2 = await organizationService.createOrganization(user.id, {
      name: `Globex Inc ${uuid}`,
    });

    // 3. Seed data for both
    await demoRepository.seedWorkspaceData(org1.id, "Acme");
    await demoRepository.seedWorkspaceData(org2.id, "Globex");

    return { email, password, organization: org1 };
  },
};
