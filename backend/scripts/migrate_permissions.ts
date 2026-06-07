import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Permission Migration...");

  // 1. Find legacy permissions
  const legacyPermissions = await prisma.permission.findMany({
    where: {
      name: {
        contains: "_legacy",
      },
    },
  });

  console.log(`Found ${legacyPermissions.length} legacy permissions.`);

  if (legacyPermissions.length === 0) {
    console.log("No legacy permissions found. Migration complete.");
    return;
  }

  const legacyPermissionIds = legacyPermissions.map((p) => p.id);

  // 2. Remove RolePermission references
  const deletedRolePermissions = await prisma.rolePermission.deleteMany({
    where: {
      permissionId: {
        in: legacyPermissionIds,
      },
    },
  });

  console.log(`Deleted ${deletedRolePermissions.count} legacy RolePermission rows.`);

  // 3. Remove legacy Permission records
  const deletedPermissions = await prisma.permission.deleteMany({
    where: {
      id: {
        in: legacyPermissionIds,
      },
    },
  });

  console.log(`Deleted ${deletedPermissions.count} legacy Permission records.`);

  // 4. Verify remaining
  const remainingPermissions = await prisma.permission.count();
  console.log(`Remaining active permissions: ${remainingPermissions}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
