import MasterMejaControler from '@/controllers/master/MasterMejaControler'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import { Router } from 'express'

import { upload } from '@/middleware/upload'

export const MasterMejaRouter = (): Router => {
  const router = Router()

  router.get('/', MasterMejaControler.getAllMeja)
  router.get('/:id', MasterMejaControler.getMejaById)

  router.use(AuthMiddleware)

  
  router.post('/create', upload.single('foto'), MasterMejaControler.createMeja)
  router.delete('/delete/:id', MasterMejaControler.deleteMeja)
  router.put('/update/:id', upload.single('foto'), MasterMejaControler.updateMeja)
  router.delete('/soft-delete/:id', MasterMejaControler.softDeleteMeja)
  router.patch('/restore/:id', MasterMejaControler.restoreMeja)
  
  return router
}
