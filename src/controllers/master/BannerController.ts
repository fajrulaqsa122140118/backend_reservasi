import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { uploadToSupabase } from '@/Services/banner/uploadBanner'



const BannerController = {
  getAllBanners: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const showDeleted = req.query.showDeleted === 'true' // default: false

      const whereCondition = showDeleted
        ? {} // tampilkan semua (termasuk yang sudah soft-deleted)
        : { deletedAt: null } // hanya yang aktif

      const [bannerData, count] = await Promise.all([
        prisma.banner.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.banner.count({
          where: whereCondition,
        }),
      ])

      return res
        .status(StatusCodes.OK)
        .json(
          ResponseData(
            StatusCodes.OK,
            'Success',
            page.paginate({ count, rows: bannerData }),
          ),
        )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  createBanner: async (req: Request, res: Response): Promise<Response> => {
    try {


      const { judul } = req.body
      const file = req.file

      // Validasi input
      if (!judul || !file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field judul dan file banner wajib diisi',
        })
      }

      // Upload ke Supabase
      const imageUrl = await uploadToSupabase(file)
      console.log('Image URL:', imageUrl)
      if (!imageUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah gambar ke Supabase',
        })
      }

      // Simpan ke database (IsActive default true, deletedAt tidak diisi)
      const banner = await prisma.banner.create({
        data: {
          Judul: judul,
          Foto: imageUrl,
          IsActive: true, // opsional karena default, tapi ditulis eksplisit
        },
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Banner berhasil dibuat', banner),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}

export default BannerController