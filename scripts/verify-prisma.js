// Script to verify Prisma Client has User model
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log("Checking Prisma Client...");
    
    // Check if user model exists
    if (!prisma.user) {
      console.error("❌ ERROR: prisma.user is undefined!");
      console.error("Prisma Client was generated without the User model.");
      console.error("Run: npx prisma generate");
      process.exit(1);
    }
    
    // Try to query users table
    const userCount = await prisma.user.count();
    console.log(`✅ Prisma Client is working correctly!`);
    console.log(`✅ Found ${userCount} users in database`);
    
    await prisma.$disconnect();
    process.exit(0);
  } catch (e) {
    console.error("❌ ERROR:", e.message);
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

verify();
