import fs from "fs";
import { generateAccessToken } from "../src/domains/iam/auth/auth.tokens.js";
import prisma from "../src/config/database.js";

async function runTests() {
  console.log("Loading collection...");
  const collectionData = fs.readFileSync("erp-postman-collection.json", "utf-8");
  const collection = JSON.parse(collectionData);

  console.log("Connecting to database to generate valid auth token...");
  const user = await prisma.user.findFirst({
    include: { organizationMembers: true }
  });

  if (!user || user.organizationMembers.length === 0) {
    console.error("No valid user with organization members found in the database.");
    await prisma.$disconnect();
    return;
  }

  const membership = user.organizationMembers[0];
  
  // Generate token matching the server's expected payload
  const { token } = generateAccessToken(user.id, {
    organizationId: membership.organizationId,
    membershipId: membership.id,
    role: membership.role
  });

  console.log(`Generated auth token for user ${user.email} in org ${membership.organizationId}`);

  let totalGetRequests = 0;
  let successfulRequests = 0;
  let failedRequests500 = 0;
  let otherFailedRequests = 0;
  
  const breakingEndpoints: { method: string, url: string, status: number, body: string }[] = [];

  for (const folder of collection.item) {
    for (const item of folder.item) {
      if (item.request.method === "GET") {
        totalGetRequests++;
        
        let rawUrl = item.request.url.raw;
        // Replace {{baseUrl}}
        rawUrl = rawUrl.replace("{{baseUrl}}", "http://localhost:5000");
        
        // Postman variables in the path (e.g. :id or {{id}}) 
        // We will replace them with a valid looking UUID or a 1
        const dummyId = "00000000-0000-0000-0000-000000000001";
        const dummyString = "test";
        
        // Replace /:param with /dummyId
        rawUrl = rawUrl.replace(/\/:[a-zA-Z0-9_]+/g, `/${dummyId}`);
        rawUrl = rawUrl.replace(/\{\{[a-zA-Z0-9_]+\}\}/g, dummyId);
        
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const res = await fetch(rawUrl, {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            signal: controller.signal as any
          });
          
          clearTimeout(timeoutId);
          
          if (res.status >= 200 && res.status < 400) {
            successfulRequests++;
            console.log(`[OK] ${res.status} GET ${rawUrl}`);
          } else if (res.status === 500) {
            failedRequests500++;
            const text = await res.text();
            console.error(`[FAIL] ${res.status} GET ${rawUrl} - ${text.substring(0, 100)}`);
            breakingEndpoints.push({
              method: "GET",
              url: rawUrl,
              status: res.status,
              body: text
            });
          } else {
            // 400, 401, 403, 404
            otherFailedRequests++;
            console.log(`[IGNORE] ${res.status} GET ${rawUrl}`);
          }
        } catch (e: any) {
          failedRequests500++;
          console.error(`[ERROR] GET ${rawUrl} - ${e.message}`);
          breakingEndpoints.push({
            method: "GET",
            url: rawUrl,
            status: 0,
            body: e.message
          });
        }
      }
    }
  }

  await prisma.$disconnect();

  console.log("\n=============================");
  console.log("TEST RUN SUMMARY");
  console.log("=============================");
  console.log(`Total GET Requests : ${totalGetRequests}`);
  console.log(`Successful (2xx-3xx): ${successfulRequests}`);
  console.log(`Ignored (4xx)       : ${otherFailedRequests}`);
  console.log(`Breaking (500s)     : ${failedRequests500}`);
  
  if (breakingEndpoints.length > 0) {
    console.log("\nBREAKING ENDPOINTS (500 ERRORS):");
    breakingEndpoints.forEach(err => {
      console.log(`- ${err.url}: ${err.body.substring(0, 200)}`);
    });
  } else {
    console.log("\nNo 500 errors detected! All GET endpoints survived without crashing.");
  }
}

runTests().catch(console.error);
