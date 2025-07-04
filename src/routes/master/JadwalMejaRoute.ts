import JadwalMejaController from '@/controllers/master/JadwalMejaControler'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

export const JadwalMejaRouter = (): Router => {
  const router = Router()

  router.use(AuthMiddleware)

  router.get('/', JadwalMejaController.getAllJadwalMeja)
  router.post('/create', JadwalMejaController.createJadwalMeja) 
  router.delete('/delete/:id', JadwalMejaController.deleteJadwalMeja)
  router.put('/update/:id', JadwalMejaController.updateJadwalMeja)
  router.get('/:id', JadwalMejaController.getJadwalMejaById)
  return router
}
