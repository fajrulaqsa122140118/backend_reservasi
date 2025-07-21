import { Request, Response } from 'express'
import prisma from '@/config/database'

const ClosedController = {

  createClosed: async (req: Request, res: Response) => {
    try {
      const { startDate, reason } = req.body

      if (!startDate || !reason) {
        return res.status(400).json({ message: 'Semua field wajib diisi' })
      }

      const date = new Date(startDate)
      if (isNaN(date.getTime())) {
        return res.status(400).json({ message: 'Tanggal tidak valid' })
      }

      // Cek apakah tanggal ini sudah ditutup
      const existing = await prisma.closed.findFirst({
        where: {
          date: date,
          type: 'TUTUP',
        },
      })

      if (existing) {
        return res.status(400).json({
          message: `Tanggal ${startDate} sudah ditutup sebelumnya.`,
        })
      }

      // Buat entri tutup
      const created = await prisma.closed.create({
        data: {
          date,
          type: 'TUTUP',
          reason,
        },
      })

      return res.status(201).json({
        message: 'Tanggal berhasil ditutup',
        data: created,
      })
    } catch (err: any) {
      return res.status(500).json({
        message: 'Terjadi kesalahan saat menutup tanggal',
        error: err.message,
      })
    }
  },
  createOpen: async (req: Request, res: Response) => {
    try {
      const { closedIds, reason } = req.body

      if (!closedIds || !Array.isArray(closedIds) || closedIds.length === 0 || !reason) {
        return res.status(400).json({ message: 'closedIds (array) dan reason wajib diisi' })
      }

      // Ambil data penutupan berdasarkan ID
      const closedEntries = await prisma.closed.findMany({
        where: {
          id: { in: closedIds },
          type: 'TUTUP',
        },
      })

      if (closedEntries.length === 0) {
        return res.status(404).json({ message: 'Data penutupan tidak ditemukan' })
      }

      // Cek apakah sudah pernah dibuka sebelumnya
      const alreadyOpened = await prisma.closed.findMany({
        where: {
          type: 'BUKA',
          referenceId: { in: closedIds },
        },
      })

      const alreadyOpenedIds = new Set(alreadyOpened.map(o => o.referenceId))
      const toOpen = closedEntries.filter(entry => !alreadyOpenedIds.has(entry.id))

      if (toOpen.length === 0) {
        return res.status(400).json({ message: 'Semua entri sudah pernah dibuka sebelumnya' })
      }

      // Buat entri BUKA
      const created = await prisma.closed.createMany({
        data: toOpen.map(entry => ({
          date: entry.date,
          type: 'BUKA',
          reason,
          referenceId: entry.id,
        })),
      })

      return res.status(200).json({
        message: 'Tanggal berhasil dibuka kembali',
        data: created,
      })
    } catch (err: any) {
      return res.status(500).json({
        message: 'Terjadi kesalahan saat membuka tanggal',
        error: err.message,
      })
    }
  },
  deleteClosed: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const closedId = parseInt(id)
      if (isNaN(closedId)) {
        return res.status(400).json({ message: 'ID tidak valid' })
      }

      // Cek apakah closed ada
      const closed = await prisma.closed.findUnique({
        where: { id: closedId },
      })

      if (!closed) {
        return res.status(404).json({ message: 'Closed tidak ditemukan' })
      }

      // Hapus semua entri BUKA yang mereferensikan closed ini
      await prisma.closed.deleteMany({
        where: {
          referenceId: closedId,
        },
      })

      // Hapus closed utamanya
      await prisma.closed.delete({
        where: { id: closedId },
      })

      return res.status(200).json({
        message: 'Closed dan referensi pembuka berhasil dihapus',
      })
    } catch (error: any) {
      return res.status(500).json({
        message: 'Gagal menghapus closed',
        error: error.message,
      })
    }
  },
  getAllClosed: async (req: Request, res: Response) => {
    try {
      const allClosed = await prisma.closed.findMany({
        orderBy: { date: 'asc' },
        include: {
          reference: true,     // Menunjukkan TUTUP yang dirujuk jika type == BUKA
          openedBy: true,       // Menunjukkan BUKA yang merujuk ke entri ini jika type == TUTUP
        },
      })

      return res.status(200).json({
        message: 'Data closed schedule berhasil diambil',
        data: allClosed,
      })
    } catch (err: any) {
      return res.status(500).json({
        message: 'Gagal mengambil data closed schedule',
        error: err.message,
      })
    }
  },
  getClosedById: async (req: Request, res: Response) => {
    try {
      const { id } = req.params

      const closed = await prisma.closed.findUnique({
        where: { id: Number(id) },
        include: {
          reference: true,    // Jika type = BUKA, tampilkan data TUTUP yang dirujuk
          openedBy: true,      // Jika type = TUTUP, tampilkan semua BUKA yang merujuknya
        },
      })

      if (!closed) {
        return res.status(404).json({ message: 'Data tidak ditemukan' })
      }

      return res.status(200).json({
        message: 'Data closed schedule ditemukan',
        data: closed,
      })
    } catch (err: any) {
      return res.status(500).json({
        message: 'Terjadi kesalahan saat mengambil data',
        error: err.message,
      })
    }
  },
}

export default ClosedController 