/*
  Warnings:

  - You are about to drop the column `company` on the `row_data` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `row_data` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "row_data" DROP COLUMN "company",
DROP COLUMN "name",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "phone_number" TEXT,
ADD COLUMN     "rating" TEXT,
ADD COLUMN     "review" TEXT;
