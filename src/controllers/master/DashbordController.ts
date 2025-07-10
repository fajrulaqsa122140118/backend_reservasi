import { Request, Response } from 'express'
import { startOfYear, endOfYear, getMonth } from 'date-fns'
import prisma from '@/config/database'
import { ResponseData, serverErrorResponse } from '@/utilities'
import { StatusCodes } from 'http-status-codes'

const DashboardController = {
  getDashboardData: async (req: Request, res: Response): Promise<any> => {
    try {
      const currentYear = new Date().getFullYear()
      const startDate = startOfYear(new Date(currentYear, 0, 1))
      const endDate = endOfYear(new Date(currentYear, 11, 31))

      // Ambil semua booking tahun ini
      const bookings = await prisma.booking.findMany({
        where: {
          Tanggal: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          Tanggal: true,
          Harga: true,
        },
      })

      // Bulan dalam format pendek
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

      // Inisialisasi data kosong
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        bulan: monthNames[i],
        totalBooking: 0,
        totalPendapatan: 0,
      }))

      // Loop hasil booking dan hitung berdasarkan bulan
      bookings.forEach((booking) => {
        const monthIndex = getMonth(booking.Tanggal) // 0–11
        monthlyData[monthIndex].totalBooking += 1
        monthlyData[monthIndex].totalPendapatan += Number(booking.Harga)
      })

      return res.status(StatusCodes.OK).json(
        ResponseData(StatusCodes.OK, 'Data chart berhasil diambil', monthlyData),
      )
    } catch (error: any) {
      return serverErrorResponse(res, error)
    }
  },
}
  


  

export default DashboardController