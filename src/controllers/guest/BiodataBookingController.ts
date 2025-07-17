import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'

const BiodataController = {
  getAllBiodata: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const showDeleted = req.query.showDeleted === 'true' // default: false

      const whereCondition = showDeleted
        ? {} // tampilkan semua (termasuk yang sudah soft-deleted)
        : { deletedAt: null } // hanya yang aktif

      const [biodataData, count] = await Promise.all([
        prisma.biodataBooking.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.biodataBooking.count({
          where: whereCondition,
        }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: biodataData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createBiodata : async (req: Request, res: Response): Promise<any> => {
    try {
      const { Nama, NoTelp, Alamat, BookingId } = req.body

      // Validasi input
      if (!Nama || !NoTelp || !Alamat || !BookingId) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Semua field (Nama, NoTelp, Alamat, BookingId) wajib diisi',
        })
      }

      const newBiodata = await prisma.biodataBooking.create({
        data: {
          Nama: Nama,
          NoTelp: NoTelp,
          Alamat: Alamat,
          Booking: {
            connect: { id: BookingId },
          },
        },
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Biodata berhasil ditambahkan', newBiodata),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getBiodataById: async (req: Request, res: Response): Promise<any> => {
    try {
      const biodataId = parseInt(req.params.id as string)
      const biodataData = await prisma.biodataBooking.findUnique({
        where: { id: biodataId , deletedAt: null },
      })

      if (!biodataData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Biodata tidak ditemukan'))
      }

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Success', biodataData))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  softdeleteBiodata: async (req: Request, res: Response): Promise<any> => {
    try {
      const biodataId = parseInt(req.params.id as string)

      const biodataData = await prisma.biodataBooking.findUnique({
        where: { id: biodataId },
      })

      if (!biodataData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Biodata tidak ditemukan'))
      }

      const deletedBiodata = await prisma.biodataBooking.update({
        where: { id: biodataId },
        data: { deletedAt: new Date() },
      })

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Biodata berhasil dihapus', deletedBiodata))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  restoreBiodata: async (req: Request, res: Response): Promise<any> => {
    try {
      const biodataId = parseInt(req.params.id as string)

      const biodataData = await prisma.biodataBooking.findUnique({
        where: { id: biodataId },
      })

      if (!biodataData) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json(ResponseData(StatusCodes.NOT_FOUND, 'Biodata tidak ditemukan'))
      }

      const restoredBiodata = await prisma.biodataBooking.update({
        where: { id: biodataId },
        data: { deletedAt: null },
      })

      return res
        .status(StatusCodes.OK)
        .json(ResponseData(StatusCodes.OK, 'Biodata berhasil dipulihkan', restoredBiodata))
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },


}

export default BiodataController
