import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'
import ClosedController from '@/controllers/master/ClosedController'

export const ClosedRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.post('/close', ClosedController.createClosedStore)
  router.get('/', ClosedController.getAllClosedStores)
  router.get('/:id', ClosedController.getClosedStoreById)

  return router
}

