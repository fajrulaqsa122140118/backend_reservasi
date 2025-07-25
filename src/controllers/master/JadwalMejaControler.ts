import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'


const JadwalMejaController = {
  getAllJadwalMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      // Ambil semua jadwalMeja
      const jadwalList = await prisma.jadwalMeja.findMany()

      // Ambil semua booking aktif
      const jamBooking = await prisma.jamBooking.findMany({
        select: {
          idJadwalMeja: true,
        },
      })

      const bookedSet = new Set(jamBooking.map((jb) => jb.idJadwalMeja))

      // Tambahkan status ke tiap jadwal
      const jadwalWithStatus = jadwalList.map((jadwal) => ({
        ...jadwal,
        status: bookedSet.has(jadwal.id) ? 'Booked' : 'Tersedia',
      }))

      // Gunakan ResponseData agar import tidak sia-sia
      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Semua JadwalMeja berhasil diambil', jadwalWithStatus),
      )
    } catch (error: any) {
      // Gunakan serverErrorResponse agar tidak unused
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

      // Ambil data meja dan semua jadwalnya
      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: jadwal?.mejaId },
        include: {
          JadwalMeja: true,
        },
      })

      if (!mejaData) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `Meja dengan id ${jadwal?.mejaId} tidak ditemukan`,
        })
      }

      const jamBooking = await prisma.jamBooking.findMany({
        where: {
          idMeja: jadwal?.mejaId,
        },
        select: {
          idJadwalMeja: true,
        },
      })

      // Tandai jadwal yang sudah dibooking
      const bookedSet = new Set(jamBooking.map((jb) => jb.idJadwalMeja))

      // Tambahkan status manual ke setiap JadwalMeja
      const jadwalWithStatus = mejaData.JadwalMeja.map((jadwal) => ({
        ...jadwal,
        status: bookedSet.has(jadwal.id) ? 'Booked' : 'Tersedia',
      }))

      if (!jadwal) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `JadwalMeja dengan id ${jadwalId} tidak ditemukan`,
        })
      }

      // Hanya ambil satu jadwal yang sesuai id
      const singleJadwal = jadwalWithStatus.find((j) => j.id === jadwalId)

      return res.status(StatusCodes.OK).json({
        message: 'JadwalMeja ditemukan',
        data: singleJadwal,
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