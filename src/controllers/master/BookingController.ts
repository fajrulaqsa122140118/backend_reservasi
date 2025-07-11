import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'

function generateKodeBooking(tanggal: string): string {
  const formatTanggal = tanggal.replace(/-/g, '') // 2025-07-03 → 20250703
  const random = Math.random().toString(36).substring(2, 6).toUpperCase() // 4 karakter acak
  return `BK-${formatTanggal}-${random}`
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
                JamBooking: {
                  select: {
                    JadwalMeja: true,
                  },
                },
              },
            },
            BuktiPembayaran: {
              select: {
                id: true,
                Foto: true,
                createdAt: true,
              },
            },
          },
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.booking.count({ where: whereCondition }),
      ])

      return res.status(StatusCodes.OK).json(
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
      const { mejaId, tanggal, jadwalIds } = req.body

      if (!mejaId || !tanggal || !jadwalIds || !Array.isArray(jadwalIds)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field mejaId, tanggal, dan jadwalIds wajib diisi dan jadwalIds harus berupa array.',
        })
      }

      const tanggalBooking = new Date(tanggal)

      const closedData = await prisma.closed.findFirst()
      if (closedData) {
        const startDate = new Date(closedData.startdate)
        const endDate = new Date(closedData.enddate)

        if (tanggalBooking >= startDate && tanggalBooking <= endDate) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: `Toko sedang tutup pada tanggal tersebut (${closedData.Deskripsi})`,
          })
        }
      }

      const meja = await prisma.masterMeja.findFirst({
        where: { id: Number(mejaId) },
      })

      if (!meja) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Meja tidak ditemukan',
        })
      }

      const validJadwals = await prisma.jadwalMeja.findMany({
        where: {
          id: { in: jadwalIds },
          mejaId: mejaId,
        },
      })

      if (validJadwals.length !== jadwalIds.length) {
        return res.status(400).json({
          message: 'Jadwal tidak sesuai dengan meja yang dipilih.',
        })
      }

      // Hitung total jam dari jadwal
      const getDurationInHours = (startTime: string, endTime: string): number => {
        const [startHour, startMinute] = startTime.split(':').map(Number)
        const [endHour, endMinute] = endTime.split(':').map(Number)
        const start = new Date(); start.setHours(startHour, startMinute, 0, 0)
        const end = new Date(); end.setHours(endHour, endMinute, 0, 0)
        const diffMs = end.getTime() - start.getTime()
        return diffMs / (1000 * 60 * 60)
      }

      let totalDurasiJam = 0
      validJadwals.forEach(jadwal => {
        totalDurasiJam += getDurationInHours(jadwal.StartTime, jadwal.EndTime)
      })

      const kodeBooking = generateKodeBooking(tanggal)

      const booking = await prisma.booking.create({
        data: {
          meja: { connect: { id: Number(mejaId) } },
          Tanggal: tanggalBooking,
          Harga: meja.Harga,
          KodeBooking: kodeBooking,
          durasiJam: totalDurasiJam.toString(), // pastikan field ini tersedia di model
        },
      })
      const totalBayar = totalDurasiJam * Number(meja.Harga)


      const jamBookingData = jadwalIds.map((jadwalId: number) => ({
        BookingId: booking.id,
        idMeja: Number(mejaId),
        idJadwalMeja: jadwalId,
      }))

      await prisma.jamBooking.createMany({ data: jamBookingData })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Booking berhasil dibuat', {
          booking,
          totalDurasiJam,
          jam_booking: jamBookingData,
          totalBayar,
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
              JamBooking: {
                select: {
                  JadwalMeja:true,
                },
              },
            },
          },
        },
      })
    
      if (!bookingData) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Booking tidak ditemukan',
        })
      }
    
      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Success', bookingData),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}
export default BookingController
 