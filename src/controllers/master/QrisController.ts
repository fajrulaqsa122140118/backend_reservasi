import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { FileType, uploadFileToSupabase, deleteFileFromSupabase } from '@/utilities/AwsHandler'
import path from 'path'

const QrisController = {

  getAllQris: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )

      const showDeleted = req.query.showDeleted === 'true' // default: false

      const whereCondition = showDeleted
        ? {} // tampilkan semua (termasuk yang sudah soft-deleted)
        : { deletedAt: null } // hanya yang aktif

      const [qrisData, count] = await Promise.all([
        prisma.qris.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.qris.count({ where: whereCondition }),
      ])

      return res.status(StatusCodes.OK).json(
        ResponseData(
          StatusCodes.OK,
          showDeleted ? 'Including soft-deleted data' : 'Success',
          page.paginate({ count, rows: qrisData }),
        ),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

  //   createOrUpdateQris: async (req: Request, res: Response): Promise<Response> => {
  //     try {
  //       const { judul } = req.body
  //       const file = req.file

  //       // Validasi input
  //       if (!judul || !file) {
  //         return res.status(StatusCodes.BAD_REQUEST).json({
  //           message: 'Field judul dan file QRIS wajib diisi',
  //         })
  //       }

  //       // Buat nama file unik
  //       const extension = path.extname(file.originalname) // contoh: .png
  //       const generatedFileName = `qris-${Date.now()}${extension}`

  //       // Upload file ke Supabase
  //       const fileUpload: FileType = {
  //         mimetype: file.mimetype,
  //         buffer: file.buffer,
  //         originalname: generatedFileName,
  //       }

  //       const imageResult = await uploadFileToSupabase(fileUpload, 'qris')

  //       if (!imageResult) {
  //         return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
  //           message: 'Gagal mengunggah QRIS ke Supabase',
  //         })
  //       }

  //       // Cek apakah data QRIS sudah ada
  //       const existingQris = await prisma.qris.findUnique({ 
  //         where: { id: 1 },
  //         select: { NamaFoto: true },
  //       })


  //       // Hapus file lama jika ada
  //       if (existingQris && existingQris.NamaFoto) {
  //         await supabase.storage
  //           .from('uploads')
  //           .remove(['uploads/qris/' + existingQris.NamaFoto])
  //       }

  //       // Upsert: update jika ada ID=1, jika tidak, create baru
  //       const qris = await prisma.qris.upsert({
  //         where: { id: 1 },
  //         update: {
  //           Foto: imageResult.url,
  //           Judul: judul,
  //           NamaFoto: generatedFileName, // nama file baru
  //         },
  //         create: {
  //           id: 1,
  //           Foto: imageResult.url,
  //           Judul: judul,
  //           NamaFoto: generatedFileName,
  //         },
  //       })

  //       return res.status(StatusCodes.OK).json(
  //         ResponseData(StatusCodes.OK, 'QRIS created or updated successfully', qris),
  //       )
  //     } catch (error: any) {
  //       return serverErrorResponse(res, error)
  //     }
  //   },
  createOrUpdateQris: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { judul } = req.body
      const file = req.file

      if (!judul) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'Field judul wajib diisi',
        })
      }

      // Cek apakah QRIS sudah ada
      const existingQris = await prisma.qris.findUnique({
        where: { id: 1 },
      })

      // Jika tidak ada file baru, update hanya judul
      if (!file) {
        const updatedQris = await prisma.qris.upsert({
          where: { id: 1 },
          update: { Judul: judul },
          create: {
            id: 1,
            Judul: judul,
            Foto: '',
            NamaFoto: '',
          },
        })

        return res.status(StatusCodes.OK).json(
          ResponseData(StatusCodes.OK, 'QRIS berhasil diperbarui (judul saja)', updatedQris),
        )
      }

      // Jika ada file baru, hapus file lama dulu
      if (existingQris?.NamaFoto) {
        const oldFilePath = `qris/${existingQris.NamaFoto}`
        const deleteResult = await deleteFileFromSupabase(oldFilePath)
        if (!deleteResult) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: 'Gagal menghapus file QRIS lama dari Supabase',
          })
        }
      }

      // Buat nama file baru unik
      const extension = path.extname(file.originalname)
      console.log(extension)
      const generatedFileName = `qris-${Date.now()}${extension}`

      // Upload file baru
      const fileUpload: FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: generatedFileName,
      }

      const uploadResult = await uploadFileToSupabase(fileUpload, 'qris')

      if (!uploadResult) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah file QRIS ke Supabase',
        })
      }

      // Simpan ke database (upsert)
      const updatedQris = await prisma.qris.upsert({
        where: { id: 1 },
        update: {
          Judul: judul,
          Foto: uploadResult.url,
          NamaFoto: uploadResult.filename,
        },
        create: {
          id: 1,
          Judul: judul,
          Foto: uploadResult.url,
          NamaFoto: uploadResult.filename,
        },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'QRIS berhasil diperbarui', updatedQris),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  deleteQris: async (req: Request, res: Response): Promise<Response> => {
    try {
    // Ambil data QRIS dengan ID tetap = 1
      const existingQris = await prisma.qris.findUnique({
        where: { id: 1 },
      })

      if (!existingQris) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'QRIS tidak ditemukan',
        })
      }

      // Hapus file QR dari Supabase
      const oldFilePath = `qris/${existingQris.NamaFoto}`
      const deleteResult = await deleteFileFromSupabase(oldFilePath)

      if (!deleteResult) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal menghapus file QRIS dari Supabase',
        })
      }

      // Hapus data dari database
      await prisma.qris.delete({
        where: { id: 1 },
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'QRIS berhasil dihapus', null),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  }, 
}

export default QrisController