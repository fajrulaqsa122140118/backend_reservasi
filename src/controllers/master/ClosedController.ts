import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { Pagination } from '@/utilities/Pagination'

const ClosedController = {
  getAllClosedStores: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const whereCondition = {
        deletedAt: null,
      }

      const [closedData, count] = await Promise.all([
        prisma.closed.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.closed.count({
          where: whereCondition,
        }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: closedData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createClosedStore: async (req: Request, res: Response): Promise<any> => {
    try {
      const { startdate, enddate, deskripsi } = req.body

      if (!startdate || !enddate || !deskripsi) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'startdate, enddate, dan deskripsi wajib diisi',
        })
      }

      if (new Date(startdate) >= new Date(enddate)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Tanggal mulai harus lebih kecil dari tanggal akhir',
        })
      }

      const closed = await prisma.closed.create({
        data: {
          startdate: new Date(startdate),
          enddate: new Date(enddate),
          Deskripsi: deskripsi,
        },
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Toko berhasil ditutup untuk sementara', closed),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getClosedStoreById: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params
      const closed = await prisma.closed.findUnique({
        where: { id: Number(id) },
      })
      if (!closed) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Toko tidak ditemukan',
        })
      }
      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Detail toko', closed),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default ClosedController