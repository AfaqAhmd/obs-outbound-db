/*
  Warnings:

  - You are about to drop the column `normalize_business_name` on the `enriched_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "enriched_data" DROP COLUMN "normalize_business_name",
ADD COLUMN     "normalized_business_name" TEXT;
