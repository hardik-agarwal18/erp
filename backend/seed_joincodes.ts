import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  const orgs = await prisma.organization.findMany({ where: { joinCode: null } });
  for (const org of orgs) {
    const code = `${org.name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, "")}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    await prisma.organization.update({
      where: { id: org.id },
      data: { joinCode: code },
    });
    console.log(`Updated org ${org.name} with joinCode ${code}`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
