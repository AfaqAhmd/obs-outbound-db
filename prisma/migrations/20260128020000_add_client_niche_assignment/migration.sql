-- CreateTable
CREATE TABLE "client_niches" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "niche_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_niches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "client_niches_client_id_niche_id_key" ON "client_niches"("client_id", "niche_id");

-- CreateIndex
CREATE INDEX "client_niches_client_id_idx" ON "client_niches"("client_id");

-- CreateIndex
CREATE INDEX "client_niches_niche_id_idx" ON "client_niches"("niche_id");

-- AddForeignKey
ALTER TABLE "client_niches" ADD CONSTRAINT "client_niches_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_niches" ADD CONSTRAINT "client_niches_niche_id_fkey" FOREIGN KEY ("niche_id") REFERENCES "niches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
