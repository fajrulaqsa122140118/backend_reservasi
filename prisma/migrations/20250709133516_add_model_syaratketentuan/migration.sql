-- CreateTable
CREATE TABLE "syaratketentuan" (
    "id" SERIAL NOT NULL,
    "syarat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "syaratketentuan_pkey" PRIMARY KEY ("id")
);
