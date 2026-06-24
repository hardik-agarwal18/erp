const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Applying AuditLog immutability trigger...");

  // Drop if exists first to allow re-runs
  try {
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS prevent_audit_modification_trigger ON "AuditLog";`);
    await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS prevent_audit_modification();`);
  } catch (e) {}

  await prisma.$executeRawUnsafe(`
    CREATE FUNCTION prevent_audit_modification()
    RETURNS trigger AS $$
    BEGIN
        RAISE EXCEPTION 'Audit logs are immutable';
    END;
    $$ LANGUAGE plpgsql;
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TRIGGER prevent_audit_modification_trigger
    BEFORE UPDATE OR DELETE ON "AuditLog"
    FOR EACH ROW
    EXECUTE FUNCTION prevent_audit_modification();
  `);

  console.log("Trigger applied successfully.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
