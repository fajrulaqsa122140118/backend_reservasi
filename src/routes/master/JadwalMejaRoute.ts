import JadwalMejaController from '@/controllers/master/JadwalMejaControler'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'


export const JadwalMejaRouter = (): Router => {
  const router = Router()

  router.get('/:id', JadwalMejaController.getJadwalMejaById)
  router.get('/', JadwalMejaController.getAllJadwalMeja)

  router.use(AuthMiddleware)

  
  router.post('/create', JadwalMejaController.createJadwalMeja) 
  router.delete('/delete/:id', JadwalMejaController.deleteJadwalMeja)
  router.put('/update/:id', JadwalMejaController.updateJadwalMeja)

  return router
}