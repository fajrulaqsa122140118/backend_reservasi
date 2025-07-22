import DashboardController from '@/controllers/master/DashbordController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const DashboardRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.get('/', DashboardController.getDashboardData)

  return router
}