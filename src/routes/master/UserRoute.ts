import UserController from '@/controllers/master/UserController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const UserRouter = (): Router => {
  const router = Router()
  
  router.get('/', UserController.getAllUser)
  router.get('/:id', UserController.getUserById)

  router.use(AuthMiddleware)


  router.post('/', UserController.createUser)
  router.put('/:id', UserController.updateUser)
  router.delete('/:id/soft', UserController.softDeleteUser)
  router.patch('/:id/restore', UserController.restoreUser)
  router.delete('/:id/hard', UserController.deleteUser)

  return router
}
