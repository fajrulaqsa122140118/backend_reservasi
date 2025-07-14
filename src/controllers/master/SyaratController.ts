import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'

const SyaratController = {
  
  getSyaratById: async (req: Request, res: Response): Promise<any> => {
    try {

      const syarat = await prisma.syaratketentuan.findUnique({
        where: { id: Number(1) },
      })

      const datas = {
        syarat: syarat?.syarat || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Success', datas),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  updateSyarat: async (req: Request, res: Response): Promise<any> => {
    try {

      
      const { syarat } = req.body

      const syaratId =  Number(1)

      const updatedSyarat = await prisma.syaratketentuan.upsert({
        where: { id: syaratId },
        create: {
          syarat: syarat,
        },
        update: {
          syarat: syarat,
        },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Syarat updated successfully', updatedSyarat),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default SyaratController