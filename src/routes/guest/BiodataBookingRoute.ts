import BiodataController from '@/controllers/guest/BiodataBookingController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const BiodataBookingRouter = (): Router => {
  const router = Router()
  
  router.post('/create', BiodataController.createBiodata)

  router.use(AuthMiddleware)

  router.get('/', BiodataController.getAllBiodata)
  router.get('/:id', BiodataController.getBiodataById)
  router.delete('/:id/soft', BiodataController.softdeleteBiodata)
  router.patch('/:id/restore', BiodataController.restoreBiodata)

  return router
}


