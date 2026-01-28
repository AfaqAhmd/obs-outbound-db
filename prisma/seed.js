import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default admin user
  const adminUsername = "admin";
  const adminPassword = "admin123"; // Change this in production!

  const existingAdmin = await prisma.admin.findFirst({
    where: { username: adminUsername }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.admin.create({
      data: {
        username: adminUsername,
        password: hashedPassword
      }
    });
    console.log(`Admin user created: ${adminUsername} / ${adminPassword}`);
  }

  // Create sample client
  const sampleName = "Acme Corp";

  const existing = await prisma.client.findFirst({
    where: { name: sampleName }
  });

  if (!existing) {
    await prisma.client.create({
      data: {
        name: sampleName
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

