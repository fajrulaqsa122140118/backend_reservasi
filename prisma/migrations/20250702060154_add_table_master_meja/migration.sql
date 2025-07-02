-- CreateTable
CREATE TABLE "MasterMeja" (
    "id" SERIAL NOT NULL,
    "NamaMeja" TEXT NOT NULL,
    "Foto" TEXT,
    "Deskripsi" TEXT,
    "Harga" TEXT NOT NULL,
    "NoMeja" INTEGER NOT NULL,
    "TipeMeja" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "Closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "MasterMeja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JadwalMeja" (
    "id" SERIAL NOT NULL,
    "mejaId" INTEGER NOT NULL,
    "StartTime" TIMESTAMP(3) NOT NULL,
    "EndTime" TIMESTAMP(3) NOT NULL,
    "Status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JadwalMeja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "mejaId" INTEGER NOT NULL,
    "Tanggal" TIMESTAMP(3) NOT NULL,
    "Harga" TEXT NOT NULL,
    "KodeBooking" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JamBooking" (
    "id" SERIAL NOT NULL,
    "BookingId" INTEGER NOT NULL,
    "idMeja" INTEGER NOT NULL,
    "idJadwalMeja" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "JamBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiodataBooking" (
    "id" SERIAL NOT NULL,
    "BookingId" INTEGER NOT NULL,
    "Nama" TEXT NOT NULL,
    "NoTelp" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BiodataBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BuktiPembayaran" (
    "id" SERIAL NOT NULL,
    "KodeBookingID" TEXT,
    "Foto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "BuktiPembayaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Banner" (
    "id" SERIAL NOT NULL,
    "Foto" TEXT NOT NULL,
    "Judul" TEXT NOT NULL,
    "IsActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Closed" (
    "id" SERIAL NOT NULL,
    "startdate" TIMESTAMP(3) NOT NULL,
    "enddate" TIMESTAMP(3) NOT NULL,
    "Deskripsi" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Closed_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_KodeBooking_key" ON "Booking"("KodeBooking");

-- AddForeignKey
ALTER TABLE "JadwalMeja" ADD CONSTRAINT "JadwalMeja_mejaId_fkey" FOREIGN KEY ("mejaId") REFERENCES "MasterMeja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_mejaId_fkey" FOREIGN KEY ("mejaId") REFERENCES "MasterMeja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamBooking" ADD CONSTRAINT "JamBooking_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamBooking" ADD CONSTRAINT "JamBooking_idMeja_fkey" FOREIGN KEY ("idMeja") REFERENCES "MasterMeja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JamBooking" ADD CONSTRAINT "JamBooking_idJadwalMeja_fkey" FOREIGN KEY ("idJadwalMeja") REFERENCES "JadwalMeja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiodataBooking" ADD CONSTRAINT "BiodataBooking_BookingId_fkey" FOREIGN KEY ("BookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BuktiPembayaran" ADD CONSTRAINT "BuktiPembayaran_KodeBookingID_fkey" FOREIGN KEY ("KodeBookingID") REFERENCES "Booking"("KodeBooking") ON DELETE SET NULL ON UPDATE CASCADE;
