import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

let prisma;

if (!globalThis.prisma) {
  const client = new PrismaClient();
  const dbUrl = process.env.DATABASE_URL || "";
  const isAccelerateUrl =
    dbUrl.startsWith("prisma://") || dbUrl.startsWith("prisma+postgres://");
  globalThis.prisma = isAccelerateUrl ? client.$extends(withAccelerate()) : client;
}

prisma = globalThis.prisma;

export default prisma;

