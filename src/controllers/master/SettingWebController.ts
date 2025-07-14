import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import prisma from '@/config/database'
import { FileType, uploadFileToSupabase } from '@/utilities/AwsHandler'
import { ResponseData, serverErrorResponse } from '@/utilities'




const SettingWebController = {
  createOrUpdateSettingWeb: async (req: Request, res: Response): Promise<Response> => {
    try {
      const {
        deskripsi,
        alamat,
        kodePos,
        telepon,
        faks,
        email,
        jamOperasional,
        menuQuick,
        menuTentang,
        menuKontak,
        sosialMedia,
        copyright,
        developer,
      } = req.body

      const file = req.file

      let logoUrl = ''

      // Jika upload logo baru
      if (file) {
        const fileUpload: FileType = {
          mimetype: file.mimetype,
          buffer: file.buffer,
          originalname: file.originalname,
        }

        const imageResult = await uploadFileToSupabase(fileUpload, 'logo')

        if (!imageResult) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Gagal mengunggah logo ke Supabase',
          })
        }

        logoUrl = imageResult.url
      }

      // Jika tidak ada file, gunakan logo yang sudah ada 

      // Cari apakah sudah ada setting sebelumnya
      const existing = await prisma.settinganWeb.findFirst()

      let setting
      if (existing) {
      // Update jika sudah ada
        setting = await prisma.settinganWeb.update({
          where: { id: existing.id },
          data: {
            logoUrl: logoUrl || existing.logoUrl,
            deskripsi,
            alamat,
            kodePos,
            telepon: JSON.parse(telepon || '[]'),
            faks,
            email,
            jamOperasional,
            menuQuick: JSON.parse(menuQuick || '[]'),
            menuTentang: JSON.parse(menuTentang || '[]'),
            menuKontak: JSON.parse(menuKontak || '[]'),
            sosialMedia: JSON.parse(sosialMedia || '[]'),
            copyright,
            developer,
          },
        })
      } else {
      // Create baru
        if (!logoUrl) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: 'Logo wajib diunggah untuk pertama kali',
          })
        }

        setting = await prisma.settinganWeb.create({
          data: {
            logoUrl,
            deskripsi,
            alamat,
            kodePos,
            telepon: JSON.parse(telepon || '[]'),
            faks,
            email,
            jamOperasional,
            menuQuick: JSON.parse(menuQuick || '[]'),
            menuTentang: JSON.parse(menuTentang || '[]'),
            menuKontak: JSON.parse(menuKontak || '[]'),
            sosialMedia: JSON.parse(sosialMedia || '[]'),
            copyright,
            developer,
          },
        })
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Settingan Web berhasil disimpan', setting),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getAllSettings: async (req: Request, res: Response): Promise<Response> => {
    try {
      const settings = await prisma.settinganWeb.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Berhasil mendapatkan semua settingan web', settings),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default SettingWebController