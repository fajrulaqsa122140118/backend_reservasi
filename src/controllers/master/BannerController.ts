import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { deleteFileFromSupabase, FileType, uploadFileToSupabase } from '@/utilities/AwsHandler'
import { supabase, supabaseStorageBucket } from '@/config/supabase'
import { get } from 'http'



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

      const fileUpload : FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      }
      const imageUrl = await uploadFileToSupabase(fileUpload,
        'banner', // folder tujuan di Supabase
      )
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
          Foto: imageUrl.url,
          NamaFoto: imageUrl.filename,
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
  deleteBanner : async (req: Request, res: Response): Promise<Response> => {

    try {

      const params = req.params
      const datasbanner = await prisma.banner.findUnique({
        where: { id: Number(params.id) },
      })

      if (!datasbanner) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Banner tidak ditemukan',
        })
      } 

      const { data, error } = await supabase.storage
        .from('uploads') // nama bucket
        .remove(['uploads/banner/'+datasbanner.NamaFoto]) // path relatif ke dalam bucket

      await prisma.banner.delete({
        where: { id: Number(params.id) },
      })
      if (error) {
        console.error('Gagal hapus file:', error.message)
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal menghapus file dari Supabase',
          error: error.message,
        })
      }

      console.log('File berhasil dihapus:', data)
      return res.status(StatusCodes.OK).json({
        message: 'File berhasil dihapus dari Supabase',
        data,
      })
    }catch(error : any){
      return serverErrorResponse(res, error)
    }
  },
  updateBanner: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params
      const { judul } = req.body
      const file = req.file

      if (!judul) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field judul wajib diisi',
        })
      }
      console.log('ID:', id)

      const existingBanner = await prisma.banner.findUnique({
        where: { id: Number(id) },
      })

      if (!existingBanner) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Banner tidak ditemukan',
        })
      }

      // Jika tidak ada file baru, update hanya judul
      if (!file) {
        const updatedBanner = await prisma.banner.update({
          where: { id: Number(id) },
          data: { Judul: judul },
        })
        return res.status(StatusCodes.OK).json(
          ResponseData(StatusCodes.OK, 'Banner berhasil diperbarui', updatedBanner),
        )
      }

      // Jika ada file baru, hapus file lama terlebih dahulu
      const oldFilePath = `banner/${existingBanner.NamaFoto}`
      const deleteResult = await deleteFileFromSupabase(oldFilePath)

      if (!deleteResult) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal menghapus file lama dari Supabase',
        })
      }

      // Upload file baru ke Supabase
      const fileUpload: FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      }

      const imageUrl = await uploadFileToSupabase(fileUpload, 'banner')

      if (!imageUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah gambar baru ke Supabase',
        })
      }

      // Update database dengan judul dan file baru
      const updatedBanner = await prisma.banner.update({
        where: { id: Number(id) },
        data: {
          Judul: judul,
          Foto: imageUrl.url,
          NamaFoto: imageUrl.filename,
        },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Banner berhasil diperbarui', updatedBanner),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getBannerById: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params

      const banner = await prisma.banner.findUnique({
        where: { id: Number(id) },
      })

      if (!banner) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Banner tidak ditemukan',
        })
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Banner ditemukan', banner),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },


}

export default BannerController