/*
  Warnings:

  - Added the required column `Alamat` to the `BiodataBooking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BiodataBooking" ADD COLUMN     "Alamat" TEXT NOT NULL;
