-- CreateTable
CREATE TABLE "Qris" (
    "id" SERIAL NOT NULL,
    "Foto" TEXT NOT NULL,
    "Judul" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Qris_pkey" PRIMARY KEY ("id")
);
