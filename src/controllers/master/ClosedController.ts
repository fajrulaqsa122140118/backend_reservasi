import { Request, Response } from 'express'
import prisma from '@/config/database'

const ClosedController = {
  getAllClosed: async (req: Request, res: Response) => {
    try {
      const data = await prisma.closed.findMany({
        where: { deletedAt: null },
        orderBy: { startdate: 'desc' },
      })

      return res.status(200).json({ message: 'Semua jadwal tutup', data })
    } catch (err: any) {
      return res.status(500).json({ message: 'Gagal ambil data', error: err.message })
    }
  },
  createOrUpdateClosed: async (req: Request, res: Response) => {
    try {
      const { startdate, enddate, deskripsi } = req.body

      if (!startdate || !enddate || !deskripsi) {
        return res.status(400).json({ message: 'Semua field wajib diisi' })
      }

      const start = new Date(startdate)
      const end = new Date(enddate)

      if (start >= end) {
        return res.status(400).json({ message: 'Start date harus < end date' })
      }

      // Cek apakah range ini sudah ada
      const existingClosed = await prisma.closed.findFirst()

      let closed

      if (existingClosed) {
      // Update jika sudah ada
        closed = await prisma.closed.update({
          where: { id: existingClosed.id },
          data: {
            Deskripsi: deskripsi,
            updatedAt: new Date(),
          },
        })
      } else {
      // Create jika belum ada
        closed = await prisma.closed.create({
          data: {
            startdate: start,
            enddate: end,
            Deskripsi: deskripsi,
          },
        })
      }

      return res.status(200).json({
        message: existingClosed ? 'Closed updated' : 'Closed created',
        data: closed,
      })
    } catch (err: any) {
      return res.status(500).json({
        message: 'Error saat memproses closed',
        error: err.message,
      })
    }
  },
  getClosedById: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)
      const closed = await prisma.closed.findUnique({ where: { id } })

      if (!closed) {
        return res.status(404).json({ message: 'Data tidak ditemukan' })
      }

      return res.status(200).json({ message: 'Data ditemukan', data: closed })
    } catch (err: any) {
      return res.status(500).json({ message: 'Internal error', error: err.message })
    }
  },
  deleteClosed: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id)

      await prisma.closed.delete({ where: { id } })

      return res.status(200).json({ message: 'Jadwal tutup dihapus permanen' })
    } catch (err: any) {
      return res.status(500).json({ message: 'Gagal menghapus data', error: err.message })
    }
  },
}

export default ClosedController 