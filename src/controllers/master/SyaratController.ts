import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { create } from 'domain'
import { get } from 'http'

const SyaratController = {
  getAllSyarat: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const whereCondition = {
        deletedAt: null,
      }

      const [syaratData, count] = await Promise.all([
        prisma.syaratketentuan.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.syaratketentuan.count({
          where: whereCondition,
        }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: syaratData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createSyarat: async (req: Request, res: Response): Promise<any> => {
    try {
      const { syarat } = req.body

      if (!syarat) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Syarat is required',
        })
      }

      const newSyarat = await prisma.syaratketentuan.create({
        data: {
          syarat,
        },
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Syarat created successfully', newSyarat),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getSyaratById: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params
      const syarat = await prisma.syaratketentuan.findUnique({
        where: { id: Number(id) },
      })

      if (!syarat) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Syarat not found',
        })
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Success', syarat),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  updateSyarat: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params
      const { syarat } = req.body

      if (!syarat) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Syarat is required',
        })
      }

      const updatedSyarat = await prisma.syaratketentuan.update({
        where: { id: Number(id) },
        data: { syarat },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Syarat updated successfully', updatedSyarat),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  deleteSyarat: async (req: Request, res: Response): Promise<any> => {
    try {
      const { id } = req.params

      const deletedSyarat = await prisma.syaratketentuan.update({
        where: { id: Number(id) },
        data: { deletedAt: new Date() },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Syarat deleted successfully', deletedSyarat),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

}

export default SyaratController