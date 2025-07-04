import express, { Router } from 'express'
import { upload } from '@/middleware/upload'
import BannerController from '@/controllers/master/BannerController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'


export const BannerRouter = (): Router => {

  const router = express.Router()

  router.use(AuthMiddleware)

  router.get('/', BannerController.getAllBanners)
  router.post('/create', upload.single('banner'), BannerController.createBanner)
  //   router.get('/:id', BannerController.getBannerById)
  //   router.delete('/:id/soft', BannerController.softdeleteBanner)
  //   router.patch('/:id/restore', BannerController.restoreBanner)
  return router
}