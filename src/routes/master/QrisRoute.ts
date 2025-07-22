import express, { Router } from 'express'
import { upload } from '@/middleware/upload'
import QrisController from '@/controllers/master/QrisController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'

export const QrisRouter = (): Router => {
  const router = express.Router()

  router.get('/', QrisController.getAllQris)
  router.use(AuthMiddleware)

  // Get all QRIS data
  

  // Create or update QRIS data
  router.post('/create', upload.single('file'), QrisController.createOrUpdateQris)

  //   // Get QRIS by ID
  //   router.get('/:id', QrisController.getQrisById)

  // Delete QRIS by ID
  router.delete('/delete/:id', QrisController.deleteQris)

  return router
}