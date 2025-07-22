import SyaratController from '@/controllers/master/SyaratController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const SyaratRouter = (): Router => {
  const router = Router()

  // Get syarat by id
  router.get('/:id', SyaratController.getSyaratById)
  
  router.use(AuthMiddleware)



  // Update syarat
  router.put('/update/:id', SyaratController.updateSyarat)

  return router
}