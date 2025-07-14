import SettingWebController from '@/controllers/master/SettingWebController'
import { AuthMiddleware } from '@/middleware/AuthMiddleware'
import express, { Router } from 'express'
import { upload } from '@/middleware/upload'

export const SettingWebRouter = (): Router => {
  const router = express.Router()

  router.use(AuthMiddleware)

  // Route untuk membuat atau memperbarui setting website
  router.post('/CreateOrUpdate', upload.single('logo'), SettingWebController.createOrUpdateSettingWeb)

  // Route untuk mendapatkan semua setting website
  router.get('/', SettingWebController.getAllSettings)

  return router
}

