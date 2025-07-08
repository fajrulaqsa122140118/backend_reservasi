import express, { Router } from 'express'
import { upload } from '@/middleware/upload'
import BuktiPembayaranController from '@/controllers/master/BuktiPembayaranController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'

export const BuktiPembayaranRouter = (): Router => {
  const router = express.Router()

  router.use(AuthMiddleware)

  router.post('/upload', upload.single('file'), BuktiPembayaranController.uploadBukti)
  router.get('/', BuktiPembayaranController.getAllBuktiPembayaran)
  router.get('/:id', BuktiPembayaranController.getBuktiById)

  return router
}