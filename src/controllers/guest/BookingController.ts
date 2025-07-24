import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { sendEmail } from '@/utilities/MailerHandler'
import { PesanKonfirmasi } from '@/utilities/TemplatingEmail'

function generateKodeBooking(tanggal: string): string {
  const formatTanggal = tanggal.replace(/-/g, '') // 2025-07-03 → 20250703
  const random = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 karakter acak
  return `BK-${formatTanggal}-${random}`
}

function formatDateToIndonesian(date: Date): string {
  const formatted = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
    hour12: false,
  }).format(date) 
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const BookingController = {
  getAllBookings: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const showDeleted = req.query.showDeleted === 'true' // default: false

      const whereCondition = showDeleted
        ? {} // tampilkan semua (termasuk yang sudah soft-deleted)
        : { deletedAt: null } // hanya yang aktif

      const [bookingData, count] = await Promise.all([
        prisma.booking.findMany({
          where: whereCondition,
          include: {
            meja: {
              select: {
                id: true,
                NamaMeja: true,
              },
            },
            JamBooking: {
              include: {
                JadwalMeja: true,
              },
            },
            BiodataBooking: true,
          },
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.booking.count({ where: whereCondition }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            showDeleted ? 'Including soft-deleted data' : 'Success',
            page.paginate({ count, rows: bookingData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createBooking: async (req: Request, res: Response): Promise<any> => {
    try {
      const { tanggal, jadwalIds } = req.body

      if (!tanggal || !jadwalIds || !Array.isArray(jadwalIds)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message:
            'Field tanggal, dan jadwalIds wajib diisi dan jadwalIds harus berupa array.',
        })
      }

      const meja = await prisma.jadwalMeja.findFirst({
        where: { id: jadwalIds[0] },
        include: { meja: true },
      })

      const tanggalBooking = new Date(tanggal)

      const closedData = await prisma.closed.findFirst({
        where: {
          type: 'TUTUP',
          date: tanggalBooking,
          openedBy: {
            none: {},
          },
        },
      })

      if (closedData) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Toko sedang tutup pada tanggal tersebut (${closedData.reason})`,
        })
      }

      const validJadwals = await prisma.jadwalMeja.findMany({
        where: {
          id: { in: jadwalIds },
          mejaId: meja?.meja.id,
        },
      })

      if (validJadwals.length !== jadwalIds.length) {
        return res.status(400).json({
          message: 'Jadwal tidak sesuai dengan meja yang dipilih.',
        })
      }

      const existingBooking = await prisma.jamBooking.findMany({
        where: {
          idJadwalMeja: { in: jadwalIds },
          Booking: {
            Tanggal: tanggalBooking,
          },
        },
        include: {
          JadwalMeja: true,
        },
      })

      if (existingBooking.length > 0) {
        return res.status(StatusCodes.CONFLICT).json({
          status: StatusCodes.CONFLICT,
          message:
            'Beberapa jadwal sudah dibooking di tanggal tersebut. Silakan pilih jadwal lain.',
          data: existingBooking.map(
            (b) => b.JadwalMeja.StartTime + ' - ' + b.JadwalMeja.EndTime,
          ),
        })
      }

      const getDurationInHours = (
        startTime: string,
        endTime: string,
      ): number => {
        const [startHour, startMinute] = startTime.split(':').map(Number)
        const [endHour, endMinute] = endTime.split(':').map(Number)
        const start = new Date()
        start.setHours(startHour, startMinute, 0, 0)
        const end = new Date()
        end.setHours(endHour, endMinute, 0, 0)
        const diffMs = end.getTime() - start.getTime()
        return diffMs / (1000 * 60 * 60)
      }

      let totalDurasiJam = 0
      validJadwals.forEach((jadwal) => {
        totalDurasiJam += getDurationInHours(jadwal.StartTime, jadwal.EndTime)
      })

      const hargaPerJam = Number(meja?.meja.Harga) || 0
      const totalBayar = totalDurasiJam * hargaPerJam

      const kodeBooking = generateKodeBooking(tanggal)

      const booking = await prisma.booking.create({
        data: {
          meja: { connect: { id: Number(meja?.meja.id) } },
          Tanggal: tanggalBooking,
          Harga: hargaPerJam.toString(),
          KodeBooking: kodeBooking,
          durasiJam: totalDurasiJam.toString(),
          TotalBayar: Number(totalBayar),
        },
      })

      const jamBookingData = jadwalIds.map((jadwalId: number) => ({
        BookingId: booking.id,
        idMeja: Number(meja?.meja.id),
        idJadwalMeja: jadwalId,
      }))

      await prisma.jamBooking.createMany({ data: jamBookingData })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Booking berhasil dibuat', {
          ...booking,
          // totalDurasiJam,
          // totalBayar,
          jam_booking: jamBookingData,
          BuktiPembayaran: [],

        }),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  softdeleteBooking: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookingId = parseInt(req.params.id as string)

      const bookingData = await prisma.booking.findUnique({
        where: { id: bookingId },
      })

      if (!bookingData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Booking not found'))
      }

      const deletedBookingData = await prisma.booking.update({
        where: { id: bookingId },
        data: { deletedAt: new Date() },
      })

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', deletedBookingData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  restoreBooking: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookingId = parseInt(req.params.id as string)

      const bookingData = await prisma.booking.findUnique({
        where: { id: bookingId },
      })

      if (!bookingData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Booking not found'))
      }

      const restoredBookingData = await prisma.booking.update({
        where: { id: bookingId },
        data: { deletedAt: null },
      })

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', restoredBookingData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getBookingById: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookingId = parseInt(req.params.id as string)

      const bookingData = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          meja: {
            select: {
              id: true,
              NamaMeja: true,
            },
          },
          JamBooking: {
            include: {
              JadwalMeja: true,
            },
          },
          BiodataBooking: true,
          BuktiPembayaran: true,
        },
      })

      if (!bookingData) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Booking tidak ditemukan',
        })
      }

      // Pisahkan agar bisa atur urutan properti
      const { BiodataBooking, durasiJam, TotalBayar, ...rest } = bookingData

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Success', {
          ...rest,
          BiodataBooking,
          durasiJam: Number(durasiJam),
          totalBayar: TotalBayar ?? 0,
          BuktiPembayaran: bookingData?.BuktiPembayaran || [],
        }),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  updateKonfirmasi: async (req: Request, res: Response): Promise<any> => {
    try {
      const bookingId = parseInt(req.params.id as string)

      const bookingData = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          BuktiPembayaran: true,
          BiodataBooking: true,
          meja: {
            select: {
              NamaMeja: true,
            },
          },
          JamBooking: {
            include: {
              JadwalMeja: true,
            },
          },
        },
      })

      if (!bookingData) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Booking tidak ditemukan',
        })
      }

      if (bookingData?.BuktiPembayaran.length !== 1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Bukti pembayaran belum diupload',
        })
      }

      const updatedBookingData = await prisma.booking.update({
        where: { id: bookingId },
        data: {
          konfirmasi: bookingData?.konfirmasi === true ? false : true,
        },
      })

      await sendEmail(
        bookingData?.BiodataBooking?.[0]?.Email as string,
        'Konfirmasi Booking',
        PesanKonfirmasi(
          bookingData.BiodataBooking?.[0]?.Nama,
          `<div style="font-family: Arial, sans-serif; padding: 20px;">
            <p>
              Booking Anda telah <strong>${updatedBookingData?.konfirmasi === true ? '✅ dikonfirmasi' : '❌ ditolak'}</strong>. 
              Berikut adalah detail booking Anda:
            </p>

            <table style="margin-top: 20px; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px;">📅 <strong>Tanggal Booking:</strong></td>
                <td style="padding: 8px;">${formatDateToIndonesian(bookingData?.Tanggal)}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">🪑 <strong>Meja:</strong></td>
                <td style="padding: 8px;">${bookingData?.meja?.NamaMeja}</td>
              </tr>
              <tr>
                <td style="padding: 8px;">⏰ <strong>Jam:</strong></td>
                <td style="padding: 8px;">${bookingData?.JamBooking?.[0]?.JadwalMeja?.StartTime} – ${bookingData?.JamBooking?.[0]?.JadwalMeja?.EndTime} WIB</td>
              </tr>
              <tr>
                <td style="padding: 8px;">⏱️ <strong>Durasi:</strong></td>
                <td style="padding: 8px;">${bookingData?.durasiJam} jam</td>
              </tr>
              <tr>
                <td style="padding: 8px;">💸 <strong>Total Bayar:</strong></td>
                <td style="padding: 8px;">Rp ${bookingData?.TotalBayar}</td>
              </tr>
             <tr>
                <td style="padding: 8px;">🔖 <strong>Kode Booking:</strong></td>
                <td style="padding: 8px;">${bookingData?.KodeBooking}</td>
              </tr>
            </table>

            <p style="margin-top: 30px;">Silakan datang sesuai jadwal. Terima kasih telah melakukan booking di <strong>Dongans Billiard</strong> 🎱</p>
            <p style="margin-top: 30px;">Jika Jika ada pertanyaan atau kendala terkait booking Anda, silakan hubungi admin melalui WhatsApp di <strong>0812-3456-7890</strong> 📞.</p>

          </div>
          `,
        ),
      )

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', updatedBookingData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}
export default BookingController
