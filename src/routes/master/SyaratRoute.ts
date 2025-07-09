import SyaratController from '@/controllers/master/SyaratController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const SyaratRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  // Get all syarat
  router.get('/', SyaratController.getAllSyarat)

  // Create syarat
  router.post('/create', SyaratController.createSyarat)

  // Get syarat by id
  router.get('/:id', SyaratController.getSyaratById)

  // Update syarat
  router.put('/update/:id', SyaratController.updateSyarat)

  // Delete syarat
  router.delete('/delete/:id', SyaratController.deleteSyarat)

  return router
}