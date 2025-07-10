import SyaratController from '@/controllers/master/SyaratController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const SyaratRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  // Get syarat by id
  router.get('/:id', SyaratController.getSyaratById)

  // Update syarat
  router.put('/update/:id', SyaratController.updateSyarat)

  return router
}