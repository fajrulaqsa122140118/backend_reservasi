import DashboardController from '@/controllers/master/DashbordController'
// import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const DashboardRouter = (): Router => {
  const router = Router()

  // router.use(AuthMiddleware)

  router.get('/', DashboardController.getDashboardData)
  //   router.post('/create', BiodataController.createBiodata)
  //   router.get('/:id', BiodataController.getBiodataById)
  //   router.delete('/:id/soft', BiodataController.softdeleteBiodata)
  //   router.patch('/:id/restore', BiodataController.restoreBiodata)

  return router
}