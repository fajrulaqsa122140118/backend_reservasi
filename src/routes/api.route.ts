import { CONFIG } from '@/config'
import { ResponseData } from '@/utilities'
import {
  type Express,
  type Request,
  type Response,
} from 'express'
import { StatusCodes } from 'http-status-codes'
import { AuthRoute } from './auth/AuthRoute'
import { UserRouter } from './master/UserRoute'
import { MasterMejaRouter } from './master/MasterMejaRoute'
import { JadwalMejaRouter } from './master/JadwalMejaRoute'
import BookingRouter from './guest/BookingRoute'
import { BiodataBookingRouter } from './guest/BiodataBookingRoute'
import { BannerRouter } from './master/BannerRoute'
import { BuktiPembayaranRouter } from './guest/BuktiPembayaranRoute'
import { ClosedRouter } from './master/ClosedRoute'
import { SyaratRouter } from './master/SyaratRoute'
import { DashboardRouter } from './master/DashboardRoute'
import { SettingWebRouter } from './master/SettingWebRoute'
import { QrisRouter } from './master/QrisRoute'

export const appRouter = async function (app: Express): Promise<void> {
  app.get('/', (req: Request, res: Response) => {
    const data = {
      message: `Welcome to ${CONFIG.appName} for more function use ${CONFIG.apiUrl} as main router`,
    }
    const response = ResponseData(StatusCodes.OK, 'Success', data)
    return res.status(StatusCodes.OK).json(response)
  })

  // other route
  // auth route
  app.use(CONFIG.apiUrl + 'auth', AuthRoute())

  // master route
  app.use(CONFIG.apiUrl + 'master/user', UserRouter())
  app.use(CONFIG.apiUrl + 'master/meja', MasterMejaRouter())


  // jadwal meja route
  app.use(CONFIG.apiUrl + 'master/jadwal-meja', JadwalMejaRouter())

  // booking route
  app.use(CONFIG.apiUrl + 'master/booking', BookingRouter)

  // Biodata route
  app.use(CONFIG.apiUrl + 'master/biodata', BiodataBookingRouter())

  // Banner route
  app.use(CONFIG.apiUrl + 'master/banner', BannerRouter())

  // Bukti route
  app.use(CONFIG.apiUrl + 'master/bukti', BuktiPembayaranRouter())

  // Closed route
  app.use(CONFIG.apiUrl + 'master/closed', ClosedRouter())

  // syarat ketentuan route
  app.use(CONFIG.apiUrl + 'master/syarat', SyaratRouter())

  // Dashboard route
  app.use(CONFIG.apiUrl + 'dashboard', DashboardRouter())

  // SettingWebsite route
  app.use(CONFIG.apiUrl + 'master/setting-web', SettingWebRouter())

  // Qris route
  app.use(CONFIG.apiUrl + 'master/qris', QrisRouter())
}


