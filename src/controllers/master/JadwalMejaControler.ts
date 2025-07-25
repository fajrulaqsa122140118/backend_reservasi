import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'


const JadwalMejaController = {
  getAllJadwalMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const whereCondition = {
        deletedAt: null,
      }

      // Ambil semua jadwal dan total count
      const [jadwalMejaData, count, jamBooking] = await Promise.all([
        prisma.jadwalMeja.findMany({
          where: whereCondition,
          include: {
            meja: true,
          },
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.jadwalMeja.count({
          where: whereCondition,
        }),
        prisma.jamBooking.findMany({
          select: {
            idJadwalMeja: true,
          },
        }),
      ])

      // Buat set ID jadwal yang sudah dibooking
      const bookedSet = new Set(jamBooking.map((jb) => jb.idJadwalMeja))

      // Tambahkan properti status ke setiap jadwal
      const jadwalWithStatus = jadwalMejaData.map((jadwal) => ({
        ...jadwal,
        status: bookedSet.has(jadwal.id) ? 'Booked' : 'Tersedia',
      }))

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: jadwalWithStatus }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createJadwalMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const { mejaId, StartTime, EndTime, Status } = req.body

      // Validasi sederhana
      if (!mejaId || !StartTime || !EndTime || !Status) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Semua field wajib diisi (mejaId, StartTime, EndTime, Status)',
        })
      }

      // ✅ Validasi Status hanya boleh nilai tertentu
      const allowedStatus = ['available', 'booked', 'unavailable']
      if (!allowedStatus.includes(Status.toLowerCase())) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Status tidak valid. Pilihan yang diizinkan: ${allowedStatus.join(', ')}`,
        })
      }

      // Cek apakah MasterMeja dengan id itu ada
      const meja = await prisma.masterMeja.findFirst({
        where: { id: Number(mejaId) },
      })

      if (!meja) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `Meja dengan id ${mejaId} tidak ditemukan`,
        })
      }

      // Validasi agar tidak ada jadwal bentrok pada meja yang sama
      const jadwalBentrok = await prisma.jadwalMeja.findFirst({
        where: {
          mejaId: Number(mejaId),
          AND: [
            { StartTime: { lt: EndTime } },
            { EndTime: { gt: StartTime } },
          ],
        },
      })

      if (jadwalBentrok) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Jadwal ini bentrok atau berada di dalam jadwal lain pada meja yang sama atau sudah dibooking.',
        })
      }

      // Simpan ke database
      const jadwal = await prisma.jadwalMeja.create({
        data: {
          mejaId: Number(mejaId),
          StartTime,
          EndTime,
          Status: Status.toLowerCase(), // normalisasi (opsional)
        },
      })

      return res.status(StatusCodes.CREATED).json({
        message: 'JadwalMeja berhasil dibuat',
        data: jadwal,
      })
    } catch (error: any) {
      console.error(error)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Gagal membuat JadwalMeja',
        error: error.message,
      })
    }
  },
  updateJadwalMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const jadwalId = parseInt(req.params.id as string)
      const { mejaId, StartTime, EndTime, Status } = req.body
      // Validasi sederhana
      if (!mejaId || !StartTime || !EndTime || !Status) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Semua field wajib diisi (mejaId, StartTime, EndTime, Status)',
        })
      }

      // Cek apakah JadwalMeja dengan id itu ada
      const jadwal = await prisma.jadwalMeja.findFirst({
        where: { id: jadwalId },
      })

      if (!jadwal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `JadwalMeja dengan id ${jadwalId} tidak ditemukan`,
        })
      }

      // Cek apakah MasterMeja dengan id itu ada
      const meja = await prisma.masterMeja.findFirst({
        where: { id: Number(mejaId) },
      })

      if (!meja) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `Meja dengan id ${mejaId} tidak ditemukan`,
        })
      }

      // Validasi bentrok (kecuali dirinya sendiri)
      const jadwalBentrok = await prisma.jadwalMeja.findFirst({
        where: {
          id: { not: jadwalId }, // hindari dirinya sendiri
          mejaId: Number(mejaId),
          AND: [
            { StartTime: { lt: EndTime } },
            { EndTime: { gt: StartTime } },
          ],
        },
      })

      if (jadwalBentrok) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Jadwal ini bentrok atau berada di dalam jadwal lain pada meja yang sama atau sudah di booking.',
        })
      }


      // Update JadwalMeja
      const updatedJadwal = await prisma.jadwalMeja.update({
        where: { id: jadwalId },
        data: {
          mejaId: Number(mejaId),
          StartTime: StartTime,
          EndTime: EndTime,
          Status,
        },
      })

      return res.status(StatusCodes.OK).json({
        message: 'JadwalMeja berhasil diperbarui',
        data: updatedJadwal,
      })
    } catch (error: any) {
      console.error(error)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Gagal memperbarui JadwalMeja',
        error: error.message,
      })
    }
  },
  deleteJadwalMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const jadwalId = parseInt(req.params.id as string)

      // Cek apakah JadwalMeja dengan id itu ada
      const jadwal = await prisma.jadwalMeja.findFirst({
        where: { id: jadwalId },
      })

      if (!jadwal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `JadwalMeja dengan id ${jadwalId} tidak ditemukan`,
        })
      }

      // Hapus JadwalMeja
      await prisma.jadwalMeja.delete({
        where: { id: jadwalId },
      })

      return res.status(StatusCodes.OK).json({
        message: 'JadwalMeja berhasil dihapus',
      })
    } catch (error: any) {
      console.error(error)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Gagal menghapus JadwalMeja',
        error: error.message,
      })
    }
  },
  getJadwalMejaById: async (req: Request, res: Response): Promise<any> => {
    try {
      const jadwalId = parseInt(req.params.id as string)

      // Cek apakah JadwalMeja dengan id itu ada
      const jadwal = await prisma.jadwalMeja.findFirst({
        where: { id: jadwalId },
      })

      if (!jadwal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `JadwalMeja dengan id ${jadwalId} tidak ditemukan`,
        })
      }

      // Ambil semua booking yang aktif di meja yang sama
      const jamBooking = await prisma.jamBooking.findMany({
        where: {
          idMeja: jadwal.mejaId,
        },
        select: {
          idJadwalMeja: true,
        },
      })

      const bookedSet = new Set(jamBooking.map((jb) => jb.idJadwalMeja))

      // Tambahkan status manual
      const status = bookedSet.has(jadwal.id) ? 'Booked' : 'Tersedia'

      return res.status(StatusCodes.OK).json({
        message: 'JadwalMeja ditemukan',
        data: {
          ...jadwal,
          status, // ini tambahan baru
        },
      })
    } catch (error: any) {
      console.error(error)
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        message: 'Gagal mendapatkan JadwalMeja',
        error: error.message,
      })
    }
  },

}

export default JadwalMejaController