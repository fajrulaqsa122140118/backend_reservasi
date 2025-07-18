/*
  Warnings:

  - You are about to drop the column `menuKontak` on the `SettinganWeb` table. All the data in the column will be lost.
  - You are about to drop the column `menuQuick` on the `SettinganWeb` table. All the data in the column will be lost.
  - You are about to drop the column `menuTentang` on the `SettinganWeb` table. All the data in the column will be lost.
  - You are about to drop the column `sosialMedia` on the `SettinganWeb` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SettinganWeb" DROP COLUMN "menuKontak",
DROP COLUMN "menuQuick",
DROP COLUMN "menuTentang",
DROP COLUMN "sosialMedia";
