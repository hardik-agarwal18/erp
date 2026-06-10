import prisma from "../src/config/database.js";
import jwt from "jsonwebtoken";

const EMAIL_VERIFY_SECRET = "CHANGE_ME_IN_PRODUCTION_email_verify_secret";

async function main() {
  console.log("Fetching token from database...");
  const user = await prisma.user.findUnique({
    where: { email: "testuser123@example.com" }
  });

  if (!user) {
    console.error("User not found in database.");
    return;
  }

  const tokenRecord = await prisma.emailVerificationToken.findFirst({
    where: { userId: user.id }
  });

  if (!tokenRecord) {
    console.error("Token not found in database.");
    return;
  }

  const tokenId = tokenRecord.token;
  console.log("Found tokenId:", tokenId);

  // Generate JWT as expected by backend
  const signedToken = jwt.sign(
    {
      sub: user.id,
      jti: tokenId,
      type: "email_verify"
    },
    EMAIL_VERIFY_SECRET,
    { expiresIn: "24h" }
  );

  console.log("Generated JWT Token:", signedToken);

  console.log("Verifying email via API...");
  const verifyRes = await fetch(`http://localhost:5000/api/v1/auth/verify-email?token=${signedToken}`);
  const verifyData = await verifyRes.json();
  console.log("Verify response:", verifyData);
}

main().catch(console.error).finally(() => process.exit(0));
