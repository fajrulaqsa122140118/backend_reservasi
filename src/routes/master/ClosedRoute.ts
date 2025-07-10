import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'
import ClosedController from '@/controllers/master/ClosedController'

export const ClosedRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.get('/', ClosedController.getAllClosed)
  router.post('/create', ClosedController.createOrUpdateClosed)
  router.get('/:id', ClosedController.getClosedById)
  router.delete('/delete/:id', ClosedController.deleteClosed)

  return router
}

