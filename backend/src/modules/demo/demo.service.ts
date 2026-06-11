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

    const { faker } = await import("@faker-js/faker");

    const userName = faker.person.fullName();
    const org1Name = faker.company.name();
    const org2Name = faker.company.name();

    // 1. Create a demo user (owner)
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

    // 3. Create additional users and add to org1
    const roles = await prisma.role.findMany({
      where: { organizationId: org1.id, isSystem: true }
    });

    const roleNames = ["admin", "manager", "member"];
    for (let i = 0; i < roleNames.length; i++) {
      const role = roles.find(r => r.name === roleNames[i]);
      if (role) {
        const additionalUser = await prisma.user.create({
          data: {
            name: faker.person.fullName(),
            email: `demo-${roleNames[i]}-${uuid}@example.com`,
            password: hashedPassword,
            isVerified: true,
          },
        });
        
        await prisma.organizationMember.create({
          data: {
            organizationId: org1.id,
            userId: additionalUser.id,
            roleId: role.id,
          }
        });
      }
    }

    // 4. Seed data for both
    await demoRepository.seedWorkspaceData(org1.id, org1Name, user.id);
    await demoRepository.seedWorkspaceData(org2.id, org2Name, user.id);

    return { email, password, organization: org1 };
  },
};

