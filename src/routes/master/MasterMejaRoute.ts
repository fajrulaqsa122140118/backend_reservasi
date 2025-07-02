import MasterMejaControler from '@/controllers/master/MasterMejaControler'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const MasterMejaRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.get('/', MasterMejaControler.getAllMeja)
  router.post('/create', MasterMejaControler.createMeja)
  router.delete('/delete/:id', MasterMejaControler.deleteMeja)
  router.put('/update/:id', MasterMejaControler.updateMeja)
  return router
}
