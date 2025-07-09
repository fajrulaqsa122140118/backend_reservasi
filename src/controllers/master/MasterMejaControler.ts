import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { jwtPayloadInterface } from '@/utilities/JwtHanldler'
import { getIO } from '@/config/socket'
import { logActivity } from '@/utilities/LogActivity'
import { FileType, uploadFileToSupabase } from '@/utilities/AwsHandler'


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
  updateMeja: async (req: Request, res: Response): Promise<any> => {
    try {
      const userLogin = req.user as jwtPayloadInterface
      const mejaId = parseInt(req.params.id as string)
      const reqBody = req.body as any

      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      const updatedMeja = await prisma.masterMeja.update({
        where: { id: mejaId },
        data: {
          NamaMeja: reqBody.nama,
          Foto: reqBody.foto,
          Deskripsi: reqBody.deskripsi,
          Harga: reqBody.harga,
          NoMeja: reqBody.noMeja,
          TipeMeja: reqBody.TipeMeja,
        },
      })

      getIO().emit('mejaUpdated', updatedMeja)

      logActivity(
        userLogin.id,
        'UPDATE',
        `Updated meja with ID ${mejaId}`,
      )

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja updated successfully', updatedMeja),
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

      const mejaData = await prisma.masterMeja.findUnique({
        where: { id: mejaId },
      })

      if (!mejaData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Meja not found'))
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Meja found', mejaData),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default MasterMejaController

