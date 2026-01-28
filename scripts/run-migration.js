import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function runMigration() {
  const migrationPath = path.join(
    __dirname,
    "../prisma/migrations/20250128000000_add_admin_niche_uploader/migration.sql"
  );
  
  const sql = fs.readFileSync(migrationPath, "utf-8");
  
  // Split by semicolons and execute each statement
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));
  
  console.log(`Executing ${statements.length} SQL statements...`);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log("✓ Executed statement");
      } catch (e) {
        console.error("✗ Error executing statement:", e.message);
        console.error("Statement:", statement.substring(0, 100));
      }
    }
  }
  
  await prisma.$disconnect();
  console.log("Migration completed!");
}

runMigration().catch(console.error);
