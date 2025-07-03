import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'

// Fungsi untuk menghasilkan kode booking
// Format: BK-YYYYMMDD-RRRR (contoh: BK-20250703-ABCD)
// Di mana YYYYMMDD adalah tanggal dalam format tahun-bulan-tanggal tanpa tanda hubung
// RRRR adalah 4 karakter acak yang dihasilkan dari kombinasi huruf dan angka
// Contoh: BK-20250703-ABCD
// Fungsi ini menerima tanggal dalam format YYYY-MM-DD dan mengembalikan kode booking yang sesuai
// Contoh penggunaan: generateKodeBooking('2025-07-03') akan menghasilkan 'BK-20250703-ABCD'
// ABCD adalah 4 karakter acak yang dihasilkan dari kombinasi huruf dan angka
// Pastikan tanggal yang diberikan valid dan sesuai dengan format yang diharapkan


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
      const { mejaId, tanggal, harga, jadwalIds } = req.body

      // Validasi input
      if (!mejaId || !tanggal || !harga || !jadwalIds || !Array.isArray(jadwalIds)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field mejaId, tanggal, harga, dan jadwalIds wajib diisi dan jadwalIds harus berupa array.',
        })
      }

      // Cek apakah meja tersedia
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
          mejaId: mejaId,  // memastikan jadwal memang milik meja itu
        },
      })

      if (validJadwals.length !== jadwalIds.length) {
        return res.status(400).json({
          message: 'Jadwal tidak sesuai dengan meja yang dipilih.',
        })
      }

      // Generate kode booking otomatis
      const kodeBooking = generateKodeBooking(tanggal)

      // 1. Simpan booking utama
      const booking = await prisma.booking.create({
        data: {
          meja: {
            connect: { id: Number(mejaId) } },
          Tanggal: new Date(tanggal),
          Harga: harga,
          KodeBooking: kodeBooking,
        },
      })

      // 2. Simpan jam-jam booking berdasarkan jadwalIds
      const jamBookingData = jadwalIds.map((jadwalId: number) => ({
        BookingId: booking.id,
        idMeja: Number(mejaId),
        idJadwalMeja: jadwalId,
      }))

      await prisma.jamBooking.createMany({
        data: jamBookingData,
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Booking berhasil dibuat', {
          booking,
          jam_booking: jamBookingData,
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
