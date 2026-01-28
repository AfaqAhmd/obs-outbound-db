-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "niches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "niches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploaders" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploaders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_username_key" ON "admins"("username");

-- CreateIndex
CREATE UNIQUE INDEX "niches_name_key" ON "niches"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uploaders_name_key" ON "uploaders"("name");

-- AlterTable
ALTER TABLE "uploads" ADD COLUMN "niche_id" TEXT;
ALTER TABLE "uploads" ADD COLUMN "uploader_id" TEXT;

-- Migrate existing niche data
INSERT INTO "niches" ("id", "name", "created_at")
SELECT DISTINCT gen_random_uuid()::text, "niche", CURRENT_TIMESTAMP
FROM "uploads"
WHERE "niche" IS NOT NULL AND "niche" != ''
ON CONFLICT ("name") DO NOTHING;

-- Migrate existing uploader data
INSERT INTO "uploaders" ("id", "name", "created_at")
SELECT DISTINCT gen_random_uuid()::text, "uploader_name", CURRENT_TIMESTAMP
FROM "uploads"
WHERE "uploader_name" IS NOT NULL AND "uploader_name" != ''
ON CONFLICT ("name") DO NOTHING;

-- Update foreign keys with migrated data
UPDATE "uploads" u
SET "niche_id" = n."id"
FROM "niches" n
WHERE u."niche" = n."name" AND u."niche_id" IS NULL;

UPDATE "uploads" u
SET "uploader_id" = up."id"
FROM "uploaders" up
WHERE u."uploader_name" = up."name" AND u."uploader_id" IS NULL;

-- Create default entries for any NULL values
DO $$
DECLARE
    default_niche_id TEXT;
    default_uploader_id TEXT;
BEGIN
    INSERT INTO "niches" ("id", "name", "created_at")
    VALUES (gen_random_uuid()::text, 'Unknown', CURRENT_TIMESTAMP)
    ON CONFLICT ("name") DO NOTHING
    RETURNING "id" INTO default_niche_id;
    
    SELECT "id" INTO default_niche_id FROM "niches" WHERE "name" = 'Unknown';
    
    INSERT INTO "uploaders" ("id", "name", "created_at")
    VALUES (gen_random_uuid()::text, 'Unknown', CURRENT_TIMESTAMP)
    ON CONFLICT ("name") DO NOTHING
    RETURNING "id" INTO default_uploader_id;
    
    SELECT "id" INTO default_uploader_id FROM "uploaders" WHERE "name" = 'Unknown';
    
    UPDATE "uploads" SET "niche_id" = default_niche_id WHERE "niche_id" IS NULL;
    UPDATE "uploads" SET "uploader_id" = default_uploader_id WHERE "uploader_id" IS NULL;
END $$;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_niche_id_fkey" FOREIGN KEY ("niche_id") REFERENCES "niches"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "uploaders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable - Make columns NOT NULL
ALTER TABLE "uploads" ALTER COLUMN "niche_id" SET NOT NULL;
ALTER TABLE "uploads" ALTER COLUMN "uploader_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "uploads_niche_id_idx" ON "uploads"("niche_id");

-- CreateIndex
CREATE INDEX "uploads_uploader_id_idx" ON "uploads"("uploader_id");

-- AlterTable - Drop old columns
ALTER TABLE "uploads" DROP COLUMN "niche";
ALTER TABLE "uploads" DROP COLUMN "uploader_name";
