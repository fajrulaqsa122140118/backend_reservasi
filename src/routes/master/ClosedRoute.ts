import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'
import ClosedController from '@/controllers/master/ClosedController'

export const ClosedRouter = (): Router => {
  const router = Router()

  // Get semua data closed
  router.get('/', ClosedController.getAllClosed)

  // Get detail closed berdasarkan ID
  router.get('/:id', ClosedController.getClosedById)

  router.use(AuthMiddleware)

  // Create tutup (penutupan tanggal)
  router.post('/tutup', ClosedController.createClosed)

  // Create buka (membuka kembali tanggal tutup berdasarkan id tutup)
  router.post('/buka', ClosedController.createOpen)

  // Delete data tutup atau buka (soft delete atau hard delete, tergantung implementasi)
  router.delete('/delete:id', ClosedController.deleteClosed)



  return router
}

