-- CreateTable
CREATE TABLE "SettinganWeb" (
    "id" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "deskripsi" TEXT,
    "alamat" TEXT,
    "kodePos" TEXT,
    "telepon" TEXT[],
    "faks" TEXT,
    "email" TEXT,
    "jamOperasional" TEXT,
    "menuQuick" JSONB NOT NULL,
    "menuTentang" JSONB NOT NULL,
    "menuKontak" JSONB NOT NULL,
    "sosialMedia" JSONB NOT NULL,
    "copyright" TEXT,
    "developer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SettinganWeb_pkey" PRIMARY KEY ("id")
);
