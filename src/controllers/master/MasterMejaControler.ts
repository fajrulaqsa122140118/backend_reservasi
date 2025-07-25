import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { jwtPayloadInterface } from '@/utilities/JwtHanldler'
import { getIO } from '@/config/socket'
import { logActivity } from '@/utilities/LogActivity'
import { FileType, uploadFileToSupabase, deleteFileFromSupabase } from '@/utilities/AwsHandler'
import { boolean } from 'zod'


const MasterMejaController = {
  getAllMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const { tipe } = req.query
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const whereCondition = {} as any

      whereCondition.deletedAt = null

      if (tipe) {
        whereCondition.TipeMeja = tipe
      }

      console.log(whereCondition)

      const [mejaData, count] = await Promise.all([
        prisma.masterMeja.findMany({
          where: whereCondition,

          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.masterMeja.count({
          where: whereCondition,
        }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: mejaData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const reqBody = req.body
      const file = req.file

      // Validasi input
      if (!reqBody.nama || !reqBody.harga || !reqBody.noMeja || !reqBody.TipeMeja || !file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field nama, harga, noMeja, tipeMeja, dan foto wajib diisi',
        })
      }
      // Cek apakah NamaMeja sudah ada
      const existingMeja = await prisma.masterMeja.findFirst({
        where: {
          NamaMeja: reqBody.nama,
        },
      })

      if (existingMeja) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Nama meja "${reqBody.nama}" sudah digunakan`,
        })
      }
      // Upload ke Supabase
      const fileUpload: FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      }

      const imageUrl = await uploadFileToSupabase(fileUpload, 'meja') // folder 'meja' di Supabase

      if (!imageUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah gambar ke Supabase',
        })
      }

      // Simpan ke database
      const newMeja = await prisma.masterMeja.create({
        data: {
          NamaMeja: reqBody.nama,
          Foto: imageUrl.url, // URL file dari Supabase
          Deskripsi: reqBody.deskripsi,
          Harga: reqBody.harga,
          NoMeja: reqBody.noMeja,
          TipeMeja: reqBody.TipeMeja,
        },
      })

      getIO().emit('mejaCreated', newMeja)

      logActivity(userLogin.id, 'CREATE', `Created new meja with ID ${newMeja.id}`)

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Meja berhasil dibuat', newMeja),
      )
    } catch (error: any) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(
        ResponseData(StatusCodes.INTERNAL_SERVER_ERROR, 'Gagal membuat meja', error.message),
      )
    }
  },
  deleteMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const mejaId = parseInt(req.params.id as string)

      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      await prisma.masterMeja.delete({
        where: { id: mejaId },
      })

      getIO().emit('mejaDeleted', mejaId)

      logActivity(
        userLogin.id,
        'DELETE',
        `Deleted meja with ID ${mejaId}`,
      )

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja deleted successfully'),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  updateMeja: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params
      const reqBody = req.body
      const file = req.file
      const userLogin = req.user as jwtPayloadInterface

      if (!reqBody.nama || !reqBody.harga || !reqBody.noMeja || !reqBody.TipeMeja) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field nama, harga, noMeja, dan TipeMeja wajib diisi',
        })
      }

      const existingMeja = await prisma.masterMeja.findUnique({
        where: { id: Number(id) },
      })

      if (!existingMeja) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Meja tidak ditemukan',
        })
      }

      // Cek apakah nama meja baru sudah digunakan meja lain
      const duplicateMeja = await prisma.masterMeja.findFirst({
        where: {
          NamaMeja: reqBody.nama,
          NOT: { id: Number(id) },
        },
      })

      if (duplicateMeja) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Nama meja "${reqBody.nama}" sudah digunakan oleh meja lain`,
        })
      }

      // Jika tidak ada file baru, update hanya data selain foto
      if (!file) {
        const updatedMeja = await prisma.masterMeja.update({
          where: { id: Number(id) },
          data: {
            NamaMeja: reqBody.nama,
            Deskripsi: reqBody.deskripsi,
            Harga: reqBody.harga,
            NoMeja: reqBody.noMeja,
            TipeMeja: reqBody.TipeMeja,
            IsActive: reqBody.isActive !== boolean ? reqBody.isActive : true, // Default to true if not provided
          },
        })

        logActivity(userLogin.id, 'UPDATE', `Updated meja (tanpa foto) with ID ${updatedMeja.id}`)

        return res.status(StatusCodes.OK).json(
          ResponseData(StatusCodes.OK, 'Meja berhasil diperbarui', updatedMeja),
        )
      }

      // Jika ada file baru, hapus file lama terlebih dahulu
      const oldFilePath = `meja/${existingMeja.Foto}`
      const deleteResult = await deleteFileFromSupabase(oldFilePath)

      if (!deleteResult) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal menghapus file lama dari Supabase',
        })
      }

      // Upload foto baru
      const fileUpload: FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      }

      const imageUrl = await uploadFileToSupabase(fileUpload, 'meja')

      if (!imageUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah gambar baru ke Supabase',
        })
      }

      // Update database dengan foto baru
      const updatedMeja = await prisma.masterMeja.update({
        where: { id: Number(id) },
        data: {
          NamaMeja: reqBody.nama,
          Deskripsi: reqBody.deskripsi,
          Harga: reqBody.harga,
          NoMeja: reqBody.noMeja,
          TipeMeja: reqBody.TipeMeja,
          Foto: imageUrl.url,
        },
      })

      logActivity(userLogin.id, 'UPDATE', `Updated meja (dengan foto) with ID ${updatedMeja.id}`)

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja berhasil diperbarui', updatedMeja),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  softDeleteMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const mejaId = parseInt(req.params.id as string)

      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      await prisma.masterMeja.update({
        where: { id: mejaId },
        data: { deletedAt: new Date() },
      })

      getIO().emit('mejaSoftDeleted', mejaId)

      logActivity(
        userLogin.id,
        'DELETE',
        `Soft deleted meja with ID ${mejaId}`,
      )

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja soft deleted successfully'),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  restoreMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const mejaId = parseInt(req.params.id as string)

      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      await prisma.masterMeja.update({
        where: { id: mejaId },
        data: { deletedAt: null },
      })

      getIO().emit('mejaRestored', mejaId)

      logActivity(
        userLogin.id,
        'RESTORE',
        `Restored meja with ID ${mejaId}`,
      )

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja restored successfully'),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getMejaById: async (req: Request, res: Response): Promise<any> => {
    try {
      const mejaId = parseInt(req.params.id as string)
      const { startDate, endDate } = req.query
      const whereCondition = {} as any

      // Atur rentang tanggal
      const gteDate = startDate
        ? new Date(String(startDate) + 'T00:00:00.000Z')
        : new Date(new Date().setHours(0, 0, 0, 0))

      const lteDate = endDate
        ? new Date(String(endDate) + 'T23:59:59.999Z')
        : new Date(new Date().setHours(23, 59, 59, 999))

      whereCondition.Booking = {
        Tanggal: {
          gte: gteDate,
          lte: lteDate,
        },
      }

      // Ambil data meja dan semua jadwalnya
      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
        include: {
          JadwalMeja: true,
        },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      // Ambil semua jamBooking yang sesuai tanggal dan meja
      const jamBooking = await prisma.jamBooking.findMany({
        where: {
          idMeja: mejaId,
          ...whereCondition,
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

      // Replace jadwal di response
      mejaData.JadwalMeja = jadwalWithStatus

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Meja found', mejaData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

}

export default MasterMejaController

