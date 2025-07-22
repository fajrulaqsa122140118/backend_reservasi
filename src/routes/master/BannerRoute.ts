import express, { Router } from 'express'
import { upload } from '@/middleware/upload'
import BannerController from '@/controllers/master/BannerController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'


export const BannerRouter = (): Router => {

  const router = express.Router()
  
  router.get('/', BannerController.getAllBanners)
  router.get('/:id', BannerController.getBannerById)

  router.use(AuthMiddleware)

  
  router.post('/create', upload.single('banner'), BannerController.createBanner)
  router.put('/update/:id', upload.single('banner'), BannerController.updateBanner)
  router.delete('/:id', BannerController.deleteBanner)
  return router
}