/*
  Warnings:

  - You are about to drop the `OpenException` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "OpenException" DROP CONSTRAINT "OpenException_closedId_fkey";

-- DropTable
DROP TABLE "OpenException";
