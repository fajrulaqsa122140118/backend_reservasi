/*
  Warnings:

  - A unique constraint covering the columns `[NamaMeja]` on the table `MasterMeja` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "OpenException" (
    "id" SERIAL NOT NULL,
    "closedId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "Keterangan" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenException_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MasterMeja_NamaMeja_key" ON "MasterMeja"("NamaMeja");

-- AddForeignKey
ALTER TABLE "OpenException" ADD CONSTRAINT "OpenException_closedId_fkey" FOREIGN KEY ("closedId") REFERENCES "Closed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
