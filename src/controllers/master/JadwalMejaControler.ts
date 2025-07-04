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

      const [jadwalMejaData, count] = await Promise.all([
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
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: jadwalMejaData }),
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

      // Cek apakah MasterMeja dengan id itu ada
      const meja = await prisma.masterMeja.findFirst({
        where: { id: Number(mejaId) },
      })

      if (!meja) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `Meja dengan id ${mejaId} tidak ditemukan`,
        })
      }

      //   // Simpan ke database
      const jadwal = await prisma.jadwalMeja.create({
        data: {
          mejaId: Number(mejaId),
          StartTime: StartTime,
          EndTime: EndTime,
          Status,
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

      return res.status(StatusCodes.OK).json({
        message: 'JadwalMeja ditemukan',
        data: jadwal,
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