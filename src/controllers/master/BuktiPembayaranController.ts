import { StatusCodes } from 'http-status-codes'
import { Request, Response } from 'express'
import { Pagination } from '@/utilities/Pagination'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { FileType, uploadFileToSupabase } from '@/utilities/AwsHandler'

const BuktiPembayaranController = {
  getAllBuktiPembayaran: async (req: Request, res: Response): Promise<any> => {
    try {
      const page = new Pagination(
        parseInt(req.query.page as string),
        parseInt(req.query.limit as string),
      )
    
      const showDeleted = req.query.showDeleted === 'true' // default: false
    
      const whereCondition = showDeleted
        ? {} // tampilkan semua (termasuk yang sudah soft-deleted)
        : { deletedAt: null } // hanya yang aktif
    
      const [buktiData, count] = await Promise.all([
        prisma.buktiPembayaran.findMany({
          where: whereCondition,
          skip: page.offset,
          take: page.limit,
          orderBy: { id: 'desc' },
        }),
        prisma.buktiPembayaran.count({ where: whereCondition }),
      ])
    
      return res.status(StatusCodes.OK).json(
        ResponseData(
          StatusCodes.OK,
          showDeleted ? 'Including soft-deleted data' : 'Success',
          page.paginate({ count, rows: buktiData }),
        ),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  uploadBukti : async (req: Request, res: Response): Promise<Response> => {
    try {
      const file = req.file

      //validasi input
      if (!file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'File bukti pembayaran wajib diisi',
        })
      }

      //upload ke supabase
      const fileUpload : FileType = {
        mimetype: file.mimetype,
        buffer: file.buffer,
        originalname: file.originalname,
      }
      const imageUrl = await uploadFileToSupabase(fileUpload,
        'bukti-pembayaran', // folder tujuan di Supabase
      )
      console.log('Image URL:', imageUrl)
      if (!imageUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah gambar ke Supabase',
        })
      }
      //upload file ke supabase
      const fileUrl = await uploadFileToSupabase(fileUpload,'bukti-pembayaran')
      if (!fileUrl) {
        return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          message: 'Gagal mengunggah file bukti pembayaran',
        })
      }
      const Booking = await prisma.booking.findUnique({
        where: { 
          KodeBooking : req.body.kodeBooking as string, // pastikan kodeBooking dikirim dalam body
        },
      })

      if (!Booking) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Booking tidak ditemukan',
        })
      }
      const buktiPembayaran = await prisma.buktiPembayaran.create({
        data: {

          Foto : fileUrl.url,
          KodeBookingID : req.body.kodeBooking as string,
        },
      })

      return res.status(StatusCodes.CREATED).json(
        ResponseData(StatusCodes.CREATED, 'Bukti pembayaran berhasil diunggah', buktiPembayaran),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
  getBuktiById: async (req: Request, res: Response): Promise<Response> => {
    try {
      const { id } = req.params

      const bukti = await prisma.buktiPembayaran.findUnique({
        where: { id: Number(id) },
      })

      if (!bukti) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: 'Bukti pembayaran tidak ditemukan',
        })
      }

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Bukti pembayaran ditemukan', bukti),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },

}
export default BuktiPembayaranController