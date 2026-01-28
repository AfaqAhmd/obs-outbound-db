-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('row', 'enriched');

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('success', 'failed');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "niche" TEXT NOT NULL,
    "uploader_name" TEXT NOT NULL,
    "data_type" "DataType" NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL,
    "original_filename" TEXT,
    "row_count" INTEGER,
    "status" "UploadStatus" NOT NULL DEFAULT 'success',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "row_data" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "company" TEXT,
    "name" TEXT,
    "street" TEXT,
    "city" TEXT,
    "state" TEXT,
    "country" TEXT,
    "website" TEXT,
    "normalized_website" TEXT,
    "google_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "row_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enriched_data" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "upload_id" TEXT NOT NULL,
    "business_name" TEXT,
    "normalized_website" TEXT,
    "company_linkedin" TEXT,
    "full_name" TEXT,
    "first_name" TEXT,
    "job_title" TEXT,
    "person_linkedin" TEXT,
    "fme" TEXT,
    "e1" TEXT,
    "e2" TEXT,
    "e3" TEXT,
    "e4" TEXT,
    "sub1" TEXT,
    "sub2" TEXT,
    "sub3" TEXT,
    "sub4" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enriched_data_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_name_key" ON "clients"("name");

-- CreateIndex
CREATE INDEX "uploads_client_id_idx" ON "uploads"("client_id");

-- CreateIndex
CREATE INDEX "uploads_upload_date_idx" ON "uploads"("upload_date");

-- CreateIndex
CREATE INDEX "row_data_client_id_idx" ON "row_data"("client_id");

-- CreateIndex
CREATE INDEX "row_data_upload_id_idx" ON "row_data"("upload_id");

-- CreateIndex
CREATE INDEX "row_data_created_at_idx" ON "row_data"("created_at");

-- CreateIndex
CREATE INDEX "row_data_normalized_website_idx" ON "row_data"("normalized_website");

-- CreateIndex
CREATE INDEX "enriched_data_client_id_idx" ON "enriched_data"("client_id");

-- CreateIndex
CREATE INDEX "enriched_data_upload_id_idx" ON "enriched_data"("upload_id");

-- CreateIndex
CREATE INDEX "enriched_data_created_at_idx" ON "enriched_data"("created_at");

-- CreateIndex
CREATE INDEX "enriched_data_normalized_website_idx" ON "enriched_data"("normalized_website");

-- AddForeignKey
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "row_data" ADD CONSTRAINT "row_data_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "row_data" ADD CONSTRAINT "row_data_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enriched_data" ADD CONSTRAINT "enriched_data_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enriched_data" ADD CONSTRAINT "enriched_data_upload_id_fkey" FOREIGN KEY ("upload_id") REFERENCES "uploads"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
