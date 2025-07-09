import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'
import ClosedController from '@/controllers/master/ClosedController'

export const ClosedRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.post('/close', ClosedController.createClosedStore)
  router.post('/open', ClosedController.createOpenException)
  router.get('/', ClosedController.getAllClosedStores)
  router.delete('/soft-delete/:id', ClosedController.softdeleteClosedStore)
  router.get('/:id', ClosedController.getClosedStoreById)

  return router
}

