/*
  Warnings:

  - You are about to drop the `Closed` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ClosedType" AS ENUM ('TUTUP', 'BUKA');

-- DropTable
DROP TABLE "Closed";

-- CreateTable
CREATE TABLE "closed" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" "ClosedType" NOT NULL DEFAULT 'TUTUP',
    "reason" TEXT,
    "referenceId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closed_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "closed" ADD CONSTRAINT "closed_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "closed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
