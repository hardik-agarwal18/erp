import prisma from "./src/config/database.js";

async function run() {
  const logs = await prisma.emailLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5
  });
  console.log("Recent Email Logs:", logs);
  process.exit(0);
}

run().catch(console.error);
