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
          include: {
            OpenException: true,
          },
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
  createOpenException: async (req: Request, res: Response): Promise<any> => {
    try {
      const { closedId, startTime, endTime, keterangan } = req.body

      if (!closedId || !startTime || !endTime || !keterangan) {
        return res.status(400).json({ message: 'Semua field wajib diisi' })
      }

      // Validasi closedId ada
      const closed = await prisma.closed.findUnique({ where: { id: closedId } })
      if (!closed) return res.status(404).json({ message: 'Jadwal tutup tidak ditemukan' })

      // Validasi apakah pengecualian di dalam rentang tutup
      const start = new Date(startTime)
      const end = new Date(endTime)
      if (start < closed.startdate || end > closed.enddate) {
        return res.status(400).json({
          message: 'Pengecualian waktu buka harus berada di dalam periode tutup',
        })
      }

      const exception = await prisma.openException.create({
        data: {
          closedId,
          startTime: start,
          endTime: end,
          Keterangan: keterangan,
        },
      })

      return res.status(201).json(
        ResponseData(201, 'Pengecualian buka berhasil ditambahkan', exception),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  softdeleteClosedStore: async (req: Request, res: Response): Promise<any> => {
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
        
      await prisma.closed.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() },
      })
        
      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Toko berhasil dihapus', closed),
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
        include: {
          OpenException: true,
        },
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