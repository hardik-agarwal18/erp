import { randomUUID } from "crypto";
import prisma from "../../config/database.js";
import { hashPassword } from "../../lib/bcrypt.js";
import { organizationService } from "../organizations/organization.service.js";
import { demoRepository } from "./demo.repository.js";
import { faker } from "@faker-js/faker";

export const demoService = {
  seedDemoEnvironment: async () => {
    const password = "password123";
    const hashedPassword = await hashPassword(password);
    const uuid = randomUUID().split("-")[0];
    const email = `demo-${uuid}@example.com`;

    const userName = faker.person.fullName();
    const org1Name = faker.company.name();
    const org2Name = faker.company.name();

    // 1. Create a demo user
    const user = await prisma.user.create({
      data: {
        name: userName,
        email,
        password: hashedPassword,
        isVerified: true,
      },
    });

    // 2. Create multiple organizations (workspaces)
    const org1 = await organizationService.createOrganization(user.id, {
      name: org1Name,
    });
    const org2 = await organizationService.createOrganization(user.id, {
      name: org2Name,
    });

    // 3. Seed data for both
    await demoRepository.seedWorkspaceData(org1.id, org1Name);
    await demoRepository.seedWorkspaceData(org2.id, org2Name);

    return { email, password, organization: org1 };
  },
};

